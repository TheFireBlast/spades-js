import { Server } from "../Server";
import { Vec3 } from "../Vec3";
import { PacketType } from "../enums";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";

// export function makeWeaponInput(server: Server, position: Vec3) {}

//TODO
export function receiveWeaponInput(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.skip(1); // player id, don't use
    let input = cursor.readUInt8();
    let primaryFire = input & 0b00000001;
    let secondaryFire = input & 0b00000010;
}
