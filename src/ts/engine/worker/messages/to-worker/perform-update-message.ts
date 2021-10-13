import { Rectangle } from "../../../../misc/rectangle";
import { Zoom } from "../../../../misc/zoom";
import { addListenerFromWorker, EVerb, sendMessageToWorker } from "../message";


const verb = EVerb.PERFORM_UPDATE;

interface IMessageData {
    readonly zoomToApply: Zoom;
    readonly viewport: Rectangle;
    readonly wantedDepth: number;
    readonly subdivisionBalance: number;
    readonly colorVariation: number;
}

function sendMessage(worker: Worker, zoomToApply: Zoom, viewport: Rectangle, wantedDepth: number, subdivisionBalance: number, colorVariation: number): void {
    const messageData: IMessageData = {
        zoomToApply,
        viewport,
        wantedDepth,
        subdivisionBalance,
        colorVariation,
    };

    sendMessageToWorker(worker, verb, messageData);
}

function addListener(listener: (zoomToApply: Zoom, viewport: Rectangle, wantedDepth: number, subdivisionBalance: number, colorVariation: number) => unknown): void {
    addListenerFromWorker(verb, (data: IMessageData) => {
        const viewport = Rectangle.rehydrate(data.viewport);
        const zoomToApply = Zoom.rehydrate(data.zoomToApply);

        listener(zoomToApply, viewport, data.wantedDepth, data.subdivisionBalance, data.colorVariation);
    });
}

export {
    addListener,
    sendMessage,
};

