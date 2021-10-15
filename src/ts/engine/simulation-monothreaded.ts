import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { Throttle } from "../misc/throttle";
import { downloadSvgOutput } from "../misc/web";
import { Zoom } from "../misc/zoom";
import { Parameters } from "../parameters";
import { IPlotter } from "../plotter/plotter-interface";
import { PlotterSVG } from "../plotter/plotter-svg";
import { Engine } from "./engine";
import { IEngineMetrics, updateEngineMetricsIndicators } from "./engine-metrics";
import { computeComputeLastLayerAlpha, ISimulation } from "./simulation";


class SimulationMonothreaded extends Engine implements ISimulation<IPlotter> {
    private cumulatedZoom: Zoom = Zoom.noZoom();
    private readonly maintainanceThrottle: Throttle = new Throttle(100);

    public update(viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean {
        this.cumulatedZoom = Zoom.multiply(instantZoom, this.cumulatedZoom);

        // don't do maintainance too often because it is costly
        let changedSomething = false;
        this.maintainanceThrottle.runIfAvailable(() => {
            changedSomething = this.performUpdate(this.cumulatedZoom, viewport, wantedDepth, subdivisionBalance, colorVariation);
            this.cumulatedZoom = Zoom.noZoom();
        });
        return changedSomething;
    }

    public draw(plotter: IPlotter, scaling: number, backgroundColor: Color, linesColor?: Color): void {
        if (this.layers.length < 1) {
            return;
        }

        let lastSolidLayer = this.layers.length - 1;
        const emergingLayerAlpha = computeComputeLastLayerAlpha(this.layers.length, this.layers[this.layers.length - 1].birthTimestamp);
        if (emergingLayerAlpha < 1) {
            lastSolidLayer--;
        }
        const emergingLayer = lastSolidLayer + 1;

        plotter.initialize(backgroundColor, this.cumulatedZoom, scaling);

        plotter.drawPolygons(this.layers[lastSolidLayer].primitives, 1);
        if (emergingLayer < this.layers.length) {
            plotter.drawPolygons(this.layers[emergingLayer].primitives, emergingLayerAlpha);
        }

        if (linesColor) {
            for (let iLayer = 0; iLayer < this.layers.length; iLayer++) {
                const thickness = SimulationMonothreaded.getLineThicknessForLayer(iLayer, this.layers.length);
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

    protected onNewMetrics(newMetrics: IEngineMetrics): void {
        updateEngineMetricsIndicators(newMetrics);
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
    SimulationMonothreaded,
};

