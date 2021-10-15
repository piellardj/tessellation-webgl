import { Zoom } from "../../../../misc/zoom";
import { addListenerToWorker, EVerb, sendMessageFromWorker } from "../message";


const verb = EVerb.PERFORM_UPDATE_NO_OUTPUT;

interface IMessageData {
    readonly appliedZoom: Zoom;
}

function sendMessage(appliedZoom: Zoom): void {
    const messageData: IMessageData = {
        appliedZoom,
    };
    sendMessageFromWorker(verb, messageData);
}

function addListener(worker: Worker, listener: (appliedZoom: Zoom) => unknown): void {
    addListenerToWorker(worker, verb, (data: IMessageData) => {
        const appliedZoom = Zoom.rehydrate(data.appliedZoom);
        listener(appliedZoom);
    });
}

export {
    addListener,
    sendMessage,
};

