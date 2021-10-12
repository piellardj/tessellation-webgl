enum EVerb {
    RESET = "reset",
    RECOMPUTE_COLORS = "recopute-colors",
    DOWNLOAD_AS_SVG = "download-svg",
    UPDATE = "update",
    NEW_METRICS = "new-metrics",
    NEW_SVG_OUTPUT = "new-svg-output",
}

interface IMessageData<TData> {
    verb: EVerb;
    data: TData;
}

function sendMessage<TData>(target: any, verb: EVerb, data: TData): void {
    const messageData: IMessageData<TData> = {
        verb,
        data,
    };
    target.postMessage(messageData);
}

function addListener<TData>(context: any, verb: EVerb, callback: (data: TData) => unknown): void {
    context.addEventListener("message", (event: MessageEvent) => {
        if (event && event.data.verb === verb) {
            callback(event.data.data);
        }
    });
}

function sendMessageToWorker<TData>(worker: Worker, verb: EVerb, data: TData): void {
    sendMessage<TData>(worker, verb, data);
}
function addListenerToWorker<TData>(worker: Worker, verb: EVerb, callback: (data: TData) => unknown): void {
    addListener<TData>(worker, verb, callback);
}

function sendMessageFromWorker<TData>(verb: EVerb, data: TData): void {
    sendMessage<TData>(self, verb, data);
}
function addListenerFromWorker<TData>(verb: EVerb, callback: (data: TData) => unknown): void {
    addListener<TData>(self as any, verb, callback);
}

export {
    addListenerFromWorker,
    addListenerToWorker,
    EVerb,
    sendMessageFromWorker,
    sendMessageToWorker,
};

