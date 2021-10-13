import { IVboBuffer } from "../../../plotter/plotter-webgl-basic";
import { rehydrateVboBuffer } from "../../../plotter/vbo-types";
import { addListenerToWorker, EVerb, sendMessageFromWorker } from "../message";


const verb = EVerb.RESET_OUTPUT;

interface IMessageData {
    readonly polygonsVboBuffer: IVboBuffer;
    readonly linesVboBuffer: IVboBuffer;
}

function sendMessage(polygonsVboBuffer: IVboBuffer, linesVboBuffer: IVboBuffer): void {
    const messageData: IMessageData = {
        polygonsVboBuffer,
        linesVboBuffer,
    };

    const transfer: ArrayBuffer[] = [
        polygonsVboBuffer.buffer.buffer,
        linesVboBuffer.buffer.buffer,
    ];
    sendMessageFromWorker(verb, messageData, transfer);
}

function addListener(worker: Worker, listener: (polygonsVboBuffer: IVboBuffer, linesVboBuffer: IVboBuffer) => unknown): void {
    addListenerToWorker(worker, verb, (data: IMessageData) => {
        const polygonsVboBuffer = rehydrateVboBuffer(data.polygonsVboBuffer);
        const linesVboBuffer = rehydrateVboBuffer(data.linesVboBuffer);
        listener(polygonsVboBuffer, linesVboBuffer);
    });
}

export {
    addListener,
    sendMessage,
};

