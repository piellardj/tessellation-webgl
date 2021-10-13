import { GeometryId } from "./geometry-id";


interface IVboPart {
    readonly indexOfFirstVertice: number;
    readonly verticesCount: number;
    readonly geometryId: GeometryId;
}

// VBO when it is still on CPU side
interface IVboBuffer {
    readonly buffer: Float32Array;
    readonly bufferParts: IVboPart[];
}

function rehydrateVboBuffer(vboBuffer: IVboBuffer): IVboBuffer {
    const bufferParts: IVboPart[] = [];
    for (const dehydratedBufferPart of vboBuffer.bufferParts) {
        bufferParts.push({
            indexOfFirstVertice: dehydratedBufferPart.indexOfFirstVertice,
            verticesCount: dehydratedBufferPart.verticesCount,
            geometryId: GeometryId.rehydrate(dehydratedBufferPart.geometryId),
        });
    }

    return {
        buffer: vboBuffer.buffer,
        bufferParts,
    };
}

export {
    IVboBuffer,
    IVboPart,
    rehydrateVboBuffer,
};

