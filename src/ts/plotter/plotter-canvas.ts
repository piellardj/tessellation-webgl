import { Rectangle } from "../misc/rectangle";

import "../page-interface-generated";


abstract class PlotterCanvas {
    protected readonly canvas: HTMLCanvasElement;
    protected readonly cssPixel: number;

    private _width: number;
    private _height: number;

    protected constructor() {
        this.canvas = Page.Canvas.getCanvas();
        this.cssPixel = window.devicePixelRatio ?? 1;
        this.resizeCanvas();
    }

    public abstract get isReady(): boolean;

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
}

export {
    PlotterCanvas,
};

