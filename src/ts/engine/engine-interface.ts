import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { IPlotter } from "../plotter/plotter-interface";
import { EPrimitiveType } from "../primitives/primitive-type-enum";


interface IEngine {
    update(viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean;
    draw(plotter: IPlotter, scaling: number): void;
    reset(viewport: Rectangle, primitiveType: EPrimitiveType): void;
    recomputeColors(colorVariation: number): void;
}

export {
    IEngine,
};
