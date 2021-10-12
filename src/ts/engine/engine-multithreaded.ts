import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { downloadSvgOutput } from "../misc/web";
import { Zoom } from "../misc/zoom";
import { PlotterWebGLBasic } from "../plotter/plotter-webgl-basic";
import { EPrimitiveType } from "../primitives/primitive-type-enum";
import * as MessagesFromWorker from "../worker/messages/from-worker/messages";
import * as MessagesToWorker from "../worker/messages/to-worker/messages";
import { IEngine } from "./engine-interface";
import { IEngineMetrics, updateEngineMetricsIndicators } from "./engine-metrics";

import "../page-interface-generated";



class EngineMultithreaded implements IEngine<PlotterWebGLBasic> {
    private readonly worker: Worker;

    public constructor() {
        this.worker = new Worker(`script/worker.js?v=${Page.version}`);

        MessagesFromWorker.NewMetrics.addListener(this.worker, (engineMetrics: IEngineMetrics) => {
            updateEngineMetricsIndicators(engineMetrics);
        });

        MessagesFromWorker.NewSvgOutput.addListener(this.worker, (output: string) => {
            downloadSvgOutput(output);
        });
    }

    public update(viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean {
        MessagesToWorker.Update.sendMessage(this.worker, viewport, instantZoom, wantedDepth, subdivisionBalance, colorVariation);
        return true;
    }

    public draw(_plotter: PlotterWebGLBasic, _scaling: number, _backgroundColor: Color, _linesColor?: Color): void {
        // throw new Error("not implemented");
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

