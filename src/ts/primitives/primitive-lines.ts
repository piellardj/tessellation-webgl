import { Color } from "../color/color";
import { Parameters } from "../parameters";
import { IPoint } from "../point";
import { Primitive } from "./primitive";

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

class PrimitiveLines extends Primitive {
    public get points(): IPoint[] {
        return [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft];
    }

    public constructor(
        private readonly topLeft: IPoint,
        private readonly topRight: IPoint,
        private readonly bottomLeft: IPoint,
        private readonly bottomRight: IPoint,
        private readonly subdivisionOrientation: EOrientation,
        color: Color) {
        super(color);
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
                new PrimitiveLines(this.topLeft, this.subdivision[0], this.bottomLeft, this.subdivision[1], EOrientation.HORIZONTAL, this.color.computeCloseColor()),
                new PrimitiveLines(this.subdivision[0], this.topRight, this.subdivision[1], this.bottomRight, EOrientation.HORIZONTAL, this.color.computeCloseColor()),
            ];
        } else {
            this.subdivision = [
                interpolatePoint(this.topLeft, this.bottomLeft, rand1),
                interpolatePoint(this.topRight, this.bottomRight, rand2),
            ];

            this.children = [
                new PrimitiveLines(this.topLeft, this.topRight, this.subdivision[0], this.subdivision[1], EOrientation.VERTICAL, this.color.computeCloseColor()),
                new PrimitiveLines(this.subdivision[0], this.subdivision[1], this.bottomLeft, this.bottomRight, EOrientation.VERTICAL, this.color.computeCloseColor()),
            ];
        }
    }
}

export {
    EOrientation,
    PrimitiveLines,
};
