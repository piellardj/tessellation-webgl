import { IEngine } from "./engine/engine-interface";
import { EngineSynchonous } from "./engine/engine-synchronous";
import { FrametimeMonitor } from "./misc/frame-time-monitor";
import { IPoint } from "./misc/point";
import { Zoom } from "./misc/zoom";
import { EPlotter, Parameters } from "./parameters";
import { PlotterCanvas } from "./plotter/plotter-canvas";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { IPlotter } from "./plotter/plotter-interface";
import { PlotterWebGL } from "./plotter/plotter-webgl";
import * as Testing from "./testing/main-testing";

import "./page-interface-generated";


function createPlotter(): PlotterCanvas & IPlotter {
    if (Parameters.plotter === EPlotter.CANVAS2D) {
        return new PlotterCanvas2D();
    } else {
        return new PlotterWebGL();
    }
}

function main(): void {
    const plotter = createPlotter();
    const engine: IEngine = new EngineSynchonous();

    Parameters.recomputeColorsObservers.push(() => {
        engine.recomputeColors(Parameters.colorVariation);
    });

    Parameters.downloadObservers.push(() => {
        engine.downloadAsSvg(plotter.width, plotter.height, Parameters.scaling);
    });

    function getCurrentMousePosition(): IPoint {
        const mousePosition = Parameters.mousePositionInPixels;
        mousePosition.x -= 0.5 * plotter.width;
        mousePosition.y -= 0.5 * plotter.height;
        return mousePosition;
    }
    let lastZoomCenter: IPoint;
    function buildInstantZoom(dt: number): Zoom {
        if (Page.Canvas.isMouseDown()) {
            lastZoomCenter = getCurrentMousePosition();
        }
        return new Zoom(lastZoomCenter, 1 + dt * Parameters.zoomingSpeed);
    }

    function reset(): void {
        plotter.resizeCanvas();
        engine.reset(plotter.viewport, Parameters.primitiveType);
        lastZoomCenter = { x: 0, y: 0 };
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
        const millisecondsSinceLastFrame = now - lastFrameTimestamp;
        lastFrameTimestamp = now;
        frametimeMonitor.registerFrameTime(millisecondsSinceLastFrame);

        // A high dt means a low FPS because of too many computations,
        // however the higher the dt, the more computation will be needed... Clamp it.
        const dt = Math.min(MAX_DT, 0.001 * millisecondsSinceLastFrame);
        const instantZoom = buildInstantZoom(dt);

        const updatedChangedSomething = engine.update(plotter.viewport, instantZoom, Parameters.depth, Parameters.balance, Parameters.colorVariation);
        if (updatedChangedSomething || instantZoom.isNotNull()) {
            needToRedraw = true;
        }

        if (needToRedraw && plotter.isReady) {
            plotter.resizeCanvas();
            engine.draw(plotter, Parameters.scaling);
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
