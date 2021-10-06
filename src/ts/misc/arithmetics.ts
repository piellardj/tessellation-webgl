import { IPoint } from "./point";


function areSameSign(a: number, b: number, c: number): boolean {
    return a * b >= 0 && a * c >= 0;
}

function getSide(p1: IPoint, p2: IPoint, p3: IPoint): number {
    return (p3.x - p1.x) * -(p2.y - p1.y) + (p3.y - p1.y) * (p2.x - p1.x);
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

function random(from: number, to: number): number {
    return from + (to - from) * Math.random();
}


function squaredDistance(p1: IPoint, p2: IPoint): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
}

export {
    areSameSign,
    getSide,
    interpolatePoint,
    random,
    squaredDistance,
};
