import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player, ToolType } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function makeSetTool(target: Player, tool: ToolType) {
    let cursor = BufferCursor.alloc(3);
    cursor.writeUInt8(PacketType.SetTool);
    cursor.writeUInt8(target.id);
    cursor.writeUInt8(tool);
    return cursor.buffer;
}

export function receiveSetTool(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.readUInt8(); // received player id, don't use
    let tool = cursor.readUInt8();
    //TODO: check timers
    sender.item = tool;
    sender.reloading = false;
    console.log(`${sender} sent SetTool{${ToolType[tool]}}`);
    server.broadcastFilter(makeSetTool(sender, tool), (p) => p != sender);
}
