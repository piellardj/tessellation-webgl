import { Color } from "../misc/color";
import { IPoint } from "../misc/point";
import { Rectangle } from "../misc/rectangle";

import "../page-interface-generated";


type Line = IPoint[];

interface ILinesBatch {
    lines: Line[];
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

    public drawLines(linesBatches: ILinesBatch[], color: Color, alpha: number = 1): void {
        this.context.fillStyle = "none";
        this.context.strokeStyle = (alpha >= 1) ? color.toHexaString() : color.toRgbaString(alpha);

        const halfWidth = 0.5 * this._width;
        const halfHeight = 0.5 * this._height;
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

        const halfWidth = 0.5 * this._width;
        const halfHeight = 0.5 * this._height;
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

    public get viewport(): Rectangle {
        return new Rectangle(-0.5 * this._width, 0.5 * this._width, -0.5 * this._height, 0.5 * this._height);
    }

    public get width(): number {
        return this._width;
    }
    public get height(): number {
        return this._height;
    }

    public resizeCanvas(): void {
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
        this.context.fillStyle = color.toHexaString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export {
    Line,
    ILinesBatch,
    IPolygon,
    PlotterCanvas2D,
};
