import * as Arithmetics from "../misc/arithmetics";
import { Color } from "../misc/color";
import { IPoint } from "../misc/point";
import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { EVisibility, PrimitiveBase } from "./primitive-base";
import { EPrimitiveType } from "./primitive-type-enum";


class PrimitiveQuads extends PrimitiveBase {
    public readonly primitiveType: EPrimitiveType = EPrimitiveType.QUADS;

    public constructor(
        private readonly topLeft: IPoint,
        private readonly topRight: IPoint,
        private readonly bottomLeft: IPoint,
        private readonly bottomRight: IPoint,
        color: Color) {
        super(color);
    }

    public get subdivisionFactor(): number {
        return 2;
    }

    public subdivide(subdivisionBalance: number, childrenColorVariation: number): void {
        this.removeChildren();

        const minRand = 0.5 * subdivisionBalance;
        const maxRand = 1 - minRand;
        const rand1 = Arithmetics.random(minRand, maxRand);
        const rand2 = Arithmetics.random(minRand, maxRand);

        const leftToRightDistance = Math.max(Arithmetics.squaredDistance(this.topLeft, this.topRight), Arithmetics.squaredDistance(this.bottomLeft, this.bottomRight));
        const topToBottomDistance = Math.max(Arithmetics.squaredDistance(this.topLeft, this.bottomLeft), Arithmetics.squaredDistance(this.topRight, this.bottomRight));

        if (leftToRightDistance > topToBottomDistance) { // current is more wide than tall => subdivide vertically
            this.subdivision = [
                Arithmetics.interpolatePoint(this.topLeft, this.topRight, rand1),
                Arithmetics.interpolatePoint(this.bottomLeft, this.bottomRight, rand2),
            ];

            this.addChildren(
                new PrimitiveQuads(this.topLeft, this.subdivision[0], this.bottomLeft, this.subdivision[1], this.color.computeCloseColor(childrenColorVariation)),
                new PrimitiveQuads(this.subdivision[0], this.topRight, this.subdivision[1], this.bottomRight, this.color.computeCloseColor(childrenColorVariation))
            );
        } else { // current is more tall than wide => subdivide horizontally
            this.subdivision = [
                Arithmetics.interpolatePoint(this.topLeft, this.bottomLeft, rand1),
                Arithmetics.interpolatePoint(this.topRight, this.bottomRight, rand2),
            ];

            this.addChildren(
                new PrimitiveQuads(this.topLeft, this.topRight, this.subdivision[0], this.subdivision[1], this.color.computeCloseColor(childrenColorVariation)),
                new PrimitiveQuads(this.subdivision[0], this.subdivision[1], this.bottomLeft, this.bottomRight, this.color.computeCloseColor(childrenColorVariation))
            );
        }
    }

    public get vertices(): IPoint[] {
        return [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft];
    }

    protected applyZoom(zoom: Zoom, isRoot: boolean): void {
        if (isRoot) {
            zoom.applyToPoint(this.topLeft);
            zoom.applyToPoint(this.topRight);
            zoom.applyToPoint(this.bottomLeft);
            zoom.applyToPoint(this.bottomRight);
        }

        if (this.subdivision) {
            for (const point of this.subdivision) {
                zoom.applyToPoint(point);
            }
        }
    }

    public computeVisibility(viewport: Rectangle): EVisibility {
        const viewportTopRight: IPoint = { x: viewport.bottomRight.x, y: viewport.topLeft.y };
        const viewportBottomLeft: IPoint = { x: viewport.topLeft.x, y: viewport.bottomRight.y };

        const viewTopLeftInside = this.isInside(viewport.topLeft);
        const viewTopRightInside = this.isInside(viewportTopRight);
        const viewBottomLeftInside = this.isInside(viewportBottomLeft);
        const viewBottomRightInside = this.isInside(viewport.bottomRight);

        if (viewTopLeftInside && viewTopRightInside && viewBottomLeftInside && viewBottomRightInside) {
            // the shape is convex so if all points are in view, the whole shape is in view
            return EVisibility.COVERS_VIEW;
        } else if (viewTopLeftInside || viewTopRightInside || viewBottomLeftInside || viewBottomRightInside) {
            return EVisibility.PARTIALLY_VISIBLE;
        } else {
            const topLeftInside = viewport.containsPoint(this.topLeft);
            const topRightInside = viewport.containsPoint(this.topRight);
            const bottomLeftInside = viewport.containsPoint(this.bottomLeft);
            const bottomRightInside = viewport.containsPoint(this.bottomRight);
            if (topLeftInside && topRightInside && bottomLeftInside && bottomRightInside) {
                return EVisibility.FULLY_VISIBLE;
            }else if (topLeftInside || topRightInside || bottomLeftInside || bottomRightInside) {
                return EVisibility.PARTIALLY_VISIBLE;
            } else if (viewport.lineIntersectsBoundaries(this.topLeft, this.topRight) ||
                viewport.lineIntersectsBoundaries(this.topRight, this.bottomRight) ||
                viewport.lineIntersectsBoundaries(this.bottomRight, this.bottomLeft) ||
                viewport.lineIntersectsBoundaries(this.bottomLeft, this.topLeft)) {
                return EVisibility.PARTIALLY_VISIBLE;
            } else {
                return EVisibility.OUT_OF_VIEW;
            }
        }
    }

    private isInside(point: IPoint): boolean {
        const SIDE_TL_TR = Arithmetics.getSide(this.topLeft, this.topRight, point);
        const SIDE_TR_BL = Arithmetics.getSide(this.topRight, this.bottomLeft, point);
        const SIDE_BL_TL = Arithmetics.getSide(this.bottomLeft, this.topLeft, point);

        if (Arithmetics.areSameSign(SIDE_TL_TR, SIDE_TR_BL, SIDE_BL_TL)) {
            return true;
        }

        const SIDE_BL_BR = Arithmetics.getSide(this.bottomLeft, this.bottomRight, point);
        const SIDE_BR_TR = Arithmetics.getSide(this.bottomRight, this.topRight, point);

        if (Arithmetics.areSameSign(SIDE_TR_BL, SIDE_BL_BR, SIDE_BR_TR)) {
            return true;
        }

        return false;
    }
}

export {
    PrimitiveQuads,
};

