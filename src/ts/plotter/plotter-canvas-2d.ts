import { Color } from "../misc/color";
import { ILinesBatch, IPolygon, Plotter } from "./plotter";

import "../page-interface-generated";


class PlotterCanvas2D extends Plotter {
    private readonly context: CanvasRenderingContext2D;

    public constructor() {
        super();
        this.context = this.canvas.getContext("2d", { alpha: false });

        this.resizeCanvas();
    }

    public drawLines(linesBatches: ILinesBatch[], color: Color, alpha: number = 1): void {
        this.context.fillStyle = "none";
        this.context.strokeStyle = (alpha >= 1) ? color.toHexaString() : color.toRgbaString(alpha);

        const halfWidth = 0.5 * this.width;
        const halfHeight = 0.5 * this.height;
        for (const linesBatch of linesBatches) {
            this.context.lineWidth = linesBatch.thickness;

            this.context.beginPath();
            for (const line of linesBatch.lines) {
                if (line.length >= 2) {
                    this.context.moveTo(line[0].x + halfWidth, line[0].y + halfHeight);

                    for (let iP = 1; iP < line.length; iP++) {
                        this.context.lineTo(line[iP].x + halfWidth, line[iP].y + halfHeight);
                    }
                }
            }
            this.context.stroke();
            this.context.closePath();
        }
    }

    public drawPolygons(polygons: IPolygon[], alpha: number = 1): void {
        this.context.strokeStyle = "none";

        const halfWidth = 0.5 * this.width;
        const halfHeight = 0.5 * this.height;
        for (const polygon of polygons) {
            if (polygon.points.length >= 3) {
                this.context.fillStyle = (alpha >= 1) ? polygon.color.toHexaString() : polygon.color.toRgbaString(alpha);

                this.context.beginPath();
                this.context.moveTo(polygon.points[0].x + halfWidth, polygon.points[0].y + halfHeight);
                for (let iP = 1; iP < polygon.points.length; iP++) {
                    this.context.lineTo(polygon.points[iP].x + halfWidth, polygon.points[iP].y + halfHeight);
                }
                this.context.closePath();
                this.context.fill();
            }
        }
    }

    protected clearCanvas(color: Color): void {
        this.context.fillStyle = color.toHexaString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export {
    PlotterCanvas2D,
};
