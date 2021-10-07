import "../page-interface-generated";


class FrametimeMonitor {
    private lastIndicatorsUpdateTimestamp: number;

    private nbFrameSinceLastIndicatorsUpdate: number;
    private maxFrametime: number;

    public constructor() {
        this.reset();
    }

    private reset(): void {
        this.nbFrameSinceLastIndicatorsUpdate = 0;
        this.lastIndicatorsUpdateTimestamp = performance.now();
    }

    public registerFrameTime(frametime: number): void {
        if (this.nbFrameSinceLastIndicatorsUpdate === 0) {
            this.maxFrametime = frametime;
        } else if (frametime > this.maxFrametime) {
            this.maxFrametime = frametime;
        }

        this.nbFrameSinceLastIndicatorsUpdate++;
    }

    public updateIndicators(): void {
        const now = performance.now();
        const timespanSinceLastUpdate = now - this.lastIndicatorsUpdateTimestamp;
        this.lastIndicatorsUpdateTimestamp = now;

        if (this.nbFrameSinceLastIndicatorsUpdate > 0) {
            const averageFrametime = timespanSinceLastUpdate / this.nbFrameSinceLastIndicatorsUpdate;

            Page.Canvas.setIndicatorText("average-frame-time", FrametimeMonitor.frametimeToString(averageFrametime));
            Page.Canvas.setIndicatorText("max-frame-time",  FrametimeMonitor.frametimeToString(this.maxFrametime));

            this.reset();
        }
    }

    private static frametimeToString(frametime: number): string {
        const shortenedFrametime = frametime.toFixed(0);
        const shortenedFps = (1000 / frametime).toFixed(0);

        return `${shortenedFrametime} ms (${shortenedFps} fps)`;
    }
}

export {
    FrametimeMonitor,
};
