import { Color } from "../misc/color";
import { IPoint } from "../misc/point";
import { GeometryId } from "./geometry-id";


interface IBatch<T> {
    items: T[];
    readonly geometryId: GeometryId;
}

interface IPolygon {
    vertices: IPoint[];
    color: Color;
}
type BatchOfPolygons = IBatch<IPolygon>;

type Line = IPoint[];
type BatchOfLines = IBatch<Line>;

export {
    BatchOfLines,
    BatchOfPolygons,
    IBatch,
    IPolygon,
    Line,
};

