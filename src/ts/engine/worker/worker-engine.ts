import { Engine } from "../engine";
import { IEngineMetrics } from "../engine-metrics";
import { Color } from "../../misc/color";
import { Rectangle } from "../../misc/rectangle";
import { PlotterSVG } from "../../plotter/plotter-svg";
import { PlotterWebGLBasic } from "../../plotter/plotter-webgl-basic";
import { BatchOfLines, BatchOfPolygons } from "../../plotter/types";
import { IVboBuffer } from "../../plotter/vbo-types";
import { EPrimitiveType } from "../../primitives/primitive-type-enum";
import * as MessagesToMain from "./messages/from-worker/messages";
import { Zoom } from "../../misc/zoom";


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

    public performUpdate(zoomToApply: Zoom, viewport: Rectangle, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean {
        const lastLayerIdPreUpdate = this.layers[this.layers.length - 1].primitives.geometryId.id;
        const changedSomething = super.performUpdate(zoomToApply, viewport, wantedDepth, subdivisionBalance, colorVariation);
        const lastLayerIdPostUpdate = this.layers[this.layers.length - 1].primitives.geometryId.id;

        const newLayerAppeared = (lastLayerIdPreUpdate !== lastLayerIdPostUpdate);

        if (changedSomething) {
            const polygonsVboBuffer = this.computePolygonsVboBuffer();
            const linesVboBuffer = this.computeLinesVboBuffer();
            MessagesToMain.PerformUpdateOutput.sendMessage(polygonsVboBuffer, linesVboBuffer, zoomToApply, newLayerAppeared);
        } else {
            MessagesToMain.PerformUpdateNoOutput.sendMessage(zoomToApply);
        }

        return changedSomething;
    }

    protected onNewMetrics(newMetrics: IEngineMetrics): void {
        MessagesToMain.NewMetrics.sendMessage(newMetrics);
    }

    private computePolygonsVboBuffer(): IVboBuffer {
        const lastLayer = this.layers[this.layers.length - 1];
        const batchesOfPolygons: BatchOfPolygons[] = [{
            items: lastLayer.primitives.items,
            geometryId: lastLayer.primitives.geometryId.copy(),
        }];

        if (this.layers.length > 1) {
            const layerBeforeLast = this.layers[this.layers.length - 2];
            batchesOfPolygons.unshift({
                items: layerBeforeLast.primitives.items,
                geometryId: layerBeforeLast.primitives.geometryId.copy(),
            });
        }

        return PlotterWebGLBasic.buildPolygonsVboBuffer(batchesOfPolygons);
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
        svgPlotter.initialize(backgroundColor, Zoom.noZoom(), scaling);

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

