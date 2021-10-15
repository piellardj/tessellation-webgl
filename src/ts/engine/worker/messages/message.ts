enum EVerb {
    RESET = "reset",
    RESET_OUTPUT = "reset-output",
    RECOMPUTE_COLORS = "recopute-colors",
    RECOMPUTE_COLORS_OUTPUT = "recompute-colors-output",
    DOWNLOAD_AS_SVG = "download-svg",
    DOWNLOAD_AS_SVG_OUTPUT = "download-as-svg-output",
    PERFORM_UPDATE = "perform-update",
    PERFORM_UPDATE_OUTPUT = "perform-update-output",
    PERFORM_UPDATE_NO_OUTPUT = "perform-update-no-output",
    NEW_METRICS = "new-metrics",
}

interface IMessageData<TData> {
    verb: EVerb;
    data: TData;
}

function sendMessage<TData>(target: any, verb: EVerb, data: TData, transfer?: Transferable[]): void {
    const messageData: IMessageData<TData> = {
        verb,
        data,
    };
    target.postMessage(messageData, transfer);
}

function addListener<TData>(context: any, verb: EVerb, callback: (data: TData) => unknown): void {
    context.addEventListener("message", (event: MessageEvent) => {
        if (event && event.data.verb === verb) {
            callback(event.data.data);
        }
    });
}

const nowAttributeName = "performanceNow";
let emulatePerformanceNow = false;
if (typeof self.performance === "undefined" || typeof self.performance.now !== "function") {
    console.log("Worker doesn't support performance.now()... Emulating it."); // IE11
    emulatePerformanceNow = true;
    (self as any).performance = {
        now: () => 0,
    };
}

function sendMessageToWorker<TData>(worker: Worker, verb: EVerb, data: TData): void {
    if (emulatePerformanceNow) {
        (data as any)[nowAttributeName] = performance.now(); // send to the worker the now() of the main thread
    }
    sendMessage<TData>(worker, verb, data);
}
function addListenerToWorker<TData>(worker: Worker, verb: EVerb, callback: (data: TData) => unknown): void {
    addListener<TData>(worker, verb, callback);
}

function sendMessageFromWorker<TData>(verb: EVerb, data: TData, transfer?: Transferable[]): void {
    sendMessage<TData>(self, verb, data, transfer);
}
function addListenerFromWorker<TData>(verb: EVerb, callback: (data: TData) => unknown): void {
    if (emulatePerformanceNow) {
        const callbackWrapper = (data: TData) => {
            const performanceNow = (data as any)[nowAttributeName]; // read from the worker the now() sent by the main thread
            (self as any).performance.now = () => performanceNow;
            callback(data);
        };
        addListener<TData>(self as any, verb, callbackWrapper);
    } else {
        addListener<TData>(self as any, verb, callback);
    }
}

export {
    addListenerFromWorker,
    addListenerToWorker,
    EVerb,
    sendMessageFromWorker,
    sendMessageToWorker,
};

