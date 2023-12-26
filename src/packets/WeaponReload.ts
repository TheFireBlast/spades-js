import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function make(player: Player, clipAmmo: number, reserveAmmo: number) {
    let cursor = BufferCursor.alloc(4);
    cursor.writeUInt8(PacketType.WeaponReload);
    cursor.writeUInt8(player.id);
    cursor.writeUInt8(clipAmmo);
    cursor.writeUInt8(reserveAmmo);
    return cursor.buffer;
}

export function handle(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.skip(1); // player id, don't use
    let clipAmmo = cursor.readUInt8();
    let reserveAmmo = cursor.readUInt8();

    sender.primary_fire = false;
    sender.secondary_fire = false;

    sender.reloading = true;
    sender.timers.weaponReload.reset();

    //devonly
    // console.log("reloading");
    sender.timers.weaponReload.wait().then(() => {
        // console.log("reloaded");
        sender.send(server.packets.make(PacketType.Restock, sender));
    });

    server.broadcastMake(PacketType.WeaponReload, sender, clipAmmo, reserveAmmo);
}
