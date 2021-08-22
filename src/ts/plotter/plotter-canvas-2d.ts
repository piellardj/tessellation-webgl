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
    color: Color;
}

class PlotterCanvas2D {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;

    private readonly cssPixel: number;

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

    public drawLines(linesBatches: ILinesBatch[]): void {
        this.context.fillStyle = "none";

        for (const linesBatch of linesBatches) {
            this.context.strokeStyle = linesBatch.color.toString();
            this.context.lineWidth = linesBatch.thickness;

            this.context.beginPath();
            for (const line of linesBatch.lines) {
                this.context.moveTo(line.p1.x, line.p1.y);
                this.context.lineTo(line.p2.x, line.p2.y);
            }
            this.context.stroke();
            this.context.closePath();
        }

        this.context.strokeStyle = "none";
    }

    private resizeCanvas(): void {
        const actualWidth = Math.floor(this.cssPixel * this.canvas.clientWidth);
        const actualHeight = Math.floor(this.cssPixel * this.canvas.clientHeight);

        if (this.canvas.width !== actualWidth || this.canvas.height !== actualHeight) {
            this.canvas.width = actualWidth;
            this.canvas.height = actualHeight;
        }
    }

    protected clearCanvas(color: Color): void {
        this.context.fillStyle = color.toString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export {
    ILine,
    ILinesBatch,
    PlotterCanvas2D,
};
