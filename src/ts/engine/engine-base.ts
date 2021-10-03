import { Rectangle } from "../misc/rectangle";
import { Zooming } from "../misc/zooming";
import { PlotterBase } from "../plotter/plotter-base";

abstract class EngineBase {
    public abstract update(viewport: Rectangle, zooming: Zooming): boolean;
    public abstract draw(plotter: PlotterBase): void;
    public abstract reset(viewport: Rectangle): void;
}

export {
    EngineBase,
};
