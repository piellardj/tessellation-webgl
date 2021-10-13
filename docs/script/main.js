/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/ts/engine/engine-metrics.ts":
/*!*****************************************!*\
  !*** ./src/ts/engine/engine-metrics.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.updateEngineMetricsIndicators = void 0;
function updateEngineMetricsIndicators(metrics) {
    Page.Canvas.setIndicatorText("tree-depth", metrics.treeDepth.toString());
    Page.Canvas.setIndicatorText("primitives-count", metrics.lastLayerPrimitivesCount.toString());
    Page.Canvas.setIndicatorText("tree-nodes-count", metrics.totalPrimitivesCount.toString());
    Page.Canvas.setIndicatorText("segments-count", metrics.segmentsCount.toString());
}
exports.updateEngineMetricsIndicators = updateEngineMetricsIndicators;


/***/ }),

/***/ "./src/ts/engine/engine-monothreaded.ts":
/*!**********************************************!*\
  !*** ./src/ts/engine/engine-monothreaded.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EngineMonothreaded = void 0;
var web_1 = __webpack_require__(/*! ../misc/web */ "./src/ts/misc/web.ts");
var parameters_1 = __webpack_require__(/*! ../parameters */ "./src/ts/parameters.ts");
var plotter_svg_1 = __webpack_require__(/*! ../plotter/plotter-svg */ "./src/ts/plotter/plotter-svg.ts");
var engine_1 = __webpack_require__(/*! ./engine */ "./src/ts/engine/engine.ts");
var engine_metrics_1 = __webpack_require__(/*! ./engine-metrics */ "./src/ts/engine/engine-metrics.ts");
var EngineMonothreaded = (function (_super) {
    __extends(EngineMonothreaded, _super);
    function EngineMonothreaded() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EngineMonothreaded.prototype.draw = function (plotter, scaling, backgroundColor, linesColor) {
        if (this.layers.length < 1) {
            return;
        }
        var lastSolidLayer = this.layers.length - 1;
        var emergingLayerAlpha = 0;
        if (parameters_1.Parameters.blending && this.layers.length > 1) {
            if (parameters_1.Parameters.zoomingSpeed > 0) {
                var emergingTimeOfLastLayer = 1000 / Math.pow((1 + parameters_1.Parameters.zoomingSpeed), 2);
                var lastLayer = this.layers[this.layers.length - 1];
                var ageOfLastLayer = performance.now() - lastLayer.birthTimestamp;
                if (ageOfLastLayer < emergingTimeOfLastLayer) {
                    lastSolidLayer--;
                    emergingLayerAlpha = ageOfLastLayer / emergingTimeOfLastLayer;
                }
            }
        }
        var emergingLayer = lastSolidLayer + 1;
        plotter.initialize(backgroundColor, this.cumulatedZoom, scaling);
        plotter.drawPolygons(this.layers[lastSolidLayer].primitives, 1);
        if (emergingLayer < this.layers.length) {
            plotter.drawPolygons(this.layers[emergingLayer].primitives, emergingLayerAlpha);
        }
        if (linesColor) {
            for (var iLayer = 0; iLayer < this.layers.length; iLayer++) {
                var thickness = EngineMonothreaded.getLineThicknessForLayer(iLayer, this.layers.length);
                var alpha = (iLayer === emergingLayer) ? emergingLayerAlpha : 1;
                plotter.drawLines(this.layers[iLayer].outlines, thickness, linesColor, alpha);
            }
        }
        plotter.finalize();
    };
    EngineMonothreaded.prototype.downloadAsSvg = function (width, height, scaling, backgroundColor, linesColor) {
        var svgPlotter = new plotter_svg_1.PlotterSVG(width, height);
        this.draw(svgPlotter, scaling, backgroundColor, linesColor);
        var svgString = svgPlotter.output();
        web_1.downloadSvgOutput(svgString);
    };
    EngineMonothreaded.prototype.onGeometryChange = function () {
        this.updateIndicators();
    };
    EngineMonothreaded.prototype.updateIndicators = function () {
        var metrics = this.computeMetrics();
        engine_metrics_1.updateEngineMetricsIndicators(metrics);
    };
    EngineMonothreaded.getLineThicknessForLayer = function (layerId, totalLayersCount) {
        var variablePart = 0;
        if (layerId > 0) {
            variablePart = parameters_1.Parameters.thickness * (totalLayersCount - 1 - layerId) / (totalLayersCount - 1);
        }
        return 1 + variablePart;
    };
    return EngineMonothreaded;
}(engine_1.Engine));
exports.EngineMonothreaded = EngineMonothreaded;


/***/ }),

/***/ "./src/ts/engine/engine-multithreaded.ts":
/*!***********************************************!*\
  !*** ./src/ts/engine/engine-multithreaded.ts ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EngineMultithreaded = void 0;
var web_1 = __webpack_require__(/*! ../misc/web */ "./src/ts/misc/web.ts");
var zoom_1 = __webpack_require__(/*! ../misc/zoom */ "./src/ts/misc/zoom.ts");
var MessagesFromWorker = __importStar(__webpack_require__(/*! ../worker/messages/from-worker/messages */ "./src/ts/worker/messages/from-worker/messages.ts"));
var MessagesToWorker = __importStar(__webpack_require__(/*! ../worker/messages/to-worker/messages */ "./src/ts/worker/messages/to-worker/messages.ts"));
var engine_metrics_1 = __webpack_require__(/*! ./engine-metrics */ "./src/ts/engine/engine-metrics.ts");
__webpack_require__(/*! ../page-interface-generated */ "./src/ts/page-interface-generated.ts");
var EngineMultithreaded = (function () {
    function EngineMultithreaded() {
        var _this = this;
        this.hasSomethingNewToDraw = true;
        this.worker = new Worker("script/worker.js?v=" + Page.version);
        MessagesFromWorker.NewMetrics.addListener(this.worker, function (engineMetrics) {
            engine_metrics_1.updateEngineMetricsIndicators(engineMetrics);
        });
        MessagesFromWorker.NewSvgOutput.addListener(this.worker, function (output) {
            web_1.downloadSvgOutput(output);
        });
        MessagesFromWorker.NewGeometry.addListener(this.worker, function (polygonsVboBuffer, linesVboBuffer) {
            _this.cumulatedZoom = zoom_1.Zoom.noZoom();
            _this.polygonsVboBuffer = polygonsVboBuffer;
            _this.linesVboBuffer = linesVboBuffer;
            _this.hasSomethingNewToDraw = true;
        });
        this.cumulatedZoom = zoom_1.Zoom.noZoom();
    }
    EngineMultithreaded.prototype.update = function (viewport, instantZoom, wantedDepth, subdivisionBalance, colorVariation) {
        this.cumulatedZoom = zoom_1.Zoom.multiply(instantZoom, this.cumulatedZoom);
        MessagesToWorker.Update.sendMessage(this.worker, viewport, instantZoom, wantedDepth, subdivisionBalance, colorVariation);
        return this.hasSomethingNewToDraw;
    };
    EngineMultithreaded.prototype.draw = function (plotter, scaling, backgroundColor, linesColor) {
        this.hasSomethingNewToDraw = false;
        plotter.initialize(backgroundColor, this.cumulatedZoom, scaling);
        if (this.polygonsVboBuffer) {
            var needToReupload = false;
            for (var _i = 0, _a = this.polygonsVboBuffer.bufferParts; _i < _a.length; _i++) {
                var polygonsVboPart = _a[_i];
                if (!plotter.registerPolygonsVboPartForDrawing(polygonsVboPart.geometryId, 1)) {
                    needToReupload = true;
                }
            }
            if (needToReupload) {
                plotter.uploadPolygonsVbo(this.polygonsVboBuffer);
                for (var _b = 0, _c = this.polygonsVboBuffer.bufferParts; _b < _c.length; _b++) {
                    var polygonsVboPart = _c[_b];
                    plotter.registerPolygonsVboPartForDrawing(polygonsVboPart.geometryId, 1);
                }
            }
        }
        if (this.linesVboBuffer && linesColor) {
            var needToReupload = false;
            for (var _d = 0, _e = this.linesVboBuffer.bufferParts; _d < _e.length; _d++) {
                var linesVboPart = _e[_d];
                if (!plotter.registerLinesVboPartForDrawing(linesVboPart.geometryId, linesColor, 1)) {
                    needToReupload = true;
                }
            }
            if (needToReupload) {
                plotter.uploadLinesVbo(this.linesVboBuffer);
                for (var _f = 0, _g = this.linesVboBuffer.bufferParts; _f < _g.length; _f++) {
                    var linesVboPart = _g[_f];
                    plotter.registerLinesVboPartForDrawing(linesVboPart.geometryId, linesColor, 1);
                }
            }
        }
        plotter.finalize();
    };
    EngineMultithreaded.prototype.reset = function (viewport, primitiveType) {
        MessagesToWorker.Reset.sendMessage(this.worker, viewport, primitiveType);
    };
    EngineMultithreaded.prototype.recomputeColors = function (colorVariation) {
        MessagesToWorker.RecomputeColors.sendMessage(this.worker, colorVariation);
    };
    EngineMultithreaded.prototype.downloadAsSvg = function (width, height, scaling, backgroundColor, linesColor) {
        MessagesToWorker.DownloadAsSvg.sendMessage(this.worker, width, height, scaling, backgroundColor, linesColor);
    };
    EngineMultithreaded.isSupported = (typeof Worker !== "undefined");
    return EngineMultithreaded;
}());
exports.EngineMultithreaded = EngineMultithreaded;


/***/ }),

/***/ "./src/ts/engine/engine.ts":
/*!*********************************!*\
  !*** ./src/ts/engine/engine.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Engine = void 0;
var color_1 = __webpack_require__(/*! ../misc/color */ "./src/ts/misc/color.ts");
var rectangle_1 = __webpack_require__(/*! ../misc/rectangle */ "./src/ts/misc/rectangle.ts");
var throttle_1 = __webpack_require__(/*! ../misc/throttle */ "./src/ts/misc/throttle.ts");
var zoom_1 = __webpack_require__(/*! ../misc/zoom */ "./src/ts/misc/zoom.ts");
var geometry_id_1 = __webpack_require__(/*! ../plotter/geometry-id */ "./src/ts/plotter/geometry-id.ts");
var primitive_base_1 = __webpack_require__(/*! ../primitives/primitive-base */ "./src/ts/primitives/primitive-base.ts");
var primitive_quads_1 = __webpack_require__(/*! ../primitives/primitive-quads */ "./src/ts/primitives/primitive-quads.ts");
var primitive_triangles_1 = __webpack_require__(/*! ../primitives/primitive-triangles */ "./src/ts/primitives/primitive-triangles.ts");
var primitive_triangles_nested_1 = __webpack_require__(/*! ../primitives/primitive-triangles-nested */ "./src/ts/primitives/primitive-triangles-nested.ts");
var primitive_type_enum_1 = __webpack_require__(/*! ../primitives/primitive-type-enum */ "./src/ts/primitives/primitive-type-enum.ts");
__webpack_require__(/*! ../page-interface-generated */ "./src/ts/page-interface-generated.ts");
var Engine = (function () {
    function Engine() {
        this.reset(new rectangle_1.Rectangle(0, 512, 0, 512), primitive_type_enum_1.EPrimitiveType.TRIANGLES);
        this.cumulatedZoom = zoom_1.Zoom.noZoom();
        this.maintainanceThrottle = new throttle_1.Throttle(100);
    }
    Engine.prototype.update = function (viewport, instantZoom, wantedDepth, subdivisionBalance, colorVariation) {
        var _this = this;
        var somethingChanged = false;
        this.cumulatedZoom = zoom_1.Zoom.multiply(instantZoom, this.cumulatedZoom);
        this.maintainanceThrottle.runIfAvailable(function () {
            somethingChanged = _this.maintenance(viewport, wantedDepth, subdivisionBalance, colorVariation);
        });
        return somethingChanged;
    };
    Engine.prototype.reset = function (viewport, primitiveType) {
        if (primitiveType === primitive_type_enum_1.EPrimitiveType.QUADS) {
            this.rootPrimitive = new primitive_quads_1.PrimitiveQuads({ x: viewport.left, y: viewport.top }, { x: viewport.right, y: viewport.top }, { x: viewport.left, y: viewport.bottom }, { x: viewport.right, y: viewport.bottom }, this.computeRootPrimitiveColor());
        }
        else if (primitiveType === primitive_type_enum_1.EPrimitiveType.TRIANGLES) {
            this.rootPrimitive = new primitive_triangles_1.PrimitiveTriangles({ x: viewport.left, y: viewport.bottom }, { x: viewport.right, y: viewport.bottom }, { x: 0, y: viewport.top }, this.computeRootPrimitiveColor());
        }
        else {
            this.rootPrimitive = new primitive_triangles_nested_1.PrimitiveTrianglesNested({ x: viewport.left, y: viewport.bottom }, { x: viewport.right, y: viewport.bottom }, { x: 0, y: viewport.top }, this.computeRootPrimitiveColor());
        }
        this.layers = [{
                primitives: {
                    items: [this.rootPrimitive],
                    geometryId: geometry_id_1.GeometryId.new(),
                },
                outlines: {
                    items: [this.rootPrimitive.getOutline()],
                    geometryId: geometry_id_1.GeometryId.new(),
                },
                birthTimestamp: performance.now(),
            }];
        this.onGeometryChange();
    };
    Engine.prototype.recomputeColors = function (colorVariation) {
        var newColor = this.computeRootPrimitiveColor();
        this.rootPrimitive.setColor(newColor, colorVariation);
        for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
            var layer = _a[_i];
            layer.primitives.geometryId.registerChange();
        }
        this.onGeometryChange();
    };
    Engine.prototype.maintenance = function (viewport, wantedDepth, subdivisionBalance, colorVariation) {
        var somethingChanged = false;
        somethingChanged = this.applyCumulatedZoom() || somethingChanged;
        somethingChanged = this.adjustLayersCount(wantedDepth, subdivisionBalance, colorVariation) || somethingChanged;
        somethingChanged = this.handleRecycling(viewport) || somethingChanged;
        if (somethingChanged) {
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                layer.primitives.geometryId.registerChange();
                layer.outlines.geometryId.registerChange();
            }
            this.onGeometryChange();
        }
        return somethingChanged;
    };
    Engine.prototype.computeMetrics = function () {
        var treeDepth = this.rootPrimitive.treeDepth();
        var lastLayerPrimitivesCount = this.layers[this.layers.length - 1].primitives.items.length;
        var totalPrimitivesCount = 0;
        var segmentsCount = 0;
        for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
            var layer = _a[_i];
            totalPrimitivesCount += layer.primitives.items.length;
            for (var _b = 0, _c = layer.outlines.items; _b < _c.length; _b++) {
                var line = _c[_b];
                var nbLinePoints = line.length;
                segmentsCount += (nbLinePoints > 1) ? (nbLinePoints - 1) : 0;
            }
        }
        return {
            treeDepth: treeDepth,
            lastLayerPrimitivesCount: lastLayerPrimitivesCount,
            totalPrimitivesCount: totalPrimitivesCount,
            segmentsCount: segmentsCount,
        };
    };
    Engine.prototype.computeRootPrimitiveColor = function () {
        var minLuminosity = 0.3;
        var maxLuminosity = 0.7;
        var maxNbTries = 10;
        var bestColor = color_1.Color.random();
        for (var iTry = 0; iTry < maxNbTries; iTry++) {
            var luminosity = bestColor.luminosity;
            if (luminosity < minLuminosity) {
                var newCandidate = color_1.Color.random();
                if (newCandidate.luminosity > luminosity) {
                    bestColor = newCandidate;
                }
            }
            else if (luminosity > maxLuminosity) {
                var newCandidate = color_1.Color.random();
                if (newCandidate.luminosity < luminosity) {
                    bestColor = newCandidate;
                }
            }
            else {
                break;
            }
        }
        return bestColor;
    };
    Engine.prototype.applyCumulatedZoom = function () {
        var appliedZoom = false;
        if (this.cumulatedZoom.isNotNull()) {
            this.rootPrimitive.zoom(this.cumulatedZoom, true);
            appliedZoom = true;
        }
        this.cumulatedZoom = zoom_1.Zoom.noZoom();
        return appliedZoom;
    };
    Engine.prototype.handleRecycling = function (viewport) {
        if (this.rootPrimitive.computeVisibility(viewport) === primitive_base_1.EVisibility.OUT_OF_VIEW) {
            this.reset(viewport, this.primitiveType);
            return true;
        }
        else {
            var prunedPrimitives = this.prunePrimitivesOutOfView(this.rootPrimitive, viewport);
            var changedRootPrimitive = this.changeRootPrimitiveInNeeded();
            if (prunedPrimitives) {
                this.rebuildLayersCollections();
                return true;
            }
            return changedRootPrimitive || prunedPrimitives;
        }
    };
    Engine.prototype.adjustLayersCount = function (wantedDepth, subdivisionBalance, colorVariation) {
        var lastLayer = this.layers[this.layers.length - 1];
        var idealPrimitivesCountForLastLayer = Math.pow(2, wantedDepth - 1);
        var currentPrimitivesCountForLastLayer = lastLayer.primitives.items.length;
        var subdivisionFactor = this.rootPrimitive.subdivisionFactor;
        if (currentPrimitivesCountForLastLayer <= idealPrimitivesCountForLastLayer / subdivisionFactor) {
            var primitivesOfNewLayer = {
                items: [],
                geometryId: geometry_id_1.GeometryId.new(),
            };
            var outlinesOfNewLayer = {
                items: [],
                geometryId: geometry_id_1.GeometryId.new(),
            };
            for (var _i = 0, _a = lastLayer.primitives.items; _i < _a.length; _i++) {
                var primitive = _a[_i];
                primitive.subdivide(subdivisionBalance, colorVariation);
                Array.prototype.push.apply(primitivesOfNewLayer.items, primitive.getDirectChildren());
                outlinesOfNewLayer.items.push(primitive.subdivision);
            }
            this.layers.push({
                primitives: primitivesOfNewLayer,
                outlines: outlinesOfNewLayer,
                birthTimestamp: performance.now()
            });
        }
        else if (currentPrimitivesCountForLastLayer >= subdivisionFactor * idealPrimitivesCountForLastLayer) {
            for (var _b = 0, _c = lastLayer.primitives.items; _b < _c.length; _b++) {
                var primitive = _c[_b];
                primitive.removeChildren();
            }
            this.layers.pop();
        }
        else {
            return false;
        }
        return true;
    };
    Engine.prototype.changeRootPrimitiveInNeeded = function () {
        var directChildrenOfRoot = this.rootPrimitive.getDirectChildren();
        if (directChildrenOfRoot.length === 1) {
            this.rootPrimitive = directChildrenOfRoot[0];
            this.layers.shift();
            return true;
        }
        return false;
    };
    Engine.prototype.prunePrimitivesOutOfView = function (primitive, viewport) {
        var changedSomething = false;
        var directChildren = primitive.getDirectChildren();
        for (var _i = 0, directChildren_1 = directChildren; _i < directChildren_1.length; _i++) {
            var child = directChildren_1[_i];
            var visibility = child.computeVisibility(viewport);
            if (visibility === primitive_base_1.EVisibility.OUT_OF_VIEW) {
                primitive.removeChild(child);
                changedSomething = true;
            }
            else if (visibility === primitive_base_1.EVisibility.VISIBLE) {
                if (this.prunePrimitivesOutOfView(child, viewport)) {
                    changedSomething = true;
                }
            }
        }
        return changedSomething;
    };
    Engine.prototype.rebuildLayersCollections = function () {
        for (var iLayer = 0; iLayer < this.layers.length; iLayer++) {
            var primitives = {
                items: this.rootPrimitive.getChildrenOfDepth(iLayer),
                geometryId: geometry_id_1.GeometryId.new(),
            };
            var outlines = {
                items: [],
                geometryId: geometry_id_1.GeometryId.new(),
            };
            if (iLayer === 0) {
                outlines.items.push(this.rootPrimitive.getOutline());
            }
            else {
                var primitivesOfParentLayer = this.layers[iLayer - 1].primitives;
                for (var _i = 0, _a = primitivesOfParentLayer.items; _i < _a.length; _i++) {
                    var primitive = _a[_i];
                    outlines.items.push(primitive.subdivision);
                }
            }
            this.layers[iLayer].primitives = primitives;
            this.layers[iLayer].outlines = outlines;
        }
    };
    Object.defineProperty(Engine.prototype, "primitiveType", {
        get: function () {
            return this.rootPrimitive.primitiveType;
        },
        enumerable: false,
        configurable: true
    });
    return Engine;
}());
exports.Engine = Engine;


/***/ }),

/***/ "./src/ts/engine/tree-node.ts":
/*!************************************!*\
  !*** ./src/ts/engine/tree-node.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TreeNode = void 0;
var TreeNode = (function () {
    function TreeNode() {
        this.children = [];
        this.subDepthsCache = [];
        this.parent = null;
    }
    TreeNode.prototype.treeDepth = function () {
        if (this.children.length > 0) {
            return this.children[0].treeDepth() + 1;
        }
        return 1;
    };
    TreeNode.prototype.getDirectChildren = function () {
        return this.getChildrenOfDepth(1);
    };
    TreeNode.prototype.getChildrenOfDepth = function (depth) {
        if (depth < 0) {
            return [];
        }
        if (typeof this.subDepthsCache[depth] !== "undefined") {
            return this.subDepthsCache[depth];
        }
        var result;
        if (depth === 0) {
            result = [this];
        }
        else {
            result = [];
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var child = _a[_i];
                var subchildren = child.getChildrenOfDepth(depth - 1);
                if (subchildren.length > 0) {
                    result = result.concat(subchildren);
                }
            }
        }
        this.subDepthsCache[depth] = result;
        return result;
    };
    TreeNode.prototype.removeChild = function (child) {
        for (var iC = this.children.length - 1; iC >= 0; iC--) {
            if (this.children[iC] === child) {
                this.children[iC].parent = null;
                this.children.splice(iC, 1);
                this.onSubtreeChange(1);
                return;
            }
        }
        throw new Error("Cannot remove an unknown child.");
    };
    TreeNode.prototype.addChildren = function () {
        var newChildren = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            newChildren[_i] = arguments[_i];
        }
        if (newChildren.length > 0) {
            for (var _a = 0, newChildren_1 = newChildren; _a < newChildren_1.length; _a++) {
                var newChild = newChildren_1[_a];
                if (newChild.parent) {
                    throw new Error("Cannot attach a tree node that already has a parent.");
                }
                newChild.parent = this;
            }
            Array.prototype.push.apply(this.children, newChildren);
            this.onSubtreeChange(1);
        }
    };
    TreeNode.prototype.removeChildren = function () {
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.parent = null;
        }
        this.children.length = 0;
        this.onSubtreeChange(1);
    };
    TreeNode.prototype.onSubtreeChange = function (invalidatedLevel) {
        if (this.subDepthsCache.length >= invalidatedLevel + 1) {
            this.subDepthsCache.length = invalidatedLevel;
        }
        if (this.parent) {
            this.parent.onSubtreeChange(invalidatedLevel + 1);
        }
    };
    return TreeNode;
}());
exports.TreeNode = TreeNode;


/***/ }),

/***/ "./src/ts/gl-utils/gl-canvas.ts":
/*!**************************************!*\
  !*** ./src/ts/gl-utils/gl-canvas.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.gl = exports.initGL = exports.adjustSize = void 0;
__webpack_require__(/*! ../page-interface-generated */ "./src/ts/page-interface-generated.ts");
var gl = null;
exports.gl = gl;
function initGL(flags) {
    function setError(message) {
        Page.Demopage.setErrorMessage("webgl-support", message);
    }
    var canvas = Page.Canvas.getCanvas();
    exports.gl = gl = canvas.getContext("webgl", flags);
    if (gl == null) {
        exports.gl = gl = canvas.getContext("experimental-webgl", flags);
        if (gl == null) {
            setError("Your browser or device does not seem to support WebGL.");
            return false;
        }
        setError("Your browser or device only supports experimental WebGL.\nThe simulation may not run as expected.");
    }
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
    return true;
}
exports.initGL = initGL;
function adjustSize(hidpi) {
    if (hidpi === void 0) { hidpi = false; }
    var cssPixel = (hidpi) ? window.devicePixelRatio : 1;
    var canvas = gl.canvas;
    var width = Math.floor(canvas.clientWidth * cssPixel);
    var height = Math.floor(canvas.clientHeight * cssPixel);
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
}
exports.adjustSize = adjustSize;


/***/ }),

/***/ "./src/ts/gl-utils/gl-resource.ts":
/*!****************************************!*\
  !*** ./src/ts/gl-utils/gl-resource.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GLResource = void 0;
var GLResource = (function () {
    function GLResource(gl) {
        this._gl = gl;
    }
    GLResource.prototype.gl = function () {
        return this._gl;
    };
    return GLResource;
}());
exports.GLResource = GLResource;


/***/ }),

/***/ "./src/ts/gl-utils/shader-manager.ts":
/*!*******************************************!*\
  !*** ./src/ts/gl-utils/shader-manager.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deleteShader = exports.registerShader = exports.getShader = exports.buildShader = void 0;
var gl_canvas_1 = __webpack_require__(/*! ./gl-canvas */ "./src/ts/gl-utils/gl-canvas.ts");
var shader_1 = __webpack_require__(/*! ./shader */ "./src/ts/gl-utils/shader.ts");
var ShaderSources = __importStar(__webpack_require__(/*! ./shader-sources */ "./src/ts/gl-utils/shader-sources.ts"));
var cachedShaders = {};
function getShader(name) {
    return cachedShaders[name].shader;
}
exports.getShader = getShader;
function buildShader(infos, callback) {
    var sourcesPending = 2;
    var sourcesFailed = 0;
    function loadedSource(success) {
        function processSource(source) {
            return source.replace(/#INJECT\(([^)]*)\)/mg, function (match, name) {
                if (infos.injected[name]) {
                    return infos.injected[name];
                }
                return match;
            });
        }
        sourcesPending--;
        if (!success) {
            sourcesFailed++;
        }
        if (sourcesPending === 0) {
            var shader = null;
            if (sourcesFailed === 0) {
                var vert = ShaderSources.getSource(infos.vertexFilename);
                var frag = ShaderSources.getSource(infos.fragmentFilename);
                var processedVert = processSource(vert);
                var processedFrag = processSource(frag);
                shader = new shader_1.Shader(gl_canvas_1.gl, processedVert, processedFrag);
            }
            callback(shader);
        }
    }
    ShaderSources.loadSource(infos.vertexFilename, loadedSource);
    ShaderSources.loadSource(infos.fragmentFilename, loadedSource);
}
exports.buildShader = buildShader;
function registerShader(name, infos, callback) {
    function callAndClearCallbacks(cached) {
        for (var _i = 0, _a = cached.callbacks; _i < _a.length; _i++) {
            var cachedCallback = _a[_i];
            cachedCallback(!cached.failed, cached.shader);
        }
        cached.callbacks = [];
    }
    if (typeof cachedShaders[name] === "undefined") {
        cachedShaders[name] = {
            callbacks: [callback],
            failed: false,
            infos: infos,
            pending: true,
            shader: null,
        };
        var cached_1 = cachedShaders[name];
        buildShader(infos, function (builtShader) {
            cached_1.pending = false;
            cached_1.failed = builtShader === null;
            cached_1.shader = builtShader;
            callAndClearCallbacks(cached_1);
        });
    }
    else {
        var cached = cachedShaders[name];
        if (cached.pending === true) {
            cached.callbacks.push(callback);
        }
        else {
            callAndClearCallbacks(cached);
        }
    }
}
exports.registerShader = registerShader;
function deleteShader(name) {
    if (typeof cachedShaders[name] !== "undefined") {
        if (cachedShaders[name].shader !== null) {
            cachedShaders[name].shader.freeGLResources();
        }
        delete cachedShaders[name];
    }
}
exports.deleteShader = deleteShader;


/***/ }),

/***/ "./src/ts/gl-utils/shader-sources.ts":
/*!*******************************************!*\
  !*** ./src/ts/gl-utils/shader-sources.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.loadSource = exports.getSource = void 0;
__webpack_require__(/*! ../page-interface-generated */ "./src/ts/page-interface-generated.ts");
var cachedSources = {};
function loadSource(filename, callback) {
    function callAndClearCallbacks(cached) {
        for (var _i = 0, _a = cached.callbacks; _i < _a.length; _i++) {
            var cachedCallback = _a[_i];
            cachedCallback(!cached.failed);
        }
        cached.callbacks = [];
    }
    if (typeof cachedSources[filename] === "undefined") {
        cachedSources[filename] = {
            callbacks: [callback],
            failed: false,
            pending: true,
            text: null,
        };
        var cached_1 = cachedSources[filename];
        var url = "./shaders/" + filename;
        if (typeof Page.version !== "undefined") {
            url += "?v=" + Page.version;
        }
        var xhr_1 = new XMLHttpRequest();
        xhr_1.open("GET", url, true);
        xhr_1.onload = function () {
            if (xhr_1.readyState === 4) {
                cached_1.pending = false;
                if (xhr_1.status === 200) {
                    cached_1.text = xhr_1.responseText;
                    cached_1.failed = false;
                }
                else {
                    console.error("Cannot load '" + filename + "' shader source: " + xhr_1.statusText);
                    cached_1.failed = true;
                }
                callAndClearCallbacks(cached_1);
            }
        };
        xhr_1.onerror = function () {
            console.error("Cannot load '" + filename + "' shader source: " + xhr_1.statusText);
            cached_1.pending = false;
            cached_1.failed = true;
            callAndClearCallbacks(cached_1);
        };
        xhr_1.send(null);
    }
    else {
        var cached = cachedSources[filename];
        if (cached.pending === true) {
            cached.callbacks.push(callback);
        }
        else {
            cached.callbacks = [callback];
            callAndClearCallbacks(cached);
        }
    }
}
exports.loadSource = loadSource;
function getSource(filename) {
    return cachedSources[filename].text;
}
exports.getSource = getSource;


/***/ }),

/***/ "./src/ts/gl-utils/shader.ts":
/*!***********************************!*\
  !*** ./src/ts/gl-utils/shader.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Shader = void 0;
var gl_resource_1 = __webpack_require__(/*! ./gl-resource */ "./src/ts/gl-utils/gl-resource.ts");
function notImplemented() {
    alert("NOT IMPLEMENTED YET");
}
function bindUniformFloat(gl, location, value) {
    if (Array.isArray(value)) {
        gl.uniform1fv(location, value);
    }
    else {
        gl.uniform1f(location, value);
    }
}
function bindUniformFloat2v(gl, location, value) {
    gl.uniform2fv(location, value);
}
function bindUniformFloat3v(gl, location, value) {
    gl.uniform3fv(location, value);
}
function bindUniformFloat4v(gl, location, value) {
    gl.uniform4fv(location, value);
}
function bindUniformInt(gl, location, value) {
    if (Array.isArray(value)) {
        gl.uniform1iv(location, value);
    }
    else {
        gl.uniform1iv(location, value);
    }
}
function bindUniformInt2v(gl, location, value) {
    gl.uniform2iv(location, value);
}
function bindUniformInt3v(gl, location, value) {
    gl.uniform3iv(location, value);
}
function bindUniformInt4v(gl, location, value) {
    gl.uniform4iv(location, value);
}
function bindUniformBool(gl, location, value) {
    gl.uniform1i(location, +value);
}
function bindUniformBool2v(gl, location, value) {
    gl.uniform2iv(location, value);
}
function bindUniformBool3v(gl, location, value) {
    gl.uniform3iv(location, value);
}
function bindUniformBool4v(gl, location, value) {
    gl.uniform4iv(location, value);
}
function bindUniformFloatMat2(gl, location, value) {
    gl.uniformMatrix2fv(location, false, value);
}
function bindUniformFloatMat3(gl, location, value) {
    gl.uniformMatrix3fv(location, false, value);
}
function bindUniformFloatMat4(gl, location, value) {
    gl.uniformMatrix4fv(location, false, value);
}
function bindSampler2D(gl, location, unitNb, value) {
    gl.uniform1i(location, unitNb);
    gl.activeTexture(gl["TEXTURE" + unitNb]);
    gl.bindTexture(gl.TEXTURE_2D, value);
}
function bindSamplerCube(gl, location, unitNb, value) {
    gl.uniform1i(location, unitNb);
    gl.activeTexture(gl["TEXTURE" + unitNb]);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, value);
}
var types = {
    0x8B50: { str: "FLOAT_VEC2", binder: bindUniformFloat2v },
    0x8B51: { str: "FLOAT_VEC3", binder: bindUniformFloat3v },
    0x8B52: { str: "FLOAT_VEC4", binder: bindUniformFloat4v },
    0x8B53: { str: "INT_VEC2", binder: bindUniformInt2v },
    0x8B54: { str: "INT_VEC3", binder: bindUniformInt3v },
    0x8B55: { str: "INT_VEC4", binder: bindUniformInt4v },
    0x8B56: { str: "BOOL", binder: bindUniformBool },
    0x8B57: { str: "BOOL_VEC2", binder: bindUniformBool2v },
    0x8B58: { str: "BOOL_VEC3", binder: bindUniformBool3v },
    0x8B59: { str: "BOOL_VEC4", binder: bindUniformBool4v },
    0x8B5A: { str: "FLOAT_MAT2", binder: bindUniformFloatMat2 },
    0x8B5B: { str: "FLOAT_MAT3", binder: bindUniformFloatMat3 },
    0x8B5C: { str: "FLOAT_MAT4", binder: bindUniformFloatMat4 },
    0x8B5E: { str: "SAMPLER_2D", binder: bindSampler2D },
    0x8B60: { str: "SAMPLER_CUBE", binder: bindSamplerCube },
    0x1400: { str: "BYTE", binder: notImplemented },
    0x1401: { str: "UNSIGNED_BYTE", binder: notImplemented },
    0x1402: { str: "SHORT", binder: notImplemented },
    0x1403: { str: "UNSIGNED_SHORT", binder: notImplemented },
    0x1404: { str: "INT", binder: bindUniformInt },
    0x1405: { str: "UNSIGNED_INT", binder: notImplemented },
    0x1406: { str: "FLOAT", binder: bindUniformFloat },
};
var ShaderProgram = (function (_super) {
    __extends(ShaderProgram, _super);
    function ShaderProgram(gl, vertexSource, fragmentSource) {
        var _this = this;
        function createShader(type, source) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            var compileSuccess = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compileSuccess) {
                console.error(gl.getShaderInfoLog(shader));
                console.log(source);
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }
        _this = _super.call(this, gl) || this;
        _this.id = null;
        _this.uCount = 0;
        _this.aCount = 0;
        var vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
        var fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);
        var id = gl.createProgram();
        gl.attachShader(id, vertexShader);
        gl.attachShader(id, fragmentShader);
        gl.linkProgram(id);
        var linkSuccess = gl.getProgramParameter(id, gl.LINK_STATUS);
        if (!linkSuccess) {
            console.error(gl.getProgramInfoLog(id));
            gl.deleteProgram(id);
        }
        else {
            _this.id = id;
            _this.introspection();
        }
        return _this;
    }
    ShaderProgram.prototype.freeGLResources = function () {
        _super.prototype.gl.call(this).deleteProgram(this.id);
        this.id = null;
    };
    ShaderProgram.prototype.use = function () {
        _super.prototype.gl.call(this).useProgram(this.id);
    };
    ShaderProgram.prototype.bindUniforms = function () {
        var _this = this;
        var gl = _super.prototype.gl.call(this);
        var currTextureUnitNb = 0;
        Object.keys(this.u).forEach(function (uName) {
            var uniform = _this.u[uName];
            if (uniform.value !== null) {
                if (uniform.type === 0x8B5E || uniform.type === 0x8B60) {
                    var unitNb = currTextureUnitNb;
                    types[uniform.type].binder(gl, uniform.loc, unitNb, uniform.value);
                    currTextureUnitNb++;
                }
                else {
                    types[uniform.type].binder(gl, uniform.loc, uniform.value);
                }
            }
        });
    };
    ShaderProgram.prototype.bindAttributes = function () {
        var _this = this;
        Object.keys(this.a).forEach(function (aName) {
            var attribute = _this.a[aName];
            if (attribute.VBO !== null) {
                attribute.VBO.bind(attribute.loc);
            }
        });
    };
    ShaderProgram.prototype.bindUniformsAndAttributes = function () {
        this.bindUniforms();
        this.bindAttributes();
    };
    ShaderProgram.prototype.introspection = function () {
        var gl = _super.prototype.gl.call(this);
        this.uCount = gl.getProgramParameter(this.id, gl.ACTIVE_UNIFORMS);
        this.u = {};
        for (var i = 0; i < this.uCount; i++) {
            var uniform = gl.getActiveUniform(this.id, i);
            var name_1 = uniform.name;
            this.u[name_1] = {
                loc: gl.getUniformLocation(this.id, name_1),
                size: uniform.size,
                type: uniform.type,
                value: null,
            };
        }
        this.aCount = gl.getProgramParameter(this.id, gl.ACTIVE_ATTRIBUTES);
        this.a = {};
        for (var i = 0; i < this.aCount; i++) {
            var attribute = gl.getActiveAttrib(this.id, i);
            var name_2 = attribute.name;
            this.a[name_2] = {
                VBO: null,
                loc: gl.getAttribLocation(this.id, name_2),
                size: attribute.size,
                type: attribute.type,
            };
        }
    };
    return ShaderProgram;
}(gl_resource_1.GLResource));
exports.Shader = ShaderProgram;


/***/ }),

/***/ "./src/ts/gl-utils/viewport.ts":
/*!*************************************!*\
  !*** ./src/ts/gl-utils/viewport.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Viewport = void 0;
var Viewport = (function () {
    function Viewport(left, lower, width, height) {
        this.left = left;
        this.lower = lower;
        this.width = width;
        this.height = height;
    }
    Viewport.setFullCanvas = function (gl) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    };
    Viewport.prototype.set = function (gl) {
        gl.viewport(this.lower, this.left, this.width, this.height);
    };
    return Viewport;
}());
exports.Viewport = Viewport;


/***/ }),

/***/ "./src/ts/main.ts":
/*!************************!*\
  !*** ./src/ts/main.ts ***!
  \************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var engine_monothreaded_1 = __webpack_require__(/*! ./engine/engine-monothreaded */ "./src/ts/engine/engine-monothreaded.ts");
var engine_multithreaded_1 = __webpack_require__(/*! ./engine/engine-multithreaded */ "./src/ts/engine/engine-multithreaded.ts");
var color_1 = __webpack_require__(/*! ./misc/color */ "./src/ts/misc/color.ts");
var frame_time_monitor_1 = __webpack_require__(/*! ./misc/frame-time-monitor */ "./src/ts/misc/frame-time-monitor.ts");
var zoom_1 = __webpack_require__(/*! ./misc/zoom */ "./src/ts/misc/zoom.ts");
var parameters_1 = __webpack_require__(/*! ./parameters */ "./src/ts/parameters.ts");
var plotter_canvas_2d_1 = __webpack_require__(/*! ./plotter/plotter-canvas-2d */ "./src/ts/plotter/plotter-canvas-2d.ts");
var plotter_webgl_1 = __webpack_require__(/*! ./plotter/plotter-webgl */ "./src/ts/plotter/plotter-webgl.ts");
var plotter_webgl_basic_1 = __webpack_require__(/*! ./plotter/plotter-webgl-basic */ "./src/ts/plotter/plotter-webgl-basic.ts");
var Testing = __importStar(__webpack_require__(/*! ./testing/main-testing */ "./src/ts/testing/main-testing.ts"));
__webpack_require__(/*! ./page-interface-generated */ "./src/ts/page-interface-generated.ts");
function main(engine, plotter) {
    var backgroundColor = color_1.Color.BLACK;
    function linesColor() {
        if (parameters_1.Parameters.displayLines) {
            return parameters_1.Parameters.linesColor;
        }
        return undefined;
    }
    parameters_1.Parameters.recomputeColorsObservers.push(function () {
        engine.recomputeColors(parameters_1.Parameters.colorVariation);
    });
    parameters_1.Parameters.downloadObservers.push(function () {
        engine.downloadAsSvg(plotter.width, plotter.height, parameters_1.Parameters.scaling, backgroundColor, linesColor());
    });
    function getCurrentMousePosition() {
        var mousePosition = parameters_1.Parameters.mousePositionInPixels;
        mousePosition.x -= 0.5 * plotter.width;
        mousePosition.y -= 0.5 * plotter.height;
        return mousePosition;
    }
    var lastZoomCenter;
    function buildInstantZoom(dt) {
        if (Page.Canvas.isMouseDown()) {
            lastZoomCenter = getCurrentMousePosition();
        }
        return zoom_1.Zoom.buildZoom(lastZoomCenter, 1 + dt * parameters_1.Parameters.zoomingSpeed);
    }
    function reset() {
        plotter.resizeCanvas();
        engine.reset(plotter.viewport, parameters_1.Parameters.primitiveType);
        lastZoomCenter = { x: 0, y: 0 };
    }
    parameters_1.Parameters.resetObservers.push(reset);
    reset();
    var needToRedraw = true;
    parameters_1.Parameters.redrawObservers.push(function () { needToRedraw = true; });
    var frametimeMonitor = new frame_time_monitor_1.FrametimeMonitor();
    setInterval(function () {
        frametimeMonitor.updateIndicators();
    }, 1000);
    var MAX_DT = 1 / 30;
    var lastFrameTimestamp = performance.now();
    function mainLoop() {
        var now = performance.now();
        var millisecondsSinceLastFrame = now - lastFrameTimestamp;
        lastFrameTimestamp = now;
        frametimeMonitor.registerFrameTime(millisecondsSinceLastFrame);
        var dt = Math.min(MAX_DT, 0.001 * millisecondsSinceLastFrame);
        var instantZoom = buildInstantZoom(dt);
        var updatedChangedSomething = engine.update(plotter.viewport, instantZoom, parameters_1.Parameters.depth, parameters_1.Parameters.balance, parameters_1.Parameters.colorVariation);
        if (updatedChangedSomething || instantZoom.isNotNull()) {
            needToRedraw = true;
        }
        if (needToRedraw && plotter.isReady) {
            plotter.resizeCanvas();
            engine.draw(plotter, parameters_1.Parameters.scaling, backgroundColor, linesColor());
            needToRedraw = false;
        }
        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}
if (parameters_1.Parameters.debugMode) {
    Testing.main();
}
else {
    if (parameters_1.Parameters.multithreaded) {
        if (!engine_multithreaded_1.EngineMultithreaded.isSupported) {
            Page.Demopage.setErrorMessage("worker-not-supported", "Your browser does not the multithreaded mode because it does not support Web Workers.");
        }
        var engine = new engine_multithreaded_1.EngineMultithreaded();
        var plotter = new plotter_webgl_basic_1.PlotterWebGLBasic();
        main(engine, plotter);
    }
    else {
        var engine = new engine_monothreaded_1.EngineMonothreaded();
        if (parameters_1.Parameters.plotter === parameters_1.EPlotter.CANVAS2D) {
            var plotter = new plotter_canvas_2d_1.PlotterCanvas2D();
            main(engine, plotter);
        }
        else {
            var plotter = new plotter_webgl_1.PlotterWebGL();
            main(engine, plotter);
        }
    }
    Page.Canvas.setIndicatorText("multithreaded", parameters_1.Parameters.multithreaded ? "yes" : "no");
}


/***/ }),

/***/ "./src/ts/misc/arithmetics.ts":
/*!************************************!*\
  !*** ./src/ts/misc/arithmetics.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.squaredDistance = exports.random = exports.interpolatePoint = exports.getSide = exports.areSameSign = void 0;
function areSameSign(a, b, c) {
    return a * b >= 0 && a * c >= 0;
}
exports.areSameSign = areSameSign;
function getSide(p1, p2, p3) {
    return (p3.x - p1.x) * -(p2.y - p1.y) + (p3.y - p1.y) * (p2.x - p1.x);
}
exports.getSide = getSide;
function interpolate(a, b, x) {
    return (1 - x) * a + x * b;
}
function interpolatePoint(p1, p2, x) {
    return {
        x: interpolate(p1.x, p2.x, x),
        y: interpolate(p1.y, p2.y, x),
    };
}
exports.interpolatePoint = interpolatePoint;
function random(from, to) {
    return from + (to - from) * Math.random();
}
exports.random = random;
function squaredDistance(p1, p2) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return dx * dx + dy * dy;
}
exports.squaredDistance = squaredDistance;


/***/ }),

/***/ "./src/ts/misc/color.ts":
/*!******************************!*\
  !*** ./src/ts/misc/color.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Color = void 0;
function registerPadStartPolyfill() {
    if (typeof String.prototype.padStart !== "function") {
        String.prototype.padStart = function padStart(maxLength, fillString) {
            if (this.length > maxLength) {
                return String(this);
            }
            if (!fillString) {
                fillString = " ";
            }
            var nbRepeats = Math.ceil((maxLength - this.length) / fillString.length);
            var result = "";
            for (var i = 0; i < nbRepeats; i++) {
                result += fillString;
            }
            return result + this;
        };
    }
}
registerPadStartPolyfill();
var Color = (function () {
    function Color(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    Color.random = function () {
        return new Color(Color.randomChannel(), Color.randomChannel(), Color.randomChannel());
    };
    Color.rehydrate = function (dehydrated) {
        return new Color(dehydrated.r, dehydrated.g, dehydrated.b);
    };
    Color.prototype.toHexaString = function () {
        if (!this.hexString) {
            var rHex = this.r.toString(16).padStart(2, "0");
            var gHex = this.g.toString(16).padStart(2, "0");
            var bHex = this.b.toString(16).padStart(2, "0");
            this.hexString = "#" + rHex + gHex + bHex;
        }
        return this.hexString;
    };
    Color.prototype.toRgbaString = function (alpha) {
        return "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + alpha + ")";
    };
    Color.prototype.computeCloseColor = function (colorVariation) {
        return new Color(Color.computeCloseChannelValue(this.r, colorVariation), Color.computeCloseChannelValue(this.g, colorVariation), Color.computeCloseChannelValue(this.b, colorVariation));
    };
    Object.defineProperty(Color.prototype, "luminosity", {
        get: function () {
            return (0.299 * this.r + 0.587 * this.g + 0.114 * this.b) / 255;
        },
        enumerable: false,
        configurable: true
    });
    Color.randomChannel = function () {
        return Math.floor(256 * Math.random());
    };
    Color.computeCloseChannelValue = function (referenceValue, variation) {
        var raw = referenceValue + Math.round(variation * (Math.random() - 0.5));
        if (raw < 0) {
            return 0;
        }
        else if (raw > 255) {
            return 255;
        }
        return raw;
    };
    Color.BLACK = new Color(0, 0, 0);
    Color.WHITE = new Color(255, 255, 255);
    Color.RED = new Color(255, 0, 0);
    Color.GREEN = new Color(0, 255, 0);
    return Color;
}());
exports.Color = Color;


/***/ }),

/***/ "./src/ts/misc/frame-time-monitor.ts":
/*!*******************************************!*\
  !*** ./src/ts/misc/frame-time-monitor.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FrametimeMonitor = void 0;
__webpack_require__(/*! ../page-interface-generated */ "./src/ts/page-interface-generated.ts");
var FrametimeMonitor = (function () {
    function FrametimeMonitor() {
        this.reset();
    }
    FrametimeMonitor.prototype.reset = function () {
        this.nbFrameSinceLastIndicatorsUpdate = 0;
        this.lastIndicatorsUpdateTimestamp = performance.now();
    };
    FrametimeMonitor.prototype.registerFrameTime = function (frametime) {
        if (this.nbFrameSinceLastIndicatorsUpdate === 0) {
            this.maxFrametime = frametime;
        }
        else if (frametime > this.maxFrametime) {
            this.maxFrametime = frametime;
        }
        this.nbFrameSinceLastIndicatorsUpdate++;
    };
    FrametimeMonitor.prototype.updateIndicators = function () {
        var now = performance.now();
        var timespanSinceLastUpdate = now - this.lastIndicatorsUpdateTimestamp;
        this.lastIndicatorsUpdateTimestamp = now;
        if (this.nbFrameSinceLastIndicatorsUpdate > 0) {
            var averageFrametime = timespanSinceLastUpdate / this.nbFrameSinceLastIndicatorsUpdate;
            Page.Canvas.setIndicatorText("average-frame-time", FrametimeMonitor.frametimeToString(averageFrametime));
            Page.Canvas.setIndicatorText("max-frame-time", FrametimeMonitor.frametimeToString(this.maxFrametime));
            this.reset();
        }
    };
    FrametimeMonitor.frametimeToString = function (frametime) {
        var shortenedFrametime = frametime.toFixed(0);
        var shortenedFps = (1000 / frametime).toFixed(0);
        return shortenedFrametime + " ms (" + shortenedFps + " fps)";
    };
    return FrametimeMonitor;
}());
exports.FrametimeMonitor = FrametimeMonitor;


/***/ }),

/***/ "./src/ts/misc/loader.ts":
/*!*******************************!*\
  !*** ./src/ts/misc/loader.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerLoadingObject = exports.registerLoadedObject = void 0;
__webpack_require__(/*! ../page-interface-generated */ "./src/ts/page-interface-generated.ts");
var loadingObjects = {};
function registerLoadingObject(id) {
    if (Object.keys(loadingObjects).length === 0) {
        Page.Canvas.showLoader(true);
    }
    loadingObjects[id] = false;
}
exports.registerLoadingObject = registerLoadingObject;
function registerLoadedObject(id) {
    delete loadingObjects[id];
    if (Object.keys(loadingObjects).length === 0) {
        Page.Canvas.showLoader(false);
    }
}
exports.registerLoadedObject = registerLoadedObject;


/***/ }),

/***/ "./src/ts/misc/rectangle.ts":
/*!**********************************!*\
  !*** ./src/ts/misc/rectangle.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Rectangle = void 0;
var Rectangle = (function () {
    function Rectangle(left, right, top, bottom) {
        this.topLeft = { x: left, y: top };
        this.bottomRight = { x: right, y: bottom };
    }
    Rectangle.rehydrate = function (dehydrated) {
        return new Rectangle(dehydrated.topLeft.x, dehydrated.bottomRight.x, dehydrated.topLeft.y, dehydrated.bottomRight.y);
    };
    Rectangle.prototype.containsPoint = function (point) {
        return (point.x >= this.topLeft.x && point.x <= this.bottomRight.x) &&
            (point.y >= this.topLeft.y && point.y <= this.bottomRight.y);
    };
    Rectangle.prototype.lineIntersectsBoundaries = function (p1, p2) {
        var vPx = p2.x - p1.x;
        var vPy = p2.y - p1.y;
        var width = this.width;
        var height = this.height;
        if (vPx !== 0) {
            {
                var lambdaP = (this.left - p1.x) / vPx;
                if (lambdaP >= 0 && lambdaP <= 1) {
                    var lambdaD = (p1.y + lambdaP * vPy - this.top) / height;
                    if (lambdaD >= 0 && lambdaD <= 1) {
                        return true;
                    }
                }
            }
            {
                var lambdaP = (this.right - p1.x) / vPx;
                if (lambdaP >= 0 && lambdaP <= 1) {
                    var lambdaD = (p1.y + lambdaP * vPy - this.top) / height;
                    if (lambdaD >= 0 && lambdaD <= 1) {
                        return true;
                    }
                }
            }
        }
        if (vPy !== 0) {
            {
                var lambdaP = (this.top - p1.y) / vPy;
                if (lambdaP >= 0 && lambdaP <= 1) {
                    var lambdaD = (p1.x + lambdaP * vPx - this.left) / width;
                    if (lambdaD >= 0 && lambdaD <= 1) {
                        return true;
                    }
                }
            }
            {
                var lambdaP = (this.bottom - p1.y) / vPy;
                if (lambdaP >= 0 && lambdaP <= 1) {
                    var lambdaD = (p1.x + lambdaP * vPx - this.left) / width;
                    if (lambdaD >= 0 && lambdaD <= 1) {
                        return true;
                    }
                }
            }
        }
        return false;
    };
    Object.defineProperty(Rectangle.prototype, "width", {
        get: function () {
            return this.bottomRight.x - this.topLeft.x;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rectangle.prototype, "height", {
        get: function () {
            return this.bottomRight.y - this.topLeft.y;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rectangle.prototype, "left", {
        get: function () {
            return this.topLeft.x;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rectangle.prototype, "right", {
        get: function () {
            return this.bottomRight.x;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rectangle.prototype, "top", {
        get: function () {
            return this.topLeft.y;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Rectangle.prototype, "bottom", {
        get: function () {
            return this.bottomRight.y;
        },
        enumerable: false,
        configurable: true
    });
    return Rectangle;
}());
exports.Rectangle = Rectangle;


/***/ }),

/***/ "./src/ts/misc/throttle.ts":
/*!*********************************!*\
  !*** ./src/ts/misc/throttle.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Throttle = void 0;
var Throttle = (function () {
    function Throttle(minimumDistanceBetweenRuns) {
        this.minimumDistanceBetweenRuns = minimumDistanceBetweenRuns;
        this.reset();
    }
    Throttle.prototype.reset = function () {
        this.lastRunTimestamp = performance.now();
    };
    Throttle.prototype.runIfAvailable = function (operation) {
        var now = performance.now();
        if (now - this.lastRunTimestamp > this.minimumDistanceBetweenRuns) {
            operation();
            this.lastRunTimestamp = now;
        }
    };
    return Throttle;
}());
exports.Throttle = Throttle;


/***/ }),

/***/ "./src/ts/misc/web.ts":
/*!****************************!*\
  !*** ./src/ts/misc/web.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setQueryStringValue = exports.getQueryStringValue = exports.downloadSvgOutput = void 0;
function downloadTextFile(fileName, content) {
    var fileType = "text/plain";
    var blob = new Blob([content], { type: fileType });
    if (typeof window.navigator !== "undefined" && typeof window.navigator.msSaveBlob !== "undefined") {
        window.navigator.msSaveBlob(blob, fileName);
    }
    else {
        var objectUrl_1 = URL.createObjectURL(blob);
        var linkElement = document.createElement('a');
        linkElement.download = fileName;
        linkElement.href = objectUrl_1;
        linkElement.dataset.downloadurl = fileType + ":" + linkElement.download + ":" + linkElement.href;
        linkElement.style.display = "none";
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        setTimeout(function () {
            URL.revokeObjectURL(objectUrl_1);
        }, 5000);
    }
}
function downloadSvgOutput(output) {
    downloadTextFile("tessellation.svg", output);
}
exports.downloadSvgOutput = downloadSvgOutput;
function getQueryStringValue(name) {
    if (typeof URLSearchParams !== "undefined") {
        var params = new URLSearchParams(window.location.search);
        return params.get(name);
    }
    if (window.location.search.length > 0) {
        var search = window.location.search.slice(1);
        var words = search.split("&");
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            var wantedPrefix = name + "=";
            if (word.indexOf(wantedPrefix) === 0) {
                var rawValue = word.substring(wantedPrefix.length);
                return decodeURIComponent(rawValue);
            }
        }
    }
    return null;
}
exports.getQueryStringValue = getQueryStringValue;
function setQueryStringValue(name, value) {
    if (typeof URLSearchParams !== "undefined") {
        var params = new URLSearchParams(window.location.search);
        if (value === null) {
            params.delete(name);
        }
        else {
            params.set(name, value);
        }
        window.location.search = params.toString();
    }
}
exports.setQueryStringValue = setQueryStringValue;


/***/ }),

/***/ "./src/ts/misc/zoom.ts":
/*!*****************************!*\
  !*** ./src/ts/misc/zoom.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Zoom = void 0;
var Zoom = (function () {
    function Zoom(a, b, c) {
        this.a = a;
        this.b = b;
        this.c = c;
    }
    Zoom.noZoom = function () {
        return new Zoom(1, 0, 0);
    };
    Zoom.rehydrate = function (dehydrated) {
        return new Zoom(dehydrated.a, dehydrated.b, dehydrated.c);
    };
    Zoom.multiply = function (z1, z2) {
        return new Zoom(z1.a * z2.a, z1.a * z2.b + z1.b, z1.a * z2.c + z1.c);
    };
    Zoom.buildZoom = function (center, scaling) {
        return new Zoom(scaling, center.x * (1 - scaling), center.y * (1 - scaling));
    };
    Zoom.prototype.isNotNull = function () {
        var isIdentity = (this.a === 1) && (this.b === 0) && (this.c === 0);
        return !isIdentity;
    };
    Zoom.prototype.applyToPoint = function (point) {
        point.x = this.a * point.x + this.b;
        point.y = this.a * point.y + this.c;
    };
    Zoom.prototype.copy = function () {
        return new Zoom(this.a, this.b, this.c);
    };
    Object.defineProperty(Zoom.prototype, "scale", {
        get: function () {
            return this.a;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Zoom.prototype, "translate", {
        get: function () {
            return { x: this.b, y: this.c };
        },
        enumerable: false,
        configurable: true
    });
    return Zoom;
}());
exports.Zoom = Zoom;


/***/ }),

/***/ "./src/ts/page-interface-generated.ts":
/*!********************************************!*\
  !*** ./src/ts/page-interface-generated.ts ***!
  \********************************************/
/***/ (function() {




/***/ }),

/***/ "./src/ts/parameters.ts":
/*!******************************!*\
  !*** ./src/ts/parameters.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Parameters = exports.EPlotter = void 0;
var color_1 = __webpack_require__(/*! ./misc/color */ "./src/ts/misc/color.ts");
var web_1 = __webpack_require__(/*! ./misc/web */ "./src/ts/misc/web.ts");
__webpack_require__(/*! ./page-interface-generated */ "./src/ts/page-interface-generated.ts");
var controlId = {
    PRIMITIVE_TABS_ID: "primitive-tabs-id",
    DEPTH_RANGE_ID: "depth-range-id",
    BALANCE_RANGE_ID: "balance-range-id",
    ZOOMING_SPEED_RANGE_ID: "zooming-speed-range-id",
    MULTITHREADED_CHECKBOX_ID: "multithreaded-checkbox-id",
    RESET_BUTTON_ID: "reset-button-id",
    PLOTTER_TABS_ID: "plotter-tabs-id",
    SCALING_RANGE_ID: "scaling-range-id",
    COLOR_VARIATION_RANGE_ID: "color-variation-range-id",
    BLENDING_CHECKBOX_ID: "blending-checkbox-id",
    SHOW_INDICATORS_CHECKBOX_ID: "show-indicators-checkbox-id",
    DISPLAY_LINES_CHECKBOX_ID: "display-lines-checkbox-id",
    THICKNESS_RANGE_ID: "thickness-range-id",
    LINES_COLOR_PICKER_ID: "lines-color-picker-id",
    DOWNLOAD_BUTTON: "result-download-id",
};
var EPlotter;
(function (EPlotter) {
    EPlotter["WEBGL"] = "webgl";
    EPlotter["CANVAS2D"] = "canvas2d";
})(EPlotter || (EPlotter = {}));
exports.EPlotter = EPlotter;
var plotterQueryStringParamName = "plotter";
var multithreadedQueryStringParamName = "multithread";
function isMultithreaded() {
    return web_1.getQueryStringValue(multithreadedQueryStringParamName) === "1";
}
function getPlotter() {
    if (isMultithreaded()) {
        return EPlotter.WEBGL;
    }
    else if (web_1.getQueryStringValue(plotterQueryStringParamName) === EPlotter.CANVAS2D) {
        return EPlotter.CANVAS2D;
    }
    else {
        return EPlotter.WEBGL;
    }
}
var Parameters = (function () {
    function Parameters() {
    }
    Object.defineProperty(Parameters, "primitiveType", {
        get: function () {
            return Page.Tabs.getValues(controlId.PRIMITIVE_TABS_ID)[0];
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Parameters, "depth", {
        get: function () {
            return Page.Range.getValue(controlId.DEPTH_RANGE_ID);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Parameters, "balance", {
        get: function () {
            return Page.Range.getValue(controlId.BALANCE_RANGE_ID);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Parameters, "zoomingSpeed", {
        get: function () {
            return Page.Range.getValue(controlId.ZOOMING_SPEED_RANGE_ID);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Parameters, "scaling", {
        get: function () {
            return Page.Range.getValue(controlId.SCALING_RANGE_ID);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Parameters, "colorVariation", {
        get: function () {
            return 255 * Page.Range.getValue(controlId.COLOR_VARIATION_RANGE_ID);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Parameters, "blending", {
        get: function () {
            return Page.Checkbox.isChecked(controlId.BLENDING_CHECKBOX_ID);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Parameters, "displayLines", {
        get: function () {
            return Page.Checkbox.isChecked(controlId.DISPLAY_LINES_CHECKBOX_ID);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Parameters, "isThicknessEnabled", {
        get: function () {
            return Parameters.plotter === EPlotter.CANVAS2D;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Parameters, "thickness", {
        get: function () {
            if (Parameters.isThicknessEnabled) {
                return Page.Range.getValue(controlId.THICKNESS_RANGE_ID);
            }
            else {
                return 0;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Parameters, "linesColor", {
        get: function () {
            var color = Page.ColorPicker.getValue(controlId.LINES_COLOR_PICKER_ID);
            return new color_1.Color(color.r, color.g, color.b);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Parameters, "mousePositionInPixels", {
        get: function () {
            var canvasSize = Page.Canvas.getSize();
            var mousePosition = Page.Canvas.getMousePosition();
            return {
                x: window.devicePixelRatio * canvasSize[0] * mousePosition[0],
                y: window.devicePixelRatio * canvasSize[1] * mousePosition[1],
            };
        },
        enumerable: false,
        configurable: true
    });
    Parameters.resetObservers = [];
    Parameters.recomputeColorsObservers = [];
    Parameters.redrawObservers = [];
    Parameters.downloadObservers = [];
    Parameters.debugMode = (web_1.getQueryStringValue("debug") === "1");
    Parameters.multithreaded = isMultithreaded();
    Parameters.plotter = getPlotter();
    return Parameters;
}());
exports.Parameters = Parameters;
function callObservers(observers) {
    for (var _i = 0, observers_1 = observers; _i < observers_1.length; _i++) {
        var observer = observers_1[_i];
        observer();
    }
}
var callRedraw = function () { callObservers(Parameters.redrawObservers); };
var callReset = function () {
    callObservers(Parameters.resetObservers);
    callRedraw();
};
Page.Range.addObserver(controlId.BALANCE_RANGE_ID, callReset);
Page.Button.addObserver(controlId.RESET_BUTTON_ID, callReset);
Page.Canvas.Observers.canvasResize.push(callReset);
Page.Tabs.addObserver(controlId.PRIMITIVE_TABS_ID, callReset);
Page.Range.addObserver(controlId.COLOR_VARIATION_RANGE_ID, function () {
    callObservers(Parameters.recomputeColorsObservers);
    callRedraw();
});
Page.Range.addObserver(controlId.SCALING_RANGE_ID, callRedraw);
Page.Checkbox.addObserver(controlId.DISPLAY_LINES_CHECKBOX_ID, callRedraw);
Page.Canvas.Observers.canvasResize.push(callRedraw);
Page.Range.addObserver(controlId.THICKNESS_RANGE_ID, callRedraw);
Page.ColorPicker.addObserver(controlId.LINES_COLOR_PICKER_ID, callRedraw);
Page.FileControl.addDownloadObserver(controlId.DOWNLOAD_BUTTON, function () { callObservers(Parameters.downloadObservers); });
Page.Controls.setVisibility(controlId.THICKNESS_RANGE_ID, Parameters.isThicknessEnabled);
function updateIndicatorsVisibility() {
    Page.Canvas.setIndicatorsVisibility(Page.Checkbox.isChecked(controlId.SHOW_INDICATORS_CHECKBOX_ID));
}
Page.Checkbox.addObserver(controlId.SHOW_INDICATORS_CHECKBOX_ID, updateIndicatorsVisibility);
updateIndicatorsVisibility();
Page.Tabs.setValues(controlId.PLOTTER_TABS_ID, [Parameters.plotter]);
Page.Tabs.addObserver(controlId.PLOTTER_TABS_ID, function (values) {
    var wantedPlotter = (values[0] === EPlotter.CANVAS2D) ? EPlotter.CANVAS2D : EPlotter.WEBGL;
    Page.Tabs.clearStoredState(controlId.PLOTTER_TABS_ID);
    web_1.setQueryStringValue(plotterQueryStringParamName, wantedPlotter);
});
Page.Checkbox.setChecked(controlId.MULTITHREADED_CHECKBOX_ID, Parameters.multithreaded);
Page.Checkbox.addObserver(controlId.MULTITHREADED_CHECKBOX_ID, function (checked) {
    Page.Checkbox.clearStoredState(controlId.MULTITHREADED_CHECKBOX_ID);
    web_1.setQueryStringValue(multithreadedQueryStringParamName, checked ? "1" : null);
});
Page.Controls.setVisibility(controlId.PLOTTER_TABS_ID, !Parameters.multithreaded);


/***/ }),

/***/ "./src/ts/plotter/geometry-id.ts":
/*!***************************************!*\
  !*** ./src/ts/plotter/geometry-id.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GeometryId = void 0;
var nextFreeId = 0;
var GeometryId = (function () {
    function GeometryId(id, version) {
        this.id = id;
        this.version = version;
    }
    GeometryId.new = function () {
        return new GeometryId(nextFreeId++, 0);
    };
    GeometryId.rehydrate = function (dehydrated) {
        return new GeometryId(dehydrated.id, dehydrated.version);
    };
    GeometryId.prototype.copy = function () {
        return new GeometryId(this.id, this.version);
    };
    GeometryId.prototype.isSameAs = function (other) {
        return other !== null && this.id === other.id && this.version === other.version;
    };
    GeometryId.prototype.registerChange = function () {
        this.version++;
    };
    return GeometryId;
}());
exports.GeometryId = GeometryId;


/***/ }),

/***/ "./src/ts/plotter/plotter-canvas-2d.ts":
/*!*********************************************!*\
  !*** ./src/ts/plotter/plotter-canvas-2d.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlotterCanvas2D = void 0;
var plotter_canvas_1 = __webpack_require__(/*! ./plotter-canvas */ "./src/ts/plotter/plotter-canvas.ts");
__webpack_require__(/*! ../page-interface-generated */ "./src/ts/page-interface-generated.ts");
var PlotterCanvas2D = (function (_super) {
    __extends(PlotterCanvas2D, _super);
    function PlotterCanvas2D() {
        var _this = _super.call(this) || this;
        _this.context = _this.canvas.getContext("2d", { alpha: false });
        return _this;
    }
    Object.defineProperty(PlotterCanvas2D.prototype, "isReady", {
        get: function () {
            return true;
        },
        enumerable: false,
        configurable: true
    });
    PlotterCanvas2D.prototype.initialize = function (backgroundColor, zoom, scaling) {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.fillStyle = backgroundColor.toHexaString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.translate(+0.5 * this.width, +0.5 * this.height);
        this.context.scale(scaling, scaling);
        this.context.translate(-0.5 * this.width, -0.5 * this.height);
        var zoomTranslate = zoom.translate;
        this.context.translate(zoomTranslate.x, zoomTranslate.y);
        var zoomScale = zoom.scale;
        this.context.translate(+0.5 * this.width, +0.5 * this.height);
        this.context.scale(zoomScale, zoomScale);
        this.context.translate(-0.5 * this.width, -0.5 * this.height);
    };
    PlotterCanvas2D.prototype.finalize = function () { };
    PlotterCanvas2D.prototype.drawLines = function (batchOfLines, thickness, color, alpha) {
        if (alpha > 0 && batchOfLines) {
            this.context.fillStyle = "none";
            this.context.strokeStyle = (alpha >= 1) ? color.toHexaString() : color.toRgbaString(alpha);
            var halfWidth = 0.5 * this.width;
            var halfHeight = 0.5 * this.height;
            for (var _i = 0, _a = batchOfLines.items; _i < _a.length; _i++) {
                var line = _a[_i];
                this.context.lineWidth = thickness * this.cssPixel;
                this.context.beginPath();
                if (line.length >= 2) {
                    this.context.moveTo(line[0].x + halfWidth, line[0].y + halfHeight);
                    for (var iP = 1; iP < line.length; iP++) {
                        this.context.lineTo(line[iP].x + halfWidth, line[iP].y + halfHeight);
                    }
                }
                this.context.stroke();
                this.context.closePath();
            }
        }
    };
    PlotterCanvas2D.prototype.drawPolygons = function (batchOfPolygons, alpha) {
        if (alpha > 0 && batchOfPolygons) {
            this.context.strokeStyle = "none";
            var halfWidth = 0.5 * this.width;
            var halfHeight = 0.5 * this.height;
            for (var _i = 0, _a = batchOfPolygons.items; _i < _a.length; _i++) {
                var polygon = _a[_i];
                if (polygon.vertices.length >= 3) {
                    this.context.fillStyle = (alpha >= 1) ? polygon.color.toHexaString() : polygon.color.toRgbaString(alpha);
                    this.context.beginPath();
                    this.context.moveTo(polygon.vertices[0].x + halfWidth, polygon.vertices[0].y + halfHeight);
                    for (var iP = 1; iP < polygon.vertices.length; iP++) {
                        this.context.lineTo(polygon.vertices[iP].x + halfWidth, polygon.vertices[iP].y + halfHeight);
                    }
                    this.context.closePath();
                    this.context.fill();
                }
            }
        }
    };
    return PlotterCanvas2D;
}(plotter_canvas_1.PlotterCanvas));
exports.PlotterCanvas2D = PlotterCanvas2D;


/***/ }),

/***/ "./src/ts/plotter/plotter-canvas.ts":
/*!******************************************!*\
  !*** ./src/ts/plotter/plotter-canvas.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlotterCanvas = void 0;
var rectangle_1 = __webpack_require__(/*! ../misc/rectangle */ "./src/ts/misc/rectangle.ts");
__webpack_require__(/*! ../page-interface-generated */ "./src/ts/page-interface-generated.ts");
var PlotterCanvas = (function () {
    function PlotterCanvas() {
        var _a;
        this.canvas = Page.Canvas.getCanvas();
        this.cssPixel = (_a = window.devicePixelRatio) !== null && _a !== void 0 ? _a : 1;
        this.resizeCanvas();
    }
    Object.defineProperty(PlotterCanvas.prototype, "viewport", {
        get: function () {
            return new rectangle_1.Rectangle(-0.5 * this._width, 0.5 * this._width, -0.5 * this._height, 0.5 * this._height);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PlotterCanvas.prototype, "width", {
        get: function () {
            return this._width;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PlotterCanvas.prototype, "height", {
        get: function () {
            return this._height;
        },
        enumerable: false,
        configurable: true
    });
    PlotterCanvas.prototype.resizeCanvas = function () {
        var actualWidth = Math.floor(this.cssPixel * this.canvas.clientWidth);
        var actualHeight = Math.floor(this.cssPixel * this.canvas.clientHeight);
        if (this.canvas.width !== actualWidth || this.canvas.height !== actualHeight) {
            this.canvas.width = actualWidth;
            this.canvas.height = actualHeight;
        }
        this._width = this.canvas.width;
        this._height = this.canvas.height;
    };
    return PlotterCanvas;
}());
exports.PlotterCanvas = PlotterCanvas;


/***/ }),

/***/ "./src/ts/plotter/plotter-svg.ts":
/*!***************************************!*\
  !*** ./src/ts/plotter/plotter-svg.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlotterSVG = void 0;
var PlotterSVG = (function () {
    function PlotterSVG(width, height) {
        this.width = width;
        this.height = height;
        this.lines = [];
    }
    PlotterSVG.prototype.initialize = function (backgroundColor, zoom, scaling) {
        this.lines = [];
        this.lines.push("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>");
        this.lines.push("<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 " + this.width + " " + this.height + "\">");
        this.lines.push("<rect fill=\"" + backgroundColor.toHexaString() + "\" stroke=\"none\" x=\"0\" y=\"0\" width=\"" + this.width + "\" height=\"" + this.height + "\"/>");
        this.lines.push("\t<g transform=\"scale(" + scaling + ")\" transform-origin=\"" + 0.5 * this.width + " " + 0.5 * this.height + "\">");
        var zoomTranslate = zoom.translate;
        this.lines.push("\t\t<g transform=\"translate(" + zoomTranslate.x + ", " + zoomTranslate.y + ")\">");
        this.lines.push("\t\t\t<g transform=\"scale(" + zoom.scale + ")\" transform-origin=\"" + 0.5 * this.width + " " + 0.5 * this.height + "\">");
    };
    PlotterSVG.prototype.finalize = function () {
        this.lines.push("\t\t\t</g>");
        this.lines.push("\t\t</g>");
        this.lines.push("\t</g>");
        this.lines.push("</svg>");
    };
    PlotterSVG.prototype.drawLines = function (batchOfLines, thickness, color, alpha) {
        if (alpha > 0 && batchOfLines) {
            this.lines.push("\t\t\t\t<g stroke=\"" + color.toHexaString() + "\" fill=\"none\" opacity=\"" + alpha + "\">");
            var halfWidth = 0.5 * this.width;
            var halfHeight = 0.5 * this.height;
            for (var _i = 0, _a = batchOfLines.items; _i < _a.length; _i++) {
                var line = _a[_i];
                var path = [];
                if (line.length >= 2) {
                    path.push("M" + (line[0].x + halfWidth) + " " + (line[0].y + halfHeight));
                    for (var iP = 1; iP < line.length; iP++) {
                        path.push("L" + (line[iP].x + halfWidth) + " " + (line[iP].y + halfHeight));
                    }
                }
                if (path.length > 0) {
                    this.lines.push("\t\t\t\t\t<path stroke-width=\"" + thickness + "\" d=\"" + path.join() + "\"/>");
                }
            }
            this.lines.push("\t\t\t\t</g>");
        }
    };
    PlotterSVG.prototype.drawPolygons = function (batchOfPolygons, alpha) {
        if (alpha > 0 && batchOfPolygons) {
            this.lines.push("\t\t\t\t<g stroke=\"none\" opacity=\"" + alpha + "\">");
            var halfWidth = 0.5 * this.width;
            var halfHeight = 0.5 * this.height;
            for (var _i = 0, _a = batchOfPolygons.items; _i < _a.length; _i++) {
                var polygon = _a[_i];
                if (polygon.vertices.length >= 3) {
                    var path = [];
                    if (polygon.vertices.length >= 3) {
                        path.push("M" + (polygon.vertices[0].x + halfWidth) + " " + (polygon.vertices[0].y + halfHeight));
                        for (var iP = 1; iP < polygon.vertices.length; iP++) {
                            path.push("L" + (polygon.vertices[iP].x + halfWidth) + " " + (polygon.vertices[iP].y + halfHeight));
                        }
                    }
                    if (path.length > 0) {
                        this.lines.push("\t\t\t\t\t<path fill=\"" + polygon.color.toHexaString() + "\" d=\"" + path.join() + "\"/>");
                    }
                }
            }
            this.lines.push("\t\t\t\t</g>");
        }
    };
    PlotterSVG.prototype.output = function () {
        return this.lines.join("\n");
    };
    return PlotterSVG;
}());
exports.PlotterSVG = PlotterSVG;


/***/ }),

/***/ "./src/ts/plotter/plotter-webgl-basic.ts":
/*!***********************************************!*\
  !*** ./src/ts/plotter/plotter-webgl-basic.ts ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlotterWebGLBasic = void 0;
var color_1 = __webpack_require__(/*! ../misc/color */ "./src/ts/misc/color.ts");
var Loader = __importStar(__webpack_require__(/*! ../misc/loader */ "./src/ts/misc/loader.ts"));
var plotter_canvas_1 = __webpack_require__(/*! ./plotter-canvas */ "./src/ts/plotter/plotter-canvas.ts");
var GLCanvas = __importStar(__webpack_require__(/*! ../gl-utils/gl-canvas */ "./src/ts/gl-utils/gl-canvas.ts"));
var gl_canvas_1 = __webpack_require__(/*! ../gl-utils/gl-canvas */ "./src/ts/gl-utils/gl-canvas.ts");
var ShaderManager = __importStar(__webpack_require__(/*! ../gl-utils/shader-manager */ "./src/ts/gl-utils/shader-manager.ts"));
var viewport_1 = __webpack_require__(/*! ../gl-utils/viewport */ "./src/ts/gl-utils/viewport.ts");
__webpack_require__(/*! ../page-interface-generated */ "./src/ts/page-interface-generated.ts");
var PlotterWebGLBasic = (function (_super) {
    __extends(PlotterWebGLBasic, _super);
    function PlotterWebGLBasic() {
        var _this = _super.call(this) || this;
        var webglFlags = {
            alpha: false,
            antialias: true,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false,
        };
        if (!GLCanvas.initGL(webglFlags)) {
            return _this;
        }
        gl_canvas_1.gl.disable(gl_canvas_1.gl.CULL_FACE);
        gl_canvas_1.gl.enable(gl_canvas_1.gl.BLEND);
        gl_canvas_1.gl.blendFunc(gl_canvas_1.gl.SRC_ALPHA, gl_canvas_1.gl.ONE_MINUS_SRC_ALPHA);
        gl_canvas_1.gl.disable(gl_canvas_1.gl.DEPTH_TEST);
        gl_canvas_1.gl.disable(gl_canvas_1.gl.STENCIL_TEST);
        PlotterWebGLBasic.asyncLoadShader("shaderLines.vert", "shaderLines.frag", function (shader) {
            _this.shaderLines = shader;
        });
        PlotterWebGLBasic.asyncLoadShader("shaderPolygons.vert", "shaderPolygons.frag", function (shader) {
            _this.shaderPolygons = shader;
        });
        _this.linesVbo = {
            id: gl_canvas_1.gl.createBuffer(),
            vboParts: [],
        };
        _this.polygonsVbo = {
            id: gl_canvas_1.gl.createBuffer(),
            vboParts: [],
        };
        return _this;
    }
    PlotterWebGLBasic.buildLinesVboBuffer = function (batchesOfLines) {
        var bufferParts = [];
        var totalNbVertices = 0;
        for (var _i = 0, batchesOfLines_1 = batchesOfLines; _i < batchesOfLines_1.length; _i++) {
            var batchOfLines = batchesOfLines_1[_i];
            var indexOfFirstVertice = totalNbVertices;
            var batchVerticesCount = 0;
            for (var _a = 0, _b = batchOfLines.items; _a < _b.length; _a++) {
                var line = _b[_a];
                if (line.length >= 2) {
                    batchVerticesCount += 2 + 2 * (line.length - 2);
                }
            }
            totalNbVertices += batchVerticesCount;
            bufferParts.push({
                indexOfFirstVertice: indexOfFirstVertice,
                verticesCount: batchVerticesCount,
                geometryId: batchOfLines.geometryId.copy(),
            });
        }
        var FLOATS_PER_VERTICE = 2;
        var buffer = new Float32Array(FLOATS_PER_VERTICE * totalNbVertices);
        var i = 0;
        for (var _c = 0, batchesOfLines_2 = batchesOfLines; _c < batchesOfLines_2.length; _c++) {
            var batchOfLines = batchesOfLines_2[_c];
            for (var _d = 0, _e = batchOfLines.items; _d < _e.length; _d++) {
                var line = _e[_d];
                if (line.length >= 2) {
                    buffer[i++] = line[0].x;
                    buffer[i++] = line[0].y;
                    for (var iP = 1; iP < line.length - 1; iP++) {
                        buffer[i++] = line[iP].x;
                        buffer[i++] = line[iP].y;
                        buffer[i++] = line[iP].x;
                        buffer[i++] = line[iP].y;
                    }
                    buffer[i++] = line[line.length - 1].x;
                    buffer[i++] = line[line.length - 1].y;
                }
            }
        }
        if (i !== buffer.length) {
            console.log("ALERT LINES");
        }
        return {
            buffer: buffer,
            bufferParts: bufferParts,
        };
    };
    PlotterWebGLBasic.buildPolygonsVboBuffer = function (batchesOfPolygons) {
        var bufferParts = [];
        var totalNbVertices = 0;
        for (var _i = 0, batchesOfPolygons_1 = batchesOfPolygons; _i < batchesOfPolygons_1.length; _i++) {
            var batchOfPolygons = batchesOfPolygons_1[_i];
            var indexOfFirstVertice = totalNbVertices;
            var batchVerticesCount = 0;
            for (var _a = 0, _b = batchOfPolygons.items; _a < _b.length; _a++) {
                var polygon = _b[_a];
                if (polygon.vertices.length >= 3) {
                    batchVerticesCount += 3 * (polygon.vertices.length - 2);
                }
            }
            totalNbVertices += batchVerticesCount;
            bufferParts.push({
                indexOfFirstVertice: indexOfFirstVertice,
                verticesCount: batchVerticesCount,
                geometryId: batchOfPolygons.geometryId.copy(),
            });
        }
        var FLOATS_PER_VERTICE = 6;
        var buffer = new Float32Array(FLOATS_PER_VERTICE * totalNbVertices);
        var i = 0;
        for (var _c = 0, batchesOfPolygons_2 = batchesOfPolygons; _c < batchesOfPolygons_2.length; _c++) {
            var batchOfPolygons = batchesOfPolygons_2[_c];
            for (var _d = 0, _e = batchOfPolygons.items; _d < _e.length; _d++) {
                var polygon = _e[_d];
                if (polygon.vertices.length >= 3) {
                    var red = polygon.color.r / 255;
                    var green = polygon.color.g / 255;
                    var blue = polygon.color.b / 255;
                    for (var iP = 1; iP < polygon.vertices.length - 1; iP++) {
                        buffer[i++] = polygon.vertices[0].x;
                        buffer[i++] = polygon.vertices[0].y;
                        buffer[i++] = red;
                        buffer[i++] = green;
                        buffer[i++] = blue;
                        i++;
                        buffer[i++] = polygon.vertices[iP].x;
                        buffer[i++] = polygon.vertices[iP].y;
                        buffer[i++] = red;
                        buffer[i++] = green;
                        buffer[i++] = blue;
                        i++;
                        buffer[i++] = polygon.vertices[iP + 1].x;
                        buffer[i++] = polygon.vertices[iP + 1].y;
                        buffer[i++] = red;
                        buffer[i++] = green;
                        buffer[i++] = blue;
                        i++;
                    }
                }
            }
        }
        return {
            buffer: buffer,
            bufferParts: bufferParts,
        };
    };
    Object.defineProperty(PlotterWebGLBasic.prototype, "isReady", {
        get: function () {
            return !!this.shaderLines && !!this.shaderPolygons;
        },
        enumerable: false,
        configurable: true
    });
    PlotterWebGLBasic.prototype.initialize = function (backgroundColor, zoom, scaling) {
        for (var _i = 0, _a = this.linesVbo.vboParts; _i < _a.length; _i++) {
            var vboPart = _a[_i];
            vboPart.scheduledForDrawing = false;
        }
        for (var _b = 0, _c = this.polygonsVbo.vboParts; _b < _c.length; _b++) {
            var vboPart = _c[_b];
            vboPart.scheduledForDrawing = false;
        }
        viewport_1.Viewport.setFullCanvas(gl_canvas_1.gl);
        gl_canvas_1.gl.clearColor(backgroundColor.r / 255, backgroundColor.g / 255, backgroundColor.b / 255, 1);
        gl_canvas_1.gl.clear(gl_canvas_1.gl.COLOR_BUFFER_BIT);
        var zoomTranslate = zoom.translate;
        var zoomAndScalingAsUniform = [zoom.scale, zoomTranslate.x, zoomTranslate.y, scaling];
        this.shaderLines.u["uZoom"].value = zoomAndScalingAsUniform;
        this.shaderPolygons.u["uZoom"].value = zoomAndScalingAsUniform;
    };
    PlotterWebGLBasic.prototype.finalize = function () {
        this.drawPolygonsVBO();
        this.drawLinesVBO();
    };
    PlotterWebGLBasic.prototype.uploadLinesVbo = function (newLinesVbo) {
        gl_canvas_1.gl.bindBuffer(gl_canvas_1.gl.ARRAY_BUFFER, this.linesVbo.id);
        gl_canvas_1.gl.bufferData(gl_canvas_1.gl.ARRAY_BUFFER, newLinesVbo.buffer, gl_canvas_1.gl.DYNAMIC_DRAW);
        this.linesVbo.vboParts = [];
        for (var _i = 0, _a = newLinesVbo.bufferParts; _i < _a.length; _i++) {
            var bufferPart = _a[_i];
            this.linesVbo.vboParts.push({
                indexOfFirstVertice: bufferPart.indexOfFirstVertice,
                verticesCount: bufferPart.verticesCount,
                scheduledForDrawing: false,
                geometryId: bufferPart.geometryId.copy(),
                color: color_1.Color.GREEN,
                alpha: 1,
            });
        }
    };
    PlotterWebGLBasic.prototype.uploadPolygonsVbo = function (newPolygonsVbo) {
        gl_canvas_1.gl.bindBuffer(gl_canvas_1.gl.ARRAY_BUFFER, this.polygonsVbo.id);
        gl_canvas_1.gl.bufferData(gl_canvas_1.gl.ARRAY_BUFFER, newPolygonsVbo.buffer, gl_canvas_1.gl.DYNAMIC_DRAW);
        this.polygonsVbo.vboParts = [];
        for (var _i = 0, _a = newPolygonsVbo.bufferParts; _i < _a.length; _i++) {
            var bufferPart = _a[_i];
            this.polygonsVbo.vboParts.push({
                indexOfFirstVertice: bufferPart.indexOfFirstVertice,
                verticesCount: bufferPart.verticesCount,
                scheduledForDrawing: false,
                geometryId: bufferPart.geometryId.copy(),
                alpha: 1,
            });
        }
    };
    PlotterWebGLBasic.prototype.registerLinesVboPartForDrawing = function (vboPartId, color, alpha) {
        var uploadedVBOPart = PlotterWebGLBasic.findUploadedVBOPart(this.linesVbo, vboPartId);
        if (uploadedVBOPart) {
            uploadedVBOPart.color = color;
            uploadedVBOPart.alpha = alpha;
            uploadedVBOPart.scheduledForDrawing = true;
            return true;
        }
        return false;
    };
    PlotterWebGLBasic.prototype.registerPolygonsVboPartForDrawing = function (vboPartId, alpha) {
        var uploadedVBOPart = PlotterWebGLBasic.findUploadedVBOPart(this.polygonsVbo, vboPartId);
        if (uploadedVBOPart) {
            uploadedVBOPart.alpha = alpha;
            uploadedVBOPart.scheduledForDrawing = true;
            return true;
        }
        return false;
    };
    PlotterWebGLBasic.prototype.drawLinesVBO = function () {
        var vbpPartsScheduledForDrawing = PlotterWebGLBasic.selectVBOPartsScheduledForDrawing(this.linesVbo);
        if (this.shaderLines && vbpPartsScheduledForDrawing.length > 0) {
            this.shaderLines.use();
            var aVertexLocation = this.shaderLines.a["aVertex"].loc;
            gl_canvas_1.gl.enableVertexAttribArray(aVertexLocation);
            gl_canvas_1.gl.bindBuffer(gl_canvas_1.gl.ARRAY_BUFFER, this.linesVbo.id);
            gl_canvas_1.gl.vertexAttribPointer(aVertexLocation, 2, gl_canvas_1.gl.FLOAT, false, 0, 0);
            this.shaderLines.u["uScreenSize"].value = [0.5 * this.width, -0.5 * this.height];
            var currentVboPartId = 0;
            while (currentVboPartId < vbpPartsScheduledForDrawing.length) {
                var currentVboPart = vbpPartsScheduledForDrawing[currentVboPartId];
                var indexOfFirstVertice = currentVboPart.indexOfFirstVertice;
                var verticesCount = currentVboPart.verticesCount;
                var nextVboPart = vbpPartsScheduledForDrawing[currentVboPartId + 1];
                while (PlotterWebGLBasic.canLinesVboPartsBeMerged(currentVboPart, nextVboPart)) {
                    verticesCount += nextVboPart.verticesCount;
                    currentVboPartId++;
                    currentVboPart = nextVboPart;
                    nextVboPart = vbpPartsScheduledForDrawing[currentVboPartId + 1];
                }
                this.shaderLines.u["uColor"].value = [currentVboPart.color.r / 255, currentVboPart.color.g / 255, currentVboPart.color.b / 255, currentVboPart.alpha];
                this.shaderLines.bindUniforms();
                gl_canvas_1.gl.drawArrays(gl_canvas_1.gl.LINES, indexOfFirstVertice, verticesCount);
                currentVboPartId++;
            }
        }
    };
    PlotterWebGLBasic.prototype.drawPolygonsVBO = function () {
        var vbpPartsScheduledForDrawing = PlotterWebGLBasic.selectVBOPartsScheduledForDrawing(this.polygonsVbo);
        if (this.shaderPolygons && vbpPartsScheduledForDrawing.length > 0) {
            this.shaderPolygons.use();
            var BYTES_PER_FLOAT = Float32Array.BYTES_PER_ELEMENT;
            var aPositionLoc = this.shaderPolygons.a["aPosition"].loc;
            var aColorLoc = this.shaderPolygons.a["aColor"].loc;
            gl_canvas_1.gl.bindBuffer(gl_canvas_1.gl.ARRAY_BUFFER, this.polygonsVbo.id);
            gl_canvas_1.gl.enableVertexAttribArray(aPositionLoc);
            gl_canvas_1.gl.vertexAttribPointer(aPositionLoc, 2, gl_canvas_1.gl.FLOAT, false, BYTES_PER_FLOAT * 6, 0);
            gl_canvas_1.gl.enableVertexAttribArray(aColorLoc);
            gl_canvas_1.gl.vertexAttribPointer(aColorLoc, 4, gl_canvas_1.gl.FLOAT, false, BYTES_PER_FLOAT * 6, BYTES_PER_FLOAT * 2);
            this.shaderPolygons.u["uScreenSize"].value = [0.5 * this.width, -0.5 * this.height];
            for (var _i = 0, vbpPartsScheduledForDrawing_1 = vbpPartsScheduledForDrawing; _i < vbpPartsScheduledForDrawing_1.length; _i++) {
                var vboPart = vbpPartsScheduledForDrawing_1[_i];
                this.shaderPolygons.u["uAlpha"].value = vboPart.alpha;
                this.shaderPolygons.bindUniforms();
                gl_canvas_1.gl.drawArrays(gl_canvas_1.gl.TRIANGLES, vboPart.indexOfFirstVertice, vboPart.verticesCount);
            }
        }
    };
    PlotterWebGLBasic.selectVBOPartsScheduledForDrawing = function (partitionedVBO) {
        return partitionedVBO.vboParts.filter(function (vboPart) { return vboPart.scheduledForDrawing; });
    };
    PlotterWebGLBasic.findUploadedVBOPart = function (uploadedVBO, searchedGeometryId) {
        return uploadedVBO.vboParts.find(function (vboPart) { return vboPart.geometryId.isSameAs(searchedGeometryId); });
    };
    PlotterWebGLBasic.canLinesVboPartsBeMerged = function (vboPart1, vboPart2) {
        return vboPart1 && vboPart2 &&
            (vboPart2.indexOfFirstVertice === vboPart1.indexOfFirstVertice + vboPart1.verticesCount) &&
            (vboPart1.color.r === vboPart2.color.r) &&
            (vboPart1.color.g === vboPart2.color.g) &&
            (vboPart1.color.b === vboPart2.color.b) &&
            (vboPart1.alpha === vboPart2.alpha);
    };
    PlotterWebGLBasic.asyncLoadShader = function (vertexFilename, fragmentFilename, callback) {
        var id = vertexFilename + "__" + fragmentFilename + "__" + Math.random();
        Loader.registerLoadingObject(id);
        ShaderManager.buildShader({
            fragmentFilename: fragmentFilename,
            vertexFilename: vertexFilename,
            injected: {},
        }, function (builtShader) {
            Loader.registerLoadedObject(id);
            if (builtShader !== null) {
                callback(builtShader);
            }
            else {
                Page.Demopage.setErrorMessage(name + "-shader-error", "Failed to build '" + name + "' shader.");
            }
        });
    };
    return PlotterWebGLBasic;
}(plotter_canvas_1.PlotterCanvas));
exports.PlotterWebGLBasic = PlotterWebGLBasic;


/***/ }),

/***/ "./src/ts/plotter/plotter-webgl.ts":
/*!*****************************************!*\
  !*** ./src/ts/plotter/plotter-webgl.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlotterWebGL = void 0;
var plotter_webgl_basic_1 = __webpack_require__(/*! ./plotter-webgl-basic */ "./src/ts/plotter/plotter-webgl-basic.ts");
var PlotterWebGL = (function (_super) {
    __extends(PlotterWebGL, _super);
    function PlotterWebGL() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.pendingLinesList = [];
        _this.pendingPolygonsList = [];
        return _this;
    }
    PlotterWebGL.prototype.finalize = function () {
        if (this.pendingPolygonsList.length > 0) {
            for (var _i = 0, _a = this.pendingPolygonsList; _i < _a.length; _i++) {
                var pendingPolygons = _a[_i];
                if (!this.registerPolygonsVboPartForDrawing(pendingPolygons.batchOfPolygons.geometryId, pendingPolygons.alpha)) {
                    this.buildAndUploadPolygonsVBO();
                    break;
                }
            }
            this.pendingPolygonsList = [];
        }
        if (this.pendingLinesList.length > 0) {
            for (var _b = 0, _c = this.pendingLinesList; _b < _c.length; _b++) {
                var pendingLines = _c[_b];
                if (!this.registerLinesVboPartForDrawing(pendingLines.batchOfLines.geometryId, pendingLines.color, pendingLines.alpha)) {
                    this.buildAndUploadLinesVBO();
                    break;
                }
            }
            this.pendingLinesList = [];
        }
        _super.prototype.finalize.call(this);
    };
    PlotterWebGL.prototype.drawLines = function (batchOfLines, _thickness, color, alpha) {
        this.pendingLinesList.push({ batchOfLines: batchOfLines, color: color, alpha: alpha });
    };
    PlotterWebGL.prototype.drawPolygons = function (batchOfPolygons, alpha) {
        this.pendingPolygonsList.push({ batchOfPolygons: batchOfPolygons, alpha: alpha });
    };
    PlotterWebGL.prototype.buildAndUploadLinesVBO = function () {
        var pendingBatchesOfLines = [];
        for (var _i = 0, _a = this.pendingLinesList; _i < _a.length; _i++) {
            var pendingLines = _a[_i];
            pendingBatchesOfLines.push(pendingLines.batchOfLines);
        }
        var linesVboBuffer = plotter_webgl_basic_1.PlotterWebGLBasic.buildLinesVboBuffer(pendingBatchesOfLines);
        this.uploadLinesVbo(linesVboBuffer);
        for (var _b = 0, _c = this.pendingLinesList; _b < _c.length; _b++) {
            var pendingLines = _c[_b];
            this.registerLinesVboPartForDrawing(pendingLines.batchOfLines.geometryId, pendingLines.color, pendingLines.alpha);
        }
    };
    PlotterWebGL.prototype.buildAndUploadPolygonsVBO = function () {
        var pendingBatchesOfPolygons = [];
        for (var _i = 0, _a = this.pendingPolygonsList; _i < _a.length; _i++) {
            var pendingPolygons = _a[_i];
            pendingBatchesOfPolygons.push(pendingPolygons.batchOfPolygons);
        }
        var polygonsVboBuffer = plotter_webgl_basic_1.PlotterWebGLBasic.buildPolygonsVboBuffer(pendingBatchesOfPolygons);
        this.uploadPolygonsVbo(polygonsVboBuffer);
        for (var _b = 0, _c = this.pendingPolygonsList; _b < _c.length; _b++) {
            var pendingPolygons = _c[_b];
            this.registerPolygonsVboPartForDrawing(pendingPolygons.batchOfPolygons.geometryId, pendingPolygons.alpha);
        }
    };
    return PlotterWebGL;
}(plotter_webgl_basic_1.PlotterWebGLBasic));
exports.PlotterWebGL = PlotterWebGL;


/***/ }),

/***/ "./src/ts/primitives/primitive-base.ts":
/*!*********************************************!*\
  !*** ./src/ts/primitives/primitive-base.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrimitiveBase = exports.EVisibility = void 0;
var tree_node_1 = __webpack_require__(/*! ../engine/tree-node */ "./src/ts/engine/tree-node.ts");
var EVisibility;
(function (EVisibility) {
    EVisibility[EVisibility["OUT_OF_VIEW"] = 0] = "OUT_OF_VIEW";
    EVisibility[EVisibility["VISIBLE"] = 1] = "VISIBLE";
    EVisibility[EVisibility["COVERS_VIEW"] = 2] = "COVERS_VIEW";
})(EVisibility || (EVisibility = {}));
exports.EVisibility = EVisibility;
var PrimitiveBase = (function (_super) {
    __extends(PrimitiveBase, _super);
    function PrimitiveBase(color) {
        var _this = _super.call(this) || this;
        _this.subdivision = null;
        _this._color = color;
        return _this;
    }
    PrimitiveBase.prototype.setColor = function (color, childrenColorVariation) {
        this._color = color;
        var children = this.getDirectChildren();
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var child = children_1[_i];
            var childColor = this.color.computeCloseColor(childrenColorVariation);
            child.setColor(childColor, childrenColorVariation);
        }
    };
    Object.defineProperty(PrimitiveBase.prototype, "color", {
        get: function () {
            return this._color;
        },
        enumerable: false,
        configurable: true
    });
    PrimitiveBase.prototype.removeChildren = function () {
        _super.prototype.removeChildren.call(this);
        this.subdivision = null;
    };
    PrimitiveBase.prototype.getOutline = function () {
        var result = this.vertices;
        result.push(result[0]);
        return result;
    };
    PrimitiveBase.prototype.zoom = function (zoom, isRoot) {
        this.applyZoom(zoom, isRoot);
        var children = this.getDirectChildren();
        for (var _i = 0, children_2 = children; _i < children_2.length; _i++) {
            var child = children_2[_i];
            child.zoom(zoom, false);
        }
    };
    return PrimitiveBase;
}(tree_node_1.TreeNode));
exports.PrimitiveBase = PrimitiveBase;


/***/ }),

/***/ "./src/ts/primitives/primitive-quads.ts":
/*!**********************************************!*\
  !*** ./src/ts/primitives/primitive-quads.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrimitiveQuads = void 0;
var Arithmetics = __importStar(__webpack_require__(/*! ../misc/arithmetics */ "./src/ts/misc/arithmetics.ts"));
var primitive_base_1 = __webpack_require__(/*! ./primitive-base */ "./src/ts/primitives/primitive-base.ts");
var primitive_type_enum_1 = __webpack_require__(/*! ./primitive-type-enum */ "./src/ts/primitives/primitive-type-enum.ts");
var PrimitiveQuads = (function (_super) {
    __extends(PrimitiveQuads, _super);
    function PrimitiveQuads(topLeft, topRight, bottomLeft, bottomRight, color) {
        var _this = _super.call(this, color) || this;
        _this.topLeft = topLeft;
        _this.topRight = topRight;
        _this.bottomLeft = bottomLeft;
        _this.bottomRight = bottomRight;
        _this.primitiveType = primitive_type_enum_1.EPrimitiveType.QUADS;
        return _this;
    }
    Object.defineProperty(PrimitiveQuads.prototype, "subdivisionFactor", {
        get: function () {
            return 2;
        },
        enumerable: false,
        configurable: true
    });
    PrimitiveQuads.prototype.subdivide = function (subdivisionBalance, childrenColorVariation) {
        this.removeChildren();
        var minRand = 0.5 * subdivisionBalance;
        var maxRand = 1 - minRand;
        var rand1 = Arithmetics.random(minRand, maxRand);
        var rand2 = Arithmetics.random(minRand, maxRand);
        var leftToRightDistance = Math.max(Arithmetics.squaredDistance(this.topLeft, this.topRight), Arithmetics.squaredDistance(this.bottomLeft, this.bottomRight));
        var topToBottomDistance = Math.max(Arithmetics.squaredDistance(this.topLeft, this.bottomLeft), Arithmetics.squaredDistance(this.topRight, this.bottomRight));
        if (leftToRightDistance > topToBottomDistance) {
            this.subdivision = [
                Arithmetics.interpolatePoint(this.topLeft, this.topRight, rand1),
                Arithmetics.interpolatePoint(this.bottomLeft, this.bottomRight, rand2),
            ];
            this.addChildren(new PrimitiveQuads(this.topLeft, this.subdivision[0], this.bottomLeft, this.subdivision[1], this.color.computeCloseColor(childrenColorVariation)), new PrimitiveQuads(this.subdivision[0], this.topRight, this.subdivision[1], this.bottomRight, this.color.computeCloseColor(childrenColorVariation)));
        }
        else {
            this.subdivision = [
                Arithmetics.interpolatePoint(this.topLeft, this.bottomLeft, rand1),
                Arithmetics.interpolatePoint(this.topRight, this.bottomRight, rand2),
            ];
            this.addChildren(new PrimitiveQuads(this.topLeft, this.topRight, this.subdivision[0], this.subdivision[1], this.color.computeCloseColor(childrenColorVariation)), new PrimitiveQuads(this.subdivision[0], this.subdivision[1], this.bottomLeft, this.bottomRight, this.color.computeCloseColor(childrenColorVariation)));
        }
    };
    Object.defineProperty(PrimitiveQuads.prototype, "vertices", {
        get: function () {
            return [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft];
        },
        enumerable: false,
        configurable: true
    });
    PrimitiveQuads.prototype.applyZoom = function (zoom, isRoot) {
        if (isRoot) {
            zoom.applyToPoint(this.topLeft);
            zoom.applyToPoint(this.topRight);
            zoom.applyToPoint(this.bottomLeft);
            zoom.applyToPoint(this.bottomRight);
        }
        if (this.subdivision) {
            for (var _i = 0, _a = this.subdivision; _i < _a.length; _i++) {
                var point = _a[_i];
                zoom.applyToPoint(point);
            }
        }
    };
    PrimitiveQuads.prototype.computeVisibility = function (viewport) {
        var viewportTopRight = { x: viewport.bottomRight.x, y: viewport.topLeft.y };
        var viewportBottomLeft = { x: viewport.topLeft.x, y: viewport.bottomRight.y };
        var viewTopLeftInside = this.isInside(viewport.topLeft);
        var viewTopRightInside = this.isInside(viewportTopRight);
        var viewBottomLeftInside = this.isInside(viewportBottomLeft);
        var viewBottomRightInside = this.isInside(viewport.bottomRight);
        if (viewTopLeftInside && viewTopRightInside && viewBottomLeftInside && viewBottomRightInside) {
            return primitive_base_1.EVisibility.COVERS_VIEW;
        }
        else if (viewTopLeftInside || viewTopRightInside || viewBottomLeftInside || viewBottomRightInside) {
            return primitive_base_1.EVisibility.VISIBLE;
        }
        else if (viewport.containsPoint(this.topLeft) || viewport.containsPoint(this.topRight) ||
            viewport.containsPoint(this.bottomLeft) || viewport.containsPoint(this.bottomRight)) {
            return primitive_base_1.EVisibility.VISIBLE;
        }
        else if (viewport.lineIntersectsBoundaries(this.topLeft, this.topRight) ||
            viewport.lineIntersectsBoundaries(this.topRight, this.bottomRight) ||
            viewport.lineIntersectsBoundaries(this.bottomRight, this.bottomLeft) ||
            viewport.lineIntersectsBoundaries(this.bottomLeft, this.topLeft)) {
            return primitive_base_1.EVisibility.VISIBLE;
        }
        else {
            return primitive_base_1.EVisibility.OUT_OF_VIEW;
        }
    };
    PrimitiveQuads.prototype.isInside = function (point) {
        var SIDE_TL_TR = Arithmetics.getSide(this.topLeft, this.topRight, point);
        var SIDE_TR_BL = Arithmetics.getSide(this.topRight, this.bottomLeft, point);
        var SIDE_BL_TL = Arithmetics.getSide(this.bottomLeft, this.topLeft, point);
        if (Arithmetics.areSameSign(SIDE_TL_TR, SIDE_TR_BL, SIDE_BL_TL)) {
            return true;
        }
        var SIDE_BL_BR = Arithmetics.getSide(this.bottomLeft, this.bottomRight, point);
        var SIDE_BR_TR = Arithmetics.getSide(this.bottomRight, this.topRight, point);
        if (Arithmetics.areSameSign(SIDE_TR_BL, SIDE_BL_BR, SIDE_BR_TR)) {
            return true;
        }
        return false;
    };
    return PrimitiveQuads;
}(primitive_base_1.PrimitiveBase));
exports.PrimitiveQuads = PrimitiveQuads;


/***/ }),

/***/ "./src/ts/primitives/primitive-triangles-nested.ts":
/*!*********************************************************!*\
  !*** ./src/ts/primitives/primitive-triangles-nested.ts ***!
  \*********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrimitiveTrianglesNested = void 0;
var Arithmetics = __importStar(__webpack_require__(/*! ../misc/arithmetics */ "./src/ts/misc/arithmetics.ts"));
var primitive_triangles_1 = __webpack_require__(/*! ./primitive-triangles */ "./src/ts/primitives/primitive-triangles.ts");
var primitive_type_enum_1 = __webpack_require__(/*! ./primitive-type-enum */ "./src/ts/primitives/primitive-type-enum.ts");
var PrimitiveTrianglesNested = (function (_super) {
    __extends(PrimitiveTrianglesNested, _super);
    function PrimitiveTrianglesNested(p1, p2, p3, color) {
        var _this = _super.call(this, p1, p2, p3, color) || this;
        _this.primitiveType = primitive_type_enum_1.EPrimitiveType.NESTED_TRIANGLES;
        return _this;
    }
    Object.defineProperty(PrimitiveTrianglesNested.prototype, "subdivisionFactor", {
        get: function () {
            return 4;
        },
        enumerable: false,
        configurable: true
    });
    PrimitiveTrianglesNested.prototype.subdivide = function (subdivisionBalance, childrenColorVariation) {
        this.removeChildren();
        this.midPoint1 = this.randomNewPoint(this.p1, this.p2, subdivisionBalance);
        this.midPoint2 = this.randomNewPoint(this.p2, this.p3, subdivisionBalance);
        this.midPoint3 = this.randomNewPoint(this.p3, this.p1, subdivisionBalance);
        this.subdivision = [
            this.midPoint1,
            this.midPoint2,
            this.midPoint3,
            this.midPoint1,
        ];
        this.addChildren(new PrimitiveTrianglesNested(this.midPoint1, this.midPoint2, this.midPoint3, this.color.computeCloseColor(childrenColorVariation)), new PrimitiveTrianglesNested(this.p1, this.midPoint1, this.midPoint3, this.color.computeCloseColor(childrenColorVariation)), new PrimitiveTrianglesNested(this.p2, this.midPoint2, this.midPoint1, this.color.computeCloseColor(childrenColorVariation)), new PrimitiveTrianglesNested(this.p3, this.midPoint3, this.midPoint2, this.color.computeCloseColor(childrenColorVariation)));
    };
    PrimitiveTrianglesNested.prototype.applyZoom = function (zoom, isRoot) {
        if (isRoot) {
            zoom.applyToPoint(this.p1);
            zoom.applyToPoint(this.p2);
            zoom.applyToPoint(this.p3);
        }
        if (this.subdivision) {
            zoom.applyToPoint(this.midPoint1);
            zoom.applyToPoint(this.midPoint2);
            zoom.applyToPoint(this.midPoint3);
        }
    };
    PrimitiveTrianglesNested.prototype.randomNewPoint = function (p1, p2, range) {
        var r = Arithmetics.random(0.5 - 0.5 * range, 0.5 + 0.5 * range);
        return {
            x: p1.x * (1 - r) + p2.x * r,
            y: p1.y * (1 - r) + p2.y * r,
        };
    };
    return PrimitiveTrianglesNested;
}(primitive_triangles_1.PrimitiveTriangles));
exports.PrimitiveTrianglesNested = PrimitiveTrianglesNested;


/***/ }),

/***/ "./src/ts/primitives/primitive-triangles.ts":
/*!**************************************************!*\
  !*** ./src/ts/primitives/primitive-triangles.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrimitiveTriangles = void 0;
var Arithmetics = __importStar(__webpack_require__(/*! ../misc/arithmetics */ "./src/ts/misc/arithmetics.ts"));
var primitive_base_1 = __webpack_require__(/*! ./primitive-base */ "./src/ts/primitives/primitive-base.ts");
var primitive_type_enum_1 = __webpack_require__(/*! ./primitive-type-enum */ "./src/ts/primitives/primitive-type-enum.ts");
var PrimitiveTriangles = (function (_super) {
    __extends(PrimitiveTriangles, _super);
    function PrimitiveTriangles(p1, p2, p3, color) {
        var _this = _super.call(this, color) || this;
        _this.p1 = p1;
        _this.p2 = p2;
        _this.p3 = p3;
        _this.primitiveType = primitive_type_enum_1.EPrimitiveType.TRIANGLES;
        return _this;
    }
    Object.defineProperty(PrimitiveTriangles.prototype, "subdivisionFactor", {
        get: function () {
            return 2;
        },
        enumerable: false,
        configurable: true
    });
    PrimitiveTriangles.prototype.subdivide = function (subdivisionBalance, childrenColorVariation) {
        var _this = this;
        this.removeChildren();
        var subdivideInternal = function (sourcePoint, otherPoint1, otherPoint2) {
            var minRand = 0.5 * subdivisionBalance;
            var maxRand = 1 - minRand;
            var rand = Arithmetics.random(minRand, maxRand);
            _this.subdivision = [
                sourcePoint,
                Arithmetics.interpolatePoint(otherPoint1, otherPoint2, rand),
            ];
            _this.addChildren(new PrimitiveTriangles(sourcePoint, otherPoint1, _this.subdivision[1], _this.color.computeCloseColor(childrenColorVariation)), new PrimitiveTriangles(sourcePoint, _this.subdivision[1], otherPoint2, _this.color.computeCloseColor(childrenColorVariation)));
        };
        var distance12 = Arithmetics.squaredDistance(this.p1, this.p2);
        var distance23 = Arithmetics.squaredDistance(this.p2, this.p3);
        var distance31 = Arithmetics.squaredDistance(this.p3, this.p1);
        if (distance12 > distance23 && distance12 > distance31) {
            subdivideInternal(this.p3, this.p1, this.p2);
        }
        else if (distance23 > distance12 && distance23 > distance31) {
            subdivideInternal(this.p1, this.p2, this.p3);
        }
        else {
            subdivideInternal(this.p2, this.p3, this.p1);
        }
    };
    Object.defineProperty(PrimitiveTriangles.prototype, "vertices", {
        get: function () {
            return [this.p1, this.p2, this.p3];
        },
        enumerable: false,
        configurable: true
    });
    PrimitiveTriangles.prototype.applyZoom = function (zoom, isRoot) {
        if (isRoot) {
            zoom.applyToPoint(this.p1);
            zoom.applyToPoint(this.p2);
            zoom.applyToPoint(this.p3);
        }
        if (this.subdivision) {
            zoom.applyToPoint(this.subdivision[1]);
        }
    };
    PrimitiveTriangles.prototype.computeVisibility = function (viewport) {
        var viewportTopRight = { x: viewport.bottomRight.x, y: viewport.topLeft.y };
        var viewportBottomLeft = { x: viewport.topLeft.x, y: viewport.bottomRight.y };
        var viewTopLeftInside = this.isInside(viewport.topLeft);
        var viewTopRightInside = this.isInside(viewportTopRight);
        var viewBottomLeftInside = this.isInside(viewportBottomLeft);
        var viewBottomRightInside = this.isInside(viewport.bottomRight);
        if (viewTopLeftInside && viewTopRightInside && viewBottomLeftInside && viewBottomRightInside) {
            return primitive_base_1.EVisibility.COVERS_VIEW;
        }
        else if (viewTopLeftInside || viewTopRightInside || viewBottomLeftInside || viewBottomRightInside) {
            return primitive_base_1.EVisibility.VISIBLE;
        }
        else if (viewport.containsPoint(this.p1) || viewport.containsPoint(this.p2) || viewport.containsPoint(this.p3)) {
            return primitive_base_1.EVisibility.VISIBLE;
        }
        else if (viewport.lineIntersectsBoundaries(this.p1, this.p2) ||
            viewport.lineIntersectsBoundaries(this.p2, this.p3) ||
            viewport.lineIntersectsBoundaries(this.p3, this.p1)) {
            return primitive_base_1.EVisibility.VISIBLE;
        }
        else {
            return primitive_base_1.EVisibility.OUT_OF_VIEW;
        }
    };
    PrimitiveTriangles.prototype.isInside = function (point) {
        var SIDE_1_2 = Arithmetics.getSide(this.p1, this.p2, point);
        var SIDE_2_3 = Arithmetics.getSide(this.p2, this.p3, point);
        var SIDE_3_1 = Arithmetics.getSide(this.p3, this.p1, point);
        return Arithmetics.areSameSign(SIDE_1_2, SIDE_2_3, SIDE_3_1);
    };
    return PrimitiveTriangles;
}(primitive_base_1.PrimitiveBase));
exports.PrimitiveTriangles = PrimitiveTriangles;


/***/ }),

/***/ "./src/ts/primitives/primitive-type-enum.ts":
/*!**************************************************!*\
  !*** ./src/ts/primitives/primitive-type-enum.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EPrimitiveType = void 0;
var EPrimitiveType;
(function (EPrimitiveType) {
    EPrimitiveType["QUADS"] = "quads";
    EPrimitiveType["TRIANGLES"] = "triangles";
    EPrimitiveType["NESTED_TRIANGLES"] = "triangles-nested";
})(EPrimitiveType || (EPrimitiveType = {}));
exports.EPrimitiveType = EPrimitiveType;


/***/ }),

/***/ "./src/ts/testing/main-testing.ts":
/*!****************************************!*\
  !*** ./src/ts/testing/main-testing.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.main = void 0;
var parameters_1 = __webpack_require__(/*! ../parameters */ "./src/ts/parameters.ts");
var plotter_canvas_2d_1 = __webpack_require__(/*! ../plotter/plotter-canvas-2d */ "./src/ts/plotter/plotter-canvas-2d.ts");
var plotter_webgl_1 = __webpack_require__(/*! ../plotter/plotter-webgl */ "./src/ts/plotter/plotter-webgl.ts");
var test_engine_1 = __webpack_require__(/*! ./test-engine */ "./src/ts/testing/test-engine.ts");
function createPlotter() {
    if (parameters_1.Parameters.plotter === parameters_1.EPlotter.CANVAS2D) {
        return new plotter_canvas_2d_1.PlotterCanvas2D();
    }
    else {
        return new plotter_webgl_1.PlotterWebGL();
    }
}
function main() {
    var plotter = createPlotter();
    var testEngine = new test_engine_1.TestEngine();
    parameters_1.Parameters.resetObservers.push(function () {
        plotter.resizeCanvas();
        testEngine.reset();
    });
    function mainLoop() {
        testEngine.update();
        if (plotter.isReady) {
            plotter.resizeCanvas();
            testEngine.draw(plotter);
        }
        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}
exports.main = main;


/***/ }),

/***/ "./src/ts/testing/test-engine.ts":
/*!***************************************!*\
  !*** ./src/ts/testing/test-engine.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestEngine = void 0;
var color_1 = __webpack_require__(/*! ../misc/color */ "./src/ts/misc/color.ts");
var rectangle_1 = __webpack_require__(/*! ../misc/rectangle */ "./src/ts/misc/rectangle.ts");
var zoom_1 = __webpack_require__(/*! ../misc/zoom */ "./src/ts/misc/zoom.ts");
var parameters_1 = __webpack_require__(/*! ../parameters */ "./src/ts/parameters.ts");
var geometry_id_1 = __webpack_require__(/*! ../plotter/geometry-id */ "./src/ts/plotter/geometry-id.ts");
var primitive_base_1 = __webpack_require__(/*! ../primitives/primitive-base */ "./src/ts/primitives/primitive-base.ts");
var primitive_quads_1 = __webpack_require__(/*! ../primitives/primitive-quads */ "./src/ts/primitives/primitive-quads.ts");
var primitive_triangles_1 = __webpack_require__(/*! ../primitives/primitive-triangles */ "./src/ts/primitives/primitive-triangles.ts");
var primitive_type_enum_1 = __webpack_require__(/*! ../primitives/primitive-type-enum */ "./src/ts/primitives/primitive-type-enum.ts");
__webpack_require__(/*! ../page-interface-generated */ "./src/ts/page-interface-generated.ts");
var TestEngine = (function () {
    function TestEngine() {
        var _this = this;
        this.testWindowBaseWidth = 300;
        this.testWindowBaseHeight = 120;
        this.zoom = 1;
        this.lastPrimitiveVisibilityStatus = null;
        this.lastLineIntersectingStatus = null;
        this.testWindow = new rectangle_1.Rectangle(0, 0, 0, 0);
        Page.Canvas.Observers.mouseWheel.push(function (delta) {
            _this.zoom += 0.1 * delta;
            if (_this.zoom < 0.1) {
                _this.zoom = 0.1;
            }
            else if (_this.zoom > 3) {
                _this.zoom = 3;
            }
        });
        this.batchForPrimitive = {
            items: [],
            geometryId: geometry_id_1.GeometryId.new(),
        };
        this.line = [{ x: -50, y: -50 }, { x: 70, y: 50 }];
        this.batchForLine = {
            items: [this.line],
            geometryId: geometry_id_1.GeometryId.new(),
        };
        this.batchForWindow = {
            items: [],
            geometryId: geometry_id_1.GeometryId.new(),
        };
        this.reset();
    }
    TestEngine.prototype.reset = function () {
        var color = color_1.Color.RED;
        var primitiveType = parameters_1.Parameters.primitiveType;
        if (primitiveType === primitive_type_enum_1.EPrimitiveType.QUADS) {
            this.primitive = new primitive_quads_1.PrimitiveQuads({ x: -150 * Math.random(), y: -150 * Math.random() }, { x: +150 * Math.random(), y: -150 * Math.random() }, { x: -150 * Math.random(), y: +150 * Math.random() }, { x: +150 * Math.random(), y: +150 * Math.random() }, color);
        }
        else {
            this.primitive = new primitive_triangles_1.PrimitiveTriangles({ x: -100 - 50 * Math.random(), y: -100 - 50 * Math.random() }, { x: +100 + 50 * Math.random(), y: -100 - 50 * Math.random() }, { x: +100 + 50 * (Math.random() - 0.5), y: +100 + 50 * Math.random() }, color);
        }
        this.batchForPrimitive.items.length = 0;
        this.batchForPrimitive.items.push(this.primitive);
        this.batchForPrimitive.geometryId.registerChange();
        this.lastPrimitiveVisibilityStatus = null;
        this.lastLineIntersectingStatus = null;
    };
    TestEngine.prototype.update = function () {
        this.updateTestWindow();
        var newPrimitiveVisibilityStatus = this.primitive.computeVisibility(this.testWindow);
        if (this.lastPrimitiveVisibilityStatus !== newPrimitiveVisibilityStatus) {
            if (newPrimitiveVisibilityStatus === primitive_base_1.EVisibility.COVERS_VIEW) {
                console.log("Primitive coverage: COVERS_VIEW");
            }
            else if (newPrimitiveVisibilityStatus === primitive_base_1.EVisibility.OUT_OF_VIEW) {
                console.log("Primitive coverage: OUT_OF_VIEW");
            }
            else {
                console.log("Primitive coverage: VISIBLE");
            }
            this.lastPrimitiveVisibilityStatus = newPrimitiveVisibilityStatus;
        }
        var newLineIntersectionStatus = this.testWindow.lineIntersectsBoundaries(this.line[0], this.line[1]);
        if (this.lastLineIntersectingStatus !== newLineIntersectionStatus) {
            console.log("Line intersection: " + newLineIntersectionStatus);
            this.lastLineIntersectingStatus = newLineIntersectionStatus;
        }
        return true;
    };
    TestEngine.prototype.draw = function (plotter) {
        plotter.initialize(color_1.Color.BLACK, zoom_1.Zoom.noZoom(), 1);
        plotter.drawPolygons(this.batchForPrimitive, 1);
        plotter.drawLines(this.batchForLine, 1, color_1.Color.GREEN, 1);
        plotter.drawLines(this.batchForWindow, 1, color_1.Color.WHITE, 1);
        plotter.finalize();
    };
    TestEngine.prototype.updateTestWindow = function () {
        var canvasSize = Page.Canvas.getSize();
        var mousePosition = parameters_1.Parameters.mousePositionInPixels;
        mousePosition.x -= 0.5 * canvasSize[0];
        mousePosition.y -= 0.5 * canvasSize[1];
        var testWindowWidth = this.zoom * this.testWindowBaseWidth;
        var testWindowHeight = this.zoom * this.testWindowBaseHeight;
        this.testWindow.topLeft.x = mousePosition.x - 0.5 * testWindowWidth;
        this.testWindow.topLeft.y = mousePosition.y - 0.5 * testWindowHeight;
        this.testWindow.bottomRight.x = mousePosition.x + 0.5 * testWindowWidth;
        this.testWindow.bottomRight.y = mousePosition.y + 0.5 * testWindowHeight;
        this.batchForWindow.items[0] = [
            this.testWindow.topLeft,
            { x: this.testWindow.right, y: this.testWindow.top },
            this.testWindow.bottomRight,
            { x: this.testWindow.left, y: this.testWindow.bottom },
            this.testWindow.topLeft,
        ];
        this.batchForWindow.geometryId.registerChange();
    };
    return TestEngine;
}());
exports.TestEngine = TestEngine;


/***/ }),

/***/ "./src/ts/worker/messages/from-worker/messages.ts":
/*!********************************************************!*\
  !*** ./src/ts/worker/messages/from-worker/messages.ts ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NewSvgOutput = exports.NewMetrics = exports.NewGeometry = void 0;
var NewGeometry = __importStar(__webpack_require__(/*! ./new-geometry */ "./src/ts/worker/messages/from-worker/new-geometry.ts"));
exports.NewGeometry = NewGeometry;
var NewMetrics = __importStar(__webpack_require__(/*! ./new-metrics */ "./src/ts/worker/messages/from-worker/new-metrics.ts"));
exports.NewMetrics = NewMetrics;
var NewSvgOutput = __importStar(__webpack_require__(/*! ./new-svg-output */ "./src/ts/worker/messages/from-worker/new-svg-output.ts"));
exports.NewSvgOutput = NewSvgOutput;


/***/ }),

/***/ "./src/ts/worker/messages/from-worker/new-geometry.ts":
/*!************************************************************!*\
  !*** ./src/ts/worker/messages/from-worker/new-geometry.ts ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sendMessage = exports.addListener = void 0;
var geometry_id_1 = __webpack_require__(/*! ../../../plotter/geometry-id */ "./src/ts/plotter/geometry-id.ts");
var message_1 = __webpack_require__(/*! ../message */ "./src/ts/worker/messages/message.ts");
var verb = message_1.EVerb.NEW_GEOMETRY;
function sendMessage(polygonsVboBuffer, linesVboBuffer) {
    var messageData = {
        polygonsVboBuffer: polygonsVboBuffer,
        linesVboBuffer: linesVboBuffer,
    };
    var transfer = [
        polygonsVboBuffer.buffer.buffer,
        linesVboBuffer.buffer.buffer,
    ];
    message_1.sendMessageFromWorker(verb, messageData, transfer);
}
exports.sendMessage = sendMessage;
function rehydrateVboBuffer(vboBuffer) {
    var bufferParts = [];
    for (var _i = 0, _a = vboBuffer.bufferParts; _i < _a.length; _i++) {
        var dehydratedBufferPart = _a[_i];
        bufferParts.push({
            indexOfFirstVertice: dehydratedBufferPart.indexOfFirstVertice,
            verticesCount: dehydratedBufferPart.verticesCount,
            geometryId: geometry_id_1.GeometryId.rehydrate(dehydratedBufferPart.geometryId),
        });
    }
    return {
        buffer: vboBuffer.buffer,
        bufferParts: bufferParts,
    };
}
function addListener(worker, listener) {
    message_1.addListenerToWorker(worker, verb, function (data) {
        var polygonsVboBuffer = rehydrateVboBuffer(data.polygonsVboBuffer);
        var linesVboBuffer = rehydrateVboBuffer(data.linesVboBuffer);
        listener(polygonsVboBuffer, linesVboBuffer);
    });
}
exports.addListener = addListener;


/***/ }),

/***/ "./src/ts/worker/messages/from-worker/new-metrics.ts":
/*!***********************************************************!*\
  !*** ./src/ts/worker/messages/from-worker/new-metrics.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sendMessage = exports.addListener = void 0;
var message_1 = __webpack_require__(/*! ../message */ "./src/ts/worker/messages/message.ts");
var verb = message_1.EVerb.NEW_METRICS;
function sendMessage(engineMetrics) {
    var messageData = {
        engineMetrics: engineMetrics,
    };
    message_1.sendMessageFromWorker(verb, messageData);
}
exports.sendMessage = sendMessage;
function addListener(worker, listener) {
    message_1.addListenerToWorker(worker, verb, function (data) {
        listener(data.engineMetrics);
    });
}
exports.addListener = addListener;


/***/ }),

/***/ "./src/ts/worker/messages/from-worker/new-svg-output.ts":
/*!**************************************************************!*\
  !*** ./src/ts/worker/messages/from-worker/new-svg-output.ts ***!
  \**************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sendMessage = exports.addListener = void 0;
var message_1 = __webpack_require__(/*! ../message */ "./src/ts/worker/messages/message.ts");
var verb = message_1.EVerb.NEW_SVG_OUTPUT;
function sendMessage(output) {
    var messageData = {
        output: output,
    };
    message_1.sendMessageFromWorker(verb, messageData);
}
exports.sendMessage = sendMessage;
function addListener(worker, listener) {
    message_1.addListenerToWorker(worker, verb, function (data) {
        listener(data.output);
    });
}
exports.addListener = addListener;


/***/ }),

/***/ "./src/ts/worker/messages/message.ts":
/*!*******************************************!*\
  !*** ./src/ts/worker/messages/message.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sendMessageToWorker = exports.sendMessageFromWorker = exports.EVerb = exports.addListenerToWorker = exports.addListenerFromWorker = void 0;
var EVerb;
(function (EVerb) {
    EVerb["RESET"] = "reset";
    EVerb["RECOMPUTE_COLORS"] = "recopute-colors";
    EVerb["DOWNLOAD_AS_SVG"] = "download-svg";
    EVerb["UPDATE"] = "update";
    EVerb["NEW_METRICS"] = "new-metrics";
    EVerb["NEW_SVG_OUTPUT"] = "new-svg-output";
    EVerb["NEW_GEOMETRY"] = "new-geometry";
})(EVerb || (EVerb = {}));
exports.EVerb = EVerb;
function sendMessage(target, verb, data, transfer) {
    var messageData = {
        verb: verb,
        data: data,
    };
    target.postMessage(messageData, transfer);
}
function addListener(context, verb, callback) {
    context.addEventListener("message", function (event) {
        if (event && event.data.verb === verb) {
            callback(event.data.data);
        }
    });
}
function sendMessageToWorker(worker, verb, data) {
    sendMessage(worker, verb, data);
}
exports.sendMessageToWorker = sendMessageToWorker;
function addListenerToWorker(worker, verb, callback) {
    addListener(worker, verb, callback);
}
exports.addListenerToWorker = addListenerToWorker;
function sendMessageFromWorker(verb, data, transfer) {
    sendMessage(self, verb, data, transfer);
}
exports.sendMessageFromWorker = sendMessageFromWorker;
function addListenerFromWorker(verb, callback) {
    addListener(self, verb, callback);
}
exports.addListenerFromWorker = addListenerFromWorker;


/***/ }),

/***/ "./src/ts/worker/messages/to-worker/download-as-svg-message.ts":
/*!*********************************************************************!*\
  !*** ./src/ts/worker/messages/to-worker/download-as-svg-message.ts ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sendMessage = exports.addListener = void 0;
var color_1 = __webpack_require__(/*! ../../../misc/color */ "./src/ts/misc/color.ts");
var message_1 = __webpack_require__(/*! ../message */ "./src/ts/worker/messages/message.ts");
var verb = message_1.EVerb.DOWNLOAD_AS_SVG;
function sendMessage(worker, width, height, scaling, backgroundColor, linesColor) {
    var messageData = {
        width: width,
        height: height,
        scaling: scaling,
        backgroundColor: backgroundColor,
        linesColor: linesColor,
    };
    message_1.sendMessageToWorker(worker, verb, messageData);
}
exports.sendMessage = sendMessage;
function addListener(listener) {
    message_1.addListenerFromWorker(verb, function (data) {
        var backgroundColor = color_1.Color.rehydrate(data.backgroundColor);
        var linesColor;
        if (data.linesColor) {
            linesColor = color_1.Color.rehydrate(data.linesColor);
        }
        listener(data.width, data.height, data.scaling, backgroundColor, linesColor);
    });
}
exports.addListener = addListener;


/***/ }),

/***/ "./src/ts/worker/messages/to-worker/messages.ts":
/*!******************************************************!*\
  !*** ./src/ts/worker/messages/to-worker/messages.ts ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Update = exports.Reset = exports.RecomputeColors = exports.DownloadAsSvg = void 0;
var DownloadAsSvg = __importStar(__webpack_require__(/*! ./download-as-svg-message */ "./src/ts/worker/messages/to-worker/download-as-svg-message.ts"));
exports.DownloadAsSvg = DownloadAsSvg;
var RecomputeColors = __importStar(__webpack_require__(/*! ./recompute-color-message */ "./src/ts/worker/messages/to-worker/recompute-color-message.ts"));
exports.RecomputeColors = RecomputeColors;
var Reset = __importStar(__webpack_require__(/*! ./reset-message */ "./src/ts/worker/messages/to-worker/reset-message.ts"));
exports.Reset = Reset;
var Update = __importStar(__webpack_require__(/*! ./update-message */ "./src/ts/worker/messages/to-worker/update-message.ts"));
exports.Update = Update;


/***/ }),

/***/ "./src/ts/worker/messages/to-worker/recompute-color-message.ts":
/*!*********************************************************************!*\
  !*** ./src/ts/worker/messages/to-worker/recompute-color-message.ts ***!
  \*********************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sendMessage = exports.addListener = void 0;
var message_1 = __webpack_require__(/*! ../message */ "./src/ts/worker/messages/message.ts");
var verb = message_1.EVerb.RECOMPUTE_COLORS;
function sendMessage(worker, colorVariation) {
    var messageData = {
        colorVariation: colorVariation,
    };
    message_1.sendMessageToWorker(worker, verb, messageData);
}
exports.sendMessage = sendMessage;
function addListener(listener) {
    message_1.addListenerFromWorker(verb, function (data) {
        listener(data.colorVariation);
    });
}
exports.addListener = addListener;


/***/ }),

/***/ "./src/ts/worker/messages/to-worker/reset-message.ts":
/*!***********************************************************!*\
  !*** ./src/ts/worker/messages/to-worker/reset-message.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sendMessage = exports.addListener = void 0;
var rectangle_1 = __webpack_require__(/*! ../../../misc/rectangle */ "./src/ts/misc/rectangle.ts");
var message_1 = __webpack_require__(/*! ../message */ "./src/ts/worker/messages/message.ts");
var verb = message_1.EVerb.RESET;
function sendMessage(worker, viewport, primitiveType) {
    var messageData = {
        viewport: viewport,
        primitiveType: primitiveType,
    };
    message_1.sendMessageToWorker(worker, verb, messageData);
}
exports.sendMessage = sendMessage;
function addListener(listener) {
    message_1.addListenerFromWorker(verb, function (data) {
        var viewport = rectangle_1.Rectangle.rehydrate(data.viewport);
        listener(viewport, data.primitiveType);
    });
}
exports.addListener = addListener;


/***/ }),

/***/ "./src/ts/worker/messages/to-worker/update-message.ts":
/*!************************************************************!*\
  !*** ./src/ts/worker/messages/to-worker/update-message.ts ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sendMessage = exports.addListener = void 0;
var rectangle_1 = __webpack_require__(/*! ../../../misc/rectangle */ "./src/ts/misc/rectangle.ts");
var zoom_1 = __webpack_require__(/*! ../../../misc/zoom */ "./src/ts/misc/zoom.ts");
var message_1 = __webpack_require__(/*! ../message */ "./src/ts/worker/messages/message.ts");
var verb = message_1.EVerb.UPDATE;
function sendMessage(worker, viewport, instantZoom, wantedDepth, subdivisionBalance, colorVariation) {
    var messageData = {
        viewport: viewport,
        instantZoom: instantZoom,
        wantedDepth: wantedDepth,
        subdivisionBalance: subdivisionBalance,
        colorVariation: colorVariation,
    };
    message_1.sendMessageToWorker(worker, verb, messageData);
}
exports.sendMessage = sendMessage;
function addListener(listener) {
    message_1.addListenerFromWorker(verb, function (data) {
        var viewport = rectangle_1.Rectangle.rehydrate(data.viewport);
        var instantZoom = zoom_1.Zoom.rehydrate(data.instantZoom);
        listener(viewport, instantZoom, data.wantedDepth, data.subdivisionBalance, data.colorVariation);
    });
}
exports.addListener = addListener;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/ts/main.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.js.map