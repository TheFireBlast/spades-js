import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";
import { raytrace } from "../Raycast";
import { Color } from "../Color";
import { ChatType } from "./ChatMessage";

export function make(player: Player, input: number) {
    let cursor = BufferCursor.alloc(3);
    cursor.writeUInt8(PacketType.InputData);
    cursor.writeUInt8(player.id);
    cursor.writeUInt8(input);
    return cursor.buffer;
}

export function handle(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.skip(1); // player id, don't use
    let input = cursor.readUInt8();
    let primaryFire = input & 0b00000001;
    let secondaryFire = input & 0b00000010;

    //devonly
    if (primaryFire && sender.blockColor.equalsRGB(new Color(223, 0, 0))) {
        let ray = raytrace(
            (v) => server.map.isValidPos(v) && server.map.data.is_solid(v.x, v.y, v.z),
            sender.movement.position,
            sender.movement.forward_orientation,
        );
        if (ray.success) {
            let pos = ray.voxelPosition.add(ray.normal);
            server.setBlock(pos.add(0, 0, 0), Color.red());
            server.setBlock(pos.add(0, 0, -1), Color.green());
            server.setBlock(pos.add(0, 0, -1), Color.blue());
        }
    } else if (primaryFire && sender.blockColor.equalsRGB(new Color(223, 111, 0))) {
        sender.send(server.packets.make(PacketType.ChatMessage, 0, ChatType.System, sender.movement.position.toString()));
    }

    server.broadcastMakeFilter(PacketType.WeaponInput, (p) => p != sender, sender, input);
}
