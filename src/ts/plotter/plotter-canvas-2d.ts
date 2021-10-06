import { Color } from "../misc/color";
import { ILinesBatch, IPolygon, PlotterBase } from "./plotter-base";

import "../page-interface-generated";


class PlotterCanvas2D extends PlotterBase {
    private readonly context: CanvasRenderingContext2D;

    public constructor() {
        super();
        this.context = this.canvas.getContext("2d", { alpha: false });
    }

    // tslint:disable-next-line:no-empty
    public prepare(): void { }
    // tslint:disable-next-line:no-empty
    public finalize(): void { }

    public get isReady(): boolean {
        return true;
    }

    public drawLines(linesBatches: ILinesBatch[], color: Color, alpha: number): void {
        if (alpha > 0 && linesBatches) {
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
    }

    public drawPolygons(polygons: IPolygon[], alpha: number): void {
        if (alpha > 0 && polygons) {
            this.context.strokeStyle = "none";

            const halfWidth = 0.5 * this.width;
            const halfHeight = 0.5 * this.height;
            for (const polygon of polygons) {
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

    protected clearCanvas(color: Color): void {
        this.context.fillStyle = color.toHexaString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export {
    PlotterCanvas2D,
};
