import { Rectangle } from "../misc/rectangle";
import { EPrimitiveType } from "../primitives/primitive-type-enum";
import { WorkerEngine } from "./worker-engine";


const engine = new WorkerEngine();

MessagesFromMain.Reset.addListener((viewport: Rectangle, primitiveType: EPrimitiveType) => {
    engine.reset(viewport, primitiveType);
});

