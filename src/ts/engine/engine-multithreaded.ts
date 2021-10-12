import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { PlotterWebGLBasic } from "../plotter/plotter-webgl-basic";
import { EPrimitiveType } from "../primitives/primitive-type-enum";
import { IEngine } from "./engine-interface";

import "../page-interface-generated";


class EngineMultithreaded implements IEngine<PlotterWebGLBasic> {
    private readonly worker: Worker;

    public constructor() {
        this.worker = new Worker(`script/worker.js?v=${Page.version}`);
        this.worker.postMessage(null);
    }

    public update(_viewport: Rectangle, _instantZoom: Zoom, _wantedDepth: number, _subdivisionBalance: number, _colorVariation: number): boolean {
        return true;
        // throw new Error("not implemented");
    }

    public draw(_plotter: PlotterWebGLBasic, _scaling: number): void {
        // throw new Error("not implemented");
    }

    public reset(_viewport: Rectangle, _primitiveType: EPrimitiveType): void {
        // throw new Error("not implemented");
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

