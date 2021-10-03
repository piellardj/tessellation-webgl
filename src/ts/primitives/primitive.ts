import { Color } from "../misc/color";
import { IPolygon } from "../plotter/plotter-base";
import { IPoint } from "../misc/point";
import { Rectangle } from "../misc/rectangle";
import { Zooming } from "../misc/zooming";


type Line = IPoint[];

enum EVisibility {
    OUT_OF_VIEW,
    VISIBLE,
    COVERS_VIEW,
}

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

    public abstract zoom(zooming: Zooming, isRoot: boolean): void;
    public abstract computeVisibility(viewport: Rectangle): EVisibility;
}

export {
    EVisibility,
    Primitive,
};
