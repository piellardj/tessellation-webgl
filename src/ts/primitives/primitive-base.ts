import { TreeNode } from "../engine/tree-node";
import { Color } from "../misc/color";
import { IPoint } from "../misc/point";
import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { IPolygon } from "../plotter/types";
import { EPrimitiveType } from "./primitive-type-enum";


type Line = IPoint[];

enum EVisibility {
    OUT_OF_VIEW,
    VISIBLE,
    COVERS_VIEW,
}

abstract class PrimitiveBase extends TreeNode implements IPolygon {
    public abstract readonly primitiveType: EPrimitiveType;

    public subdivision: Line | null = null;
    protected _color: Color;

    /* Returns how many children are created when subdivided */
    public abstract get subdivisionFactor(): number;

    protected constructor(color: Color) {
        super();
        this._color = color;
    }

    public setColor(color: Color, childrenColorVariation: number): void {
        this._color = color;

        const children = this.getDirectChildren() as PrimitiveBase[];
        for (const child of children) {
            const childColor = this.color.computeCloseColor(childrenColorVariation);
            child.setColor(childColor, childrenColorVariation);
        }
    }

    public get color(): Color {
        return this._color;
    }

    public removeChildren(): void {
        super.removeChildren();
        this.subdivision = null;
    }

    public getOutline(): Line {
        const result = this.vertices;
        result.push(result[0]);
        return result;
    }

    public zoom(zoom: Zoom, isRoot: boolean): void {
        this.applyZoom(zoom, isRoot);

        const children = this.getDirectChildren() as PrimitiveBase[];
        for (const child of children) {
            child.zoom(zoom, false);
        }
    }

    public abstract subdivide(subdivisionBalance: number, childrenColorVariation: number): void;
    public abstract get vertices(): IPoint[];

    protected abstract applyZoom(zoom: Zoom, isRoot: boolean): void;
    public abstract computeVisibility(viewport: Rectangle): EVisibility;
}

export {
    EVisibility,
    PrimitiveBase,
};

