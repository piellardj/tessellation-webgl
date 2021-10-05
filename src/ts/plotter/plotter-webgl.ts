import { Color } from "../misc/color";
import { ILinesBatch, IPolygon, PlotterBase } from "./plotter-base";
import * as Loader from "../misc/loader";

import * as GLCanvas from "../gl-utils/gl-canvas";
import { gl } from "../gl-utils/gl-canvas";
import { Shader } from "../gl-utils/shader";
import * as ShaderManager from "../gl-utils/shader-manager";
import { VBO } from "../gl-utils/vbo";
import { Viewport } from "../gl-utils/viewport";
import { Zooming } from "../misc/zooming";


class PlotterWebGL extends PlotterBase {
    private shaderLines: Shader;
    private shaderPolygons: Shader;

    private readonly linesVBO: VBO;
    private readonly polygonsVBOId: WebGLBuffer;

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

        this.linesVBO = new VBO(gl, new Float32Array(), 2, gl.FLOAT, false);
        this.polygonsVBOId = gl.createBuffer();

        this.asyncLoadShader("shaderLines.vert", "shaderLines.frag", (shader: Shader) => {
            this.shaderLines = shader;
            this.shaderLines.a["aVertex"].VBO = this.linesVBO;
        });

        this.asyncLoadShader("shaderPolygons.vert", "shaderPolygons.frag", (shader: Shader) => {
            this.shaderPolygons = shader;
        });
    }

    public get isReady(): boolean {
        return !!this.shaderLines && !!this.shaderPolygons;
    }

    protected clearCanvas(color: Color): void {
        Viewport.setFullCanvas(gl);
        gl.clearColor(color.r, color.g, color.b, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    public drawLines(linesBatches: ILinesBatch[], color: Color, alpha: number, zooming: Zooming): void {
        const FLOATS_PER_VERTICE = 2;
        function buildBufferData(): Float32Array {
            // optim: first, count vertices to be able to pre-reserve space
            let nbVertices = 0;
            for (const linesBatch of linesBatches) {
                for (const line of linesBatch.lines) {
                    if (line.length >= 2) {
                        nbVertices += 2 + 2 * (line.length - 2);
                    }
                }
            }

            const bufferData = new Float32Array(nbVertices * FLOATS_PER_VERTICE);
            let i = 0;
            for (const linesBatch of linesBatches) {
                for (const line of linesBatch.lines) {
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
            return bufferData;
        }

        if (this.shaderLines && alpha > 0 && linesBatches) {
            const bufferData = buildBufferData();

            if (bufferData.length > 0) {
                this.linesVBO.setData(bufferData);
                this.shaderLines.u["uColor"].value = [color.r / 255, color.g / 255, color.b / 255, alpha];
                this.shaderLines.u["uScreenSize"].value = [0.5 * this.width, -0.5 * this.height];
                this.shaderLines.u["uZoom"].value = [zooming.center.x, zooming.center.y, zooming.currentZoomFactor, 0];
                this.shaderLines.use();
                this.shaderLines.bindUniformsAndAttributes();
                gl.drawArrays(gl.LINES, 0, bufferData.length / FLOATS_PER_VERTICE);
            }
        }
    }

    public drawPolygons(polygons: IPolygon[], alpha: number, zooming: Zooming): void {
        const FLOATS_PER_VERTICE = 6;

        function buildBufferData(): Float32Array {
            // optim: first, count vertices to be able to pre-reserve space
            let nbVertices = 0;
            for (const polygon of polygons) {
                if (polygon.vertices.length >= 3) {
                    nbVertices += 3 * (polygon.vertices.length - 2);
                }
            }

            const bufferData = new Float32Array(nbVertices * FLOATS_PER_VERTICE);
            let i = 0;
            for (const polygon of polygons) {
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
                        bufferData[i++] = alpha;

                        bufferData[i++] = polygon.vertices[iP].x;
                        bufferData[i++] = polygon.vertices[iP].y;
                        bufferData[i++] = red;
                        bufferData[i++] = green;
                        bufferData[i++] = blue;
                        bufferData[i++] = alpha;

                        bufferData[i++] = polygon.vertices[iP + 1].x;
                        bufferData[i++] = polygon.vertices[iP + 1].y;
                        bufferData[i++] = red;
                        bufferData[i++] = green;
                        bufferData[i++] = blue;
                        bufferData[i++] = alpha;
                    }
                }
            }
            return bufferData;
        }

        if (this.shaderPolygons && alpha > 0 && polygons) {
            const bufferData = buildBufferData();

            if (bufferData.length > 0) {
                this.shaderPolygons.u["uScreenSize"].value = [0.5 * this.width, -0.5 * this.height];
                this.shaderPolygons.u["uZoom"].value = [zooming.center.x, zooming.center.y, zooming.currentZoomFactor, 0];
                this.shaderPolygons.use();
                this.shaderPolygons.bindUniforms();

                const BYTES_PER_FLOAT = 4;
                const aPositionLoc = this.shaderPolygons.a["aPosition"].loc;
                const aColorLoc = this.shaderPolygons.a["aColor"].loc;
                gl.bindBuffer(gl.ARRAY_BUFFER, this.polygonsVBOId);
                gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.DYNAMIC_DRAW);
                gl.enableVertexAttribArray(aPositionLoc);
                gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, BYTES_PER_FLOAT * FLOATS_PER_VERTICE, 0);
                gl.enableVertexAttribArray(aColorLoc);
                gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, BYTES_PER_FLOAT * FLOATS_PER_VERTICE, BYTES_PER_FLOAT * 2);

                gl.drawArrays(gl.TRIANGLES, 0, bufferData.length / FLOATS_PER_VERTICE);
            }
        }
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
