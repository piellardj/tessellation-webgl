import { Color } from "../misc/color";
import { Rectangle } from "../misc/rectangle";
import { Zoom } from "../misc/zoom";
import { EPrimitive, Parameters } from "../parameters";
import { GeometryId } from "../plotter/geometry-id";
import { BatchOfLines, BatchOfPolygons, Line, PlotterBase } from "../plotter/plotter-base";
import { EVisibility, PrimitiveBase } from "../primitives/primitive-base";
import { PrimitiveQuads } from "../primitives/primitive-quads";
import { PrimitiveTriangles } from "../primitives/primitive-triangles";

import "../page-interface-generated";


class TestEngine {
    private readonly testWindow: Rectangle;
    private readonly testWindowBaseWidth: number = 300;
    private readonly testWindowBaseHeight: number = 120;
    private zoom: number = 1;

    private primitive: PrimitiveBase;
    private readonly batchForPrimitive: BatchOfPolygons;

    private readonly line: Line;
    private readonly batchForLine: BatchOfLines;
    private readonly batchForWindow: BatchOfLines;

    private lastPrimitiveVisibilityStatus: EVisibility | null = null;
    private lastLineIntersectingStatus: boolean | null = null;

    public constructor() {
        this.testWindow = new Rectangle(0, 0, 0, 0);

        Page.Canvas.Observers.mouseWheel.push((delta: number) => {
            this.zoom += 0.1 * delta;
            if (this.zoom < 0.1) {
                this.zoom = 0.1;
            } else if (this.zoom > 3) {
                this.zoom = 3;
            }
        });

        this.batchForPrimitive = {
            items: [],
            geometryId: GeometryId.new(),
        };

        this.line = [{ x: -50, y: -50 }, { x: 70, y: 50 }];
        this.batchForLine = {
            items: [this.line],
            geometryId: GeometryId.new(),
        };

        this.batchForWindow = {
            items: [],
            geometryId: GeometryId.new(),
        };

        this.reset();
    }

    public reset(): void {
        const color = Color.RED;

        const primitiveType = Parameters.primitive;
        if (primitiveType === EPrimitive.QUADS) {
            this.primitive = new PrimitiveQuads(
                { x: -150 * Math.random(), y: -150 * Math.random() }, // top left
                { x: +150 * Math.random(), y: -150 * Math.random() }, // top right
                { x: -150 * Math.random(), y: +150 * Math.random() }, // bottom left
                { x: +150 * Math.random(), y: +150 * Math.random() }, // bottom right
                color,
            );
        } else {
            this.primitive = new PrimitiveTriangles(
                { x: -100 - 50 * Math.random(), y: -100 - 50 * Math.random() },
                { x: +100 + 50 * Math.random(), y: -100 - 50 * Math.random() },
                { x: +100 + 50 * (Math.random() - 0.5), y: +100 + 50 * Math.random() },
                color,
            );
        }

        this.batchForPrimitive.items.length = 0;
        this.batchForPrimitive.items.push(this.primitive);
        this.batchForPrimitive.geometryId.registerChange();

        this.lastPrimitiveVisibilityStatus = null;
        this.lastLineIntersectingStatus = null;
    }

    public update(): boolean {
        this.updateTestWindow();

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
        plotter.initialize(Color.BLACK, Zoom.noZoom(), 1);

        plotter.drawPolygons(this.batchForPrimitive, 1);

        plotter.drawLines(this.batchForLine, 1, Color.GREEN, 1);
        this.drawTestWindow(plotter);

        plotter.finalize();
    }

    private drawTestWindow(plotter: PlotterBase): void {
        plotter.drawLines(this.batchForWindow, 1, Color.WHITE, 1);
    }

    private updateTestWindow(): void {
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

        this.batchForWindow.items[0] = [
            this.testWindow.topLeft,
            { x: this.testWindow.right, y: this.testWindow.top },
            this.testWindow.bottomRight,
            { x: this.testWindow.left, y: this.testWindow.bottom },
            this.testWindow.topLeft,
        ];
        this.batchForWindow.geometryId.registerChange();
    }
}

export { TestEngine };

