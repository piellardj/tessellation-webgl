import { EPlotter, Parameters } from "../parameters";
import { PlotterCanvas } from "../plotter/plotter-canvas";
import { PlotterCanvas2D } from "../plotter/plotter-canvas-2d";
import { IPlotter } from "../plotter/plotter-interface";
import { PlotterWebGL } from "../plotter/plotter-webgl";
import { TestEngine } from "./test-engine";


function createPlotter(): PlotterCanvas & IPlotter {
    if (Parameters.plotter === EPlotter.CANVAS2D) {
        return new PlotterCanvas2D();
    } else {
        return new PlotterWebGL();
    }
}

function main(): void {
    const plotter = createPlotter();
    const testEngine = new TestEngine();

    Parameters.resetObservers.push(() => {
        plotter.resizeCanvas();
        testEngine.reset();
    });

    function mainLoop(): void {
        testEngine.update();

        if (plotter.isReady) {
            plotter.resizeCanvas();
            testEngine.draw(plotter);
        }

        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

export {
    main,
};
