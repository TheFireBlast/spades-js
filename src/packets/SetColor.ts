import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player, ToolType } from "../Player";
import { BufferCursor } from "../BufferCursor";
import { Color } from "../Color";

export function make(target: Player, color: Color) {
    let cursor = BufferCursor.alloc(5);
    cursor.writeUInt8(PacketType.SetColor);
    cursor.writeUInt8(target.id);
    cursor.writeColorRGB(color);
    return cursor.buffer;
}

export function handle(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.skip(1); // player id, don't use
    let color = cursor.readColorRGB();

    sender.blockColor = color;

    console.log(`${sender} sent SetColor{${color}}`);

    server.broadcastMakeFilter(PacketType.SetColor, (p) => p != sender, sender, color);
}
