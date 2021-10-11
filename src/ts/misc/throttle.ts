class Throttle {
    private lastRunTimestamp: number;

    public constructor(private readonly minimumDistanceBetweenRuns: number) {
        this.reset();
    }

    public reset(): void {
        this.lastRunTimestamp = performance.now();
    }

    public runIfAvailable(operation: () => unknown): void {
        const now = performance.now();
        if (now - this.lastRunTimestamp > this.minimumDistanceBetweenRuns) {
            operation();
            this.lastRunTimestamp = now;
        }
    }
}

export {
    Throttle,
};
