import { PacketType } from "../enums";
import { BufferCursor } from "../BufferCursor";

export function make(chunk: Buffer) {
    let cursor = BufferCursor.alloc(1 + chunk.length);
    cursor.writeUInt8(PacketType.MapChunk);
    cursor.writeBuffer(chunk);
    return cursor.buffer;
}
