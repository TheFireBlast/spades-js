import { Server } from "../Server";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";
import { PacketType } from "../enums";
import { traverse, traverseAdjacent } from "../util";

export function make() {
    let cursor = BufferCursor.alloc(1);
    cursor.writeUInt8(PacketType.BlockLine);
    return cursor.buffer;
}

export function handle(server: Server, sender: Player, cursor: BufferCursor) {
    if (sender.sprinting) return;
    cursor.skip(1); // player id, don't use
    const from = cursor.readVec3u32();
    const to = cursor.readVec3u32();

    if (!server.map.isEmpty(from) || !server.map.isEmpty(to)) return;

    for (const v of traverseAdjacent(from, to, server.map.info.size, 50)) {
        if (!server.map.isSolid(v)) server.setBlock(v, sender.blockColor);
    }
}
