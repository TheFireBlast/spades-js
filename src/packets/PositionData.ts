import { Server } from "../Server";
import { Vec3 } from "../Vec3";
import { PacketType } from "../enums";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";

// export function make(server: Server, position: Vec3) {}

export function handle(server: Server, sender: Player, cursor: BufferCursor) {
    let position = cursor.readVec3f();
    // console.log("pos", position);
    //TODO: add validation
    sender.movement.prev_position = sender.movement.position;
    sender.movement.position = position;
    // console.log(`${sender} ${position}`);
}
