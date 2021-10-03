import { Color } from "../misc/color";
import { ILinesBatch, IPolygon, PlotterBase } from "./plotter-base";
import * as Loader from "../misc/loader";

import * as GLCanvas from "../gl-utils/gl-canvas";
import { gl } from "../gl-utils/gl-canvas";
import { Shader } from "../gl-utils/shader";
import * as ShaderManager from "../gl-utils/shader-manager";
import { VBO } from "../gl-utils/vbo";
import { Viewport } from "../gl-utils/viewport";


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

    protected clearCanvas(color: Color): void {
        Viewport.setFullCanvas(gl);
        gl.clearColor(color.r, color.g, color.b, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    public drawLines(linesBatches: ILinesBatch[], color: Color, alpha: number): void {
        if (this.shaderLines && alpha > 0) {
            const vertexData: number[] = [];
            for (const linesBatch of linesBatches) {
                for (const line of linesBatch.lines) {
                    if (line.length >= 2) {
                        vertexData.push(line[0].x);
                        vertexData.push(line[0].y);

                        for (let iP = 1; iP < line.length - 1; iP++) {
                            vertexData.push(line[iP].x);
                            vertexData.push(line[iP].y);
                            vertexData.push(line[iP].x);
                            vertexData.push(line[iP].y);
                        }

                        vertexData.push(line[line.length - 1].x);
                        vertexData.push(line[line.length - 1].y);
                    }
                }
            }

            const data = new Float32Array(vertexData);
            this.linesVBO.setData(data);
            this.shaderLines.u["uColor"].value = [color.r / 255, color.g / 255, color.b / 255, alpha];
            this.shaderLines.u["uScreenSize"].value = [0.5 * this.width, -0.5 * this.height];

            this.shaderLines.use();
            this.shaderLines.bindUniformsAndAttributes();
            gl.drawArrays(gl.LINES, 0, data.length / 2);
        }
    }

    public drawPolygons(polygons: IPolygon[], alpha: number): void {
        if (this.shaderPolygons && alpha > 0) {
            const vertexData: number[] = [];
            for (const polygon of polygons) {
                if (polygon.points.length >= 3) {
                    const red = polygon.color.r / 255;
                    const green = polygon.color.g / 255;
                    const blue = polygon.color.b / 255;

                    for (let iP = 1; iP < polygon.points.length - 1; iP++) {
                        vertexData.push(polygon.points[0].x);
                        vertexData.push(polygon.points[0].y);
                        vertexData.push(red);
                        vertexData.push(green);
                        vertexData.push(blue);
                        vertexData.push(alpha);

                        vertexData.push(polygon.points[iP].x);
                        vertexData.push(polygon.points[iP].y);
                        vertexData.push(red);
                        vertexData.push(green);
                        vertexData.push(blue);
                        vertexData.push(alpha);

                        vertexData.push(polygon.points[iP + 1].x);
                        vertexData.push(polygon.points[iP + 1].y);
                        vertexData.push(red);
                        vertexData.push(green);
                        vertexData.push(blue);
                        vertexData.push(alpha);
                    }
                }
            }

            this.shaderPolygons.u["uScreenSize"].value = [0.5 * this.width, -0.5 * this.height];

            this.shaderPolygons.use();
            this.shaderPolygons.bindUniforms();

            const data = new Float32Array(vertexData);
            const BYTES_PER_FLOAT = 4;
            const aPositionLoc = this.shaderPolygons.a["aPosition"].loc;
            const aColorLoc = this.shaderPolygons.a["aColor"].loc;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.polygonsVBOId);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(aPositionLoc);
            gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, BYTES_PER_FLOAT * 6, 0);
            gl.enableVertexAttribArray(aColorLoc);
            gl.vertexAttribPointer(aColorLoc, 4, gl.FLOAT, false, BYTES_PER_FLOAT * 6, BYTES_PER_FLOAT * 2);

            gl.drawArrays(gl.TRIANGLES, 0, data.length / 6);
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
