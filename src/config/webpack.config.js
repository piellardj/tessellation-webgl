const path = require("path");

const PROJECT_DIR = path.resolve(__dirname, "..", "..");
const INPUT_SCRIPT_DIR = path.join(PROJECT_DIR, "src", "ts");
const OUTPUT_SCRIPT_DIR = path.join(PROJECT_DIR, "docs", "script");

module.exports = {
    devtool: "source-map",
    mode: "development",
    entry: path.join(INPUT_SCRIPT_DIR, "main.ts"),
    output: {
        path: OUTPUT_SCRIPT_DIR,
        filename: "[name].js"
    },
    target: ["web", "es5"],
    resolve: {
        extensions: [".ts"]
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            //   transpileOnly: true,
                            compilerOptions: {
                                rootDir: INPUT_SCRIPT_DIR
                            },
                            configFile: path.join(PROJECT_DIR, "src", "config", 'tsconfig.json')
                        }
                    }
                ],
            }
        ]
    }
}
