import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { Throttle } from "../misc/throttle";
import { downloadSvgOutput } from "../misc/web";
import { Zoom } from "../misc/zoom";
import { IVboBuffer, PlotterWebGLBasic } from "../plotter/plotter-webgl-basic";
import { EPrimitiveType } from "../primitives/primitive-type-enum";
import { IEngine } from "./engine-interface";
import { IEngineMetrics, updateEngineMetricsIndicators } from "./engine-metrics";
import * as MessagesFromWorker from "./worker/messages/from-worker/messages";
import * as MessagesToWorker from "./worker/messages/to-worker/messages";

import "../page-interface-generated";


type PendingResetCommand = {
    viewport: Rectangle;
    primitiveType: EPrimitiveType;
};

type PendingRecomputeColorsCommand = {
    colorVariation: number;
};

type PendingPerformUpdateCommand = {
    viewport: Rectangle;
    wantedDepth: number;
    subdivisionBalance: number;
    colorVariation: number;
};

class EngineMultithreaded implements IEngine<PlotterWebGLBasic> {
    public static readonly isSupported: boolean = (typeof Worker !== "undefined");

    private readonly worker: Worker;

    private polygonsVboBuffer: IVboBuffer;
    private linesVboBuffer: IVboBuffer;
    private hasSomethingNewToDraw: boolean = true;

    private cumulatedZoom: Zoom = Zoom.noZoom();

    private lastCommandSendingTimestamp: number = 0;
    private isAwaitingCommandResult: boolean = false;
    private readonly commandsThrottle: Throttle = new Throttle(100);

    private pendingResetCommand: PendingResetCommand | null = null;
    private pendingRecomputeColorsCommand: PendingRecomputeColorsCommand | null = null;
    private pendingPerformUpdateCommand: PendingPerformUpdateCommand | null = null;

    public constructor() {
        this.worker = new Worker(`script/worker.js?v=${Page.version}`);

        MessagesFromWorker.NewMetrics.addListener(this.worker, (engineMetrics: IEngineMetrics) => {
            updateEngineMetricsIndicators(engineMetrics);
        });

        MessagesFromWorker.DownloadAsSvgOutput.addListener(this.worker, (output: string) => {
            downloadSvgOutput(output);
        });

        MessagesFromWorker.ResetOutput.addListener(this.worker, (polygonsVboBuffer: IVboBuffer, linesVboBuffer: IVboBuffer) => {
            this.cumulatedZoom = Zoom.noZoom();
            this.polygonsVboBuffer = polygonsVboBuffer;
            this.linesVboBuffer = linesVboBuffer;
            this.hasSomethingNewToDraw = true;

            this.logCommandOutput("Reset");
            this.isAwaitingCommandResult = false;
            this.sendNextCommand();
        });

        MessagesFromWorker.RecomputeColorsOutput.addListener(this.worker, (polygonsVboBuffer: IVboBuffer, linesVboBuffer: IVboBuffer) => {
            this.polygonsVboBuffer = polygonsVboBuffer;
            this.linesVboBuffer = linesVboBuffer;
            this.hasSomethingNewToDraw = true;

            this.logCommandOutput("Recompute colors");
            this.isAwaitingCommandResult = false;
            this.sendNextCommand();
        });

        MessagesFromWorker.PerformUpdateOutput.addListener(this.worker, (polygonsVboBuffer: IVboBuffer, linesVboBuffer: IVboBuffer, appliedZoom: Zoom) => {
            const invAppliedZoom = appliedZoom.inverse();
            this.cumulatedZoom = Zoom.multiply(this.cumulatedZoom, invAppliedZoom); // keep the advance we had on the worker
            this.polygonsVboBuffer = polygonsVboBuffer;
            this.linesVboBuffer = linesVboBuffer;
            this.hasSomethingNewToDraw = true;

            this.logCommandOutput("Perform update");
            this.isAwaitingCommandResult = false;
            this.sendNextCommand();
        });

        MessagesFromWorker.PerformUpdateNoOutput.addListener(this.worker, (appliedZoom: Zoom) => {
            const invAppliedZoom = appliedZoom.inverse();
            this.cumulatedZoom = Zoom.multiply(this.cumulatedZoom, invAppliedZoom); // keep the advance we had on the worker
            this.hasSomethingNewToDraw = true;

            this.logCommandOutput("Perform update (no output)");
            this.isAwaitingCommandResult = false;
            this.sendNextCommand();
        });
    }

    public update(viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean {
        this.cumulatedZoom = Zoom.multiply(instantZoom, this.cumulatedZoom);

        this.pendingPerformUpdateCommand = {
            viewport,
            wantedDepth,
            subdivisionBalance,
            colorVariation,
        };
        this.sendNextCommand();

        return this.hasSomethingNewToDraw;
    }

    public draw(plotter: PlotterWebGLBasic, scaling: number, backgroundColor: Color, linesColor?: Color): void {
        this.hasSomethingNewToDraw = false;

        plotter.initialize(backgroundColor, this.cumulatedZoom, scaling);

        if (this.polygonsVboBuffer) {
            let needToReupload = false;
            for (const polygonsVboPart of this.polygonsVboBuffer.bufferParts) {
                if (!plotter.registerPolygonsVboPartForDrawing(polygonsVboPart.geometryId, 1)) {
                    needToReupload = true;
                }
            }

            if (needToReupload) {
                plotter.uploadPolygonsVbo(this.polygonsVboBuffer);
                for (const polygonsVboPart of this.polygonsVboBuffer.bufferParts) {
                    plotter.registerPolygonsVboPartForDrawing(polygonsVboPart.geometryId, 1);
                }
            }
        }

        if (this.linesVboBuffer && linesColor) {
            let needToReupload = false;
            for (const linesVboPart of this.linesVboBuffer.bufferParts) {
                if (!plotter.registerLinesVboPartForDrawing(linesVboPart.geometryId, linesColor, 1)) {
                    needToReupload = true;
                }
            }

            if (needToReupload) {
                plotter.uploadLinesVbo(this.linesVboBuffer);
                for (const linesVboPart of this.linesVboBuffer.bufferParts) {
                    plotter.registerLinesVboPartForDrawing(linesVboPart.geometryId, linesColor, 1);
                }
            }
        }

        plotter.finalize();
    }

    public reset(viewport: Rectangle, primitiveType: EPrimitiveType): void {
        this.pendingResetCommand = {
            viewport,
            primitiveType
        };
        this.sendNextCommand();
    }

    public recomputeColors(colorVariation: number): void {
        this.pendingRecomputeColorsCommand = {
            colorVariation,
        };

        this.sendNextCommand();
    }

    public downloadAsSvg(width: number, height: number, scaling: number, backgroundColor: Color, linesColor?: Color): void {
        MessagesToWorker.DownloadAsSvg.sendMessage(this.worker, width, height, scaling, backgroundColor, linesColor);
    }

    private sendNextCommand(): void {
        if (!this.isAwaitingCommandResult) {
            this.commandsThrottle.runIfAvailable(() => {
                if (this.pendingResetCommand) {
                    const command = this.pendingResetCommand;
                    this.pendingRecomputeColorsCommand = null;
                    this.pendingPerformUpdateCommand = null;
                    this.pendingResetCommand = null;

                    // console.log("Sending reset command");
                    this.lastCommandSendingTimestamp = performance.now();
                    this.isAwaitingCommandResult = true;
                    MessagesToWorker.Reset.sendMessage(this.worker, command.viewport, command.primitiveType);
                } else if (this.pendingRecomputeColorsCommand) {
                    const command = this.pendingRecomputeColorsCommand;
                    this.pendingRecomputeColorsCommand = null;

                    // console.log("Sending recompute colors command");
                    this.lastCommandSendingTimestamp = performance.now();
                    this.isAwaitingCommandResult = true;
                    MessagesToWorker.RecomputeColors.sendMessage(this.worker, command.colorVariation);
                } else if (this.pendingPerformUpdateCommand) {
                    const command = this.pendingPerformUpdateCommand;
                    this.pendingPerformUpdateCommand = null;

                    // console.log("Sending update command");
                    this.lastCommandSendingTimestamp = performance.now();
                    this.isAwaitingCommandResult = true;
                    MessagesToWorker.PerformUpdate.sendMessage(this.worker, this.cumulatedZoom, command.viewport, command.wantedDepth, command.subdivisionBalance, command.colorVariation);
                }
            });
        }
    }

    private logCommandOutput(commandName: string): void {
        const commandDuration = performance.now() - this.lastCommandSendingTimestamp;
        if (commandDuration > 50) {
            console.log(`"${commandName}" command took ${commandDuration.toFixed(0)} ms.`);
        }
    }
}

export {
    EngineMultithreaded,
};

