import { Color } from "../misc/color";
import { IPoint } from "../misc/point";
import { Rectangle } from "../misc/rectangle";
import { Zooming } from "../misc/zooming";
import { GeometryId } from "./geometry-id";


type Line = IPoint[];

interface ILines {
    lines: Line[];
    thickness: number;
}

interface IPolygon {
    vertices: IPoint[];
    color: Color;
}
interface IBatch<T> {
    readonly items: T[];
    readonly geometryId: GeometryId;
}

type BatchOfLines = IBatch<ILines>;

abstract class PlotterBase {
    protected readonly canvas: HTMLCanvasElement;
    private readonly cssPixel: number;

    private _width: number;
    private _height: number;

    protected constructor() {
        this.canvas = Page.Canvas.getCanvas();
        this.cssPixel = window.devicePixelRatio ?? 1;
        this.resizeCanvas();
    }

    public abstract get supportsThickLines(): boolean;

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

    public initialize(backgroundColor: Color): void {
        this.resizeCanvas();
        this.clearCanvas(backgroundColor);
    }

    public abstract prepare(): void;
    public abstract finalize(zooming: Zooming): void;

    public abstract get isReady(): boolean;
    protected abstract clearCanvas(color: Color): void;
    public abstract drawLines(batchOfLines: BatchOfLines, color: Color, alpha: number): void;
    public abstract drawPolygons(polygons: IPolygon[], alpha: number): void;
}

export {
    BatchOfLines,
    Line,
    ILines,
    IPolygon,
    PlotterBase,
};
