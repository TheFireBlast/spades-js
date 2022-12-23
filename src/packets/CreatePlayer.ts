import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player, PlayerState } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function makeCreatePlayer(server: Server, respawnPlayer: Player) {
    let cursor = BufferCursor.alloc(32);
    cursor.writeUInt8(PacketType.CreatePlayer);
    cursor.writeUInt8(respawnPlayer.id); // ID
    cursor.writeUInt8(respawnPlayer.weapon); // WEAPON
    cursor.writeUInt8(respawnPlayer.team); // TEAM
    cursor.writeVec3f(respawnPlayer.movement.position); // X Y Z
    cursor.writeString(respawnPlayer.name, 16); // NAME

    return cursor.buffer;
}
