import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player, ToolType } from "../Player";
import { BufferCursor } from "../BufferCursor";
import { Color } from "../Color";

export enum ChatType {
    All,
    Team,
    System,
}

export function makeChatMessage(senderId: number, type: ChatType, message: string) {
    let cursor = BufferCursor.alloc(3 + message.length + 1);
    cursor.writeUInt8(PacketType.ChatMessage);
    cursor.writeUInt8(senderId);
    cursor.writeUInt8(type);
    cursor.writeString(message);
    cursor.writeUInt8(0);
    return cursor.buffer;
}

export function receiveChatMessage(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.readUInt8(); // received player id, don't use
    let type: ChatType = cursor.readUInt8();
    if (type != ChatType.All && type != ChatType.Team) {
        type = ChatType.All;
    }

    let messageBuf = cursor.readRemaining();
    let messageLen = messageBuf.indexOf(0);
    if (messageLen == -1) messageLen = messageBuf.length;
    let message!: string;
    if (messageLen == 0) {
        return;
    } else {
        message = messageBuf.toString("ascii", 0, messageLen);
    }

    console.log(`${sender} sent ChatMessage {${ChatType[type]}, ${JSON.stringify(message)}}`);

    server.broadcast(makeChatMessage(sender.id, type, message));
}
