import { Color } from "../color/color";
import { IPoint } from "../point";

import "../page-interface-generated";


interface ILine {
    p1: IPoint;
    p2: IPoint;
}

interface ILinesBatch {
    lines: ILine[];
    thickness: number;
}

interface IPolygon {
    points: IPoint[];
    color: Color;
}

class PlotterCanvas2D {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;

    private readonly cssPixel: number;

    private _width: number;
    private _height: number;

    public constructor() {
        this.canvas = Page.Canvas.getCanvas();
        this.context = this.canvas.getContext("2d", { alpha: false });

        this.cssPixel = window.devicePixelRatio ?? 1;
        this.resizeCanvas();
    }

    public initialize(backgroundColor: Color): void {
        this.resizeCanvas();
        this.clearCanvas(backgroundColor);
    }

    public drawLines(linesBatches: ILinesBatch[], color: Color): void {
        this.context.fillStyle = "none";
        this.context.strokeStyle = color.toString();

        const halfWidth = 0.5 * this._width;
        const halfHeight = 0.5 * this._height;
        for (const linesBatch of linesBatches) {
            this.context.lineWidth = linesBatch.thickness;

            this.context.beginPath();
            for (const line of linesBatch.lines) {
                this.context.moveTo(line.p1.x + halfWidth, line.p1.y + halfHeight);
                this.context.lineTo(line.p2.x + halfWidth, line.p2.y + halfHeight);
            }
            this.context.stroke();
            this.context.closePath();
        }
    }

    public drawPolygons(polygons: IPolygon[]): void {
        this.context.strokeStyle = "none";

        const halfWidth = 0.5 * this._width;
        const halfHeight = 0.5 * this._height;
        for (const polygon of polygons) {
            if (polygon.points.length >= 3) {
                this.context.fillStyle = polygon.color.toString();

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

    public get width(): number {
        return this._width;
    }
    public get height(): number {
        return this._height;
    }

    private resizeCanvas(): void {
        const actualWidth = Math.floor(this.cssPixel * this.canvas.clientWidth);
        const actualHeight = Math.floor(this.cssPixel * this.canvas.clientHeight);

        if (this.canvas.width !== actualWidth || this.canvas.height !== actualHeight) {
            this.canvas.width = actualWidth;
            this.canvas.height = actualHeight;
        }

        this._width = this.canvas.width;
        this._height = this.canvas.height;
    }

    protected clearCanvas(color: Color): void {
        this.context.fillStyle = color.toString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export {
    ILine,
    ILinesBatch,
    IPolygon,
    PlotterCanvas2D,
};
