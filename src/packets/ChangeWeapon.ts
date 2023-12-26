import { Server } from "../Server";
import { KillType, PacketType } from "../enums";
import { Player, WeaponType } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function make(player: Player, weapon: WeaponType) {
    let cursor = BufferCursor.alloc(3);
    cursor.writeUInt8(PacketType.ChangeWeapon);
    cursor.writeUInt8(player.id);
    cursor.writeUInt8(weapon);
    return cursor.buffer;
}

export function handle(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.skip(1); // player id, don't use
    let weapon: WeaponType = cursor.readUInt8();

    sender.weapon = weapon;

    server.broadcastMake(PacketType.KillAction, sender, sender, KillType.ClassChange, 0);
    server.broadcastMake(PacketType.CreatePlayer, server, sender);
    server.broadcastMake(PacketType.OrientationData, sender.movement.forward_orientation);
}
