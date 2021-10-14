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

function registerArrayFindPolyfill(): void {
    if (typeof Array.prototype.find !== "function") {
        Array.prototype.find = function find<T>(this: T[], predicate: (this: void, value: T, index: number, array: T[]) => boolean): T | null {
            for (let i = 0; i < this.length; i++) {
                if (predicate(this[i], i, this)) {
                    return this[i];
                }
            }
            return null;
        };
    }
}

function registerPolyfills(): void {
    registerPadStartPolyfill();
    registerArrayFindPolyfill();
}

export {
    registerPolyfills,
};

