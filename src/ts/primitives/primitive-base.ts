import { Color } from "../misc/color";
import { IPolygon } from "../plotter/plotter-base";
import { IPoint } from "../misc/point";
import { Rectangle } from "../misc/rectangle";
import { Zooming } from "../misc/zooming";
import { TreeNode } from "../engine/tree-node";


type Line = IPoint[];

enum EVisibility {
    OUT_OF_VIEW,
    VISIBLE,
    COVERS_VIEW,
}

abstract class PrimitiveBase extends TreeNode implements IPolygon {
    public subdivision: Line | null = null;
    protected _color: Color;

    protected constructor(color: Color) {
        super();
        this.color = color;
    }

    public set color(color: Color) {
        this._color = color;

        const children = this.getDirectChildren() as PrimitiveBase[];
        for (const child of children) {
            child.color = this.color.computeCloseColor();
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

    public abstract subdivide(): void;
    public abstract get vertices(): IPoint[];

    public abstract zoom(zooming: Zooming, isRoot: boolean): void;
    public abstract computeVisibility(viewport: Rectangle): EVisibility;
}

export {
    EVisibility,
    PrimitiveBase,
};
