import { Engine } from "./engine/engine";
import { EngineBase } from "./engine/engine-base";
import { EngineVisibilityTest } from "./engine/engine-visibility-test";
import { Color } from "./misc/color";
import { downloadTextFile } from "./misc/web";
import { Zooming } from "./misc/zooming";
import { EPlotter, Parameters } from "./parameters";
import { PlotterBase } from "./plotter/plotter-base";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { PlotterSVG } from "./plotter/plotter-svg";
import { PlotterWebGL } from "./plotter/plotter-webgl";

import "./page-interface-generated";


function createPlotter(): PlotterBase {
    if (Parameters.plotter === EPlotter.CANVAS2D) {
        return new PlotterCanvas2D();
    } else {
        return new PlotterWebGL();
    }
}

function createEngine(plotter: PlotterBase): EngineBase {
    if (Parameters.debugMode) {
        return new EngineVisibilityTest();
    } else {
        const engine = new Engine();
        Parameters.recomputeColorsObservers.push(() => { engine.recomputeColors(); });
        engine.reset(plotter.viewport);
        return engine;
    }
}

function main(): void {
    const plotter = createPlotter();
    const engine = createEngine(plotter);
    const zooming = new Zooming({ x: 0, y: 0 }, 0.2);
    const backgroundColor = Color.BLACK;

    Parameters.downloadObservers.push(() => {
        const svgPlotter = new PlotterSVG();
        svgPlotter.initialize(backgroundColor);
        engine.draw(svgPlotter);
        const fileName = "subdivisions.svg";
        const svgString = svgPlotter.output();
        downloadTextFile(fileName, svgString);
    });

    Parameters.resetObservers.push(() => {
        plotter.resizeCanvas();
        engine.reset(plotter.viewport);
        zooming.center.x = 0;
        zooming.center.y = 0;
    });

    let needToRedraw = true;
    Parameters.redrawObservers.push(() => { needToRedraw = true; });


    const MAX_DT = 1 / 30;
    let lastUpdateTimestamp = performance.now();
    function mainLoop(): void {
        const now = performance.now();
        zooming.speed = Parameters.zoomingSpeed;
        zooming.dt = 0.001 * (now - lastUpdateTimestamp);
        if (zooming.dt > MAX_DT) {
            // A high dt means a low FPS because of too many computations,
            // however the higher the dt, the more computation will be needed... Clamp it.
            zooming.dt = MAX_DT;
        }
        lastUpdateTimestamp = now;

        if (Page.Canvas.isMouseDown()) {
            const mousePosition = Parameters.mousePositionInPixels;
            zooming.center.x = mousePosition.x - 0.5 * plotter.width;
            zooming.center.y = mousePosition.y - 0.5 * plotter.height;
        }

        if (engine.update(plotter.viewport, zooming) || zooming.speed > 0) {
            needToRedraw = true;
        }

        if (needToRedraw && plotter.isReady) {
            plotter.initialize(backgroundColor);
            engine.draw(plotter);
            needToRedraw = false;
        }

        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

main();
