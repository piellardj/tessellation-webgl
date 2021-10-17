import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { GeometryId } from "../plotter/geometry-id";
import { BatchOfLines, IBatch, Line } from "../plotter/types";
import { EVisibility, PrimitiveBase } from "../primitives/primitive-base";
import { PrimitiveQuads } from "../primitives/primitive-quads";
import { PrimitiveTriangles } from "../primitives/primitive-triangles";
import { PrimitiveTrianglesNested } from "../primitives/primitive-triangles-nested";
import { EPrimitiveType } from "../primitives/primitive-type-enum";
import { IEngineMetrics } from "./engine-metrics";

import "../page-interface-generated";


type BatchOfPrimitives = IBatch<PrimitiveBase>;

interface ILayer {
    primitives: BatchOfPrimitives;
    outlines: BatchOfLines;
    readonly birthTimestamp: number;
}

abstract class Engine {
    private rootPrimitive: PrimitiveBase;
    protected layers: ILayer[];

    public constructor() {
        this.reset(new Rectangle(0, 512, 0, 512), EPrimitiveType.TRIANGLES);
    }

    public reset(viewport: Rectangle, primitiveType: EPrimitiveType): void {
        if (primitiveType === EPrimitiveType.QUADS) {
            this.rootPrimitive = new PrimitiveQuads(
                { x: viewport.left, y: viewport.top },
                { x: viewport.right, y: viewport.top },
                { x: viewport.left, y: viewport.bottom },
                { x: viewport.right, y: viewport.bottom },
                this.computeRootPrimitiveColor(),
            );
        } else if (primitiveType === EPrimitiveType.TRIANGLES) {
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

        this.layers = [{
            primitives: {
                items: [this.rootPrimitive],
                geometryId: GeometryId.new(),
            },
            outlines: {
                items: [this.rootPrimitive.getOutline()],
                geometryId: GeometryId.new(),
            },
            birthTimestamp: performance.now(),
        }];

        this.onNewMetrics(this.computeMetrics());
    }

    public recomputeColors(colorVariation: number): void {
        const newColor = this.computeRootPrimitiveColor();
        this.rootPrimitive.setColor(newColor, colorVariation);

        // The colors of the primitive in the VBO so we need to reupload it.
        for (const layer of this.layers) {
            layer.primitives.geometryId.registerChange();
        }
    }

    public performUpdate(zoomToApply: Zoom, viewport: Rectangle, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean {
        let somethingChanged = false;

        const viewportAfterZoom = viewport.computeNewRectangleAfterZoom(zoomToApply);
        somethingChanged = this.handleRecycling(viewportAfterZoom) || somethingChanged;
        somethingChanged = this.applyZoom(zoomToApply) || somethingChanged;
        somethingChanged = this.adjustLayersCount(wantedDepth, subdivisionBalance, colorVariation) || somethingChanged;

        if (somethingChanged) {
            for (const layer of this.layers) {
                layer.primitives.geometryId.registerChange();
                layer.outlines.geometryId.registerChange();
            }

            this.onNewMetrics(this.computeMetrics());
        }

        return somethingChanged;
    }

    protected abstract onNewMetrics(newMetrics: IEngineMetrics): void;

    private computeMetrics(): IEngineMetrics {
        const treeDepth = this.rootPrimitive.treeDepth();
        const lastLayerPrimitivesCount = this.layers[this.layers.length - 1].primitives.items.length;
        let totalPrimitivesCount = 0;
        let segmentsCount = 0;

        for (const layer of this.layers) {
            totalPrimitivesCount += layer.primitives.items.length;

            for (const line of layer.outlines.items) {
                const nbLinePoints = line.length;
                segmentsCount += (nbLinePoints > 1) ? (nbLinePoints - 1) : 0;
            }
        }

        return {
            treeDepth,
            lastLayerPrimitivesCount,
            totalPrimitivesCount,
            segmentsCount,
        };
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

    private applyZoom(zoomToApply: Zoom): boolean {
        let appliedZoom = false;

        if (zoomToApply.isNotNull()) {
            this.rootPrimitive.zoom(zoomToApply, true);
            appliedZoom = true;
        }

        return appliedZoom;
    }

    private handleRecycling(viewport: Rectangle): boolean {
        if (this.rootPrimitive.computeVisibility(viewport) === EVisibility.OUT_OF_VIEW) {
            this.reset(viewport, this.primitiveType);
            return true;
        } else {
            const prunedPrimitives = this.prunePrimitivesOutOfView(this.rootPrimitive, viewport);
            const changedRootPrimitive = this.changeRootPrimitiveIfNeeded();

            if (prunedPrimitives) {
                this.rebuildLayersCollections();
                return true;
            }

            return changedRootPrimitive || prunedPrimitives;
        }
    }

    private adjustLayersCount(wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean {
        const lastLayer = this.layers[this.layers.length - 1];
        const idealPrimitivesCountForLastLayer = Math.pow(2, wantedDepth - 1);
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
                primitive.subdivide(subdivisionBalance, colorVariation);
                Array.prototype.push.apply(primitivesOfNewLayer.items, primitive.getDirectChildren() as PrimitiveBase[]);
                outlinesOfNewLayer.items.push(primitive.subdivision);
            }

            this.layers.push({
                primitives: primitivesOfNewLayer,
                outlines: outlinesOfNewLayer,
                birthTimestamp: performance.now()
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

    private changeRootPrimitiveIfNeeded(): boolean {
        let changedSomething = false;
        let directChildrenOfRoot = this.rootPrimitive.getDirectChildren();
        while (directChildrenOfRoot.length === 1) {
            this.rootPrimitive = directChildrenOfRoot[0] as PrimitiveBase;
            this.layers.shift();
            changedSomething = true;
            directChildrenOfRoot = this.rootPrimitive.getDirectChildren();
        }
        return changedSomething;
    }

    private prunePrimitivesOutOfView(primitive: PrimitiveBase, viewport: Rectangle): boolean {
        let changedSomething = false;

        const directChildren = primitive.getDirectChildren() as PrimitiveBase[];
        for (const child of directChildren) {
            const visibility = child.computeVisibility(viewport);
            if (visibility === EVisibility.OUT_OF_VIEW) {
                primitive.removeChild(child);
                changedSomething = true;
            } else if (visibility === EVisibility.PARTIALLY_VISIBLE) {
                // if it is partially visible, some of its children may be completely out of view
                if (this.prunePrimitivesOutOfView(child, viewport)) {
                    changedSomething = true;
                }
            }
        }

        return changedSomething;
    }

    private rebuildLayersCollections(): void {
        for (let iLayer = 0; iLayer < this.layers.length; iLayer++) {
            const reparsedLayerPrimitives = this.rootPrimitive.getChildrenOfDepth(iLayer) as PrimitiveBase[];
            this.layers[iLayer].primitives.items = reparsedLayerPrimitives;
            this.layers[iLayer].primitives.geometryId.registerChange();

            const reparsedLayerOutlines: Line[] = [];
            if (iLayer === 0) {
                reparsedLayerOutlines.push(this.rootPrimitive.getOutline());
            } else {
                const primitivesOfParentLayer = this.layers[iLayer - 1].primitives;
                for (const primitive of primitivesOfParentLayer.items) {
                    reparsedLayerOutlines.push(primitive.subdivision);
                }
            }
            this.layers[iLayer].outlines.items = reparsedLayerOutlines;
            this.layers[iLayer].outlines.geometryId.registerChange();
        }
    }

    private get primitiveType(): EPrimitiveType {
        return this.rootPrimitive.primitiveType;
    }
}

export { Engine };

