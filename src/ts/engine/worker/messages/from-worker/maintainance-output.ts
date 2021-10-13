import { Zoom } from "../../../../misc/zoom";
import { IVboBuffer } from "../../../../plotter/plotter-webgl-basic";
import { rehydrateVboBuffer } from "../../../../plotter/vbo-types";
import { addListenerToWorker, EVerb, sendMessageFromWorker } from "../message";


const verb = EVerb.MAINTAINANCE_OUTPUT;

interface IMessageData {
    readonly polygonsVboBuffer: IVboBuffer;
    readonly linesVboBuffer: IVboBuffer;
    readonly appliedZoom: Zoom;
}

function sendMessage(polygonsVboBuffer: IVboBuffer, linesVboBuffer: IVboBuffer, appliedZoom: Zoom): void {
    const messageData: IMessageData = {
        polygonsVboBuffer,
        linesVboBuffer,
        appliedZoom,
    };

    const transfer: ArrayBuffer[] = [
        polygonsVboBuffer.buffer.buffer,
        linesVboBuffer.buffer.buffer,
    ];
    sendMessageFromWorker(verb, messageData, transfer);
}

function addListener(worker: Worker, listener: (polygonsVboBuffer: IVboBuffer, linesVboBuffer: IVboBuffer, appliedZoom: Zoom) => unknown): void {
    addListenerToWorker(worker, verb, (data: IMessageData) => {
        const polygonsVboBuffer = rehydrateVboBuffer(data.polygonsVboBuffer);
        const linesVboBuffer = rehydrateVboBuffer(data.linesVboBuffer);
        const appliedZoom = Zoom.rehydrate(data.appliedZoom);
        listener(polygonsVboBuffer, linesVboBuffer, appliedZoom);
    });
}

export {
    addListener,
    sendMessage,
};

