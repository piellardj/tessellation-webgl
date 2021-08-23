import { Color } from "../color/color";
import { IPolygon } from "../plotter/plotter-canvas-2d";
import { IPoint } from "../point";

type Line = IPoint[];

abstract class Primitive implements IPolygon {
    public subdivision: Line | null = null;
    public children: Primitive[] = [];
    protected _color: Color;

    protected constructor(color: Color) {
        this.color = color;
    }

    public set color(color: Color) {
        this._color = color;

        for (const child of this.children) {
            child.color = this.color.computeCloseColor();
        }
    }

    public get color(): Color {
        return this._color;
    }

    public removeChildren(): void {
        this.children = [];
        this.subdivision = null;
    }

    public abstract subdivide(): void;
    public abstract get points(): IPoint[];
}

export { Primitive };
