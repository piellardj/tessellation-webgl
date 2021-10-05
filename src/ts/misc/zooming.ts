import { IPoint } from "./point";


class Zooming {
    public dt: number = 0;

    public constructor(public readonly center: IPoint, public speed: number) {
    }

    public get currentZoomFactor(): number {
        return 1 + this.dt * this.speed;
    }

    public applyToPoint(point: IPoint): void {
        point.x = this.center.x + (point.x - this.center.x) * this.currentZoomFactor;
        point.y = this.center.y + (point.y - this.center.y) * this.currentZoomFactor;
    }
}

export { Zooming };
