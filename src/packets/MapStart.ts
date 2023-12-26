import { PacketType } from "../enums";
import { BufferCursor } from "../BufferCursor";

export function make(size: number) {
    let cursor = BufferCursor.alloc(5);
    cursor.writeUInt8(PacketType.MapStart);
    cursor.writeUInt32(size);
    return cursor.buffer;
}
