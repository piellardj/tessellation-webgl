import { Engine } from "../engine/engine";
import { IEngineMetrics } from "../engine/engine-metrics";
import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { PlotterSVG } from "../plotter/plotter-svg";
import { PlotterWebGLBasic } from "../plotter/plotter-webgl-basic";
import { BatchOfLines } from "../plotter/types";
import { IVboBuffer } from "../plotter/vbo-types";
import { EPrimitiveType } from "../primitives/primitive-type-enum";
import * as MessagesToMain from "./messages/from-worker/messages";


class WorkerEngine extends Engine {
    public reset(viewport: Rectangle, primitiveType: EPrimitiveType): void {
        super.reset(viewport, primitiveType);

        const polygonsVboBuffer = this.computePolygonsVboBuffer();
        const linesVboBuffer = this.computeLinesVboBuffer();
        MessagesToMain.ResetOutput.sendMessage(polygonsVboBuffer, linesVboBuffer);
    }

    public recomputeColors(colorVariation: number): void {
        super.recomputeColors(colorVariation);

        const polygonsVboBuffer = this.computePolygonsVboBuffer();
        const linesVboBuffer = this.computeLinesVboBuffer();
        MessagesToMain.RecomputeColorsOutput.sendMessage(polygonsVboBuffer, linesVboBuffer);
    }

    public downloadAsSvg(width: number, height: number, scaling: number, backgroundColor: Color, linesColor?: Color): void {
        const svgOutput = this.drawAsSvg(width, height, scaling, backgroundColor, linesColor);
        MessagesToMain.DownloadAsSvgOutput.sendMessage(svgOutput);
    }

    protected maintainance(viewport: Rectangle, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean {
        const zoomBeforeMaintainance = this.cumulatedZoom.copy();
        const result = super.maintainance(viewport, wantedDepth, subdivisionBalance, colorVariation);

        const polygonsVboBuffer = this.computePolygonsVboBuffer();
        const linesVboBuffer = this.computeLinesVboBuffer();
        MessagesToMain.MaintainanceOutput.sendMessage(polygonsVboBuffer, linesVboBuffer, zoomBeforeMaintainance);
        return result;
    }

    protected onNewMetrics(newMetrics: IEngineMetrics): void {
        MessagesToMain.NewMetrics.sendMessage(newMetrics);
    }

    private computePolygonsVboBuffer(): IVboBuffer {
        const lastLayer = this.layers[this.layers.length - 1];
        return PlotterWebGLBasic.buildPolygonsVboBuffer([{
            items: lastLayer.primitives.items,
            geometryId: lastLayer.primitives.geometryId.copy(),
        }]);
    }

    private computeLinesVboBuffer(): IVboBuffer {
        const batchesOfLines: BatchOfLines[] = [];
        for (const layer of this.layers) {
            batchesOfLines.push(layer.outlines);
        }
        return PlotterWebGLBasic.buildLinesVboBuffer(batchesOfLines);
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

