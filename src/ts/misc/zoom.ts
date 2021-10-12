import { IPoint } from "./point";

class Zoom {
    public static noZoom(): Zoom {
        return new Zoom({ x: 0, y: 0 }, 1);
    }

    public static rehydrate(dehydrated: Zoom): Zoom {
        const result = new Zoom({ x: 0, y: 0 }, 1); // whatever
        result.a = dehydrated.a;
        result.b = dehydrated.b;
        result.c = dehydrated.c;
        return result;
    }

    /* The 2D zoom is stored as a 3x3 matrix in the form
     * | a 0 b |
     * | 0 a c |
     * | 0 0 1 |
     */
    private a: number;
    private b: number;
    private c: number;

    public constructor(center: IPoint, scaling: number) {
        this.a = scaling;
        this.b = center.x * (1 - scaling);
        this.c = center.y * (1 - scaling);
    }

    public reset(): void {
        this.a = 1;
        this.b = 0;
        this.c = 0;
    }

    public isNotNull(): boolean {
        const isIdentity = (this.a === 1) && (this.b === 0) && (this.c === 0);
        return !isIdentity;
    }
    public applyToPoint(point: IPoint): void {
        point.x = this.a * point.x + this.b;
        point.y = this.a * point.y + this.c;
    }

    public combineWith(other: Zoom): void {
        /* Apply the other zoom after this zoom
         * multiply the two matrices OTHER x THIS
                        | a1 0  b1 |
                        | 0  a1 c1 |
                        | 0  0  1  |
            | a2 0  b2 |
            | 0  a2 c2 |
            | 0  0  1  |
         */
        const newA = other.a * this.a;
        const newB = other.a * this.b + other.b;
        const newC = other.a * this.c + other.c;

        this.a = newA;
        this.b = newB;
        this.c = newC;
    }

    public get scale(): number {
        return this.a;
    }

    public get translate(): IPoint {
        return { x: this.b, y: this.c };
    }
}

export {
    Zoom,
};
