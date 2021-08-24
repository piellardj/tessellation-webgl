import { Color } from "../color/color";
import { Parameters } from "../parameters";
import { IPoint } from "../point";
import { Rectangle } from "../rectangle";
import { Zooming } from "../zooming";
import { EVisibility, Primitive } from "./primitive";


enum EOrientation {
    VERTICAL,
    HORIZONTAL,
}

function random(from: number, to: number): number {
    return from + (to - from) * Math.random();
}

function interpolate(a: number, b: number, x: number): number {
    return (1 - x) * a + x * b;
}

function interpolatePoint(p1: IPoint, p2: IPoint, x: number): IPoint {
    return {
        x: interpolate(p1.x, p2.x, x),
        y: interpolate(p1.y, p2.y, x),
    };
}

function squaredDistance(p1: IPoint, p2: IPoint): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
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

        const leftToRightDistance = Math.max(squaredDistance(topLeft, topRight), squaredDistance(bottomLeft, bottomRight));
        const topToBottomDistance = Math.max(squaredDistance(topLeft, bottomLeft), squaredDistance(topRight, bottomRight));

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
        const rand1 = random(minRand, maxRand);
        const rand2 = random(minRand, maxRand);

        if (this.subdivisionOrientation === EOrientation.VERTICAL) {
            this.subdivision = [
                interpolatePoint(this.topLeft, this.topRight, rand1),
                interpolatePoint(this.bottomLeft, this.bottomRight, rand2),
            ];

            this.children = [
                new PrimitiveQuads(this.topLeft, this.subdivision[0], this.bottomLeft, this.subdivision[1], this.color.computeCloseColor()),
                new PrimitiveQuads(this.subdivision[0], this.topRight, this.subdivision[1], this.bottomRight, this.color.computeCloseColor()),
            ];
        } else {
            this.subdivision = [
                interpolatePoint(this.topLeft, this.bottomLeft, rand1),
                interpolatePoint(this.topRight, this.bottomRight, rand2),
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
        const SIDE_TL_TR = this.getSide(this.topLeft, this.topRight, point);
        const SIDE_TR_BL = this.getSide(this.topRight, this.bottomLeft, point);
        const SIDE_BL_TL = this.getSide(this.bottomLeft, this.topLeft, point);

        if (this.areSameSign(SIDE_TL_TR, SIDE_TR_BL, SIDE_BL_TL)) {
            return true;
        }

        const SIDE_BL_BR = this.getSide(this.bottomLeft, this.bottomRight, point);
        const SIDE_BR_TR = this.getSide(this.bottomRight, this.topRight, point);

        if (this.areSameSign(SIDE_TR_BL, SIDE_BL_BR, SIDE_BR_TR)) {
            return true;
        }

        return false;
    }

    private areSameSign(a: number, b: number, c: number): boolean {
        return a * b >= 0 && a * c >= 0;
    }
}

export {
    PrimitiveQuads,
};
