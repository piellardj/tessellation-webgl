import { Color } from "../misc/color";
import * as Loader from "../misc/loader";
import { Zoom } from "../misc/zoom";
import { GeometryId } from "./geometry-id";
import { PlotterCanvas } from "./plotter-canvas";
import { BatchOfLines, BatchOfPolygons } from "./types";
import { IVboBuffer, IVboPart } from "./vbo-types";

import * as GLCanvas from "../gl-utils/gl-canvas";
import { gl } from "../gl-utils/gl-canvas";
import { Shader } from "../gl-utils/shader";
import * as ShaderManager from "../gl-utils/shader-manager";
import { Viewport } from "../gl-utils/viewport";

import "../page-interface-generated";


interface IUploadedVboPart extends IVboPart {
    scheduledForDrawing: boolean;
}

// VBO when it is only on GPU side
interface IUploadedVbo<T extends IUploadedVboPart> {
    readonly id: WebGLBuffer;
    vboParts: T[];
}

interface ILinesVboPart extends IUploadedVboPart {
    color: Color;
    alpha: number;
}

interface IPolygonsVboPart extends IUploadedVboPart {
    alpha: number;
}

class PlotterWebGLBasic extends PlotterCanvas {
    public static buildLinesVboBuffer(batchesOfLines: BatchOfLines[]): IVboBuffer {
        const bufferParts: IVboPart[] = [];

        // optim: first, count vertices to be able to pre-reserve space
        let totalNbVertices = 0;
        for (const batchOfLines of batchesOfLines) {
            const indexOfFirstVertice = totalNbVertices;

            let batchVerticesCount = 0;
            for (const line of batchOfLines.items) {
                if (line.length >= 2) {
                    batchVerticesCount += 2 + 2 * (line.length - 2);
                }
            }
            totalNbVertices += batchVerticesCount;

            bufferParts.push({
                indexOfFirstVertice,
                verticesCount: batchVerticesCount,
                geometryId: batchOfLines.geometryId.copy(),
            });
        }

        const FLOATS_PER_VERTICE = 2;
        const buffer = new Float32Array(FLOATS_PER_VERTICE * totalNbVertices);
        let i = 0;
        for (const batchOfLines of batchesOfLines) {
            for (const line of batchOfLines.items) {
                if (line.length >= 2) {
                    buffer[i++] = line[0].x;
                    buffer[i++] = line[0].y;

                    for (let iP = 1; iP < line.length - 1; iP++) {
                        buffer[i++] = line[iP].x;
                        buffer[i++] = line[iP].y;
                        buffer[i++] = line[iP].x;
                        buffer[i++] = line[iP].y;
                    }

                    buffer[i++] = line[line.length - 1].x;
                    buffer[i++] = line[line.length - 1].y;
                }
            }
        }
        if (i !== buffer.length) {
            console.log("ALERT LINES");
        }

        return {
            buffer,
            bufferParts,
        };
    }

    public static buildPolygonsVboBuffer(batchesOfPolygons: BatchOfPolygons[]): IVboBuffer {
        const bufferParts: IVboPart[] = [];

        // optim: first, count vertices to be able to pre-reserve space
        let totalNbVertices = 0;
        for (const batchOfPolygons of batchesOfPolygons) {
            const indexOfFirstVertice = totalNbVertices;

            let batchVerticesCount = 0;
            for (const polygon of batchOfPolygons.items) {
                if (polygon.vertices.length >= 3) {
                    batchVerticesCount += 3 * (polygon.vertices.length - 2);
                }
            }
            totalNbVertices += batchVerticesCount;

            bufferParts.push({
                indexOfFirstVertice,
                verticesCount: batchVerticesCount,
                geometryId: batchOfPolygons.geometryId.copy(),
            });
        }

        const FLOATS_PER_VERTICE = 6;
        const buffer = new Float32Array(FLOATS_PER_VERTICE * totalNbVertices);
        let i = 0;
        for (const batchOfPolygons of batchesOfPolygons) {
            for (const polygon of batchOfPolygons.items) {
                if (polygon.vertices.length >= 3) {
                    const red = polygon.color.r / 255;
                    const green = polygon.color.g / 255;
                    const blue = polygon.color.b / 255;

                    for (let iP = 1; iP < polygon.vertices.length - 1; iP++) {
                        buffer[i++] = polygon.vertices[0].x;
                        buffer[i++] = polygon.vertices[0].y;
                        buffer[i++] = red;
                        buffer[i++] = green;
                        buffer[i++] = blue;
                        i++; // padding

                        buffer[i++] = polygon.vertices[iP].x;
                        buffer[i++] = polygon.vertices[iP].y;
                        buffer[i++] = red;
                        buffer[i++] = green;
                        buffer[i++] = blue;
                        i++; // padding

                        buffer[i++] = polygon.vertices[iP + 1].x;
                        buffer[i++] = polygon.vertices[iP + 1].y;
                        buffer[i++] = red;
                        buffer[i++] = green;
                        buffer[i++] = blue;
                        i++; // padding
                    }
                }
            }
        }

        return {
            buffer,
            bufferParts,
        };
    }

    private shaderLines: Shader;
    private shaderPolygons: Shader;

    private readonly linesVbo: IUploadedVbo<ILinesVboPart>;
    private readonly polygonsVbo: IUploadedVbo<IPolygonsVboPart>;

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

        PlotterWebGLBasic.asyncLoadShader("shaderLines.vert", "shaderLines.frag", (shader: Shader) => {
            this.shaderLines = shader;
        });

        PlotterWebGLBasic.asyncLoadShader("shaderPolygons.vert", "shaderPolygons.frag", (shader: Shader) => {
            this.shaderPolygons = shader;
        });

        this.linesVbo = {
            id: gl.createBuffer(),
            vboParts: [],
        };

        this.polygonsVbo = {
            id: gl.createBuffer(),
            vboParts: [],
        };
    }

    public get isReady(): boolean {
        return !!this.shaderLines && !!this.shaderPolygons;
    }

    public initialize(backgroundColor: Color, zoom: Zoom, scaling: number): void {
        for (const vboPart of this.linesVbo.vboParts) {
            vboPart.scheduledForDrawing = false;
        }

        for (const vboPart of this.polygonsVbo.vboParts) {
            vboPart.scheduledForDrawing = false;
        }

        Viewport.setFullCanvas(gl);
        gl.clearColor(backgroundColor.r / 255, backgroundColor.g / 255, backgroundColor.b / 255, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const zoomTranslate = zoom.translate;
        const zoomAndScalingAsUniform = [zoom.scale, zoomTranslate.x, zoomTranslate.y, scaling];
        this.shaderLines.u["uZoom"].value = zoomAndScalingAsUniform;
        this.shaderPolygons.u["uZoom"].value = zoomAndScalingAsUniform;
    }

    public finalize(): void {
        this.drawPolygonsVBO();
        this.drawLinesVBO();
    }

    public uploadLinesVbo(newLinesVbo: IVboBuffer): void {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.linesVbo.id);
        gl.bufferData(gl.ARRAY_BUFFER, newLinesVbo.buffer, gl.DYNAMIC_DRAW);

        this.linesVbo.vboParts = [];
        for (const bufferPart of newLinesVbo.bufferParts) {
            this.linesVbo.vboParts.push({
                indexOfFirstVertice: bufferPart.indexOfFirstVertice,
                verticesCount: bufferPart.verticesCount,
                scheduledForDrawing: false,
                geometryId: bufferPart.geometryId.copy(),
                color: Color.GREEN, // temporary, will be overwritten later
                alpha: 1, // temporary, will be overwritten later
            });
        }
    }

    public uploadPolygonsVbo(newPolygonsVbo: IVboBuffer): void {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.polygonsVbo.id);
        gl.bufferData(gl.ARRAY_BUFFER, newPolygonsVbo.buffer, gl.DYNAMIC_DRAW);

        this.polygonsVbo.vboParts = [];
        for (const bufferPart of newPolygonsVbo.bufferParts) {
            this.polygonsVbo.vboParts.push({
                indexOfFirstVertice: bufferPart.indexOfFirstVertice,
                verticesCount: bufferPart.verticesCount,
                scheduledForDrawing: false,
                geometryId: bufferPart.geometryId.copy(),
                alpha: 1, // temporary, will be overwritten later
            });
        }
    }

    public registerLinesVboPartForDrawing(vboPartId: GeometryId, color: Color, alpha: number): boolean {
        const uploadedVBOPart = PlotterWebGLBasic.findUploadedVBOPart(this.linesVbo, vboPartId);
        if (uploadedVBOPart) {
            uploadedVBOPart.color = color;
            uploadedVBOPart.alpha = alpha;
            uploadedVBOPart.scheduledForDrawing = true;
            return true;
        }
        return false;
    }

    public registerPolygonsVboPartForDrawing(vboPartId: GeometryId, alpha: number): boolean {
        const uploadedVBOPart = PlotterWebGLBasic.findUploadedVBOPart(this.polygonsVbo, vboPartId);
        if (uploadedVBOPart) {
            uploadedVBOPart.alpha = alpha;
            uploadedVBOPart.scheduledForDrawing = true;
            return true;
        }
        return false;
    }

    private drawLinesVBO(): void {
        const vbpPartsScheduledForDrawing = PlotterWebGLBasic.selectVBOPartsScheduledForDrawing(this.linesVbo);

        if (this.shaderLines && vbpPartsScheduledForDrawing.length > 0) {
            this.shaderLines.use();

            const aVertexLocation = this.shaderLines.a["aVertex"].loc;
            gl.enableVertexAttribArray(aVertexLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.linesVbo.id);
            gl.vertexAttribPointer(aVertexLocation, 2, gl.FLOAT, false, 0, 0);

            this.shaderLines.u["uScreenSize"].value = [0.5 * this.width, -0.5 * this.height];

            let currentVboPartId = 0;
            while (currentVboPartId < vbpPartsScheduledForDrawing.length) {
                let currentVboPart = vbpPartsScheduledForDrawing[currentVboPartId];
                const indexOfFirstVertice = currentVboPart.indexOfFirstVertice;
                let verticesCount = currentVboPart.verticesCount;

                let nextVboPart = vbpPartsScheduledForDrawing[currentVboPartId + 1];
                while (PlotterWebGLBasic.canLinesVboPartsBeMerged(currentVboPart, nextVboPart)) {
                    verticesCount += nextVboPart.verticesCount;
                    currentVboPartId++;
                    currentVboPart = nextVboPart;
                    nextVboPart = vbpPartsScheduledForDrawing[currentVboPartId + 1];
                }

                this.shaderLines.u["uColor"].value = [currentVboPart.color.r / 255, currentVboPart.color.g / 255, currentVboPart.color.b / 255, currentVboPart.alpha];
                this.shaderLines.bindUniforms();
                gl.drawArrays(gl.LINES, indexOfFirstVertice, verticesCount);

                currentVboPartId++;
            }
        }
    }

    private drawPolygonsVBO(): void {
        const vbpPartsScheduledForDrawing = PlotterWebGLBasic.selectVBOPartsScheduledForDrawing(this.polygonsVbo);

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

            this.shaderPolygons.u["uScreenSize"].value = [0.5 * this.width, -0.5 * this.height];

            for (const vboPart of vbpPartsScheduledForDrawing) {
                this.shaderPolygons.u["uAlpha"].value = vboPart.alpha;
                this.shaderPolygons.bindUniforms();
                gl.drawArrays(gl.TRIANGLES, vboPart.indexOfFirstVertice, vboPart.verticesCount);
            }
        }
    }

    private static selectVBOPartsScheduledForDrawing<T extends IUploadedVboPart>(partitionedVBO: IUploadedVbo<T>): T[] {
        return partitionedVBO.vboParts.filter((vboPart: T) => vboPart.scheduledForDrawing);
    }

    private static findUploadedVBOPart<T extends IUploadedVboPart>(uploadedVBO: IUploadedVbo<T>, searchedGeometryId: GeometryId): T | undefined {
        return uploadedVBO.vboParts.find((vboPart: T) => vboPart.geometryId.isSameAs(searchedGeometryId));
    }

    private static canLinesVboPartsBeMerged(vboPart1: ILinesVboPart, vboPart2: ILinesVboPart): boolean {
        return vboPart1 && vboPart2 &&
            (vboPart2.indexOfFirstVertice === vboPart1.indexOfFirstVertice + vboPart1.verticesCount) &&
            (vboPart1.color.r === vboPart2.color.r) &&
            (vboPart1.color.g === vboPart2.color.g) &&
            (vboPart1.color.b === vboPart2.color.b) &&
            (vboPart1.alpha === vboPart2.alpha);
    }

    private static asyncLoadShader(vertexFilename: string, fragmentFilename: string, callback: (shader: Shader) => unknown): void {
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
    IVboBuffer,
    IVboPart,
    PlotterWebGLBasic,
};

