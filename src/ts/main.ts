import { Engine } from "./engine";
import { Parameters } from "./parameters";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";

import "./page-interface-generated";


function main(): void {
    const plotter = new PlotterCanvas2D();
    const engine = new Engine();

    Parameters.resetObservers.push(() => { engine.reset(plotter.width, plotter.height); });
    Parameters.recomputeColorsObservers.push(() => { engine.recomputeColors(); });

    function mainLoop(): void {
        engine.update();
        engine.draw(plotter);

        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

main();
