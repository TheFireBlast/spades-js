import fs from "fs";
import crypto from "crypto";
import enet from "enet";
import pako from "pako";
import { Server } from "./Server";
import { Vec3 } from "./Vec3";
import { PacketType } from "./enums";
import { BufferCursor } from "./BufferCursor";
import { Color } from "./Color";
import { makeCreatePlayer } from "./packets/CreatePlayer";
import { makeStateData } from "./packets/StateData";
import { makeExistingPlayer } from "./packets/ExistingPlayer";
import { makeVersionRequest } from "./packets/VersionInfo";
import { ChatType, makeChatMessage } from "./packets/ChatMessage";

export enum PlayerState {
    Disconnected,
    WaitingForMap,
    LoadingChunks,
    Joining,
    PickScreen,
    Spawning,
    WaitingForRespawn,
    Ready,
}
//TODO: rename to ItemType?
export enum ToolType {
    Spade,
    Block,
    Gun,
    Grenade,
}

export enum WeaponType {
    Rifle,
    SMG,
    Shotgun,
}

export class Player {
    name: string = "limbo";
    id: number;
    state: PlayerState = PlayerState.Disconnected;
    peer: enet.Peer | undefined;
    mapGenerator: MapGenerator | undefined;
    updatesPerSecond!: number;
    team!: number;
    weapon!: WeaponType;
    item!: ToolType;
    kills!: number;
    blockColor!: Color;
    hp!: number;
    grenades!: number;
    blocks!: number;
    input!: number;
    move_forward!: boolean;
    move_backwards!: boolean;
    move_left!: boolean;
    move_right!: boolean;
    jumping!: boolean;
    crouching!: boolean;
    sneaking!: boolean;
    sprinting!: boolean;
    primary_fire!: boolean;
    secondary_fire!: boolean;
    alive!: boolean;
    reloading!: boolean;
    movement!: {
        position: Vec3;
        prev_position: Vec3;
        prev_legit_pos: Vec3;
        eye_pos: Vec3;
        velocity: Vec3;
        strafe_orientation: Vec3;
        height_orientation: Vec3;
        forward_orientation: Vec3;
        previous_orientation: Vec3;
    };
    timers!: {
        worldUpdate: number;
    };

    constructor(id: number) {
        this.id = id;
        this.reset();
    }
    reset() {
        this.name = "limbo";
        this.state = PlayerState.Disconnected;
        this.peer = undefined;
        this.mapGenerator = undefined;
        this.updatesPerSecond = 60;
        this.team = 0;
        this.weapon = WeaponType.Rifle;
        this.item = ToolType.Gun;
        this.kills = 0;
        this.blockColor = new Color();
        this.hp = 0;
        this.grenades = 0;
        this.blocks = 0;
        this.input = 0;
        this.move_forward = false;
        this.move_backwards = false;
        this.move_left = false;
        this.move_right = false;
        this.jumping = false;
        this.crouching = false;
        this.sneaking = false;
        this.sprinting = false;
        this.primary_fire = false;
        this.secondary_fire = false;
        this.alive = false;
        this.reloading = false;
        this.movement = {
            position: new Vec3(),
            prev_position: new Vec3(),
            prev_legit_pos: new Vec3(),
            eye_pos: new Vec3(),
            velocity: new Vec3(),
            strafe_orientation: new Vec3(),
            height_orientation: new Vec3(),
            forward_orientation: new Vec3(),
            previous_orientation: new Vec3(),
        };
        this.timers = {
            worldUpdate: 0,
        };
    }

    send(packet: enet.Packet): boolean;
    send(buf: Buffer, flags?: enet.PacketFlag): boolean;
    send(cursor: BufferCursor, flags?: enet.PacketFlag): boolean;
    send(data: enet.Packet | Buffer | BufferCursor, flags?: enet.PacketFlag): boolean {
        const peer = this.peer;
        if (!peer) return false;

        let packet!: enet.Packet;
        if (Buffer.isBuffer(data)) {
            packet = new enet.Packet(data, flags ?? enet.PACKET_FLAG.RELIABLE);
        } else if (data instanceof BufferCursor) {
            packet = new enet.Packet(data.buffer, flags ?? enet.PACKET_FLAG.RELIABLE);
        } else {
            packet = data;
        }
        return !peer.send(0, packet);
    }
    isPastStateData() {
        return this.state > PlayerState.Joining;
    }
    isPastJoinScreen() {
        return this.state > PlayerState.PickScreen;
    }
    respawn(server: Server) {
        let packetData = makeCreatePlayer(server, this);
        server.broadcastFilter(packetData, (p) => p.isPastStateData());
        this.state = PlayerState.Ready;
    }
    toString() {
        return `${this.name}#${this.id}`;
    }
    toStringWithIp() {
        return `${this.name}(${this.getIp()})#${this.id}`;
    }
    getIp() {
        return this.peer?.address().address;
    }

    update(server: Server) {
        const player = this;
        switch (player.state) {
            case PlayerState.WaitingForMap: {
                //TODO: accumulate packets until client is done loading map
                console.log(`sending mapstart to ${player}`);

                //TODO: use thread to write and deflate map
                console.log("writing map");
                let data = server.map.data.write_map();
                console.log("writing map done (%i bytes)", data.length);

                console.log("deflating");
                let compressed = Buffer.from(pako.deflate(data, { level: 9 }));
                console.log(
                    `deflating done (${compressed.length} bytes) ${((compressed.length / data.length) * 100).toFixed(
                        2
                    )}%`
                );
                console.log(`sending ${Math.ceil(compressed.length / 8192)} chunks to ${player}`);

                let buf = Buffer.alloc(5);
                buf.writeUInt8(PacketType.MapStart, 0);
                // buf.writeUInt32LE(1.5 * 1024 * 1024, 1);
                buf.writeUInt32LE(compressed.length, 1);
                let packet = new enet.Packet(buf, enet.PACKET_FLAG.RELIABLE);
                if (player.send(packet)) {
                    player.mapGenerator = new MapGenerator(compressed);
                    player.state = PlayerState.LoadingChunks;
                }
                break;
            }
            case PlayerState.LoadingChunks: {
                if (!player.mapGenerator) break;
                if (player.mapGenerator.done()) {
                    console.log(`finished sending chunks to ${player}`);
                    player.send(makeVersionRequest());
                    player.state = PlayerState.Joining;
                    player.mapGenerator = undefined;
                    break;
                }
                // let chunk = player.map_generator.read(999999999);
                let chunk = player.mapGenerator.read(8192);
                // let md5 = crypto.createHash("md5").update(chunk).digest("hex");
                // console.log(md5, player.map_generator.position, player.map_generator.left(), chunk.length);
                // console.log(`sending chunk to ${player} (${chunk.length}) (${player.mapGenerator.left()} left)`);

                let buf = Buffer.alloc(1 + chunk.length);
                buf.writeUInt8(PacketType.MapChunk, 0);
                chunk.copy(buf, 1);
                let packet = new enet.Packet(buf, enet.PACKET_FLAG.RELIABLE);
                player.send(packet);
                break;
            }
            case PlayerState.Joining: {
                let existingPlayerPacketData = makeExistingPlayer(server, player);
                server.broadcastFilter(existingPlayerPacketData, (p) => p != player && p.isPastStateData());
                player.send(makeStateData(server, player));
                console.log(`sent game state to ${player}`);
                player.state = PlayerState.PickScreen;
                break;
            }
            case PlayerState.Spawning: {
                player.hp = 100;
                player.grenades = 3;
                player.blocks = 50;
                player.item = 2;
                player.input = 0;
                player.move_forward = false;
                player.move_backwards = false;
                player.move_left = false;
                player.move_right = false;
                player.jumping = false;
                player.crouching = false;
                player.sneaking = false;
                player.sprinting = false;
                player.primary_fire = false;
                player.secondary_fire = false;
                player.alive = true;
                player.reloading = false;
                server.setPlayerRespawnPoint(player);
                this.respawn(server);
                console.log(`${player} spawning at ${player.movement.position}`);
                break;
            }
            default: {
                // console.log("unknown state", PlayerState[player.state])
            }
        }
    }
}

export class MapGenerator {
    data: Buffer;
    position: number = 0;
    constructor(data: Buffer) {
        this.data = data;
    }
    read(length: number): Buffer {
        var slice = this.data.subarray(this.position, this.position + length);
        this.position += length;
        return slice;
    }
    done(): boolean {
        return this.position >= this.data.length;
    }
    left() {
        return Math.max(0, this.data.length - this.position);
    }
}
