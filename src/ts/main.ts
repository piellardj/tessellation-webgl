import { Color } from "./color/color";
import { Parameters } from "./parameters";
import { ILine, ILinesBatch, PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { EOrientation, Primitive } from "./primitives/primitive";

import "./page-interface-generated";


type Layer = Primitive[];

function computeNextLayer(parentLayer: Layer): Layer {
    let newLayer: Layer = [];

    for (const parentPrimitive of parentLayer) {
        newLayer = newLayer.concat(parentPrimitive.subdivide());
    }

    return newLayer;
}

function computeLinesBatches(layers: Layer[]): ILinesBatch[] {
    const linesBatches: ILinesBatch[] = [];

    const MAX_THICKNESS = Parameters.thickness;

    for (let iLayer = 0; iLayer < layers.length - 1; iLayer++) {
        const layer = layers[iLayer];

        const lines: ILine[] = [];
        for (const primitive of layer) {
            lines.push({
                p1: primitive.subdivision[0],
                p2: primitive.subdivision[1],
            });
        }

        linesBatches.push({
            lines,
            thickness: 1 + MAX_THICKNESS * (layers.length - 2 - iLayer) / (layers.length - 2),
        });
    }

    return linesBatches;
}

function main(): void {
    const plotter = new PlotterCanvas2D();
    const backgroundColor = new Color(255, 128, 128);

    const basePrimitive = new Primitive(
        { x: 0, y: 0 }, { x: 512, y: 0 }, { x: 0, y: 512 }, { x: 512, y: 512 },
        EOrientation.VERTICAL,
        Color.random(),
    );

    const layers: Layer[] = [[basePrimitive]];
    let linesBatches: ILinesBatch[];

    function reset(): void {
        basePrimitive.removeChildren();
        layers.length = 1;
        linesBatches = computeLinesBatches(layers);
    }

    Parameters.resetObservers.push(reset);
    Parameters.redrawObservers.push(() => { linesBatches = computeLinesBatches(layers); });
    Parameters.recomputeColorsObservers.push(() => {
        basePrimitive.color = Color.random();
    });
    reset();

    function mainLoop(): void {
        {
            const wantedLayersCount = Parameters.depth;
            const somethingChanged = (layers.length !== wantedLayersCount);

            if (layers.length > wantedLayersCount) {
                for (const primitive of layers[wantedLayersCount - 1]) {
                    primitive.removeChildren();
                }
                layers.length = wantedLayersCount;
            } else {
                while (layers.length < wantedLayersCount) {
                    const lastLayer = layers[layers.length - 1];
                    const newLayer = computeNextLayer(lastLayer);
                    layers.push(newLayer);
                }
            }

            if (somethingChanged) {
                linesBatches = computeLinesBatches(layers);
            }
        }

        plotter.initialize(backgroundColor);
        plotter.drawPolygons(layers[layers.length - 1]);
        plotter.drawLines(linesBatches, Parameters.linesColor);

        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

main();
