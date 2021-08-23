import { Color } from "./color/color";
import { Parameters } from "./parameters";
import { ILine, ILinesBatch, PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { EOrientation, Primitive } from "./primitives/primitive";

type Layer = Primitive[];

class Engine {
    private rootPrimitive: Primitive;
    private layers: Layer[];

    private linesBatches: ILinesBatch[] | null;

    public constructor() {
        this.reset(512, 512);
    }

    public update(): void {
        this.adjustLayersCount(Parameters.depth);
    }

    public draw(plotter: PlotterCanvas2D): void {
        if (!this.linesBatches) {
            this.computeLinesBatches();
        }

        plotter.initialize(Color.BLACK);
        plotter.drawPolygons(this.layers[this.layers.length - 1]);
        plotter.drawLines(this.linesBatches, Parameters.linesColor);
    }

    public reset(canvasWidth: number, canvasHeight: number): void {
        const halfWidth = 0.5 * canvasWidth;
        const halfHeight = 0.5 * canvasHeight;

        this.rootPrimitive = new Primitive(
            { x: -halfWidth, y: -halfHeight }, { x: halfWidth, y: -halfHeight }, { x: -halfWidth, y: halfHeight }, { x: halfWidth, y: halfHeight },
            (canvasWidth >= canvasHeight) ? EOrientation.VERTICAL : EOrientation.HORIZONTAL,
            Color.random(),
        );

        const rootLayer = [this.rootPrimitive];
        this.layers = [rootLayer];
        this.recomputeLines();
    }

    public recomputeColors(): void {
        this.rootPrimitive.color = Color.random();
    }

    public recomputeLines(): void {
        this.linesBatches = null;
    }

    private adjustLayersCount(wantedLayersCount: number): void {
        if (wantedLayersCount < 1) {
            wantedLayersCount = 1;
        }

        if (this.layers.length !== wantedLayersCount) {
            this.linesBatches = null;

            if (this.layers.length > wantedLayersCount) {
                for (const primitive of this.layers[wantedLayersCount - 1]) {
                    primitive.removeChildren();
                }
                this.layers.length = wantedLayersCount;
            } else {
                while (this.layers.length < wantedLayersCount) {
                    let newLayer: Layer = [];

                    const lastLayer = this.layers[this.layers.length - 1];
                    for (const parentPrimitive of lastLayer) {
                        newLayer = newLayer.concat(parentPrimitive.subdivide());
                    }

                    this.layers.push(newLayer);
                }
            }
        }
    }

    private computeLinesBatches(): void {
        this.linesBatches = [];

        const MAX_THICKNESS = Parameters.thickness;

        for (let iLayer = 0; iLayer < this.layers.length - 1; iLayer++) {
            const layer = this.layers[iLayer];

            const lines: ILine[] = [];
            for (const primitive of layer) {
                lines.push({
                    p1: primitive.subdivision[0],
                    p2: primitive.subdivision[1],
                });
            }

            this.linesBatches.push({
                lines,
                thickness: 1 + MAX_THICKNESS * (this.layers.length - 2 - iLayer) / (this.layers.length - 2),
            });
        }
    }
}

export { Engine };
