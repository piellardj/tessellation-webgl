/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
        this.cumulatedZoom.combineWith(instantZoom);
        var maintainance = function () {
            somethingChanged = _this.applyCumulatedZoom() || somethingChanged;
            somethingChanged = _this.adjustLayersCount(wantedDepth, subdivisionBalance, colorVariation) || somethingChanged;
            somethingChanged = _this.handleRecycling(viewport) || somethingChanged;
            if (somethingChanged) {
                for (var _i = 0, _a = _this.layers; _i < _a.length; _i++) {
                    var layer = _a[_i];
                    layer.primitives.geometryId.registerChange();
                    layer.outlines.geometryId.registerChange();
                }
            }
            _this.updateIndicators();
        };
        this.maintainanceThrottle.runIfAvailable(maintainance);
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
        this.updateIndicators();
    };
    Engine.prototype.recomputeColors = function (colorVariation) {
        var newColor = this.computeRootPrimitiveColor();
        this.rootPrimitive.setColor(newColor, colorVariation);
        for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
            var layer = _a[_i];
            layer.primitives.geometryId.registerChange();
        }
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
        this.cumulatedZoom.reset();
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

/***/ "./src/ts/misc/zoom.ts":
/*!*****************************!*\
  !*** ./src/ts/misc/zoom.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Zoom = void 0;
var Zoom = (function () {
    function Zoom(center, scaling) {
        this.a = scaling;
        this.b = center.x * (1 - scaling);
        this.c = center.y * (1 - scaling);
    }
    Zoom.noZoom = function () {
        return new Zoom({ x: 0, y: 0 }, 1);
    };
    Zoom.rehydrate = function (dehydrated) {
        var result = new Zoom({ x: 0, y: 0 }, 1);
        result.a = dehydrated.a;
        result.b = dehydrated.b;
        result.c = dehydrated.c;
        return result;
    };
    Zoom.prototype.reset = function () {
        this.a = 1;
        this.b = 0;
        this.c = 0;
    };
    Zoom.prototype.isNotNull = function () {
        var isIdentity = (this.a === 1) && (this.b === 0) && (this.c === 0);
        return !isIdentity;
    };
    Zoom.prototype.applyToPoint = function (point) {
        point.x = this.a * point.x + this.b;
        point.y = this.a * point.y + this.c;
    };
    Zoom.prototype.combineWith = function (other) {
        var newA = other.a * this.a;
        var newB = other.a * this.b + other.b;
        var newC = other.a * this.c + other.c;
        this.a = newA;
        this.b = newB;
        this.c = newC;
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
exports.NewSvgOutput = exports.NewMetrics = void 0;
var NewMetrics = __importStar(__webpack_require__(/*! ./new-metrics */ "./src/ts/worker/messages/from-worker/new-metrics.ts"));
exports.NewMetrics = NewMetrics;
var NewSvgOutput = __importStar(__webpack_require__(/*! ./new-svg-output */ "./src/ts/worker/messages/from-worker/new-svg-output.ts"));
exports.NewSvgOutput = NewSvgOutput;


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
})(EVerb || (EVerb = {}));
exports.EVerb = EVerb;
function sendMessage(target, verb, data) {
    var messageData = {
        verb: verb,
        data: data,
    };
    target.postMessage(messageData);
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
function sendMessageFromWorker(verb, data) {
    sendMessage(self, verb, data);
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


/***/ }),

/***/ "./src/ts/worker/worker-engine.ts":
/*!****************************************!*\
  !*** ./src/ts/worker/worker-engine.ts ***!
  \****************************************/
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
exports.WorkerEngine = void 0;
var engine_1 = __webpack_require__(/*! ../engine/engine */ "./src/ts/engine/engine.ts");
var plotter_svg_1 = __webpack_require__(/*! ../plotter/plotter-svg */ "./src/ts/plotter/plotter-svg.ts");
var MessagesToMain = __importStar(__webpack_require__(/*! ./messages/from-worker/messages */ "./src/ts/worker/messages/from-worker/messages.ts"));
var WorkerEngine = (function (_super) {
    __extends(WorkerEngine, _super);
    function WorkerEngine() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WorkerEngine.prototype.downloadAsSvg = function (width, height, scaling, backgroundColor, linesColor) {
        var svgOutput = this.drawAsSvg(width, height, scaling, backgroundColor, linesColor);
        MessagesToMain.NewSvgOutput.sendMessage(svgOutput);
    };
    WorkerEngine.prototype.updateIndicators = function () {
        var metrics = this.computeMetrics();
        MessagesToMain.NewMetrics.sendMessage(metrics);
    };
    WorkerEngine.prototype.drawAsSvg = function (width, height, scaling, backgroundColor, linesColor) {
        var svgPlotter = new plotter_svg_1.PlotterSVG(width, height);
        svgPlotter.initialize(backgroundColor, this.cumulatedZoom, scaling);
        svgPlotter.drawPolygons(this.layers[this.layers.length - 1].primitives, 1);
        if (linesColor) {
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                svgPlotter.drawLines(layer.outlines, 1, linesColor, 1);
            }
        }
        svgPlotter.finalize();
        return svgPlotter.output();
    };
    return WorkerEngine;
}(engine_1.Engine));
exports.WorkerEngine = WorkerEngine;


/***/ }),

/***/ "./src/ts/worker/worker.ts":
/*!*********************************!*\
  !*** ./src/ts/worker/worker.ts ***!
  \*********************************/
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
var MessagesFromMain = __importStar(__webpack_require__(/*! ./messages/to-worker/messages */ "./src/ts/worker/messages/to-worker/messages.ts"));
var worker_engine_1 = __webpack_require__(/*! ./worker-engine */ "./src/ts/worker/worker-engine.ts");
var engine = new worker_engine_1.WorkerEngine();
MessagesFromMain.Update.addListener(function (viewport, instantZoom, wantedDepth, subdivisionBalance, colorVariation) {
    engine.update(viewport, instantZoom, wantedDepth, subdivisionBalance, colorVariation);
});
MessagesFromMain.Reset.addListener(function (viewport, primitiveType) {
    engine.reset(viewport, primitiveType);
});
MessagesFromMain.RecomputeColors.addListener(function (colorVariation) {
    engine.recomputeColors(colorVariation);
});
MessagesFromMain.DownloadAsSvg.addListener(function (width, height, scaling, backgroundColor, linesColor) {
    engine.downloadAsSvg(width, height, scaling, backgroundColor, linesColor);
});


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
/******/ 	var __webpack_exports__ = __webpack_require__("./src/ts/worker/worker.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=worker.js.map