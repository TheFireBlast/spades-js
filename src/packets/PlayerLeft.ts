import { PacketType, TeamId } from "../enums";
import { Player, PlayerState } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function make(player: Player) {
    let cursor = BufferCursor.alloc(2);
    cursor.writeUInt8(PacketType.PlayerLeft);
    cursor.writeUInt8(player.id);
    return cursor.buffer;
}

// export function handle(server: Server, sender: Player, cursor: BufferCursor) { }
