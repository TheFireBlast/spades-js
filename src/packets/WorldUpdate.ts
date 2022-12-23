import { Server } from "../Server";
import { Vec3 } from "../Vec3";
import { PacketType } from "../enums";
import { Player, PlayerState } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function makeWorldUpdate(server: Server) {
    let cursor = BufferCursor.alloc(1 + 32 * 24);
    cursor.writeUInt8(PacketType.WorldUpdate);
    const zero = new Vec3();
    for (let player of server.players) {
        if (player.state == PlayerState.Disconnected) {
            cursor.writeVec3f(zero);
            cursor.writeVec3f(zero);
        } else {
            cursor.writeVec3f(player.movement.position);
            cursor.writeVec3f(player.movement.forward_orientation);
        }
    }
    return cursor.buffer;
}

// export function receiveWorldUpdate(server: Server, sender: Player, cursor: BufferCursor) { }
