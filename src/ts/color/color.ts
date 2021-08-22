function registerPadStartPolyfill(): void {
    if (typeof String.prototype.padStart !== "function") {
        String.prototype.padStart = function padStart(maxLength: number, fillString?: string): string {
            if (this.length > maxLength) {
                return String(this);
            }

            if (!fillString) {
                fillString = " ";
            }

            const nbRepeats = Math.ceil((maxLength - this.length) / fillString.length);
            let result = "";
            for (let i = 0; i < nbRepeats; i++) {
                result += fillString;
            }
            return result + this;
        };
    }
}
registerPadStartPolyfill(); // for IE11

class Color {
    public static readonly BLACK: Color = new Color(0, 0, 0);
    public static readonly WHITE: Color = new Color(255, 255, 255);
    public static readonly GREEN: Color = new Color(0, 255, 0);

    /** @param r in [0, 255]
     *  @param g in [0, 255]
     *  @param b in [0, 255]
     */
    public constructor(public readonly r: number, public readonly g: number, public readonly b: number) { }

    public toString(): string {
        if (!this.hexString) {
            const rHex = this.r.toString(16).padStart(2, "0");
            const gHex = this.g.toString(16).padStart(2, "0");
            const bHex = this.b.toString(16).padStart(2, "0");
            this.hexString = `#${rHex}${gHex}${bHex}`;
        }

        return this.hexString;
    }

    private hexString: string;
}

export { Color };
