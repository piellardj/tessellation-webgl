import { Color } from "../color/color";
import { Parameters } from "../parameters";
import { IPoint } from "../point";
import { Rectangle } from "../rectangle";
import { Zooming } from "../zooming";
import { EVisibility, Primitive } from "./primitive";
import * as Utils from "../utils";

enum EOrientation {
    VERTICAL,
    HORIZONTAL,
}

class PrimitiveQuads extends Primitive {
    private readonly subdivisionOrientation: EOrientation;

    public constructor(
        private readonly topLeft: IPoint,
        private readonly topRight: IPoint,
        private readonly bottomLeft: IPoint,
        private readonly bottomRight: IPoint,
        color: Color) {
        super(color);

        const leftToRightDistance = Math.max(Utils.squaredDistance(topLeft, topRight), Utils.squaredDistance(bottomLeft, bottomRight));
        const topToBottomDistance = Math.max(Utils.squaredDistance(topLeft, bottomLeft), Utils.squaredDistance(topRight, bottomRight));

        if (leftToRightDistance > topToBottomDistance) {
            this.subdivisionOrientation = EOrientation.VERTICAL;
        } else {
            this.subdivisionOrientation = EOrientation.HORIZONTAL;
        }


    }

    public subdivide(): void {
        this.children = [];

        const balance = Parameters.balance;
        const minRand = 0.5 * balance;
        const maxRand = 1 - minRand;
        const rand1 = Utils.random(minRand, maxRand);
        const rand2 = Utils.random(minRand, maxRand);

        if (this.subdivisionOrientation === EOrientation.VERTICAL) {
            this.subdivision = [
                Utils.interpolatePoint(this.topLeft, this.topRight, rand1),
                Utils.interpolatePoint(this.bottomLeft, this.bottomRight, rand2),
            ];

            this.children = [
                new PrimitiveQuads(this.topLeft, this.subdivision[0], this.bottomLeft, this.subdivision[1], this.color.computeCloseColor()),
                new PrimitiveQuads(this.subdivision[0], this.topRight, this.subdivision[1], this.bottomRight, this.color.computeCloseColor()),
            ];
        } else {
            this.subdivision = [
                Utils.interpolatePoint(this.topLeft, this.bottomLeft, rand1),
                Utils.interpolatePoint(this.topRight, this.bottomRight, rand2),
            ];

            this.children = [
                new PrimitiveQuads(this.topLeft, this.topRight, this.subdivision[0], this.subdivision[1], this.color.computeCloseColor()),
                new PrimitiveQuads(this.subdivision[0], this.subdivision[1], this.bottomLeft, this.bottomRight, this.color.computeCloseColor()),
            ];
        }
    }

    public get points(): IPoint[] {
        return [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft];
    }

    public zoom(zooming: Zooming, isRoot: boolean): void {
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

        for (const child of this.children) {
            child.zoom(zooming, false);
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

    private getSide(p1: IPoint, p2: IPoint, p3: IPoint): number {
        return (p3.x - p1.x) * -(p2.y - p1.y) + (p3.y - p1.y) * (p2.x - p1.x);
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
