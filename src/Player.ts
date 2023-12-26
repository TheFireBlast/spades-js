import * as fs from "fs";
import * as crypto from "crypto";
import * as enet from "enet";
import * as pako from "pako";
import { Server } from "./Server";
import { Vec3 } from "./Vec3";
import { DisconnectReason, PacketType, TeamId } from "./enums";
import { BufferCursor } from "./BufferCursor";
import { Color } from "./Color";
import { ChatType } from "./packets/ChatMessage";
import { Timer } from "./Timer";
import { Volume } from "./Volume";

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
    private _weapon!: WeaponType;
    public get weapon(): WeaponType {
        return this._weapon;
    }
    public set weapon(value: WeaponType) {
        this._weapon = value;
        this.timers.weaponReload.delay = this.getWeaponReloadDelay();
        this.timers.weaponReload.reset(0);
        this.timers.weaponFire.delay = this.getWeaponFireDelay();
        this.timers.weaponFire.reset(0);
    }
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
        worldUpdate: Timer;
        weaponReload: Timer;
        weaponFire: Timer;
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
        this._weapon = WeaponType.Rifle;
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
            worldUpdate: new Timer(1000 / this.updatesPerSecond),
            weaponReload: new Timer(this.getWeaponReloadDelay()),
            weaponFire: new Timer(this.getWeaponFireDelay()),
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
    moveToSpawn(server: Server) {
        if (this.team != TeamId.Spectator) {
            let spawn: Volume = server.spawns[this.team];

            let dx: number = spawn.to.x - spawn.from.x;
            let dy: number = spawn.to.y - spawn.from.y;

            this.movement.position.x = spawn.from.x + dx * Math.random();
            this.movement.position.y = spawn.from.y + dy * Math.random();
            this.movement.position.z =
                server.map.findTopBlock(this.movement.position.x, this.movement.position.y) - 2.36;

            this.movement.forward_orientation.x = 0;
            this.movement.forward_orientation.y = 0;
            this.movement.forward_orientation.z = 0;
        }
    }
    respawn(server: Server) {
        let packetData = server.packets.make(PacketType.CreatePlayer, server, this);
        server.broadcastFilter(packetData, (p) => p.isPastStateData());
        this.state = PlayerState.Ready;
    }
    getWeaponFireDelay() {
        return {
            [WeaponType.Rifle]: 500,
            [WeaponType.SMG]: 100,
            [WeaponType.Shotgun]: 1000,
        }[this.weapon];
    }
    getWeaponReloadDelay() {
        return {
            [WeaponType.Rifle]: 2500,
            [WeaponType.SMG]: 2500,
            [WeaponType.Shotgun]: 500,
        }[this.weapon];
    }

    update(server: Server) {
        const player = this;
        switch (player.state) {
            case PlayerState.Disconnected: {
                break;
            }
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
                        2,
                    )}%`,
                );
                console.log(`sending ${Math.ceil(compressed.length / 8192)} chunks to ${player}`);

                if (player.send(server.packets.make(PacketType.MapStart, compressed.length))) {
                    player.mapGenerator = new MapGenerator(compressed);
                    player.state = PlayerState.LoadingChunks;
                }
                break;
            }
            case PlayerState.LoadingChunks: {
                if (!player.mapGenerator) break;
                if (player.mapGenerator.done()) {
                    console.log(`finished sending chunks to ${player}`);
                    player.send(server.packets.make(PacketType.VersionRequest));
                    player.state = PlayerState.Joining;
                    player.mapGenerator = undefined;
                    break;
                }
                // let chunk = player.map_generator.read(999999999);
                let chunk = player.mapGenerator.read(8192);
                // let md5 = crypto.createHash("md5").update(chunk).digest("hex");
                // console.log(md5, player.map_generator.position, player.map_generator.left(), chunk.length);
                // console.log(`sending chunk to ${player} (${chunk.length}) (${player.mapGenerator.left()} left)`);

                player.send(server.packets.make(PacketType.MapChunk, chunk));
                break;
            }
            case PlayerState.Joining: {
                for (const p of server.players) {
                    if (p != player && p.isPastJoinScreen()) {
                        player.send(server.packets.make(PacketType.ExistingPlayer, p));
                    }
                }
                player.send(server.packets.make(PacketType.StateData, server, player));
                console.log(`sent game state to ${player}`);
                player.state = PlayerState.PickScreen;
                break;
            }
            case PlayerState.PickScreen: {
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
                this.moveToSpawn(server);
                this.respawn(server);
                console.log(`${player} spawning at ${player.movement.position}`);
                break;
            }
            case PlayerState.WaitingForRespawn: {
                break;
            }
            case PlayerState.Ready: {
                break;
            }
            default: {
                console.log("unknown state", PlayerState[player.state]);
            }
        }
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
