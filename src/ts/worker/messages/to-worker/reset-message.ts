import { Rectangle } from "../../../misc/rectangle";
import { EPrimitiveType } from "../../../primitives/primitive-type-enum";
import { addListenerFromWorker, EVerb, sendMessageToWorker } from "../message";


const verb = EVerb.RESET;

interface IMessageData {
    readonly viewport: Rectangle;
    readonly primitiveType: EPrimitiveType;
}

function sendMessage(worker: Worker, viewport: Rectangle, primitiveType: EPrimitiveType): void {
    const messageData: IMessageData = {
        viewport,
        primitiveType,
    };

    sendMessageToWorker(worker, verb, messageData);
}

function addListener(listener: (viewport: Rectangle, primitiveType: EPrimitiveType) => unknown): void {
    addListenerFromWorker(verb, (data: IMessageData) => {
        const viewport = Rectangle.rehydrate(data.viewport);
        listener(viewport, data.primitiveType);
    });
}

export {
    addListener,
    sendMessage,
};

