import { Rectangle } from "../../../misc/rectangle";
import { Zoom } from "../../../misc/zoom";
import { addListenerFromWorker, EVerb, sendMessageToWorker } from "../message";


const verb = EVerb.UPDATE;

interface IMessageData {
    readonly viewport: Rectangle;
    readonly instantZoom: Zoom;
    readonly wantedDepth: number;
    readonly subdivisionBalance: number;
    readonly colorVariation: number;
}

function sendMessage(worker: Worker, viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number): void {
    const messageData: IMessageData = {
        viewport,
        instantZoom,
        wantedDepth,
        subdivisionBalance,
        colorVariation,
    };

    sendMessageToWorker(worker, verb, messageData);
}

function addListener(listener: (viewport: Rectangle, instantZoom: Zoom, wantedDepth: number, subdivisionBalance: number, colorVariation: number) => unknown): void {
    addListenerFromWorker(verb, (data: IMessageData) => {
        const viewport = Rectangle.rehydrate(data.viewport);
        const instantZoom = Zoom.rehydrate(data.instantZoom);

        listener(viewport, instantZoom, data.wantedDepth, data.subdivisionBalance, data.colorVariation);
    });
}

export {
    addListener,
    sendMessage,
};

