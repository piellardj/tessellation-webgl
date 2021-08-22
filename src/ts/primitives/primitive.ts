import { IPoint } from "../point";


enum EOrientation {
    VERTICAl,
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

class Primitive {
    private readonly topLeft: IPoint;
    private readonly topRight: IPoint;
    private readonly bottomLeft: IPoint;
    private readonly bottomRight: IPoint;

    private readonly subdivisionOrientation: EOrientation;

    public subdivision: [IPoint, IPoint] | null;
    private children: [Primitive, Primitive] | null;

    public constructor(topLeft: IPoint, topRight: IPoint, bottomLeft: IPoint, bottomRight: IPoint, subdivisionOrientation: EOrientation) {
        this.topLeft = topLeft;
        this.topRight = topRight;
        this.bottomLeft = bottomLeft;
        this.bottomRight = bottomRight;
        this.subdivisionOrientation = subdivisionOrientation;

        this.subdivision = null;
        this.children = null;
    }

    public subdivide(): [Primitive, Primitive] {
        if (!this.children) {
            const rand1 = random(0.3, 0.7);
            const rand2 = random(0.3, 0.7);

            if (this.subdivisionOrientation === EOrientation.VERTICAl) {
                this.subdivision = [
                    interpolatePoint(this.topLeft, this.topRight, rand1),
                    interpolatePoint(this.bottomLeft, this.bottomRight, rand2),
                ];

                this.children = [
                    new Primitive(this.topLeft, this.subdivision[0], this.bottomLeft, this.subdivision[1], EOrientation.HORIZONTAL),
                    new Primitive(this.subdivision[0], this.topRight, this.subdivision[1], this.bottomRight, EOrientation.HORIZONTAL),
                ];
            } else {
                this.subdivision = [
                    interpolatePoint(this.topLeft, this.bottomLeft, rand1),
                    interpolatePoint(this.topRight, this.bottomRight, rand2),
                ];

                this.children = [
                    new Primitive(this.topLeft, this.topRight, this.subdivision[0], this.subdivision[1], EOrientation.VERTICAl),
                    new Primitive(this.subdivision[0], this.subdivision[1], this.bottomLeft, this.bottomRight, EOrientation.VERTICAl),
                ];
            }
        }

        return this.children;
    }
}

export {
    EOrientation,
    Primitive,
};
