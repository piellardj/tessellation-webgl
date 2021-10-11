import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { Throttle } from "../misc/throttle";
import { Zooming } from "../misc/zooming";
import { EPrimitive, Parameters } from "../parameters";
import { GeometryId } from "../plotter/geometry-id";
import { BatchOfLines, IBatch, PlotterBase } from "../plotter/plotter-base";
import { EVisibility, PrimitiveBase } from "../primitives/primitive-base";
import { PrimitiveQuads } from "../primitives/primitive-quads";
import { PrimitiveTriangles } from "../primitives/primitives-triangles";
import { PrimitiveTrianglesNested } from "../primitives/primitives-triangles-nested";

import "../page-interface-generated";


type BatchOfPrimitives = IBatch<PrimitiveBase>;

interface ILayer {
    primitives: BatchOfPrimitives;
    outlines: BatchOfLines;
}

class Engine {
    private rootPrimitive: PrimitiveBase;
    private layers: ILayer[];

    private lastLayerBirthTimestamp: number;

    public readonly currentCumulatedZooming: Zooming;
    private readonly maintainanceThrottle: Throttle;

    public constructor() {
        this.reset(new Rectangle(0, 512, 0, 512));
        this.currentCumulatedZooming = new Zooming({ x: 0, y: 0 }, 0);
        this.maintainanceThrottle = new Throttle(100);
    }

    public update(viewport: Rectangle, zooming: Zooming): boolean {
        let somethingChanged = false;

        this.currentCumulatedZooming.dt += zooming.dt;

        const maintainance = () => {
            // apply the cumulated zooming
            somethingChanged = this.applyCumulatedZooming(zooming) || somethingChanged;
            somethingChanged = this.adjustLayersCount() || somethingChanged;
            somethingChanged = this.handleRecycling(viewport) || somethingChanged;

            if (somethingChanged) {
                for (const layer of this.layers) {
                    layer.primitives.geometryId.registerChange();
                    layer.outlines.geometryId.registerChange();
                }
            }

            this.updateIndicators();
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
        if (Parameters.blending && this.layers.length > 1) {
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

        plotter.initialize();
        plotter.clearCanvas(Color.BLACK);

        plotter.drawPolygons(this.layers[lastSolidLayer].primitives, 1);
        if (emergingLayer < this.layers.length) {
            plotter.drawPolygons(this.layers[emergingLayer].primitives, emergingLayerAlpha);
        }

        if (Parameters.displayLines) {
            for (let iLayer = 0; iLayer < this.layers.length; iLayer++) {
                const thickness = Engine.getLineThicknessForLayer(iLayer, this.layers.length);
                const alpha = (iLayer === emergingLayer) ? emergingLayerAlpha : 1;
                plotter.drawLines(this.layers[iLayer].outlines, thickness, Parameters.linesColor, alpha);
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
        } else if (primitiveType === EPrimitive.TRIANGLES) {
            this.rootPrimitive = new PrimitiveTriangles(
                { x: viewport.left, y: viewport.bottom },
                { x: viewport.right, y: viewport.bottom },
                { x: 0, y: viewport.top },
                this.computeRootPrimitiveColor(),
            );
        } else {
            this.rootPrimitive = new PrimitiveTrianglesNested(
                { x: viewport.left, y: viewport.bottom },
                { x: viewport.right, y: viewport.bottom },
                { x: 0, y: viewport.top },
                this.computeRootPrimitiveColor(),
            );
        }

        this.rebuildLayersCollections();
        this.updateIndicators();
    }

    public recomputeColors(): void {
        this.rootPrimitive.color = this.computeRootPrimitiveColor();
        // The colors of the primitive in the VBO so we need to reupload it.
        for (const layer of this.layers) {
            layer.primitives.geometryId.registerChange();
        }
    }

    private computeRootPrimitiveColor(): Color {
        const minLuminosity = 0.3;
        const maxLuminosity = 0.7;
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

    private applyCumulatedZooming(newZoom: Zooming): boolean {
        let appliedZoom = false;

        if (this.currentCumulatedZooming.speed !== 0) {
            this.rootPrimitive.zoom(this.currentCumulatedZooming, true);
            appliedZoom = true;
        }

        // reset the cumulated zooming
        this.currentCumulatedZooming.center.x = newZoom.center.x;
        this.currentCumulatedZooming.center.y = newZoom.center.y;
        this.currentCumulatedZooming.speed = newZoom.speed;
        this.currentCumulatedZooming.dt = 0;

        return appliedZoom;
    }

    private handleRecycling(viewport: Rectangle): boolean {
        if (this.rootPrimitive.computeVisibility(viewport) === EVisibility.OUT_OF_VIEW) {
            this.reset(viewport);
            return true;
        } else {
            const lastLayer = this.layers[this.layers.length - 1];
            const nbPrimitivesLastLayer = lastLayer.primitives.items.length;

            const prunedPrimitives = this.prunePrimitivesOutOfView(this.rootPrimitive, viewport);
            const changedRootPrimitive = this.changeRootPrimitiveInNeeded();

            if (prunedPrimitives) {
                this.rebuildLayersCollections();

                if (Parameters.verbose) {
                    console.log(`went from ${nbPrimitivesLastLayer} to ${lastLayer.primitives.items.length}`);
                }
                return true;
            }

            return changedRootPrimitive || prunedPrimitives;
        }
        return false;
    }

    private adjustLayersCount(): boolean {
        const lastLayer = this.layers[this.layers.length - 1];
        const idealPrimitivesCountForLastLayer = Math.pow(2, Parameters.depth - 1);
        const currentPrimitivesCountForLastLayer = lastLayer.primitives.items.length;

        const subdivisionFactor = this.rootPrimitive.subdivisionFactor;
        if (currentPrimitivesCountForLastLayer <= idealPrimitivesCountForLastLayer / subdivisionFactor) {
            // subdivide once more
            const primitivesOfNewLayer: BatchOfPrimitives = {
                items: [],
                geometryId: GeometryId.new(),
            };
            const outlinesOfNewLayer: BatchOfLines = {
                items: [],
                geometryId: GeometryId.new(),
            };

            for (const primitive of lastLayer.primitives.items) {
                primitive.subdivide();
                Array.prototype.push.apply(primitivesOfNewLayer.items, primitive.getDirectChildren() as PrimitiveBase[]);
                outlinesOfNewLayer.items.push(primitive.subdivision);
            }

            this.lastLayerBirthTimestamp = performance.now();
            this.layers.push({
                primitives: primitivesOfNewLayer,
                outlines: outlinesOfNewLayer,
            });
        } else if (currentPrimitivesCountForLastLayer >= subdivisionFactor * idealPrimitivesCountForLastLayer) {
            // remove last subdivision
            for (const primitive of lastLayer.primitives.items) {
                primitive.removeChildren();
            }
            this.layers.pop();
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
            this.layers.shift();

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
            const primitives: BatchOfPrimitives = {
                items: this.rootPrimitive.getChildrenOfDepth(iDepth) as PrimitiveBase[],
                geometryId: GeometryId.new(),
            };


            const outlines: BatchOfLines = {
                items: [],
                geometryId: GeometryId.new(),
            };
            if (iDepth === 0) {
                outlines.items.push(this.rootPrimitive.getOutline());
            } else {
                const primitivesOfParentLayer = this.layers[iDepth - 1].primitives;
                for (const primitive of primitivesOfParentLayer.items) {
                    outlines.items.push(primitive.subdivision);
                }
            }

            this.layers.push({
                primitives,
                outlines,
            });
        }
    }

    private updateIndicators(): void {
        Page.Canvas.setIndicatorText("tree-depth", this.rootPrimitive.treeDepth().toString());

        Page.Canvas.setIndicatorText("primitives-count", this.layers[this.layers.length - 1].primitives.items.length.toString());

        let totalPrimitivesCount = 0;
        let segmentsCount = 0;
        for (const layer of this.layers) {
            totalPrimitivesCount += layer.primitives.items.length;

            for (const line of layer.outlines.items) {
                const nbLinePoints = line.length;
                segmentsCount += (nbLinePoints > 1) ? (nbLinePoints - 1) : 0;
            }
        }
        Page.Canvas.setIndicatorText("tree-nodes-count", totalPrimitivesCount.toString());
        Page.Canvas.setIndicatorText("segments-count", segmentsCount.toString());
    }
}

export { Engine };

