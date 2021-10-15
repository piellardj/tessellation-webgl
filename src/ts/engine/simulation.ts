import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { EPrimitiveType } from "../primitives/primitive-type-enum";


interface ISimulation<TPlotter> {
    update(viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean;
    draw(plotter: TPlotter, scaling: number, backgroundColor: Color, linesColor?: Color): void;
    reset(viewport: Rectangle, primitiveType: EPrimitiveType): void;
    recomputeColors(colorVariation: number): void;
    downloadAsSvg(width: number, height: number, scaling: number, backgroundColor: Color, linesColor?: Color): void;
}

export {
    ISimulation,
};
