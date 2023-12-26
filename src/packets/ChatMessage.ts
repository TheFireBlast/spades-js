import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player, PlayerState, ToolType } from "../Player";
import { BufferCursor } from "../BufferCursor";
import { Color } from "../Color";
import { raytrace } from "../Raycast";
import { SpadesMap } from "../Map";
import { Vec3 } from "../Vec3";
import { wait } from "../util";
import { Volume } from "../Volume";

export enum ChatType {
    All,
    Team,
    System,
}

export function make(senderId: number, type: ChatType, message: string) {
    let cursor = BufferCursor.alloc(3 + message.length + 1);
    cursor.writeUInt8(PacketType.ChatMessage);
    cursor.writeUInt8(senderId);
    cursor.writeUInt8(type);
    cursor.writeString(message);
    cursor.writeUInt8(0);
    return cursor.buffer;
}

export async function handle(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.skip(1); // player id, don't use
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

    console.log(`${sender} sent ChatMessage{${ChatType[type]}, ${JSON.stringify(message)}}`);

    if (message.startsWith("!")) {
        const cmd = message.slice(1).split(/\s+/g);
        if (cmd[0] == "test") {
            server.broadcastMake(PacketType.ChatMessage, 0, ChatType.All, "Hello, World!");
        } else if (cmd[0] == "restock") {
            sender.send(server.packets.make(PacketType.Restock, sender));
            sender.send(server.packets.make(PacketType.ChatMessage, 0, ChatType.All, "Restocked"));
        } else if (cmd[0] == "mapresend") {
            sender.state = PlayerState.WaitingForMap;
        } else if (cmd[0] == "mapreload") {
            server.map = SpadesMap.fromOptionsSync(server.map.info);
            //BUG: will error if a player is still receiving map
            server.players.forEach((p) => p.isPastStateData() && (p.state = PlayerState.WaitingForMap));
        } else if (cmd[0] == "getbounds") {
            //TODO: raytrace stop on hit map bounds
            const hit = raytrace(
                (v) => server.map.isSolid(v),
                sender.movement.position,
                sender.movement.forward_orientation,
            );
            if (hit.success) {
                const color = server.map._getColor(hit.voxelPosition);
                const points = [hit.voxelPosition.copy()];
                const origin = hit.voxelPosition.add(0.5, 0.5, 0.5);
                for (const d of [
                    new Vec3(1, 0, 0), //
                    new Vec3(-1, 0, 0),
                    new Vec3(0, 1, 0),
                    new Vec3(0, -1, 0),
                ]) {
                    const _hit = raytrace(
                        (v) => server.map.getColor(v)?.equalsRGB(color) || false,
                        origin.copy().add(d),
                        d,
                    );
                    if (_hit.success && server.map._getColor(_hit.voxelPosition).equalsRGB(color)) {
                        points.push(_hit.voxelPosition);
                    }
                }
                if (points.length >= 2) {
                    const Z = points[0].z;
                    let bounds = new Volume(
                        new Vec3(
                            points.reduce((a, p) => Math.min(p.x, a), Infinity),
                            points.reduce((a, p) => Math.min(p.y, a), Infinity),
                            Z,
                        ),
                        new Vec3(
                            points.reduce((a, p) => Math.max(p.x, a), -Infinity),
                            points.reduce((a, p) => Math.max(p.y, a), -Infinity),
                            Z,
                        ),
                    );
                    sender.send(
                        server.packets.make(
                            PacketType.ChatMessage,
                            0,
                            ChatType.System,
                            `new Volume(new Vec3(${bounds.from.x},${bounds.from.y},${bounds.from.z}),new Vec3(${bounds.to.x},${bounds.to.y},${bounds.to.z}))`,
                        ),
                    );
                    console.log(
                        `new Volume(new Vec3(${bounds.from.x},${bounds.from.y},${bounds.from.z}),new Vec3(${bounds.to.x},${bounds.to.y},${bounds.to.z}))`,
                    );
                    // let corners = bounds.getXY()
                    let black = new Color(20, 20, 20);
                    let yellow = new Color(230, 230, 0);
                    for (let x = bounds.from.x + 1; x < bounds.to.x; x++) {
                        server.setBlock(new Vec3(x, bounds.from.y, Z), (x + Z) % 2 == 0 ? black : yellow);
                        server.setBlock(new Vec3(x, bounds.to.y, Z), (x + Z) % 2 == 0 ? black : yellow);
                    }
                    for (let y = bounds.from.y + 1; y < bounds.to.y; y++) {
                        server.setBlock(new Vec3(bounds.from.x, y, Z), (y + Z) % 2 == 0 ? black : yellow);
                        server.setBlock(new Vec3(bounds.to.x, y, Z), (y + Z) % 2 == 0 ? black : yellow);
                    }
                }
            }
        } else if (cmd[0] == "mapreloadquick") {
            sender.send(server.packets.make(PacketType.ChatMessage, 0, ChatType.System, "Loading map..."));
            let newMap = await SpadesMap.fromOptions(server.map.info);
            let add: [Vec3, Color][] = [];
            let remove: Vec3[] = [];
            let pos = new Vec3(0, 0, 0);
            sender.send(server.packets.make(PacketType.ChatMessage, 0, ChatType.System, "Diffing..."));
            await wait(0);
            for (pos.x = 0; pos.x < newMap.info.size.x; pos.x++) {
                for (pos.y = 0; pos.y < newMap.info.size.y; pos.y++) {
                    for (pos.z = 0; pos.z < newMap.info.size.z; pos.z++) {
                        if (newMap.data.blocks[pos.x][pos.y][pos.z] != server.map.data.blocks[pos.x][pos.y][pos.z]) {
                            if (newMap.data.blocks[pos.x][pos.y][pos.z] == 0) {
                                remove.push(pos.copy());
                            } else {
                                add.push([pos.copy(), newMap.getColor(pos)!]);
                            }
                        } else if (
                            newMap.data.colors[pos.x][pos.y][pos.z] != server.map.data.colors[pos.x][pos.y][pos.z]
                        ) {
                            add.push([pos.copy(), newMap.getColor(pos)!]);
                        }
                    }
                }
            }
            for (const [i, [v, c]] of add.entries()) {
                server.setBlock(v, c);
                if (i % 20 == 19) await wait(20);
            }
            for (const [i, v] of remove.entries()) {
                server.removeBlock(v);
                if (i % 20 == 19) await wait(20);
            }
            sender.send(server.packets.make(PacketType.ChatMessage, 0, ChatType.System, "Reloaded"));
        } else {
            sender.send(server.packets.make(PacketType.ChatMessage, 0, ChatType.System, "Unknown command " + cmd[0]));
        }
    } else {
        server.broadcastMake(PacketType.ChatMessage, sender.id, type, message);
    }
}
