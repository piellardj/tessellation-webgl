import { Engine } from "../engine/engine";
import { Color } from "../misc/color";
import { PlotterSVG } from "../plotter/plotter-svg";
import * as MessagesToMain from "./messages/from-worker/messages";


class WorkerEngine extends Engine {
    public downloadAsSvg(width: number, height: number, scaling: number, backgroundColor: Color, linesColor?: Color): void {
        const svgOutput = this.drawAsSvg(width, height, scaling, backgroundColor, linesColor);
        MessagesToMain.NewSvgOutput.sendMessage(svgOutput);
    }

    protected updateIndicators(): void {
        const metrics = this.computeMetrics();
        MessagesToMain.NewMetrics.sendMessage(metrics);
    }

    private drawAsSvg(width: number, height: number, scaling: number, backgroundColor: Color, linesColor?: Color): string {
        const svgPlotter = new PlotterSVG(width, height);
        svgPlotter.initialize(backgroundColor, this.cumulatedZoom, scaling);

        svgPlotter.drawPolygons(this.layers[this.layers.length - 1].primitives, 1);

        if (linesColor) {
            for (const layer of this.layers) {
                svgPlotter.drawLines(layer.outlines, 1, linesColor, 1);
            }
        }

        svgPlotter.finalize();
        return svgPlotter.output();
    }
}

export {
    WorkerEngine,
};

