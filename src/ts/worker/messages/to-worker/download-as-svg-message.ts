import { Color } from "../../../misc/color";
import { addListenerFromWorker, EVerb, sendMessageToWorker } from "../message";


const verb = EVerb.DOWNLOAD_AS_SVG;

interface IMessageData {
    readonly width: number;
    readonly height: number;
    readonly scaling: number;
    readonly backgroundColor: Color;
    readonly linesColor?: Color;
}

function sendMessage(worker: Worker, width: number, height: number, scaling: number, backgroundColor: Color, linesColor?: Color): void {
    const messageData: IMessageData = {
        width,
        height,
        scaling,
        backgroundColor,
        linesColor,
    };

    sendMessageToWorker(worker, verb, messageData);
}

function addListener(listener: (width: number, height: number, scaling: number, backgroundColor: Color, linesColor?: Color) => unknown): void {
    addListenerFromWorker(verb, (data: IMessageData) => {
        const backgroundColor = Color.rehydrate(data.backgroundColor);
        let linesColor;
        if (data.linesColor) {
            linesColor = Color.rehydrate(data.linesColor);
        }
        listener(data.width, data.height,  data.scaling, backgroundColor, linesColor);
    });
}

export {
    addListener,
    sendMessage,
};

