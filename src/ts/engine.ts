import { Color } from "./color/color";
import { Parameters } from "./parameters";
import { ILinesBatch, PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { Primitive } from "./primitives/primitive";
import { EOrientation, PrimitiveLines } from "./primitives/primitive-lines";


type Layer = Primitive[];

class Engine {
    private rootPrimitive: Primitive;
    private layers: Layer[];
    private linesBatches: ILinesBatch[];

    private startTime: number;

    public constructor() {
        this.reset(512, 512);
    }

    public update(): void {
        this.adjustLayersCount(Parameters.depth);
    }

    public draw(plotter: PlotterCanvas2D): void {
        this.adjustLinesThickness();

        plotter.initialize(Color.BLACK);

        const maxDepth = 0.001 * (performance.now() - this.startTime);
        const lastSolidLayer = Math.min(Math.floor(maxDepth), this.layers.length - 1);

        const hasEmergingLayer = (lastSolidLayer < this.layers.length - 1);
        const emergingLayer = lastSolidLayer + 1;
        const emergingLayerAlpha = maxDepth - Math.floor(maxDepth);

        plotter.drawPolygons(this.layers[lastSolidLayer]);
        if (hasEmergingLayer && emergingLayer < this.layers.length) {
            plotter.drawPolygons(this.layers[emergingLayer], emergingLayerAlpha);
        }

        plotter.drawLines(this.linesBatches.slice(0, emergingLayer), Parameters.linesColor);
        if (hasEmergingLayer && emergingLayer < this.linesBatches.length) {
            plotter.drawLines([this.linesBatches[emergingLayer]], Parameters.linesColor, emergingLayerAlpha);
        }
    }

    public reset(canvasWidth: number, canvasHeight: number): void {
        const halfWidth = 0.5 * canvasWidth;
        const halfHeight = 0.5 * canvasHeight;

        this.rootPrimitive = new PrimitiveLines(
            { x: -halfWidth, y: -halfHeight }, { x: halfWidth, y: -halfHeight }, { x: -halfWidth, y: halfHeight }, { x: halfWidth, y: halfHeight },
            (canvasWidth >= canvasHeight) ? EOrientation.VERTICAL : EOrientation.HORIZONTAL,
            Color.random(),
        );

        const rootLayer = [this.rootPrimitive];
        this.layers = [rootLayer];
        this.linesBatches = [];
        this.startTime = performance.now();
    }

    public recomputeColors(): void {
        this.rootPrimitive.color = Color.random();
    }

    private adjustLayersCount(wantedLayersCount: number): void {
        if (wantedLayersCount < 1) {
            wantedLayersCount = 1;
        }

        if (this.layers.length !== wantedLayersCount) {
            if (this.layers.length > wantedLayersCount) {
                for (const primitive of this.layers[wantedLayersCount - 1]) {
                    primitive.removeChildren();
                }
                this.layers.length = wantedLayersCount;
                this.linesBatches.length = wantedLayersCount - 1;
            } else {
                while (this.layers.length < wantedLayersCount) {
                    let newLayer: Layer = [];
                    const newLinesBatch: ILinesBatch = {
                        lines: [],
                        thickness: 1,
                    };

                    const lastLayer = this.layers[this.layers.length - 1];
                    for (const parentPrimitive of lastLayer) {
                        parentPrimitive.subdivide();
                        newLinesBatch.lines.push(parentPrimitive.subdivision);
                        newLayer = newLayer.concat(parentPrimitive.children);
                    }

                    this.layers.push(newLayer);
                    this.linesBatches.push(newLinesBatch);
                }
            }
        }
    }

    private adjustLinesThickness(): void {
        const MAX_THICKNESS = Parameters.thickness;

        for (let iB = 0; iB < this.linesBatches.length; iB++) {
            this.linesBatches[iB].thickness = 1 + MAX_THICKNESS * (this.linesBatches.length - 1 - iB) / (this.linesBatches.length - 1);
        }
    }
}

export { Engine };
