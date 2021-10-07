import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { Throttle } from "../misc/throttle";
import { Zooming } from "../misc/zooming";
import { EPrimitive, Parameters } from "../parameters";
import { GeometryId } from "../plotter/geometry-id";
import { BatchOfLines, PlotterBase } from "../plotter/plotter-base";
import { EVisibility, PrimitiveBase } from "../primitives/primitive-base";
import { PrimitiveQuads } from "../primitives/primitive-quads";
import { PrimitiveTriangles } from "../primitives/primitives-triangles";
import { EngineBase } from "./engine-base";


type Layer = PrimitiveBase[];

class Engine extends EngineBase {
    private rootPrimitive: PrimitiveBase;
    private layers: Layer[];
    private linesBatches: BatchOfLines[];

    private lastLayerBirthTimestamp: number;

    public readonly currentCumulatedZooming: Zooming;
    private readonly maintainanceThrottle: Throttle;

    public constructor() {
        super();
        this.reset(new Rectangle(0, 512, 0, 512));
        this.currentCumulatedZooming = new Zooming({ x: 0, y: 0 }, 0);
        this.maintainanceThrottle = new Throttle(100);
    }

    public update(viewport: Rectangle, zooming: Zooming): boolean {
        let somethingChanged = false;

        this.currentCumulatedZooming.dt += zooming.dt;

        const maintainance = () => {
            // apply the cumulated zooming
            somethingChanged = this.handleZoom(this.currentCumulatedZooming) || somethingChanged;
            somethingChanged = this.adjustLayersCount() || somethingChanged;
            somethingChanged = this.handleRecycling(viewport) || somethingChanged;

            if (somethingChanged) {
                for (const batchOfLines of this.linesBatches) {
                    batchOfLines.geometryId.registerChange();
                }
            }

            // reset the cumulated zooming
            this.currentCumulatedZooming.center.x = zooming.center.x;
            this.currentCumulatedZooming.center.y = zooming.center.y;
            this.currentCumulatedZooming.speed = zooming.speed;
            this.currentCumulatedZooming.dt = 0;
        };

        const zoomingHasChanged =
            (this.currentCumulatedZooming.center.x !== zooming.center.x) ||
            (this.currentCumulatedZooming.center.y !== zooming.center.y) ||
            (this.currentCumulatedZooming.speed !== zooming.speed);

        if (zoomingHasChanged) {
            // zooming has changed, so we cannot easily reconstruct the cumulated zooming
            // force-apply the cumulated zooming now,
            // and reset it to the current zooming.
            this.maintainanceThrottle.forceRun(maintainance);
        } else {
            // don't do maintainance too often because it is costly
            this.maintainanceThrottle.runIfAvailable(maintainance);
        }

        return somethingChanged;
    }

    public draw(plotter: PlotterBase): void {
        if (this.layers.length < 1) {
            return;
        }

        let lastSolidLayer = this.layers.length - 1;
        let emergingLayerAlpha = 0;
        if (this.layers.length > 1) {
            if (Parameters.zoomingSpeed > 0) {
                const emergingTimeOfLastLayer = 1000 / Math.pow((1 + Parameters.zoomingSpeed), 2);
                const ageOfLastLayer = performance.now() - this.lastLayerBirthTimestamp;
                if (ageOfLastLayer < emergingTimeOfLastLayer) {
                    // last layer is still blending in
                    lastSolidLayer--;
                    emergingLayerAlpha = ageOfLastLayer / emergingTimeOfLastLayer;
                }
            }
        }
        const emergingLayer = lastSolidLayer + 1;

        plotter.prepare();

        plotter.drawPolygons(this.layers[lastSolidLayer], 1);
        if (emergingLayer < this.layers.length) {
            plotter.drawPolygons(this.layers[emergingLayer], emergingLayerAlpha);
        }

        if (Parameters.displayLines) {
            for (let iLayer = 0; iLayer < this.linesBatches.length; iLayer++) {
                const thickness = Engine.getLineThicknessForLayer(iLayer, this.linesBatches.length);
                const alpha = (iLayer === emergingLayer) ? emergingLayerAlpha : 1;
                plotter.drawLines(this.linesBatches[iLayer], thickness, Parameters.linesColor, alpha);
            }
        }

        plotter.finalize(this.currentCumulatedZooming);
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

        this.rebuildLayersCollections();
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

            if (Parameters.verbose) {
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
            const newBatchOfLines: BatchOfLines = {
                items: [],
                geometryId: GeometryId.new(),
            };

            for (const primitive of lastLayer) {
                primitive.subdivide();
                newBatchOfLines.items.push(primitive.subdivision);
                newLayer = newLayer.concat(primitive.getDirectChildren() as PrimitiveBase[]);
            }

            this.layers.push(newLayer);
            this.linesBatches.push(newBatchOfLines);
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

    private static getLineThicknessForLayer(layerId: number, totalLayersCount: number): number {
        let variablePart = 0;
        if (layerId > 0) {
            variablePart = Parameters.thickness * (totalLayersCount - 1 - layerId) / (totalLayersCount - 1);
        }
        return 1 + variablePart;
    }

    private changeRootPrimitiveInNeeded(): boolean {
        const directChildrenOfRoot = this.rootPrimitive.getDirectChildren();
        if (directChildrenOfRoot.length === 1) {
            this.rootPrimitive = directChildrenOfRoot[0] as PrimitiveBase;

            if (Parameters.verbose) {
                console.log("root changed");
            }
            return true;
        }
        return false;
    }

    private prunePrimitivesOutOfView(primitive: PrimitiveBase, viewport: Rectangle): boolean {
        let changedSomething = false;

        const directChildren = primitive.getDirectChildren() as PrimitiveBase[];
        for (const child of directChildren) {
            const visibility = child.computeVisibility(viewport);
            if (visibility === EVisibility.OUT_OF_VIEW) {
                primitive.removeChild(child);
                changedSomething = true;
            } else if (visibility === EVisibility.VISIBLE) {
                // if it is partially visible, some of its children may be completely out of view
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
        for (let iLayer = 0; iLayer < this.layers.length; iLayer++) {
            const newBatchOfLines: BatchOfLines = {
                items: [],
                geometryId: GeometryId.new(),
            };

            if (iLayer === 0) {
                newBatchOfLines.items.push(this.rootPrimitive.getOutline());
            } else {
                for (const primitive of this.layers[iLayer - 1]) {
                    newBatchOfLines.items.push(primitive.subdivision);
                }
            }

            this.linesBatches.push(newBatchOfLines);
        }
    }
}

export { Engine };
