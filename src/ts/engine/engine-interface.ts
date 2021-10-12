import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { EPrimitiveType } from "../primitives/primitive-type-enum";


interface IEngine<TPlotter> {
    update(viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean;
    draw(plotter: TPlotter, scaling: number): void;
    reset(viewport: Rectangle, primitiveType: EPrimitiveType): void;
    recomputeColors(colorVariation: number): void;
    downloadAsSvg(width: number, height: number, scaling: number): void;
}

export {
    IEngine,
};
