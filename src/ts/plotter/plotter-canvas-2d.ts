import { Color } from "../misc/color";
import { Zoom } from "../misc/zoom";
import { PlotterCanvas } from "./plotter-canvas";
import { IPlotter } from "./plotter-interface";
import { BatchOfLines, BatchOfPolygons } from "./types";

import "../page-interface-generated";


class PlotterCanvas2D extends PlotterCanvas implements IPlotter {
    private readonly context: CanvasRenderingContext2D;

    public constructor() {
        super();
        this.context = this.canvas.getContext("2d", { alpha: false });
    }

    public get isReady(): boolean {
        return true;
    }

    public initialize(backgroundColor: Color, zoom: Zoom, scaling: number): void {
        // reset all transforms
        this.context.setTransform(1, 0, 0, 1, 0, 0);

        // clear canvas
        this.context.fillStyle = backgroundColor.toHexaString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // apply scaling
        this.context.translate(+0.5 * this.width, +0.5 * this.height);
        this.context.scale(scaling, scaling);
        this.context.translate(-0.5 * this.width, -0.5 * this.height);

        // apply zoom
        const zoomTranslate = zoom.translate;
        this.context.translate(zoomTranslate.x, zoomTranslate.y);

        const zoomScale = zoom.scale;
        this.context.translate(+0.5 * this.width, +0.5 * this.height);
        this.context.scale(zoomScale, zoomScale);
        this.context.translate(-0.5 * this.width, -0.5 * this.height);
    }

    // tslint:disable-next-line:no-empty
    public finalize(): void { }

    public drawLines(batchOfLines: BatchOfLines, thickness: number, color: Color, alpha: number): void {
        if (alpha > 0 && batchOfLines) {
            this.context.fillStyle = "none";
            this.context.strokeStyle = (alpha >= 1) ? color.toHexaString() : color.toRgbaString(alpha);

            const halfWidth = 0.5 * this.width;
            const halfHeight = 0.5 * this.height;
            for (const line of batchOfLines.items) {
                this.context.lineWidth = thickness * this.cssPixel;

                this.context.beginPath();
                if (line.length >= 2) {
                    this.context.moveTo(line[0].x + halfWidth, line[0].y + halfHeight);

                    for (let iP = 1; iP < line.length; iP++) {
                        this.context.lineTo(line[iP].x + halfWidth, line[iP].y + halfHeight);
                    }
                }
                this.context.stroke();
                this.context.closePath();
            }
        }
    }

    public drawPolygons(batchOfPolygons: BatchOfPolygons, alpha: number): void {
        if (alpha > 0 && batchOfPolygons) {
            this.context.strokeStyle = "none";

            const halfWidth = 0.5 * this.width;
            const halfHeight = 0.5 * this.height;
            for (const polygon of batchOfPolygons.items) {
                if (polygon.vertices.length >= 3) {
                    this.context.fillStyle = (alpha >= 1) ? polygon.color.toHexaString() : polygon.color.toRgbaString(alpha);

                    this.context.beginPath();
                    this.context.moveTo(polygon.vertices[0].x + halfWidth, polygon.vertices[0].y + halfHeight);
                    for (let iP = 1; iP < polygon.vertices.length; iP++) {
                        this.context.lineTo(polygon.vertices[iP].x + halfWidth, polygon.vertices[iP].y + halfHeight);
                    }
                    this.context.closePath();
                    this.context.fill();
                }
            }
        }
    }
}

export {
    PlotterCanvas2D,
};

