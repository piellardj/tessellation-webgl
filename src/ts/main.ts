import { Engine } from "./engine";
import { EngineVisibilityTest } from "./engine-visibility-test";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { Parameters } from "./parameters";
import { Zooming } from "./misc/zooming";

import "./page-interface-generated";


function createEngine(plotter: PlotterCanvas2D): Engine {
    const engine = new Engine();
    Parameters.recomputeColorsObservers.push(() => { engine.recomputeColors(); });
    engine.reset(plotter.viewport);
    return engine;
}

function main(): void {
    const plotter = new PlotterCanvas2D();
    const engine = Parameters.debugMode ? new EngineVisibilityTest() : createEngine(plotter);
    const zooming = new Zooming({ x: 0, y: 0 }, 0.2);

    Parameters.resetObservers.push(() => {
        plotter.resizeCanvas();
        engine.reset(plotter.viewport);
    });

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

        engine.update(plotter.viewport, zooming);
        engine.draw(plotter);

        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

main();
