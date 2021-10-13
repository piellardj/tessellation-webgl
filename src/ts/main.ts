import { IEngine } from "./engine/engine-interface";
import { EngineMonothreaded } from "./engine/engine-monothreaded";
import { EngineMultithreaded } from "./engine/engine-multithreaded";
import { Color } from "./misc/color";
import { FrametimeMonitor } from "./misc/frame-time-monitor";
import { IPoint } from "./misc/point";
import { Zoom } from "./misc/zoom";
import { EPlotter, Parameters } from "./parameters";
import { PlotterCanvas } from "./plotter/plotter-canvas";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { PlotterWebGL } from "./plotter/plotter-webgl";
import { PlotterWebGLBasic } from "./plotter/plotter-webgl-basic";
import * as Testing from "./testing/main-testing";

import "./page-interface-generated";


function main<TPlotter extends PlotterCanvas>(engine: IEngine<TPlotter>, plotter: TPlotter): void {
    const backgroundColor = Color.BLACK;

    function linesColor(): Color | undefined {
        if (Parameters.displayLines) {
            return Parameters.linesColor;
        }
        return undefined;
    }

    Parameters.recomputeColorsObservers.push(() => {
        engine.recomputeColors(Parameters.colorVariation);
    });

    Parameters.downloadObservers.push(() => {
        engine.downloadAsSvg(plotter.width, plotter.height, Parameters.scaling, backgroundColor, linesColor());
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
            engine.draw(plotter, Parameters.scaling, backgroundColor, linesColor());
            needToRedraw = false;
        }

        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

if (Parameters.debugMode) {
    Testing.main();
} else {
    if (Parameters.multithreaded) {
        if (!EngineMultithreaded.isSupported) {
            Page.Demopage.setErrorMessage("worker-not-supported", "Your browser does not the multithreaded mode because it does not support Web Workers.");
        }

        const engine = new EngineMultithreaded();
        const plotter = new PlotterWebGLBasic();
        main<typeof plotter>(engine, plotter);
    } else {
        const engine = new EngineMonothreaded();
        if (Parameters.plotter === EPlotter.CANVAS2D) {
            const plotter = new PlotterCanvas2D();
            main<typeof plotter>(engine, plotter);
        } else {
            const plotter = new PlotterWebGL();
            main<typeof plotter>(engine, plotter);
        }
    }

    Page.Canvas.setIndicatorText("multithreaded", Parameters.multithreaded ? "yes" : "no");
}
