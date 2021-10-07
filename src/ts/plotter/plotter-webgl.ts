import { Color } from "../misc/color";
import * as Loader from "../misc/loader";
import { Zooming } from "../misc/zooming";
import { GeometryId } from "./geometry-id";
import { BatchOfLines, BatchOfPolygons, PlotterBase } from "./plotter-base";

import * as GLCanvas from "../gl-utils/gl-canvas";
import { gl } from "../gl-utils/gl-canvas";
import { Shader } from "../gl-utils/shader";
import * as ShaderManager from "../gl-utils/shader-manager";
import { Viewport } from "../gl-utils/viewport";


interface IPendingLines {
    readonly batchOfLines: BatchOfLines;
    readonly color: Color;
    readonly alpha: number;
}

interface IPendingPolygons {
    readonly batchOfPolygons: BatchOfPolygons;
    readonly alpha: number;
}


interface IVboPart {
    readonly indexOfFirstVertice: number;
    readonly verticesCount: number;
    readonly geometryId: GeometryId;
    scheduledForDrawing: boolean;
}

interface IPartionedVbo<T extends IVboPart> {
    readonly id: WebGLBuffer;
    vboParts: T[];
}


interface ILinesVboPart extends IVboPart {
    color: Color;
    alpha: number;
}

interface IPolygonsVboPart extends IVboPart {
    alpha: number;
}


class PlotterWebGL extends PlotterBase {
    private shaderLines: Shader;
    private shaderPolygons: Shader;

    private readonly linesVbo: IPartionedVbo<ILinesVboPart>;
    private readonly polygonsVbo: IPartionedVbo<IPolygonsVboPart>;

    private pendingLines: IPendingLines[] = [];
    private pendingPolygons: IPendingPolygons[] = [];

    public constructor() {
        super();

        const webglFlags = {
            alpha: false,
            antialias: true,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false,
        };
        if (!GLCanvas.initGL(webglFlags)) {
            return;
        }
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.STENCIL_TEST);

        this.linesVbo = {
            id: gl.createBuffer(),
            vboParts: [],
        };

        this.polygonsVbo = {
            id: gl.createBuffer(),
            vboParts: [],
        };

        this.asyncLoadShader("shaderLines.vert", "shaderLines.frag", (shader: Shader) => {
            this.shaderLines = shader;
        });

        this.asyncLoadShader("shaderPolygons.vert", "shaderPolygons.frag", (shader: Shader) => {
            this.shaderPolygons = shader;
        });
    }

    public get supportsThickLines(): boolean { return false; }

    public prepare(): void {
        for (const vboPart of this.linesVbo.vboParts) {
            vboPart.scheduledForDrawing = false;
        }

        for (const vboPart of this.polygonsVbo.vboParts) {
            vboPart.scheduledForDrawing = false;
        }
    }

    public finalize(zooming: Zooming): void {
        if (this.pendingPolygons.length > 0) {
            let needToRebuildVBO = false;
            for (const pendingPolygons of this.pendingPolygons) {
                const existingVboPart = this.findUploadedVBOPart(this.polygonsVbo, pendingPolygons.batchOfPolygons.geometryId);
                if (existingVboPart) {
                    existingVboPart.scheduledForDrawing = true;
                    existingVboPart.alpha = pendingPolygons.alpha;
                } else {
                    // no matching vboPart => we need to upload it to the GPU
                    needToRebuildVBO = true;
                }
            }

            if (needToRebuildVBO) {
                this.buildAndUploadPolygonsVBO();
            }
            this.pendingPolygons = [];
        }

        if (this.pendingLines.length > 0) {
            let needToRebuildVBO = false;
            for (const pendingLines of this.pendingLines) {
                const existingVboPart = this.findUploadedVBOPart(this.linesVbo, pendingLines.batchOfLines.geometryId);
                if (existingVboPart) {
                    existingVboPart.scheduledForDrawing = true;
                    existingVboPart.alpha = pendingLines.alpha;
                    existingVboPart.color = pendingLines.color;
                } else {
                    // no matching vboPart => we need to upload it to the GPU
                    needToRebuildVBO = true;
                }
            }

            if (needToRebuildVBO) {
                this.buildAndUploadLinesVBO();
            }
            this.pendingLines = [];
        }

        this.drawPolygonsVBO(zooming);
        this.drawLinesVBO(zooming);
    }

    public get isReady(): boolean {
        return !!this.shaderLines && !!this.shaderPolygons;
    }

    protected clearCanvas(color: Color): void {
        Viewport.setFullCanvas(gl);
        gl.clearColor(color.r, color.g, color.b, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    public drawLines(batchOfLines: BatchOfLines, _thickness: number, color: Color, alpha: number): void {
        this.pendingLines.push({ batchOfLines, color, alpha });
    }

    public drawPolygons(batchOfPolygons: BatchOfPolygons, alpha: number): void {
        this.pendingPolygons.push({ batchOfPolygons, alpha });
    }

    private buildAndUploadLinesVBO(): void {
        this.linesVbo.vboParts = [];

        // optim: first, count vertices to be able to pre-reserve space
        let nbVertices = 0;
        for (const pendingLinesSuperbatch of this.pendingLines) {
            const indexOfFirstVertice = nbVertices;

            let verticesCount = 0;
            for (const line of pendingLinesSuperbatch.batchOfLines.items) {
                if (line.length >= 2) {
                    verticesCount += 2 + 2 * (line.length - 2);
                }
            }
            nbVertices += verticesCount;

            this.linesVbo.vboParts.push({
                indexOfFirstVertice,
                verticesCount,
                geometryId: pendingLinesSuperbatch.batchOfLines.geometryId.copy(),
                scheduledForDrawing: true,
                color: pendingLinesSuperbatch.color,
                alpha: pendingLinesSuperbatch.alpha,
            });
        }

        const FLOATS_PER_VERTICE = 2;
        const bufferData = new Float32Array(nbVertices * FLOATS_PER_VERTICE);
        let i = 0;
        for (const pendingLinesSuperbatch of this.pendingLines) {
            for (const line of pendingLinesSuperbatch.batchOfLines.items) {
                if (line.length >= 2) {
                    bufferData[i++] = line[0].x;
                    bufferData[i++] = line[0].y;

                    for (let iP = 1; iP < line.length - 1; iP++) {
                        bufferData[i++] = line[iP].x;
                        bufferData[i++] = line[iP].y;
                        bufferData[i++] = line[iP].x;
                        bufferData[i++] = line[iP].y;
                    }

                    bufferData[i++] = line[line.length - 1].x;
                    bufferData[i++] = line[line.length - 1].y;
                }
            }
        }
        if (i !== bufferData.length) {
            console.log("ALERT LINES");
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.linesVbo.id);
        gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.DYNAMIC_DRAW);
    }

    private drawLinesVBO(zooming: Zooming): void {
        const vbpPartsScheduledForDrawing = this.selectVBOPartsScheduledForDrawing(this.linesVbo);

        if (this.shaderLines && vbpPartsScheduledForDrawing.length > 0) {
            this.shaderLines.use();

            const aVertexLocation = this.shaderLines.a["aVertex"].loc;
            gl.enableVertexAttribArray(aVertexLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.linesVbo.id);
            gl.vertexAttribPointer(aVertexLocation, 2, gl.FLOAT, false, 0, 0);

            this.shaderLines.u["uZoom"].value = [zooming.center.x, zooming.center.y, zooming.currentZoomFactor, 0];
            this.shaderLines.u["uScreenSize"].value = [0.5 * this.width, -0.5 * this.height];

            let currentVboPartId = 0;
            while (currentVboPartId < vbpPartsScheduledForDrawing.length) {
                const currentVboPart = vbpPartsScheduledForDrawing[currentVboPartId];
                const indexOfFirstVertice = currentVboPart.indexOfFirstVertice;
                let verticesCount = currentVboPart.verticesCount;

                let nextVboPart = vbpPartsScheduledForDrawing[currentVboPartId + 1];
                while (this.doLinesVboPartsHaveSameUniforms(currentVboPart, nextVboPart)) {
                    verticesCount += nextVboPart.verticesCount;
                    currentVboPartId++;
                    nextVboPart = vbpPartsScheduledForDrawing[currentVboPartId + 1];
                }

                this.shaderLines.u["uColor"].value = [currentVboPart.color.r / 255, currentVboPart.color.g / 255, currentVboPart.color.b / 255, currentVboPart.alpha];
                this.shaderLines.bindUniforms();
                gl.drawArrays(gl.LINES, indexOfFirstVertice, verticesCount);

                currentVboPartId++;
            }
        }
    }

    private buildAndUploadPolygonsVBO(): void {
        // optim: first, count vertices to be able to pre-reserve space
        let nbVertices = 0;
        for (const polygonsBatch of this.pendingPolygons) {
            const indexOfFirstVertice = nbVertices;

            let verticesCount = 0;
            for (const polygon of polygonsBatch.batchOfPolygons.items) {
                if (polygon.vertices.length >= 3) {
                    verticesCount += 3 * (polygon.vertices.length - 2);
                }
            }
            nbVertices += verticesCount;

            this.polygonsVbo.vboParts.push({
                indexOfFirstVertice,
                verticesCount,
                geometryId: polygonsBatch.batchOfPolygons.geometryId.copy(),
                scheduledForDrawing: true,
                alpha: polygonsBatch.alpha,
            });
        }

        const FLOATS_PER_VERTICE = 6;
        const bufferData = new Float32Array(nbVertices * FLOATS_PER_VERTICE);
        let i = 0;
        for (const polygonsBatch of this.pendingPolygons) {
            for (const polygon of polygonsBatch.batchOfPolygons.items) {
                if (polygon.vertices.length >= 3) {
                    const red = polygon.color.r / 255;
                    const green = polygon.color.g / 255;
                    const blue = polygon.color.b / 255;

                    for (let iP = 1; iP < polygon.vertices.length - 1; iP++) {
                        bufferData[i++] = polygon.vertices[0].x;
                        bufferData[i++] = polygon.vertices[0].y;
                        bufferData[i++] = red;
                        bufferData[i++] = green;
                        bufferData[i++] = blue;
                        i++; // padding

                        bufferData[i++] = polygon.vertices[iP].x;
                        bufferData[i++] = polygon.vertices[iP].y;
                        bufferData[i++] = red;
                        bufferData[i++] = green;
                        bufferData[i++] = blue;
                        i++; // padding

                        bufferData[i++] = polygon.vertices[iP + 1].x;
                        bufferData[i++] = polygon.vertices[iP + 1].y;
                        bufferData[i++] = red;
                        bufferData[i++] = green;
                        bufferData[i++] = blue;
                        i++; // padding
                    }
                }
            }
        }
        if (i !== bufferData.length) {
            console.log("ALERT POLYGONS");
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.polygonsVbo.id);
        gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.DYNAMIC_DRAW);
    }

    private drawPolygonsVBO(zooming: Zooming): void {
        const vbpPartsScheduledForDrawing = this.selectVBOPartsScheduledForDrawing(this.polygonsVbo);

        if (this.shaderPolygons && vbpPartsScheduledForDrawing.length > 0) {
            this.shaderPolygons.use();

            const BYTES_PER_FLOAT = Float32Array.BYTES_PER_ELEMENT;
            const aPositionLoc = this.shaderPolygons.a["aPosition"].loc;
            const aColorLoc = this.shaderPolygons.a["aColor"].loc;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.polygonsVbo.id);
            gl.enableVertexAttribArray(aPositionLoc);
            gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, BYTES_PER_FLOAT * 6, 0);
            gl.enableVertexAttribArray(aColorLoc);
            gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, BYTES_PER_FLOAT * 6, BYTES_PER_FLOAT * 2);

            this.shaderPolygons.u["uZoom"].value = [zooming.center.x, zooming.center.y, zooming.currentZoomFactor, 0];
            this.shaderPolygons.u["uScreenSize"].value = [0.5 * this.width, -0.5 * this.height];

            for (const vboPart of vbpPartsScheduledForDrawing) {
                this.shaderPolygons.u["uAlpha"].value = vboPart.alpha;
                this.shaderPolygons.bindUniforms();
                gl.drawArrays(gl.TRIANGLES, vboPart.indexOfFirstVertice, vboPart.verticesCount);
            }
        }
    }

    private findUploadedVBOPart<T extends IVboPart>(partitionedVBO: IPartionedVbo<T>, geometryId: GeometryId): T | null {
        for (const vboPart of partitionedVBO.vboParts) {
            if (vboPart.geometryId.isSameAs(geometryId)) {
                return vboPart;
            }
        }
        return null;
    }

    private selectVBOPartsScheduledForDrawing<T extends IVboPart>(partitionedVBO: IPartionedVbo<T>): T[] {
        return partitionedVBO.vboParts.filter((vboPart: T) => vboPart.scheduledForDrawing);
    }

    private doLinesVboPartsHaveSameUniforms(vboPart1: ILinesVboPart, vboPart2: ILinesVboPart): boolean {
        return vboPart1 && vboPart2 &&
            (vboPart1.color.r === vboPart2.color.r) &&
            (vboPart1.color.g === vboPart2.color.g) &&
            (vboPart1.color.b === vboPart2.color.b) &&
            (vboPart1.alpha === vboPart2.alpha);
    }

    private asyncLoadShader(vertexFilename: string, fragmentFilename: string, callback: (shader: Shader) => unknown): void {
        const id = `${vertexFilename}__${fragmentFilename}__${Math.random()}`;

        Loader.registerLoadingObject(id);

        ShaderManager.buildShader({
            fragmentFilename,
            vertexFilename,
            injected: {},
        }, (builtShader: Shader | null) => {
            Loader.registerLoadedObject(id);

            if (builtShader !== null) {
                callback(builtShader);
            } else {
                Page.Demopage.setErrorMessage(`${name}-shader-error`, `Failed to build '${name}' shader.`);
            }
        });
    }
}

export {
    PlotterWebGL,
};
