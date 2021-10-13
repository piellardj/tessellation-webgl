import { GeometryId } from "../../../plotter/geometry-id";
import { IVboBuffer, IVboPart } from "../../../plotter/plotter-webgl-basic";
import { addListenerToWorker, EVerb, sendMessageFromWorker } from "../message";


const verb = EVerb.NEW_GEOMETRY;

interface IMessageData {
    readonly polygonsVboBuffer: IVboBuffer;
    readonly linesVboBuffer: IVboBuffer;
}

function sendMessage(polygonsVboBuffer: IVboBuffer, linesVboBuffer: IVboBuffer): void {
    const messageData: IMessageData = {
        polygonsVboBuffer,
        linesVboBuffer,
    };

    sendMessageFromWorker(verb, messageData);
}

function rehydrateVboBuffer(vboBuffer: IVboBuffer): IVboBuffer {
    const bufferParts: IVboPart[] = [];
    for (const dehydratedBufferPart of vboBuffer.bufferParts) {
        bufferParts.push({
            indexOfFirstVertice: dehydratedBufferPart.indexOfFirstVertice,
            verticesCount: dehydratedBufferPart.verticesCount,
            geometryId: GeometryId.rehydrate(dehydratedBufferPart.geometryId),
        });
    }

    return {
        buffer: vboBuffer.buffer,
        bufferParts,
    };
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

