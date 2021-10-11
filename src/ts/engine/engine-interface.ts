import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { PlotterBase } from "../plotter/plotter-base";
import { EPrimitiveType } from "../primitives/primitive-type-enum";


interface IEngine {
    update(viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean;
    draw(plotter: PlotterBase, scaling: number): void;
    reset(viewport: Rectangle, primitiveType: EPrimitiveType): void;
    recomputeColors(colorVariation: number): void;
}

export {
    IEngine,
};
