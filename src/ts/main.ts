import { Engine } from "./engine/engine";
import { FrametimeMonitor } from "./misc/frame-time-monitor";
import { downloadTextFile } from "./misc/web";
import { Zooming } from "./misc/zooming";
import { EPlotter, Parameters } from "./parameters";
import { PlotterBase } from "./plotter/plotter-base";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { PlotterSVG } from "./plotter/plotter-svg";
import { PlotterWebGL } from "./plotter/plotter-webgl";
import * as Testing from "./testing/main-testing";

import "./page-interface-generated";


function createPlotter(): PlotterBase {
    if (Parameters.plotter === EPlotter.CANVAS2D) {
        return new PlotterCanvas2D();
    } else {
        return new PlotterWebGL();
    }
}

function main(): void {
    const plotter = createPlotter();
    const engine = new Engine();
    const zooming = new Zooming({ x: 0, y: 0 }, 0.2);

    Parameters.recomputeColorsObservers.push(() => { engine.recomputeColors(); });

    Parameters.downloadObservers.push(() => {
        const svgPlotter = new PlotterSVG();
        engine.draw(svgPlotter);
        const fileName = "subdivisions.svg";
        const svgString = svgPlotter.output();
        downloadTextFile(fileName, svgString);
    });

    function reset(): void {
        plotter.resizeCanvas();
        engine.reset(plotter.viewport);
        zooming.center.x = 0;
        zooming.center.y = 0;
    }
    Parameters.resetObservers.push(reset);
    reset();

    let needToRedraw = true;
    Parameters.redrawObservers.push(() => { needToRedraw = true; });

    const frametimeMonitor = new FrametimeMonitor();
    setInterval(() => {
        frametimeMonitor.updateIndicators();
    }, 1000);

    const MAX_DT = 1 / 30;
    let lastFrameTimestamp = performance.now();
    function mainLoop(): void {
        const now = performance.now();
        const timeSinceLastFrame = now - lastFrameTimestamp;
        frametimeMonitor.registerFrameTime(timeSinceLastFrame);

        zooming.speed = Parameters.zoomingSpeed;
        zooming.dt = 0.001 * timeSinceLastFrame;
        if (zooming.dt > MAX_DT) {
            // A high dt means a low FPS because of too many computations,
            // however the higher the dt, the more computation will be needed... Clamp it.
            zooming.dt = MAX_DT;
        }
        lastFrameTimestamp = now;

        if (Page.Canvas.isMouseDown()) {
            const mousePosition = Parameters.mousePositionInPixels;
            zooming.center.x = mousePosition.x - 0.5 * plotter.width;
            zooming.center.y = mousePosition.y - 0.5 * plotter.height;
        }

        if (engine.update(plotter.viewport, zooming) || zooming.speed > 0) {
            needToRedraw = true;
        }

        if (needToRedraw && plotter.isReady) {
            plotter.resizeCanvas();
            engine.draw(plotter);
            needToRedraw = false;
        }

        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

if (Parameters.debugMode) {
    Testing.main();
} else {
    main();
}
