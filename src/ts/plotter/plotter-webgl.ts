import { Color } from "../misc/color";
import { IPlotter } from "./plotter-interface";
import { PlotterWebGLBasic } from "./plotter-webgl-basic";
import { BatchOfLines, BatchOfPolygons } from "./types";


interface IPendingLines {
    readonly batchOfLines: BatchOfLines;
    readonly color: Color;
    readonly alpha: number;
}

interface IPendingPolygons {
    readonly batchOfPolygons: BatchOfPolygons;
    readonly alpha: number;
}

class PlotterWebGL extends PlotterWebGLBasic implements IPlotter {
    private pendingLinesList: IPendingLines[] = [];
    private pendingPolygonsList: IPendingPolygons[] = [];

    public finalize(): void {
        if (this.pendingPolygonsList.length > 0) {
            for (const pendingPolygons of this.pendingPolygonsList) {
                if (!this.registerPolygonsVboPartForDrawing(pendingPolygons.batchOfPolygons.geometryId, pendingPolygons.alpha)) {
                    // this VBO part is not uploaded on the GPU yet
                    // => need to reupload everything
                    this.buildAndUploadPolygonsVBO();
                    break;
                }
            }

            this.pendingPolygonsList = [];
        }

        if (this.pendingLinesList.length > 0) {
            for (const pendingLines of this.pendingLinesList) {
                if (!this.registerLinesVboPartForDrawing(pendingLines.batchOfLines.geometryId, pendingLines.color, pendingLines.alpha)) {
                    // this VBO part is not uploaded on the GPU yet
                    // => need to reupload everything
                    this.buildAndUploadLinesVBO();
                    break;
                }
            }

            this.pendingLinesList = [];
        }

        super.finalize();
    }

    public drawLines(batchOfLines: BatchOfLines, _thickness: number, color: Color, alpha: number): void {
        this.pendingLinesList.push({ batchOfLines, color, alpha });
    }

    public drawPolygons(batchOfPolygons: BatchOfPolygons, alpha: number): void {
        this.pendingPolygonsList.push({ batchOfPolygons, alpha });
    }

    private buildAndUploadLinesVBO(): void {
        const pendingBatchesOfLines: BatchOfLines[] = [];
        for (const pendingLines of this.pendingLinesList) {
            pendingBatchesOfLines.push(pendingLines.batchOfLines);
        }

        const linesVboBuffer = PlotterWebGLBasic.buildLinesVboBuffer(pendingBatchesOfLines);
        this.uploadLinesVbo(linesVboBuffer);

        for (const pendingLines of this.pendingLinesList) {
            this.registerLinesVboPartForDrawing(pendingLines.batchOfLines.geometryId, pendingLines.color, pendingLines.alpha);
        }
    }

    private buildAndUploadPolygonsVBO(): void {
        const pendingBatchesOfPolygons: BatchOfPolygons[] = [];
        for (const pendingPolygons of this.pendingPolygonsList) {
            pendingBatchesOfPolygons.push(pendingPolygons.batchOfPolygons);
        }

        const polygonsVboBuffer = PlotterWebGLBasic.buildPolygonsVboBuffer(pendingBatchesOfPolygons);
        this.uploadPolygonsVbo(polygonsVboBuffer);

        for (const pendingPolygons of this.pendingPolygonsList) {
            this.registerPolygonsVboPartForDrawing(pendingPolygons.batchOfPolygons.geometryId, pendingPolygons.alpha);
        }
    }
}

export {
    PlotterWebGL,
};

