import "./page-interface-generated";


/* === IDs ============================================================ */
const controlId = {
    DEPTH_RANGE_ID: "depth-range-id",
    BALANCE_RANGE_ID: "balance-range-id",
};

type Observer = () => unknown;

abstract class Parameters {
    public static readonly resetObservers: Observer[] = [];

    public static get depth(): number {
        return Page.Range.getValue(controlId.DEPTH_RANGE_ID);
    }

    public static get balance(): number {
        return Page.Range.getValue(controlId.BALANCE_RANGE_ID);
    }
}

function callResetObservers(): void {
    for (const observer of Parameters.resetObservers) {
        observer();
    }
}

Page.Range.addObserver(controlId.DEPTH_RANGE_ID, callResetObservers);
Page.Range.addObserver(controlId.BALANCE_RANGE_ID, callResetObservers);

export {
    Parameters,
};

