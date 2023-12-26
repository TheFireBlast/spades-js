import { Server } from "../Server";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";
import { PacketType } from "../enums";

//TODO: TerritoryCapturePacket

export function make() {
    let cursor = BufferCursor.alloc(1);
    cursor.writeUInt8(PacketType.TerritoryCapture);
    return cursor.buffer;
}

// export function handle(server: Server, sender: Player, cursor: BufferCursor) {}
