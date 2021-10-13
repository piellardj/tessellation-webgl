import { IPoint } from "./point";

class Zoom {
    public static noZoom(): Zoom {
        return new Zoom(1, 0, 0);
    }

    public static rehydrate(dehydrated: Zoom): Zoom {
        return new Zoom(dehydrated.a, dehydrated.b, dehydrated.c);
    }

    public static multiply(z1: Zoom, z2: Zoom): Zoom {
        /* Multiply the two matrices OTHER x THIS
                        | a2 0  b2 |
                        | 0  a2 c2 |
                        | 0  0  1  |
            | a1 0  b1 |
            | 0  a1 c1 |
            | 0  0  1  |
         */
        return new Zoom(
            z1.a * z2.a,
            z1.a * z2.b + z1.b,
            z1.a * z2.c + z1.c
        );
    }

    public static buildZoom(center: IPoint, scaling: number): Zoom {
        return new Zoom(scaling, center.x * (1 - scaling), center.y * (1 - scaling));
    }

    /* The 2D zoom is stored as a 3x3 matrix in the form
     * | a 0 b |
     * | 0 a c |
     * | 0 0 1 |
     */
    private constructor(
        private readonly a: number,
        private readonly b: number,
        private readonly c: number) {
    }

    public isNotNull(): boolean {
        const isIdentity = (this.a === 1) && (this.b === 0) && (this.c === 0);
        return !isIdentity;
    }

    public applyToPoint(point: IPoint): void {
        point.x = this.a * point.x + this.b;
        point.y = this.a * point.y + this.c;
    }

    public copy(): Zoom {
        return new Zoom(this.a, this.b, this.c);
    }

    public inverse(): Zoom {
        /* compute invert matrix of
            | a 0 b |
            | 0 a c |
            | 0 0 1 |
        */
        return new Zoom(
            1 / this.a, // if a=0, then the current zoom is not inversible anyways so do not protect this
            -this.b / this.a,
            -this.c / this.a
        );
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
