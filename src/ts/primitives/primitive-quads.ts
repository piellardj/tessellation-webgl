import { Color } from "../misc/color";
import { IPoint } from "../misc/point";
import { Rectangle } from "../misc/rectangle";
import * as Utils from "../misc/utils";
import { Zooming } from "../misc/zooming";
import { Parameters } from "../parameters";
import { EVisibility, PrimitiveBase } from "./primitive-base";


class PrimitiveQuads extends PrimitiveBase {
    public constructor(
        private readonly topLeft: IPoint,
        private readonly topRight: IPoint,
        private readonly bottomLeft: IPoint,
        private readonly bottomRight: IPoint,
        color: Color) {
        super(color);
    }

    public subdivide(): void {
        this.removeChildren();

        const minRand = 0.5 * Parameters.balance;
        const maxRand = 1 - minRand;
        const rand1 = Utils.random(minRand, maxRand);
        const rand2 = Utils.random(minRand, maxRand);

        const leftToRightDistance = Math.max(Utils.squaredDistance(this.topLeft, this.topRight), Utils.squaredDistance(this.bottomLeft, this.bottomRight));
        const topToBottomDistance = Math.max(Utils.squaredDistance(this.topLeft, this.bottomLeft), Utils.squaredDistance(this.topRight, this.bottomRight));

        if (leftToRightDistance > topToBottomDistance) { // current is more wide than tall => subdivide vertically
            this.subdivision = [
                Utils.interpolatePoint(this.topLeft, this.topRight, rand1),
                Utils.interpolatePoint(this.bottomLeft, this.bottomRight, rand2),
            ];

            this.addChildren(
                new PrimitiveQuads(this.topLeft, this.subdivision[0], this.bottomLeft, this.subdivision[1], this.color.computeCloseColor()),
                new PrimitiveQuads(this.subdivision[0], this.topRight, this.subdivision[1], this.bottomRight, this.color.computeCloseColor())
            );
        } else { // current is more tall than wide => subdivide horizontally
            this.subdivision = [
                Utils.interpolatePoint(this.topLeft, this.bottomLeft, rand1),
                Utils.interpolatePoint(this.topRight, this.bottomRight, rand2),
            ];

            this.addChildren(
                new PrimitiveQuads(this.topLeft, this.topRight, this.subdivision[0], this.subdivision[1], this.color.computeCloseColor()),
                new PrimitiveQuads(this.subdivision[0], this.subdivision[1], this.bottomLeft, this.bottomRight, this.color.computeCloseColor())
            );
        }
    }

    public get vertices(): IPoint[] {
        return [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft];
    }

    public applyZoom(zooming: Zooming, isRoot: boolean): void {
        if (isRoot) {
            zooming.applyToPoint(this.topLeft);
            zooming.applyToPoint(this.topRight);
            zooming.applyToPoint(this.bottomLeft);
            zooming.applyToPoint(this.bottomRight);
        }

        if (this.subdivision) {
            for (const point of this.subdivision) {
                zooming.applyToPoint(point);
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
            return EVisibility.VISIBLE;
        } else if (viewport.containsPoint(this.topLeft) || viewport.containsPoint(this.topRight) ||
            viewport.containsPoint(this.bottomLeft) || viewport.containsPoint(this.bottomRight)) {
            return EVisibility.VISIBLE;
        } else if (viewport.lineIntersectsBoundaries(this.topLeft, this.topRight) ||
            viewport.lineIntersectsBoundaries(this.topRight, this.bottomRight) ||
            viewport.lineIntersectsBoundaries(this.bottomRight, this.bottomLeft) ||
            viewport.lineIntersectsBoundaries(this.bottomLeft, this.topLeft)) {
            return EVisibility.VISIBLE;
        } else {
            return EVisibility.OUT_OF_VIEW;
        }
    }

    private isInside(point: IPoint): boolean {
        const SIDE_TL_TR = Utils.getSide(this.topLeft, this.topRight, point);
        const SIDE_TR_BL = Utils.getSide(this.topRight, this.bottomLeft, point);
        const SIDE_BL_TL = Utils.getSide(this.bottomLeft, this.topLeft, point);

        if (Utils.areSameSign(SIDE_TL_TR, SIDE_TR_BL, SIDE_BL_TL)) {
            return true;
        }

        const SIDE_BL_BR = Utils.getSide(this.bottomLeft, this.bottomRight, point);
        const SIDE_BR_TR = Utils.getSide(this.bottomRight, this.topRight, point);

        if (Utils.areSameSign(SIDE_TR_BL, SIDE_BL_BR, SIDE_BR_TR)) {
            return true;
        }

        return false;
    }
}

export {
    PrimitiveQuads,
};
