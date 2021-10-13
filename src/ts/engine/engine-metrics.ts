interface IEngineMetrics {
    treeDepth: number;
    lastLayerPrimitivesCount: number;
    totalPrimitivesCount: number;
    segmentsCount: number;
}

function updateEngineMetricsIndicators(metrics: IEngineMetrics): void {
    Page.Canvas.setIndicatorText("tree-depth", metrics.treeDepth.toString());
    Page.Canvas.setIndicatorText("primitives-count", metrics.lastLayerPrimitivesCount.toString());
    Page.Canvas.setIndicatorText("tree-nodes-count", metrics.totalPrimitivesCount.toString());
    Page.Canvas.setIndicatorText("segments-count", metrics.segmentsCount.toString());
}

export {
    IEngineMetrics,
    updateEngineMetricsIndicators,
};

