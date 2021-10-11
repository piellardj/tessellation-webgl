import * as Arithmetics from "../misc/arithmetics";
import { Color } from "../misc/color";
import { IPoint } from "../misc/point";
import { Zoom } from "../misc/zoom";
import { PrimitiveTriangles } from "./primitives-triangles";


class PrimitiveTrianglesNested extends PrimitiveTriangles {
    protected midPoint1: IPoint;
    protected midPoint2: IPoint;
    protected midPoint3: IPoint;

    public constructor(p1: IPoint, p2: IPoint, p3: IPoint, color: Color) {
        super(p1, p2, p3, color);
    }

    public get subdivisionFactor(): number {
        return 4;
    }

    public subdivide(subdivisionBalance: number, childrenColorVariation: number): void {
        this.removeChildren();

        this.midPoint1 = this.randomNewPoint(this.p1, this.p2, subdivisionBalance);
        this.midPoint2 = this.randomNewPoint(this.p2, this.p3, subdivisionBalance);
        this.midPoint3 = this.randomNewPoint(this.p3, this.p1, subdivisionBalance);

        this.subdivision = [
            this.midPoint1,
            this.midPoint2,
            this.midPoint3,
            this.midPoint1,
        ];

        this.addChildren(
            new PrimitiveTrianglesNested(this.midPoint1, this.midPoint2, this.midPoint3, this.color.computeCloseColor(childrenColorVariation)),
            new PrimitiveTrianglesNested(this.p1, this.midPoint1, this.midPoint3, this.color.computeCloseColor(childrenColorVariation)),
            new PrimitiveTrianglesNested(this.p2, this.midPoint2, this.midPoint1, this.color.computeCloseColor(childrenColorVariation)),
            new PrimitiveTrianglesNested(this.p3, this.midPoint3, this.midPoint2, this.color.computeCloseColor(childrenColorVariation)),
        );
    }

    protected applyZoom(zoom: Zoom, isRoot: boolean): void {
        if (isRoot) {
            zoom.applyToPoint(this.p1);
            zoom.applyToPoint(this.p2);
            zoom.applyToPoint(this.p3);
        }

        if (this.subdivision) {
            zoom.applyToPoint(this.midPoint1);
            zoom.applyToPoint(this.midPoint2);
            zoom.applyToPoint(this.midPoint3);
        }
    }

    private randomNewPoint(p1: IPoint, p2: IPoint, range: number): IPoint {
        const r = Arithmetics.random(0.5 - 0.5 * range, 0.5 + 0.5 * range);
        return {
            x: p1.x * (1 - r) + p2.x * r,
            y: p1.y * (1 - r) + p2.y * r,
        };
    }
}

export { PrimitiveTrianglesNested };

