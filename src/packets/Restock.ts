import { PacketType } from "../enums";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function make(player: Player) {
    let cursor = BufferCursor.alloc(2);
    cursor.writeUInt8(PacketType.Restock);
    cursor.writeUInt8(player.id);
    return cursor.buffer;
}
