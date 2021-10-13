import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { downloadSvgOutput } from "../misc/web";
import { Zoom } from "../misc/zoom";
import { IVboBuffer, PlotterWebGLBasic } from "../plotter/plotter-webgl-basic";
import { EPrimitiveType } from "../primitives/primitive-type-enum";
import * as MessagesFromWorker from "../worker/messages/from-worker/messages";
import * as MessagesToWorker from "../worker/messages/to-worker/messages";
import { IEngine } from "./engine-interface";
import { IEngineMetrics, updateEngineMetricsIndicators } from "./engine-metrics";

import "../page-interface-generated";



class EngineMultithreaded implements IEngine<PlotterWebGLBasic> {
    private readonly worker: Worker;

    private polygonsVboBuffer: IVboBuffer;
    private linesVboBuffer: IVboBuffer;
    private hasSomethingNewToDraw: boolean = true;

    public constructor() {
        this.worker = new Worker(`script/worker.js?v=${Page.version}`);

        MessagesFromWorker.NewMetrics.addListener(this.worker, (engineMetrics: IEngineMetrics) => {
            updateEngineMetricsIndicators(engineMetrics);
        });

        MessagesFromWorker.NewSvgOutput.addListener(this.worker, (output: string) => {
            downloadSvgOutput(output);
        });

        MessagesFromWorker.NewGeometry.addListener(this.worker, (polygonsVboBuffer: IVboBuffer, linesVboBuffer: IVboBuffer) => {
            this.polygonsVboBuffer = polygonsVboBuffer;
            this.linesVboBuffer = linesVboBuffer;
            this.hasSomethingNewToDraw = true;
        });
    }

    public update(viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean {
        MessagesToWorker.Update.sendMessage(this.worker, viewport, instantZoom, wantedDepth, subdivisionBalance, colorVariation);
        return this.hasSomethingNewToDraw;
    }

    public draw(plotter: PlotterWebGLBasic, scaling: number, backgroundColor: Color, linesColor?: Color): void {
        this.hasSomethingNewToDraw = false;

        plotter.initialize(backgroundColor, Zoom.noZoom(), scaling);

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
        MessagesToWorker.Reset.sendMessage(this.worker, viewport, primitiveType);
    }

    public recomputeColors(colorVariation: number): void {
        MessagesToWorker.RecomputeColors.sendMessage(this.worker, colorVariation);
    }

    public downloadAsSvg(width: number, height: number, scaling: number, backgroundColor: Color, linesColor?: Color): void {
        MessagesToWorker.DownloadAsSvg.sendMessage(this.worker, width, height, scaling, backgroundColor, linesColor);
    }
}

export {
    EngineMultithreaded,
};

