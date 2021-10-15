import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { Parameters } from "../parameters";
import { EPrimitiveType } from "../primitives/primitive-type-enum";


interface ISimulation<TPlotter> {
    update(viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean;
    draw(plotter: TPlotter, scaling: number, backgroundColor: Color, linesColor?: Color): void;
    reset(viewport: Rectangle, primitiveType: EPrimitiveType): void;
    recomputeColors(colorVariation: number): void;
    downloadAsSvg(width: number, height: number, scaling: number, backgroundColor: Color, linesColor?: Color): void;
}

function computeComputeLastLayerAlpha(layersCount: number, lastLayerBirthTimestamp: number): number {
    if (Parameters.blending && layersCount > 1) {
        if (Parameters.zoomingSpeed > 0) {
            const emergingTimeOfLastLayer = 1000 / Math.pow((1 + Parameters.zoomingSpeed), 2);
            const ageOfLastLayer = performance.now() - lastLayerBirthTimestamp;
            if (ageOfLastLayer < emergingTimeOfLastLayer) {
                // last layer is still blending in
                return ageOfLastLayer / emergingTimeOfLastLayer;
            }
        }
    }
    return 1;
}

export {
    computeComputeLastLayerAlpha,
    ISimulation,
};
