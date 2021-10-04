import { Color } from "../misc/color";
import { ILinesBatch, IPolygon, PlotterBase } from "./plotter-base";


class PlotterSVG extends PlotterBase {
    private lines: string[];

    public constructor() {
        super();
    }

    public get isReady(): boolean {
        return true;
    }

    public initialize(backgroundColor: Color): void {
        this.lines = [];
        super.initialize(backgroundColor);

        this.lines.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>`);
        this.lines.push(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${this.width} ${this.height}">`);
        this.lines.push(`\t<rect fill="${backgroundColor.toHexaString()}" stroke="none" x="0" y="0" width="${this.width}" height="${this.height}"/>`);
    }

    // tslint:disable-next-line:no-empty
    protected clearCanvas(): void { }

    public drawLines(linesBatches: ILinesBatch[], color: Color, alpha: number): void {
        if (alpha > 0 && linesBatches) {
            this.lines.push(`\t<g stroke="${color.toHexaString()}" fill="none" opacity="${alpha}">`);

            const halfWidth = 0.5 * this.width;
            const halfHeight = 0.5 * this.height;
            for (const linesBatch of linesBatches) {
                const path: string[] = [];

                for (const line of linesBatch.lines) {
                    if (line.length >= 2) {
                        path.push(`M${line[0].x + halfWidth} ${line[0].y + halfHeight}`);

                        for (let iP = 1; iP < line.length; iP++) {
                            path.push(`L${line[iP].x + halfWidth} ${line[iP].y + halfHeight}`);
                        }
                    }
                }

                if (path.length > 0) {
                    this.lines.push(`\t\t<path stroke-width="${linesBatch.thickness}" d="${path.join()}"/>`);
                }
            }
            this.lines.push(`\t</g>`);
        }
    }

    public drawPolygons(polygons: IPolygon[], alpha: number): void {
        if (alpha > 0 && polygons) {
            this.lines.push(`\t<g stroke="none" opacity="${alpha}">`);

            const halfWidth = 0.5 * this.width;
            const halfHeight = 0.5 * this.height;
            for (const polygon of polygons) {
                if (polygon.vertices.length >= 3) {
                    const path: string[] = [];

                    if (polygon.vertices.length >= 3) {
                        path.push(`M${polygon.vertices[0].x + halfWidth} ${polygon.vertices[0].y + halfHeight}`);
                        for (let iP = 1; iP < polygon.vertices.length; iP++) {
                            path.push(`L${polygon.vertices[iP].x + halfWidth} ${polygon.vertices[iP].y + halfHeight}`);
                        }
                    }

                    if (path.length > 0) {
                        this.lines.push(`\t\t<path fill="${polygon.color.toHexaString()}" d="${path.join()}"/>`);
                    }
                }
            }
            this.lines.push(`\t</g>`);
        }
    }

    public finalize(): string {
        this.lines.push(`</svg>`);
        return this.lines.join("\n");
    }
}

export {
    PlotterSVG,
};
