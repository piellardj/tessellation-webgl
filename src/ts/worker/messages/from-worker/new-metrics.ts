import { IEngineMetrics } from "../../../engine/engine-metrics";
import { addListenerToWorker, EVerb, sendMessageFromWorker } from "../message";


const verb = EVerb.NEW_METRICS;

interface IMessageData {
    readonly engineMetrics: IEngineMetrics;
}

function sendMessage(engineMetrics: IEngineMetrics): void {
    const messageData: IMessageData = {
        engineMetrics,
    };

    sendMessageFromWorker(verb, messageData);
}

function addListener(worker: Worker, listener: (engineMetrics: IEngineMetrics) => unknown): void {
    addListenerToWorker(worker, verb, (data: IMessageData) => {
        listener(data.engineMetrics);
    });
}

export {
    addListener,
    sendMessage,
};
