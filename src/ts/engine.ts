import { Color } from "./color/color";
import { EPrimitive, Parameters } from "./parameters";
import { ILinesBatch, PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { EVisibility, Primitive } from "./primitives/primitive";
import { PrimitiveQuads } from "./primitives/primitive-quads";
import { PrimitiveTriangles } from "./primitives/primitives-triangles";
import { Rectangle } from "./rectangle";
import { Zooming } from "./zooming";


type Layer = Primitive[];

class Engine {
    private rootPrimitive: Primitive;
    private layers: Layer[];
    private linesBatches: ILinesBatch[];

    private startTime: number;

    public constructor() {
        this.reset(new Rectangle(0, 512, 0, 512));
    }

    public update(viewport: Rectangle, zooming: Zooming): void {
        this.adjustLayersCount();
        this.handleZoom(zooming);
        this.handleRecycling(viewport);
    }

    public draw(plotter: PlotterCanvas2D): void {
        this.adjustLinesThickness();

        plotter.initialize(Color.BLACK);

        const maxDepth = 10000 + 0.001 * (performance.now() - this.startTime);
        const lastSolidLayer = Math.min(Math.floor(maxDepth), this.layers.length - 1);

        const emergingLayer = lastSolidLayer + 1;
        const emergingLayerAlpha = maxDepth - Math.floor(maxDepth);

        plotter.drawPolygons(this.layers[lastSolidLayer]);
        if (emergingLayer < this.layers.length) {
            plotter.drawPolygons(this.layers[emergingLayer], emergingLayerAlpha);
        }

        plotter.drawLines(this.linesBatches.slice(0, emergingLayer), Parameters.linesColor);
        if (emergingLayer < this.linesBatches.length) {
            plotter.drawLines([this.linesBatches[emergingLayer]], Parameters.linesColor, emergingLayerAlpha);
        }
    }

    public reset(viewport: Rectangle): void {
        const primitiveType = Parameters.primitive;
        if (primitiveType === EPrimitive.QUADS) {
            this.rootPrimitive = new PrimitiveQuads(
                { x: viewport.left, y: viewport.top },
                { x: viewport.right, y: viewport.top },
                { x: viewport.left, y: viewport.bottom },
                { x: viewport.right, y: viewport.bottom },
                Color.random(),
            );
        } else {
            this.rootPrimitive = new PrimitiveTriangles(
                { x: viewport.left, y: viewport.bottom },
                { x: viewport.right, y: viewport.bottom },
                { x: 0, y: viewport.top },
                Color.random(),
            );
        }

        const rootLayer = [this.rootPrimitive];
        this.layers = [rootLayer];
        this.linesBatches = [];
        this.startTime = performance.now();
    }

    public recomputeColors(): void {
        this.rootPrimitive.color = Color.random();
    }

    private handleZoom(zooming: Zooming): void {
        this.rootPrimitive.zoom(zooming, true);
    }

    private handleRecycling(viewport: Rectangle): void {
        const nbPrimitivesLastLayer = this.layers[this.layers.length - 1].length;

        const prunedPrimitives = this.prunePrimitivesOutOfView(this.rootPrimitive, viewport);
        const changedRootPrimitive = this.changeRootPrimitiveInNeeded();

        if (changedRootPrimitive || prunedPrimitives) {
            this.rebuildLayersCollections();
            console.log(`went from ${nbPrimitivesLastLayer} to ${this.layers[this.layers.length - 1].length}`);
        }
    }

    private adjustLayersCount(): void {
        const lastLayer = this.layers[this.layers.length - 1];
        const idealPrimitivesCountForLastLayer = Math.pow(2, Parameters.depth - 1);
        const currentPrimitivesCountForLastLayer = lastLayer.length;

        if (currentPrimitivesCountForLastLayer <= 0.5 * idealPrimitivesCountForLastLayer) {
            // subdivide once more
            let newLayer: Layer = [];
            const newLinesBatch: ILinesBatch = {
                lines: [],
                thickness: 1,
            };

            for (const primitive of lastLayer) {
                primitive.subdivide();
                newLinesBatch.lines.push(primitive.subdivision);
                newLayer = newLayer.concat(primitive.children);
            }

            this.layers.push(newLayer);
            this.linesBatches.push(newLinesBatch);
        } else if (currentPrimitivesCountForLastLayer >= 2 * idealPrimitivesCountForLastLayer) {
            // remove last subdivision
            for (const primitive of lastLayer) {
                primitive.removeChildren();
            }
            this.layers.pop();
            this.linesBatches.pop();
        }
    }

    private adjustLinesThickness(): void {
        const MAX_THICKNESS = Parameters.thickness;

        for (let iB = 0; iB < this.linesBatches.length; iB++) {
            this.linesBatches[iB].thickness = 1 + MAX_THICKNESS * (this.linesBatches.length - 1 - iB) / (this.linesBatches.length - 1);
        }
    }

    private changeRootPrimitiveInNeeded(): boolean {
        if (this.rootPrimitive.children.length === 1) {
            this.rootPrimitive = this.rootPrimitive.children[0];
            console.log("root changed");
            return true;
        }
        return false;
    }

    private prunePrimitivesOutOfView(primitive: Primitive, viewport: Rectangle): boolean {
        let changedSomething = false;

        for (let iC = primitive.children.length - 1; iC >= 0; iC--) {
            const child = primitive.children[iC];

            const visibility = child.computeVisibility(viewport);
            if (visibility === EVisibility.OUT_OF_VIEW) {
                primitive.children.splice(iC, 1);
                changedSomething = true;
            } else if (visibility === EVisibility.VISIBLE) {
                if (this.prunePrimitivesOutOfView(child, viewport)) {
                    changedSomething = true;
                }
            }
        }

        return changedSomething;
    }

    private rebuildLayersCollections(): void {
        this.layers = [[this.rootPrimitive]];
        this.linesBatches = [];
        if (this.rootPrimitive.subdivision) {
            this.linesBatches.push({
                lines: [this.rootPrimitive.subdivision],
                thickness: 1,
            });
        }

        let newChildren = this.rootPrimitive.children.length > 0;
        while (newChildren) {
            let newLayer: Layer = [];
            const newLinesBatch: ILinesBatch = {
                lines: [],
                thickness: 1,
            };

            const lastLayer = this.layers[this.layers.length - 1];
            for (const primitive of lastLayer) {
                newLayer = newLayer.concat(primitive.children);
                if (primitive.subdivision) {
                    newLinesBatch.lines.push(primitive.subdivision);
                }
            }

            if (newLayer.length > 0) {
                this.layers.push(newLayer);

                if (newLinesBatch.lines.length > 0) {
                    this.linesBatches.push(newLinesBatch);
                }
            } else {
                newChildren = false;
            }
        }
    }
}

export { Engine };
