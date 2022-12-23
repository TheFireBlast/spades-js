import { Server } from "../Server";
import { Vec3 } from "../Vec3";
import { PacketType } from "../enums";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";

// export function makeOrientationData(server: Server, position: Vec3) {}

export function receiveOrientationData(server: Server, sender: Player, cursor: BufferCursor) {
    let orientation = cursor.readVec3f().norm();
    sender.movement.forward_orientation = orientation;
}
