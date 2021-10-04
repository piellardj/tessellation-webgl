import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { Zooming } from "../misc/zooming";
import { EPrimitive, Parameters } from "../parameters";
import { ILinesBatch, Line, PlotterBase } from "../plotter/plotter-base";
import { EVisibility, PrimitiveBase } from "../primitives/primitive-base";
import { PrimitiveQuads } from "../primitives/primitive-quads";
import { PrimitiveTriangles } from "../primitives/primitives-triangles";
import { EngineBase } from "./engine-base";


type Layer = PrimitiveBase[];

class Engine extends EngineBase {
    private rootPrimitive: PrimitiveBase;
    private layers: Layer[];
    private linesBatches: ILinesBatch[];

    private lastLayerBirthTimestamp: number;

    public constructor() {
        super();
        this.reset(new Rectangle(0, 512, 0, 512));
    }

    public update(viewport: Rectangle, zooming: Zooming): boolean {
        let somethingChanged = false;
        somethingChanged = this.adjustLayersCount() || somethingChanged;
        somethingChanged = this.handleZoom(zooming) || somethingChanged;
        somethingChanged = this.handleRecycling(viewport) || somethingChanged;
        return somethingChanged;
    }

    public draw(plotter: PlotterBase): void {
        this.adjustLinesThickness();

        plotter.initialize(Color.BLACK);

        let lastSolidLayer = this.layers.length - 1;
        let emergingLayer = lastSolidLayer + 1;
        let emergingLayerAlpha = 0;
        if (Parameters.zoomingSpeed > 0) {
            const emergingTimeOfLastLayer = 1000 / Math.pow((1 + Parameters.zoomingSpeed), 2);
            const ageOfLastLayer = performance.now() - this.lastLayerBirthTimestamp;
            emergingLayerAlpha = Math.min(1, ageOfLastLayer / emergingTimeOfLastLayer);

            if (emergingLayerAlpha < 1) {
                lastSolidLayer--;
                emergingLayer--;
            }
        }

        plotter.drawPolygons(this.layers[lastSolidLayer], 1);
        if (emergingLayer < this.layers.length) {
            plotter.drawPolygons(this.layers[emergingLayer], emergingLayerAlpha);
        }

        if (Parameters.displayLines && this.linesBatches.length > 0) {
            this.linesBatches[0].lines.push(this.rootPrimitive.getOutline());

            plotter.drawLines(this.linesBatches.slice(0, emergingLayer), Parameters.linesColor, 1);
            if (emergingLayer < this.linesBatches.length) {
                plotter.drawLines([this.linesBatches[emergingLayer]], Parameters.linesColor, emergingLayerAlpha);
            }
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
                this.computeRootPrimitiveColor(),
            );
        } else {
            this.rootPrimitive = new PrimitiveTriangles(
                { x: viewport.left, y: viewport.bottom },
                { x: viewport.right, y: viewport.bottom },
                { x: 0, y: viewport.top },
                this.computeRootPrimitiveColor(),
            );
        }

        const rootLayer = [this.rootPrimitive];
        this.layers = [rootLayer];
        this.linesBatches = [];
    }

    public recomputeColors(): void {
        this.rootPrimitive.color = this.computeRootPrimitiveColor();
    }

    private computeRootPrimitiveColor(): Color {
        const minLuminosity = 0.6;
        const maxLuminosity = 0.9;
        const maxNbTries = 10;

        let bestColor = Color.random();

        for (let iTry = 0; iTry < maxNbTries; iTry++) {
            const luminosity = bestColor.luminosity;
            if (luminosity < minLuminosity) {
                const newCandidate = Color.random();
                if (newCandidate.luminosity > luminosity) {
                    bestColor = newCandidate;
                }
            } else if (luminosity > maxLuminosity) {
                const newCandidate = Color.random();
                if (newCandidate.luminosity < luminosity) {
                    bestColor = newCandidate;
                }
            } else {
                break;
            }
        }
        return bestColor;
    }

    private handleZoom(zooming: Zooming): boolean {
        if (zooming.speed !== 0) {
            this.rootPrimitive.zoom(zooming, true);
            return true;
        }
        return false;
    }

    private handleRecycling(viewport: Rectangle): boolean {
        const nbPrimitivesLastLayer = this.layers[this.layers.length - 1].length;

        const prunedPrimitives = this.prunePrimitivesOutOfView(this.rootPrimitive, viewport);
        const changedRootPrimitive = this.changeRootPrimitiveInNeeded();

        if (changedRootPrimitive || prunedPrimitives) {
            this.rebuildLayersCollections();

            if (Parameters.debugMode) {
                console.log(`went from ${nbPrimitivesLastLayer} to ${this.layers[this.layers.length - 1].length}`);
            }
            return true;
        }
        return false;
    }

    private adjustLayersCount(): boolean {
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
                newLayer = newLayer.concat(primitive.getDirectChildren() as PrimitiveBase[]);
            }

            this.layers.push(newLayer);
            this.linesBatches.push(newLinesBatch);
            this.lastLayerBirthTimestamp = performance.now();
        } else if (currentPrimitivesCountForLastLayer >= 2 * idealPrimitivesCountForLastLayer) {
            // remove last subdivision
            for (const primitive of lastLayer) {
                primitive.removeChildren();
            }
            this.layers.pop();
            this.linesBatches.pop();
        } else { // nothing to do
            return false;
        }

        return true;
    }

    private adjustLinesThickness(): void {
        const MAX_THICKNESS = Parameters.thickness;

        for (let iB = 0; iB < this.linesBatches.length; iB++) {
            this.linesBatches[iB].thickness = 1 + MAX_THICKNESS * (this.linesBatches.length - 1 - iB) / (this.linesBatches.length - 1);
        }
    }

    private changeRootPrimitiveInNeeded(): boolean {
        const directChildrenOfRoot = this.rootPrimitive.getDirectChildren();
        if (directChildrenOfRoot.length === 1) {
            this.rootPrimitive = directChildrenOfRoot[0] as PrimitiveBase;

            if (Parameters.debugMode) {
                console.log("root changed");
            }
            return true;
        }
        return false;
    }

    private prunePrimitivesOutOfView(primitive: PrimitiveBase, viewport: Rectangle): boolean {
        let changedSomething = false;

        for (let iC = primitive.children.length - 1; iC >= 0; iC--) {
            const child = primitive.children[iC] as PrimitiveBase;

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
        const treeDepth = this.rootPrimitive.treeDepth();

        this.layers = [];
        for (let iDepth = 0; iDepth < treeDepth; iDepth++) {
            const layerOfCurrentDepth = this.rootPrimitive.getChildrenOfDepth(iDepth);
            this.layers.push(layerOfCurrentDepth as Layer);
        }

        this.linesBatches = [];
        for (let iLayer = 0; iLayer < this.layers.length - 1; iLayer++) {
            const lines: Line[] = [];
            for (const primitive of this.layers[iLayer]) {
                lines.push(primitive.subdivision);
            }

            this.linesBatches.push({
                lines,
                thickness: 1,
            });
        }
    }
}

export { Engine };
