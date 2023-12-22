import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function makeInputData(player: Player, input: number) {
    let cursor = BufferCursor.alloc(3);
    cursor.writeUInt8(PacketType.InputData);
    cursor.writeUInt8(player.id);
    cursor.writeUInt8(input);
    return cursor.buffer;
}

export function receiveInputData(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.skip(1); // player id, don't use
    let input = cursor.readUInt8();
    let up = input & 0b00000001;
    let down = input & 0b00000010;
    let left = input & 0b00000100;
    let right = input & 0b00001000;
    let jump = input & 0b00010000;
    let crouch = input & 0b00100000;
    let sneak = input & 0b01000000;
    let sprint = input & 0b10000000;
    //TODO

    server.broadcastFilter(makeInputData(sender, input), (p) => p != sender);
    // console.log({ up, down, left, right, jump, crouch, sneak, sprint });
}
