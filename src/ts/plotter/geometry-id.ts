let nextFreeId = 0;

class GeometryId {
    public static new(): GeometryId {
        return new GeometryId(nextFreeId++, 0);
    }

    public copy(): GeometryId {
        return new GeometryId(this.id, this.version);
    }

    public isSameAs(other: GeometryId): boolean {
        return other !== null && this.id === other.id && this.version === other.version;
    }

    public registerChange(): void {
        this.version++;
    }

    private constructor(
        private readonly id: number,
        private version: number
    ) { }
}

export {
    GeometryId,
};
