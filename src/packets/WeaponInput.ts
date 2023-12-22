import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function makeWeaponInput(player: Player, input: number) {
    let cursor = BufferCursor.alloc(3);
    cursor.writeUInt8(PacketType.InputData);
    cursor.writeUInt8(player.id);
    cursor.writeUInt8(input);
    return cursor.buffer;
}

export function receiveWeaponInput(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.skip(1); // player id, don't use
    let input = cursor.readUInt8();
    // let primaryFire = input & 0b00000001;
    // let secondaryFire = input & 0b00000010;
    server.broadcastFilter(makeWeaponInput(sender, input), (p) => p != sender);
}
