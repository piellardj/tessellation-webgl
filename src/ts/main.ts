import { Engine } from "./engine/engine";
import { EngineBase } from "./engine/engine-base";
import { EngineVisibilityTest } from "./engine/engine-visibility-test";
import { Zooming } from "./misc/zooming";
import { Parameters } from "./parameters";
import { PlotterBase } from "./plotter/plotter-base";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";

import "./page-interface-generated";


function createEngine(plotter: PlotterBase): Engine {
    const engine = new Engine();
    Parameters.recomputeColorsObservers.push(() => { engine.recomputeColors(); });
    engine.reset(plotter.viewport);
    return engine;
}

function main(): void {
    const plotter = new PlotterCanvas2D();
    const engine: EngineBase = Parameters.debugMode ? new EngineVisibilityTest() : createEngine(plotter);
    const zooming = new Zooming({ x: 0, y: 0 }, 0.2);

    Parameters.resetObservers.push(() => {
        plotter.resizeCanvas();
        engine.reset(plotter.viewport);
    });

    let needToRedraw = true;
    Page.Canvas.Observers.canvasResize.push(() => { needToRedraw = true; });
    Parameters.resetObservers.push(() => { needToRedraw = true; });

    let lastUpdateTimestamp = performance.now();
    function mainLoop(): void {
        const now = performance.now();
        zooming.speed = Parameters.zoomingSpeed;
        zooming.dt = 0.001 * (now - lastUpdateTimestamp);
        lastUpdateTimestamp = now;

        if (Page.Canvas.isMouseDown()) {
            const mousePosition = Parameters.mousePositionInPixels;
            zooming.center.x = mousePosition.x - 0.5 * plotter.width;
            zooming.center.y = mousePosition.y - 0.5 * plotter.height;
        }

        if (engine.update(plotter.viewport, zooming)) {
            needToRedraw = true;
        }

        if (needToRedraw) {
            engine.draw(plotter);
            needToRedraw = false;
        }

        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

main();
