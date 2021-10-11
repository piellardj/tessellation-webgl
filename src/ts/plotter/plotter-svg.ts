import { Color } from "../misc/color";
import { Zoom } from "../misc/zoom";
import { BatchOfLines, BatchOfPolygons, PlotterBase } from "./plotter-base";


class PlotterSVG extends PlotterBase {
    private lines: string[] = [];

    public constructor() {
        super();
    }

    public get isReady(): boolean {
        return true;
    }

    public initialize(backgroundColor: Color, zoom: Zoom, scaling: number): void {
        this.lines = [];

        this.lines.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>`);
        this.lines.push(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${this.width} ${this.height}">`);
        this.lines.push(`<rect fill="${backgroundColor.toHexaString()}" stroke="none" x="0" y="0" width="${this.width}" height="${this.height}"/>`);
        this.lines.push(`\t<g transform="scale(${scaling})" transform-origin="${0.5 * this.width} ${0.5 * this.height}">`);

        const zoomTranslate = zoom.translate;
        this.lines.push(`\t\t<g transform="translate(${zoomTranslate.x}, ${zoomTranslate.y})">`);
        this.lines.push(`\t\t\t<g transform="scale(${zoom.scale})" transform-origin="${0.5 * this.width} ${0.5 * this.height}">`);
    }

    public finalize(): void {
        this.lines.push(`\t\t\t</g>`);
        this.lines.push(`\t\t</g>`);
        this.lines.push(`\t</g>`);
        this.lines.push(`</svg>`);
    }

    public drawLines(batchOfLines: BatchOfLines, thickness: number, color: Color, alpha: number): void {
        if (alpha > 0 && batchOfLines) {
            this.lines.push(`\t\t\t\t<g stroke="${color.toHexaString()}" fill="none" opacity="${alpha}">`);

            const halfWidth = 0.5 * this.width;
            const halfHeight = 0.5 * this.height;
            for (const line of batchOfLines.items) {
                const path: string[] = [];

                if (line.length >= 2) {
                    path.push(`M${line[0].x + halfWidth} ${line[0].y + halfHeight}`);

                    for (let iP = 1; iP < line.length; iP++) {
                        path.push(`L${line[iP].x + halfWidth} ${line[iP].y + halfHeight}`);
                    }
                }

                if (path.length > 0) {
                    this.lines.push(`\t\t\t\t\t<path stroke-width="${thickness}" d="${path.join()}"/>`);
                }
            }
            this.lines.push(`\t\t\t\t</g>`);
        }
    }

    public drawPolygons(batchOfPolygons: BatchOfPolygons, alpha: number): void {
        if (alpha > 0 && batchOfPolygons) {
            this.lines.push(`\t\t\t\t<g stroke="none" opacity="${alpha}">`);

            const halfWidth = 0.5 * this.width;
            const halfHeight = 0.5 * this.height;
            for (const polygon of batchOfPolygons.items) {
                if (polygon.vertices.length >= 3) {
                    const path: string[] = [];

                    if (polygon.vertices.length >= 3) {
                        path.push(`M${polygon.vertices[0].x + halfWidth} ${polygon.vertices[0].y + halfHeight}`);
                        for (let iP = 1; iP < polygon.vertices.length; iP++) {
                            path.push(`L${polygon.vertices[iP].x + halfWidth} ${polygon.vertices[iP].y + halfHeight}`);
                        }
                    }

                    if (path.length > 0) {
                        this.lines.push(`\t\t\t\t\t<path fill="${polygon.color.toHexaString()}" d="${path.join()}"/>`);
                    }
                }
            }
            this.lines.push(`\t\t\t\t</g>`);
        }
    }

    public output(): string {
        return this.lines.join("\n");
    }
}

export {
    PlotterSVG,
};
