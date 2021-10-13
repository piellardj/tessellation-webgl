import { addListenerToWorker, EVerb, sendMessageFromWorker } from "../message";


const verb = EVerb.DOWNLOAD_AS_SVG_OUTPUT;

interface IMessageData {
    readonly output: string;
}

function sendMessage(output: string): void {
    const messageData: IMessageData = {
        output,
    };

    sendMessageFromWorker(verb, messageData);
}

function addListener(worker: Worker, listener: (output: string) => unknown): void {
    addListenerToWorker(worker, verb, (data: IMessageData) => {
        listener(data.output);
    });
}

export {
    addListener,
    sendMessage,
};

