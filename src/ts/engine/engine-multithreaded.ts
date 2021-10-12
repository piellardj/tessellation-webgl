import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { PlotterWebGLBasic } from "../plotter/plotter-webgl-basic";
import { EPrimitiveType } from "../primitives/primitive-type-enum";
import * as MessagesToWorker from "../worker/messages/to-worker/messages";
import { IEngine } from "./engine-interface";

import "../page-interface-generated";


class EngineMultithreaded implements IEngine<PlotterWebGLBasic> {
    private readonly worker: Worker;

    public constructor() {
        this.worker = new Worker(`script/worker.js?v=${Page.version}`);
        this.worker.postMessage(null);
    }

    public update(viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean {
        MessagesToWorker.Update.sendMessage(this.worker, viewport, instantZoom, wantedDepth, subdivisionBalance, colorVariation);
        return true;
        // throw new Error("not implemented");
    }

    public draw(_plotter: PlotterWebGLBasic, _scaling: number): void {
        // throw new Error("not implemented");
    }

    public reset(viewport: Rectangle, primitiveType: EPrimitiveType): void {
        MessagesToWorker.Reset.sendMessage(this.worker, viewport, primitiveType);
    }

    public recomputeColors(_colorVariation: number): void {
        // throw new Error("not implemented");
    }

    public downloadAsSvg(_width: number, _height: number, _scaling: number): void {
        // throw new Error("not implemented");
    }
}

export {
    EngineMultithreaded,
};

