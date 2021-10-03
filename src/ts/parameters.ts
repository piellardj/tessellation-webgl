import { Color } from "./misc/color";
import { IPoint } from "./misc/point";
import "./page-interface-generated";


/* === IDs ============================================================ */
const controlId = {
    PRIMITIVE_TABS_ID: "primitive-tabs-id",
    DEPTH_RANGE_ID: "depth-range-id",
    BALANCE_RANGE_ID: "balance-range-id",
    COLOR_VARIATION_RANGE_ID: "color-variation-range-id",
    ZOOMING_SPEED_RANGE_ID: "zooming-speed-range-id",
    RESET_BUTTON_ID: "reset-button-id",
    DISPLAY_LINES_CHECKBOX_ID: "display-lines-checkbox-id",
    THICKNESS_RANGE_ID: "thickness-range-id",
    LINES_COLOR_PICKER_ID: "lines-color-picker-id",
};

enum EPrimitive {
    QUADS = "quads",
    TRIANGLES = "triangles",
}

type Observer = () => unknown;

function hasUrlParameter(parameter: string): boolean {
    if (typeof URLSearchParams !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.has(parameter);
    }
    return false;
}

abstract class Parameters {
    public static readonly resetObservers: Observer[] = [];
    public static readonly recomputeColorsObservers: Observer[] = [];
    public static readonly redrawObservers: Observer[] = [];
    public static readonly debugMode: boolean = hasUrlParameter("debug");

    public static get primitive(): EPrimitive {
        return Page.Tabs.getValues(controlId.PRIMITIVE_TABS_ID)[0] as EPrimitive;
    }

    public static get depth(): number {
        return Page.Range.getValue(controlId.DEPTH_RANGE_ID);
    }

    public static get balance(): number {
        return Page.Range.getValue(controlId.BALANCE_RANGE_ID);
    }

    public static get colorVariation(): number {
        return 255 * Page.Range.getValue(controlId.COLOR_VARIATION_RANGE_ID);
    }

    public static get zoomingSpeed(): number {
        return Page.Range.getValue(controlId.ZOOMING_SPEED_RANGE_ID);
    }

    public static get displayLines(): boolean {
        return Page.Checkbox.isChecked(controlId.DISPLAY_LINES_CHECKBOX_ID);
    }

    public static get thickness(): number {
        return Page.Range.getValue(controlId.THICKNESS_RANGE_ID);
    }

    public static get linesColor(): Color {
        const color = Page.ColorPicker.getValue(controlId.LINES_COLOR_PICKER_ID);
        return new Color(color.r, color.g, color.b);
    }

    public static get mousePositionInPixels(): IPoint {
        const canvasSize = Page.Canvas.getSize();
        const mousePosition = Page.Canvas.getMousePosition();
        return {
            x: canvasSize[0] * mousePosition[0],
            y: canvasSize[1] * mousePosition[1],
        };
    }
}

function callObservers(observers: Observer[]): void {
    for (const observer of observers) {
        observer();
    }
}

const callRedraw = () => { callObservers(Parameters.redrawObservers); };
const callReset = () => {
    callObservers(Parameters.resetObservers);
    callRedraw();
};

Page.Range.addObserver(controlId.BALANCE_RANGE_ID, callReset);
Page.Button.addObserver(controlId.RESET_BUTTON_ID, callReset);
Page.Canvas.Observers.canvasResize.push(callReset);
Page.Tabs.addObserver(controlId.PRIMITIVE_TABS_ID, callReset);

Page.Range.addObserver(controlId.COLOR_VARIATION_RANGE_ID, () => {
    callObservers(Parameters.recomputeColorsObservers);
    callRedraw();
});

Page.Checkbox.addObserver(controlId.DISPLAY_LINES_CHECKBOX_ID, callRedraw);
Page.Canvas.Observers.canvasResize.push(callRedraw);
Page.Range.addObserver(controlId.THICKNESS_RANGE_ID, callRedraw);
Page.ColorPicker.addObserver(controlId.LINES_COLOR_PICKER_ID, callRedraw);

export {
    EPrimitive,
    Parameters,
};
