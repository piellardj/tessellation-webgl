import { Engine } from "../engine/engine";
import { Color } from "../misc/color";
import { PlotterSVG } from "../plotter/plotter-svg";
import { PlotterWebGLBasic } from "../plotter/plotter-webgl-basic";
import { BatchOfLines } from "../plotter/types";
import * as MessagesToMain from "./messages/from-worker/messages";


class WorkerEngine extends Engine {

    public downloadAsSvg(width: number, height: number, scaling: number, backgroundColor: Color, linesColor?: Color): void {
        const svgOutput = this.drawAsSvg(width, height, scaling, backgroundColor, linesColor);
        MessagesToMain.NewSvgOutput.sendMessage(svgOutput);
    }

    protected onGeometryChange(): void {
        this.sendVbos();
        this.updateIndicators();
    }

    private updateIndicators(): void {
        const metrics = this.computeMetrics();
        MessagesToMain.NewMetrics.sendMessage(metrics);
    }

    private sendVbos(): void {
        const lastLayer = this.layers[this.layers.length - 1];
        const polygonsVboBuffer = PlotterWebGLBasic.buildPolygonsVboBuffer([{
            items: lastLayer.primitives.items,
            geometryId: lastLayer.primitives.geometryId.copy(),
        }]);

        const batchesOfLines: BatchOfLines[] = [];
        for (const layer of this.layers) {
            batchesOfLines.push(layer.outlines);
        }
        const linesVboBuffer = PlotterWebGLBasic.buildLinesVboBuffer(batchesOfLines);

        MessagesToMain.NewGeometry.sendMessage(polygonsVboBuffer, linesVboBuffer);
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

