import { Color } from "../misc/color";
import { Zoom } from "../misc/zoom";
import { BatchOfLines, BatchOfPolygons } from "./types";


interface IPlotter {
    get isReady(): boolean;

    initialize(backgroundColor: Color, zoom: Zoom, scaling: number): void;
    finalize(): void;

    drawLines(batchOfLines: BatchOfLines, thickness: number, color: Color, alpha: number): void;
    drawPolygons(batchOfPolygons: BatchOfPolygons, alpha: number): void;
}

export {
    IPlotter,
};

