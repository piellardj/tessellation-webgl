import * as fs from "fs";
import * as path from "path";
import { Demopage } from "webpage-templates";


const data = {
    title: "Subdivisions",
    description: "TODO DESCRIPTION",
    introduction: [
        "TODO INTRO"
    ],
    githubProjectName: "subdivisions-webgl",
    additionalLinks: [],
    styleFiles: [],
    scriptFiles: [
        "script/main.min.js"
    ],
    indicators: [
        {
            id: "average-frame-time",
            label: "Frame time (average)"
        },
        {
            id: "max-frame-time",
            label: "Frame time (max)"
        },
    ],
    canvas: {
        width: 512,
        height: 512,
        enableFullscreen: true
    },
    controlsSections: [
        {
            title: "General",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Primitive",
                    id: "primitive-tabs-id",
                    unique: true,
                    options: [
                        {
                            value: "quads",
                            label: "Quads",
                            checked: true
                        },
                        {
                            value: "triangles",
                            label: "Triangles"
                        }
                    ]
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Depth",
                    id: "depth-range-id",
                    min: 1,
                    max: 16,
                    value: 10,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Balance",
                    id: "balance-range-id",
                    min: 0,
                    max: 1,
                    value: 0.5,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Zooming speed",
                    id: "zooming-speed-range-id",
                    min: 0,
                    max: 1,
                    value: 0.3,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Button,
                    label: "Reset",
                    id: "reset-button-id",
                },
            ]
        },
        {
            title: "Rendering",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Renderer",
                    id: "plotter-tabs-id",
                    unique: true,
                    options: [
                        {
                            value: "webgl",
                            label: "WebGL",
                            checked: true
                        },
                        {
                            value: "canvas2d",
                            label: "Canvas2D"
                        }
                    ]
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Color variation",
                    id: "color-variation-range-id",
                    min: 0,
                    max: 1,
                    value: 0.3,
                    step: 0.05
                },
            ]
        },
        {
            title: "Lines",
            controls: [
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Display lines",
                    id: "display-lines-checkbox-id",
                    checked: true
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Thickness",
                    id: "thickness-range-id",
                    min: 0,
                    max: 10,
                    value: 3,
                    step: 0.1
                },
                {
                    type: Demopage.supportedControls.ColorPicker,
                    title: "Lines color",
                    id: "lines-color-picker-id",
                    defaultValueHex: "#000000",
                },
            ]
        },
        {
            title: "Output",
            controls: [
                {
                    type: Demopage.supportedControls.FileDownload,
                    id: "result-download-id",
                    label: "Download as SVG",
                    flat: true
                }
            ]
        }
    ]
};

const SRC_DIR = path.resolve(__dirname);
const DEST_DIR = path.resolve(__dirname, "..", "docs");
const minified = true;

const buildResult = Demopage.build(data, DEST_DIR, {
    debug: !minified,
});

// disable linting on this file because it is generated
buildResult.pageScriptDeclaration = "/* tslint:disable */\n" + buildResult.pageScriptDeclaration;

const SCRIPT_DECLARATION_FILEPATH = path.join(SRC_DIR, "ts", "page-interface-generated.ts");
fs.writeFileSync(SCRIPT_DECLARATION_FILEPATH, buildResult.pageScriptDeclaration);
