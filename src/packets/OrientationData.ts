import { Server } from "../Server";
import { Vec3 } from "../Vec3";
import { PacketType } from "../enums";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function make(orientation: Vec3) {
    let cursor = BufferCursor.alloc(13);
    cursor.writeUInt8(PacketType.OrientationData);
    cursor.writeVec3f(orientation);
    return cursor.buffer;
}

export function handle(server: Server, sender: Player, cursor: BufferCursor) {
    let orientation = cursor.readVec3f().norm();
    sender.movement.forward_orientation = orientation;
}
