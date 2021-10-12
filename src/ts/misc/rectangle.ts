import { IPoint } from "./point";


class Rectangle {
    public static rehydrate(dehydrated: Rectangle): Rectangle {
        return new Rectangle(dehydrated.topLeft.x, dehydrated.bottomRight.x, dehydrated.topLeft.y, dehydrated.bottomRight.y);
    }

    public readonly topLeft: IPoint;
    public readonly bottomRight: IPoint;

    public constructor(left: number, right: number, top: number, bottom: number) {
        this.topLeft = { x: left, y: top };
        this.bottomRight = { x: right, y: bottom };
    }

    public containsPoint(point: IPoint): boolean {
        return (point.x >= this.topLeft.x && point.x <= this.bottomRight.x) &&
            (point.y >= this.topLeft.y && point.y <= this.bottomRight.y);
    }

    public lineIntersectsBoundaries(p1: IPoint, p2: IPoint): boolean {
        // Let's define a boundary by the segment between points D1 and D2
        // we will try to find lambdaP and lambdaD in [0, 1] such as
        // P1 + lambdaP * (P2 - P1) = D1 + lambdaD * (D2 - D1)

        const vPx = p2.x - p1.x;
        const vPy = p2.y - p1.y;

        const width = this.width;
        const height = this.height;
        if (vPx !== 0) { // line is not vertical, so test the vertical boundaries
            { // left boundary

                const lambdaP = (this.left - p1.x) / vPx;
                if (lambdaP >= 0 && lambdaP <= 1) {
                    const lambdaD = (p1.y + lambdaP * vPy - this.top) / height;
                    if (lambdaD >= 0 && lambdaD <= 1) {
                        return true;
                    }
                }
            }
            { // right boundary

                const lambdaP = (this.right - p1.x) / vPx;
                if (lambdaP >= 0 && lambdaP <= 1) {
                    const lambdaD = (p1.y + lambdaP * vPy - this.top) / height;
                    if (lambdaD >= 0 && lambdaD <= 1) {
                        return true;
                    }
                }
            }
        }

        if (vPy !== 0) { // line is not horizontal, so test the horizontal boundaries
            { // top boundary
                const lambdaP = (this.top - p1.y) / vPy;
                if (lambdaP >= 0 && lambdaP <= 1) {
                    const lambdaD = (p1.x + lambdaP * vPx - this.left) / width;
                    if (lambdaD >= 0 && lambdaD <= 1) {
                        return true;
                    }
                }
            }
            { // bototm boundary
                const lambdaP = (this.bottom - p1.y) / vPy;
                if (lambdaP >= 0 && lambdaP <= 1) {
                    const lambdaD = (p1.x + lambdaP * vPx - this.left) / width;
                    if (lambdaD >= 0 && lambdaD <= 1) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public get width(): number {
        return this.bottomRight.x - this.topLeft.x;
    }
    public get height(): number {
        return this.bottomRight.y - this.topLeft.y;
    }

    public get left(): number {
        return this.topLeft.x;
    }
    public get right(): number {
        return this.bottomRight.x;
    }
    public get top(): number {
        return this.topLeft.y;
    }
    public get bottom(): number {
        return this.bottomRight.y;
    }
}

export { Rectangle };
