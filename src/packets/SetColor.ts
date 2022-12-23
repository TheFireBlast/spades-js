import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player, ToolType } from "../Player";
import { BufferCursor } from "../BufferCursor";
import { Color } from "../Color";

export function makeSetColor(target: Player, color: Color) {
    let cursor = BufferCursor.alloc(5);
    cursor.writeUInt8(PacketType.SetColor);
    cursor.writeUInt8(target.id);
    cursor.writeColorRGB(color);
    return cursor.buffer;
}

export function receiveSetColor(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.readUInt8(); // received player id, don't use
    let color = cursor.readColorRGB();
    sender.blockColor = color;
    console.log(`${sender} sent SetColor{${JSON.stringify(color)}}`);
    server.broadcastFilter(makeSetColor(sender, color), (p) => p != sender);
}
