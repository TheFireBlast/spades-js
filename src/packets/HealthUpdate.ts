import { HealthUpdateType, PacketType } from "../enums";
import { BufferCursor } from "../BufferCursor";
import { Vec3 } from "../Vec3";

export function make(health: number, kind: HealthUpdateType, source: Vec3) {
    let cursor = BufferCursor.alloc(15);
    cursor.writeUInt8(PacketType.HealthUpdate);
    cursor.writeUInt8(health);
    cursor.writeUInt8(kind);
    cursor.writeVec3f(source);
    return cursor.buffer;
}
