import "./page-interface-generated";


/* === IDs ============================================================ */
const controlId = {
    DEPTH_RANGE_ID: "depth-range-id",
    BALANCE_RANGE_ID: "balance-range-id",
    THICKNESS_RANGE_ID: "thickness-range-id",
    COLOR_VARIATION_RANGE_ID: "color-variation-range-id",
};

type Observer = () => unknown;

abstract class Parameters {
    public static readonly resetObservers: Observer[] = [];
    public static readonly redrawObservers: Observer[] = [];

    public static get depth(): number {
        return Page.Range.getValue(controlId.DEPTH_RANGE_ID);
    }

    public static get balance(): number {
        return Page.Range.getValue(controlId.BALANCE_RANGE_ID);
    }

    public static get thickness(): number {
        return Page.Range.getValue(controlId.THICKNESS_RANGE_ID);
    }

    public static get colorVariation(): number {
        return Page.Range.getValue(controlId.COLOR_VARIATION_RANGE_ID);
    }
}

function callResetObservers(): void {
    for (const observer of Parameters.resetObservers) {
        observer();
    }
}

function callRedrawObservers(): void {
    for (const observer of Parameters.redrawObservers) {
        observer();
    }
}

Page.Range.addObserver(controlId.DEPTH_RANGE_ID, callResetObservers);
Page.Range.addObserver(controlId.BALANCE_RANGE_ID, callResetObservers);
Page.Range.addObserver(controlId.COLOR_VARIATION_RANGE_ID, callResetObservers);

Page.Range.addObserver(controlId.THICKNESS_RANGE_ID, callRedrawObservers);

export {
    Parameters,
};

