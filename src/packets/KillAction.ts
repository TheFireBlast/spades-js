import { Server } from "../Server";
import { KillType, PacketType } from "../enums";
import { Player, WeaponType } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function make(player: Player, killer: Player, kind: KillType, respawnTime: number) {
    let cursor = BufferCursor.alloc(5);
    cursor.writeUInt8(PacketType.KillAction);
    cursor.writeUInt8(player.id);
    cursor.writeUInt8(killer.id);
    cursor.writeUInt8(kind);
    cursor.writeUInt8(respawnTime);
    return cursor.buffer;
}
