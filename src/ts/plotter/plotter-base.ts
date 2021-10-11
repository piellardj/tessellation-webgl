import { Color } from "../misc/color";
import { IPoint } from "../misc/point";
import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { GeometryId } from "./geometry-id";

import "../page-interface-generated";


interface IBatch<T> {
    readonly items: T[];
    readonly geometryId: GeometryId;
}

interface IPolygon {
    vertices: IPoint[];
    color: Color;
}
type BatchOfPolygons = IBatch<IPolygon>;

type Line = IPoint[];
type BatchOfLines = IBatch<Line>;

abstract class PlotterBase {
    protected readonly canvas: HTMLCanvasElement;
    protected readonly cssPixel: number;

    private _width: number;
    private _height: number;

    protected constructor() {
        this.canvas = Page.Canvas.getCanvas();
        this.cssPixel = window.devicePixelRatio ?? 1;
        this.resizeCanvas();
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

    public abstract get isReady(): boolean;

    public abstract initialize(scaling: number): void;
    public abstract finalize(zoom: Zoom): void;

    public abstract clearCanvas(color: Color): void;
    public abstract drawLines(batchOfLines: BatchOfLines, thickness: number, color: Color, alpha: number): void;
    public abstract drawPolygons(batchOfPolygons: BatchOfPolygons, alpha: number): void;
}

export {
    BatchOfLines,
    BatchOfPolygons,
    Line,
    IBatch,
    IPolygon,
    PlotterBase,
};

