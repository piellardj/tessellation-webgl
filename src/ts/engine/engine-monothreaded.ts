import { Color } from "../misc/color";
import { downloadSvgOutput } from "../misc/web";
import { Parameters } from "../parameters";
import { IPlotter } from "../plotter/plotter-interface";
import { PlotterSVG } from "../plotter/plotter-svg";
import { Engine } from "./engine";
import { IEngine } from "./engine-interface";
import { updateEngineMetricsIndicators } from "./engine-metrics";


class EngineMonothreaded extends Engine implements IEngine<IPlotter> {
    public draw(plotter: IPlotter, scaling: number, backgroundColor: Color, linesColor?: Color): void {
        if (this.layers.length < 1) {
            return;
        }

        let lastSolidLayer = this.layers.length - 1;
        let emergingLayerAlpha = 0;
        if (Parameters.blending && this.layers.length > 1) {
            if (Parameters.zoomingSpeed > 0) {
                const emergingTimeOfLastLayer = 1000 / Math.pow((1 + Parameters.zoomingSpeed), 2);
                const lastLayer = this.layers[this.layers.length - 1];
                const ageOfLastLayer = performance.now() - lastLayer.birthTimestamp;
                if (ageOfLastLayer < emergingTimeOfLastLayer) {
                    // last layer is still blending in
                    lastSolidLayer--;
                    emergingLayerAlpha = ageOfLastLayer / emergingTimeOfLastLayer;
                }
            }
        }
        const emergingLayer = lastSolidLayer + 1;

        plotter.initialize(backgroundColor, this.cumulatedZoom, scaling);

        plotter.drawPolygons(this.layers[lastSolidLayer].primitives, 1);
        if (emergingLayer < this.layers.length) {
            plotter.drawPolygons(this.layers[emergingLayer].primitives, emergingLayerAlpha);
        }

        if (linesColor) {
            for (let iLayer = 0; iLayer < this.layers.length; iLayer++) {
                const thickness = EngineMonothreaded.getLineThicknessForLayer(iLayer, this.layers.length);
                const alpha = (iLayer === emergingLayer) ? emergingLayerAlpha : 1;
                plotter.drawLines(this.layers[iLayer].outlines, thickness, linesColor, alpha);
            }
        }

        plotter.finalize();
    }

    public downloadAsSvg(width: number, height: number, scaling: number, backgroundColor: Color, linesColor?: Color): void {
        const svgPlotter = new PlotterSVG(width, height);
        this.draw(svgPlotter, scaling, backgroundColor, linesColor);
        const svgString = svgPlotter.output();
        downloadSvgOutput(svgString);
    }

    protected onGeometryChange(): void {
        this.updateIndicators();
    }

    private updateIndicators(): void {
        const metrics = this.computeMetrics();
        updateEngineMetricsIndicators(metrics);
    }

    private static getLineThicknessForLayer(layerId: number, totalLayersCount: number): number {
        let variablePart = 0;
        if (layerId > 0) {
            variablePart = Parameters.thickness * (totalLayersCount - 1 - layerId) / (totalLayersCount - 1);
        }
        return 1 + variablePart;
    }
}

export {
    EngineMonothreaded,
};

