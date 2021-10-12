import { Engine } from "../engine/engine";
import { NewMetrics } from "./messages/from-worker/messages";


class WorkerEngine extends Engine {
    protected updateIndicators(): void {
        const metrics = this.computeMetrics();
        NewMetrics.sendMessage(metrics);
    }
}

export {
    WorkerEngine,
};

