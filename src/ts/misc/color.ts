class Color {
    public static readonly BLACK: Color = new Color(0, 0, 0);
    public static readonly WHITE: Color = new Color(255, 255, 255);
    public static readonly RED: Color = new Color(255, 0, 0);
    public static readonly GREEN: Color = new Color(0, 255, 0);

    public static random(): Color {
        return new Color(Color.randomChannel(), Color.randomChannel(), Color.randomChannel());
    }

    public static rehydrate(dehydrated: Color): Color {
        return new Color(dehydrated.r, dehydrated.g, dehydrated.b);
    }

    /** @param r in [0, 255]
     *  @param g in [0, 255]
     *  @param b in [0, 255]
     */
    public constructor(public r: number, public g: number, public b: number) { }

    public toHexaString(): string {
        if (!this.hexString) {
            const rHex = this.r.toString(16).padStart(2, "0");
            const gHex = this.g.toString(16).padStart(2, "0");
            const bHex = this.b.toString(16).padStart(2, "0");
            this.hexString = `#${rHex}${gHex}${bHex}`;
        }

        return this.hexString;
    }

    public toRgbaString(alpha: number): string {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha})`;
    }

    public computeCloseColor(colorVariation: number): Color {
        return new Color(
            Color.computeCloseChannelValue(this.r, colorVariation),
            Color.computeCloseChannelValue(this.g, colorVariation),
            Color.computeCloseChannelValue(this.b, colorVariation),
        );
    }

    public get luminosity(): number {
        return (0.299 * this.r + 0.587 * this.g + 0.114 * this.b) / 255;
    }

    private static randomChannel(): number {
        return Math.floor(256 * Math.random());
    }

    private static computeCloseChannelValue(referenceValue: number, variation: number): number {
        const raw = referenceValue + Math.round(variation * (Math.random() - 0.5));
        if (raw < 0) {
            return 0;
        } else if (raw > 255) {
            return 255;
        }
        return raw;
    }

    private hexString: string;
}

export { Color };
