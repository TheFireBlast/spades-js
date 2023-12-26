import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player, PlayerState } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function make(server: Server, player: Player) {
    let cursor = BufferCursor.alloc(32);
    cursor.writeUInt8(PacketType.CreatePlayer);
    cursor.writeUInt8(player.id); // ID
    cursor.writeUInt8(player.weapon); // WEAPON
    cursor.writeUInt8(player.team); // TEAM
    cursor.writeVec3f(player.movement.position); // X Y Z
    cursor.writeString(player.name, 16); // NAME

    return cursor.buffer;
}
