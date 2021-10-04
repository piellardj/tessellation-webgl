import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { EPrimitive, Parameters } from "../parameters";
import { ILinesBatch, IPolygon, Line, PlotterBase } from "../plotter/plotter-base";
import { EVisibility, PrimitiveBase } from "../primitives/primitive-base";
import { PrimitiveQuads } from "../primitives/primitive-quads";
import { PrimitiveTriangles } from "../primitives/primitives-triangles";
import { EngineBase } from "./engine-base";

import "../page-interface-generated";


class EngineVisibilityTest extends EngineBase {
    private readonly testWindow: Rectangle;
    private readonly testWindowBaseWidth: number = 300;
    private readonly testWindowBaseHeight: number = 120;
    private zoom: number = 1;

    private primitivePolygon: IPolygon;
    private primitive: PrimitiveBase;

    private readonly line: Line;

    private lastPrimitiveVisibilityStatus: EVisibility | null = null;
    private lastLineIntersectingStatus: boolean | null = null;

    public constructor() {
        super();

        this.testWindow = new Rectangle(0, 0, 0, 0);

        this.reset();

        Page.Canvas.Observers.mouseWheel.push((delta: number) => {
            this.zoom += 0.1 * delta;
            if (this.zoom < 0.1) {
                this.zoom = 0.1;
            } else if (this.zoom > 3) {
                this.zoom = 3;
            }
        });

        this.line = [{ x: -50, y: -50 }, { x: 70, y: 50 }];
    }

    public reset(): void {
        const color = new Color(255, 0, 0);

        const primitiveType = Parameters.primitive;
        if (primitiveType === EPrimitive.QUADS) {
            this.primitivePolygon = {
                vertices: [
                    { x: -150 * Math.random(), y: -150 * Math.random() }, // top left
                    { x: +150 * Math.random(), y: -150 * Math.random() }, // top right
                    { x: +150 * Math.random(), y: +150 * Math.random() }, // bottom right
                    { x: -150 * Math.random(), y: +150 * Math.random() }, // bottom left
                ],
                color: new Color(255, 0, 0),
            };
            this.primitive = new PrimitiveQuads(
                this.primitivePolygon.vertices[0], // top left
                this.primitivePolygon.vertices[1], // top right
                this.primitivePolygon.vertices[3], // bottom left
                this.primitivePolygon.vertices[2], // bottom right
                color,
            );
        } else {
            this.primitivePolygon = {
                vertices: [
                    { x: -100 - 50 * Math.random(), y: -100 - 50 * Math.random() },
                    { x: +100 + 50 * Math.random(), y: -100 - 50 * Math.random() },
                    { x: +100 + 50 * (Math.random() - 0.5), y: +100 + 50 * Math.random() },
                ],
                color: new Color(255, 0, 0),
            };
            this.primitive = new PrimitiveTriangles(
                this.primitivePolygon.vertices[0],
                this.primitivePolygon.vertices[1],
                this.primitivePolygon.vertices[2],
                color,
            );
        }

        this.lastPrimitiveVisibilityStatus = null;
        this.lastLineIntersectingStatus = null;
    }

    public update(): boolean {
        const canvasSize = Page.Canvas.getSize();
        const mousePosition = Parameters.mousePositionInPixels;
        mousePosition.x -= 0.5 * canvasSize[0];
        mousePosition.y -= 0.5 * canvasSize[1];

        const testWindowWidth = this.zoom * this.testWindowBaseWidth;
        const testWindowHeight = this.zoom * this.testWindowBaseHeight;

        this.testWindow.topLeft.x = mousePosition.x - 0.5 * testWindowWidth;
        this.testWindow.topLeft.y = mousePosition.y - 0.5 * testWindowHeight;
        this.testWindow.bottomRight.x = mousePosition.x + 0.5 * testWindowWidth;
        this.testWindow.bottomRight.y = mousePosition.y + 0.5 * testWindowHeight;

        const newPrimitiveVisibilityStatus = this.primitive.computeVisibility(this.testWindow);
        if (this.lastPrimitiveVisibilityStatus !== newPrimitiveVisibilityStatus) {
            if (newPrimitiveVisibilityStatus === EVisibility.COVERS_VIEW) { console.log("Primitive coverage: COVERS_VIEW"); }
            else if (newPrimitiveVisibilityStatus === EVisibility.OUT_OF_VIEW) { console.log("Primitive coverage: OUT_OF_VIEW"); }
            else { console.log("Primitive coverage: VISIBLE"); }

            this.lastPrimitiveVisibilityStatus = newPrimitiveVisibilityStatus;
        }

        const newLineIntersectionStatus = this.testWindow.lineIntersectsBoundaries(this.line[0], this.line[1]);
        if (this.lastLineIntersectingStatus !== newLineIntersectionStatus) {
            console.log("Line intersection: " + newLineIntersectionStatus);
            this.lastLineIntersectingStatus = newLineIntersectionStatus;
        }

        return true;
    }

    public draw(plotter: PlotterBase): void {
        plotter.initialize(Color.BLACK);

        plotter.drawPolygons([this.primitivePolygon], 1);

        plotter.drawLines([
            {
                lines: [this.line],
                thickness: 1,
            }
        ], new Color(0, 255, 0), 1);
        this.drawTestWindow(plotter);
    }

    private drawTestWindow(plotter: PlotterBase): void {
        const linesBatch: ILinesBatch = {
            lines: [[
                this.testWindow.topLeft,
                { x: this.testWindow.right, y: this.testWindow.top },
                this.testWindow.bottomRight,
                { x: this.testWindow.left, y: this.testWindow.bottom },
                this.testWindow.topLeft,
            ]],
            thickness: 1,
        };

        plotter.drawLines([linesBatch], Color.WHITE, 1);
    }
}

export { EngineVisibilityTest };
