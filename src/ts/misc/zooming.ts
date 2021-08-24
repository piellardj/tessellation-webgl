import { IPoint } from "./point";


class Zooming {
    public dt: number = 0;

    public constructor(public readonly center: IPoint, public speed: number) {
    }

    private get currentSpeed(): number {
        return this.dt * this.speed;
    }

    public applyToPoint(point: IPoint): void {
        point.x = this.center.x + (point.x - this.center.x) * (1 + this.currentSpeed);
        point.y = this.center.y + (point.y - this.center.y) * (1 + this.currentSpeed);
    }
}

export { Zooming };
