import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player, ToolType } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function make(target: Player, tool: ToolType) {
    let cursor = BufferCursor.alloc(3);
    cursor.writeUInt8(PacketType.SetTool);
    cursor.writeUInt8(target.id);
    cursor.writeUInt8(tool);
    return cursor.buffer;
}

export function handle(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.skip(1); // player id, don't use
    let tool = cursor.readUInt8();

    //TODO: check timers
    sender.item = tool;
    sender.reloading = false;

    // console.log(`${sender} sent SetTool{${ToolType[tool]}}`);

    server.broadcastMakeFilter(PacketType.SetTool, (p) => p != sender, sender, tool);
}
