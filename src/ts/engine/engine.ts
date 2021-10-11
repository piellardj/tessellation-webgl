import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { Throttle } from "../misc/throttle";
import { Zoom } from "../misc/zoom";
import { GeometryId } from "../plotter/geometry-id";
import { BatchOfLines, IBatch } from "../plotter/plotter-canvas";
import { EVisibility, PrimitiveBase } from "../primitives/primitive-base";
import { PrimitiveQuads } from "../primitives/primitive-quads";
import { PrimitiveTriangles } from "../primitives/primitive-triangles";
import { PrimitiveTrianglesNested } from "../primitives/primitive-triangles-nested";
import { EPrimitiveType } from "../primitives/primitive-type-enum";

import "../page-interface-generated";


type BatchOfPrimitives = IBatch<PrimitiveBase>;

interface ILayer {
    primitives: BatchOfPrimitives;
    outlines: BatchOfLines;
    readonly birthTimestamp: number;
}

class Engine {
    private rootPrimitive: PrimitiveBase;
    protected layers: ILayer[];

    protected readonly cumulatedZoom: Zoom;
    private readonly maintainanceThrottle: Throttle;

    public constructor() {
        this.reset(new Rectangle(0, 512, 0, 512), EPrimitiveType.TRIANGLES);
        this.cumulatedZoom = Zoom.noZoom();
        this.maintainanceThrottle = new Throttle(100);
    }

    public update(viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): boolean {
        let somethingChanged = false;

        this.cumulatedZoom.combineWith(instantZoom);

        const maintainance = () => {
            somethingChanged = this.applyCumulatedZoom() || somethingChanged;
            somethingChanged = this.adjustLayersCount(wantedDepth, subdivisionBalance, colorVariation) || somethingChanged;
            somethingChanged = this.handleRecycling(viewport) || somethingChanged;

            if (somethingChanged) {
                for (const layer of this.layers) {
                    layer.primitives.geometryId.registerChange();
                    layer.outlines.geometryId.registerChange();
                }
            }

            this.updateIndicators();
        };

        // don't do maintainance too often because it is costly
        this.maintainanceThrottle.runIfAvailable(maintainance);

        return somethingChanged;
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
        this.updateIndicators();
    }

    public recomputeColors(colorVariation: number): void {
        const newColor = this.computeRootPrimitiveColor();
        this.rootPrimitive.setColor(newColor, colorVariation);

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

    private applyCumulatedZoom(): boolean {
        let appliedZoom = false;

        if (this.cumulatedZoom.isNotNull()) {
            this.rootPrimitive.zoom(this.cumulatedZoom, true);
            appliedZoom = true;
        }

        // reset the cumulated zooming
        this.cumulatedZoom.reset();

        return appliedZoom;
    }

    private handleRecycling(viewport: Rectangle): boolean {
        if (this.rootPrimitive.computeVisibility(viewport) === EVisibility.OUT_OF_VIEW) {
            this.reset(viewport, this.primitiveType);
            return true;
        } else {
            const prunedPrimitives = this.prunePrimitivesOutOfView(this.rootPrimitive, viewport);
            const changedRootPrimitive = this.changeRootPrimitiveInNeeded();

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

    private changeRootPrimitiveInNeeded(): boolean {
        const directChildrenOfRoot = this.rootPrimitive.getDirectChildren();
        if (directChildrenOfRoot.length === 1) {
            this.rootPrimitive = directChildrenOfRoot[0] as PrimitiveBase;
            this.layers.shift();
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
        for (let iLayer = 0; iLayer < this.layers.length; iLayer++) {
            const primitives: BatchOfPrimitives = {
                items: this.rootPrimitive.getChildrenOfDepth(iLayer) as PrimitiveBase[],
                geometryId: GeometryId.new(),
            };


            const outlines: BatchOfLines = {
                items: [],
                geometryId: GeometryId.new(),
            };
            if (iLayer === 0) {
                outlines.items.push(this.rootPrimitive.getOutline());
            } else {
                const primitivesOfParentLayer = this.layers[iLayer - 1].primitives;
                for (const primitive of primitivesOfParentLayer.items) {
                    outlines.items.push(primitive.subdivision);
                }
            }

            this.layers[iLayer].primitives = primitives;
            this.layers[iLayer].outlines = outlines;
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

    private get primitiveType(): EPrimitiveType {
        return this.rootPrimitive.primitiveType;
    }
}

export { Engine };

