import * as Arithmetics from "../misc/arithmetics";
import { Color } from "../misc/color";
import { IPoint } from "../misc/point";
import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { EVisibility, PrimitiveBase } from "./primitive-base";


class PrimitiveTriangles extends PrimitiveBase {
    public constructor(
        protected readonly p1: IPoint,
        protected readonly p2: IPoint,
        protected readonly p3: IPoint,
        color: Color) {
        super(color);
    }

    public get subdivisionFactor(): number {
        return 2;
    }

    public subdivide(subdivisionBalance: number, childrenColorVariation: number): void {
        this.removeChildren();

        const subdivideInternal = (sourcePoint: IPoint, otherPoint1: IPoint, otherPoint2: IPoint) => {
            const minRand = 0.5 * subdivisionBalance;
            const maxRand = 1 - minRand;
            const rand = Arithmetics.random(minRand, maxRand);

            this.subdivision = [
                sourcePoint,
                Arithmetics.interpolatePoint(otherPoint1, otherPoint2, rand),
            ];

            this.addChildren(
                new PrimitiveTriangles(sourcePoint, otherPoint1, this.subdivision[1], this.color.computeCloseColor(childrenColorVariation)),
                new PrimitiveTriangles(sourcePoint, this.subdivision[1], otherPoint2, this.color.computeCloseColor(childrenColorVariation))
            );
        };

        const distance12 = Arithmetics.squaredDistance(this.p1, this.p2);
        const distance23 = Arithmetics.squaredDistance(this.p2, this.p3);
        const distance31 = Arithmetics.squaredDistance(this.p3, this.p1);

        if (distance12 > distance23 && distance12 > distance31) {
            subdivideInternal(this.p3, this.p1, this.p2);
        } else if (distance23 > distance12 && distance23 > distance31) {
            subdivideInternal(this.p1, this.p2, this.p3);
        } else {
            subdivideInternal(this.p2, this.p3, this.p1);
        }
    }

    public get vertices(): IPoint[] {
        return [this.p1, this.p2, this.p3];
    }

    protected applyZoom(zoom: Zoom, isRoot: boolean): void {
        if (isRoot) {
            zoom.applyToPoint(this.p1);
            zoom.applyToPoint(this.p2);
            zoom.applyToPoint(this.p3);
        }

        if (this.subdivision) {
            zoom.applyToPoint(this.subdivision[1]);
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
        } else if (viewport.containsPoint(this.p1) || viewport.containsPoint(this.p2) || viewport.containsPoint(this.p3)) {
            return EVisibility.VISIBLE;
        } else if (viewport.lineIntersectsBoundaries(this.p1, this.p2) ||
            viewport.lineIntersectsBoundaries(this.p2, this.p3) ||
            viewport.lineIntersectsBoundaries(this.p3, this.p1)) {
            return EVisibility.VISIBLE;
        } else {
            return EVisibility.OUT_OF_VIEW;
        }
    }

    private isInside(point: IPoint): boolean {
        const SIDE_1_2 = Arithmetics.getSide(this.p1, this.p2, point);
        const SIDE_2_3 = Arithmetics.getSide(this.p2, this.p3, point);
        const SIDE_3_1 = Arithmetics.getSide(this.p3, this.p1, point);

        return Arithmetics.areSameSign(SIDE_1_2, SIDE_2_3, SIDE_3_1);
    }
}

export { PrimitiveTriangles };

