import { addListenerFromWorker, EVerb, sendMessageToWorker } from "../message";


const verb = EVerb.RECOMPUTE_COLORS;

interface IMessageData  {
    readonly colorVariation: number;
}

function sendMessage(worker: Worker, colorVariation: number): void {
    const messageData: IMessageData = {
        colorVariation,
    };

   sendMessageToWorker(worker, verb, messageData);
}

function addListener(listener: (colorVariation: number) => unknown): void {
    addListenerFromWorker(verb, (data: IMessageData) => {
        listener(data.colorVariation);
    });
}

export {
    addListener,
    sendMessage,
};

