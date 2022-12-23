import * as enet from "enet";
import { Player, PlayerState } from "./Player";
import { MapInfo, SpadesMap } from "./Map";
import { Color } from "./Color";
import { BufferCursor } from "./BufferCursor";
import { PacketManager } from "./PacketManager";
import { ProtocolVersion, DisconnectReason, TeamId, GamemodeType, IntelFlag, PacketType } from "./enums";
import { Vec3 } from "./Vec3";
import { Volume } from "./Volume";
import { makeWorldUpdate } from "./packets/WorldUpdate";

export class Gamemode {
    id: GamemodeType = GamemodeType.CTF;
    score: [number, number] = [0, 0];
    scoreLimit: number = 10;
    intelFlags: IntelFlag = 0;
    intel: [Vec3, Vec3] = [new Vec3(), new Vec3()];
    base: [Vec3, Vec3] = [new Vec3(), new Vec3()];
    playerIntelTeam: [number, number] = [0, 0];
    intelHeld: [boolean, boolean] = [false, false];
}

export class Server {
    host: enet.Host;
    players: Player[] = [];
    map: SpadesMap;
    fogColor: Color = new Color(128, 232, 255);
    teamColors: [Color, Color] = [new Color(255, 0, 0), new Color(0, 0, 255)];
    teamNames: [string, string] = ["RED", "BLU"];
    gamemode: Gamemode = new Gamemode();
    spawns: [Volume, Volume];

    constructor(port: number) {
        this.spawns = [
            new Volume(new Vec3(64, 233, 0), new Vec3(188, 287, 0)),
            new Volume(new Vec3(393, 225, 0), new Vec3(447, 278, 0)),
        ];
        for (let i = 0; i < 32; i++) {
            this.players[i] = new Player(i);
        }

        //TODO: use thread to parse vxlmap file
        console.log("loading map");
        this.map = SpadesMap.from_options(new MapInfo("Border_Hallway.vxl", 512, 512, 64));
        console.log("map loaded");

        this.host = enet.createServer(
            {
                address: {
                    address: "0.0.0.0",
                    port: port,
                },
                peers: 32,
                channels: 1,
                down: 0,
                up: 0,
            },

            (err, host) => {
                if (err) {
                    console.log(err);
                    return;
                }
                host.enableCompression();

                let host_addr = host.address();
                console.log(`host ready on aos://16777343:${host_addr.port}`);

                setInterval(this.update.bind(this), 1000 / 60);

                //TODO: disconnect players on server stop (SIGINT etc)
                host.on("connect", (peer, data) => {
                    if (data == ProtocolVersion.Version_0_75) {
                        const player = this.getFreePlayer();
                        if (!player) {
                            console.log(`Player (${peer.address().address}) tried joining but the server is full`);
                            peer.disconnectNow(DisconnectReason.ServerFull);
                            return;
                        }
                        console.log(`${player.toStringWithIp()} connected`);
                        player.peer = peer;
                        player.state = PlayerState.WaitingForMap;
                        peer.on("disconnect", function () {
                            console.log(`${player} disconnected`);
                            // player.state = PlayerState.Disconnected;
                            // player.peer = undefined;
                            // player.mapGenerator = undefined;
                            player.reset();
                        });
                        peer.on("message", (packet, channel) => {
                            let packetData = packet.data();
                            let packetId = packetData[0];
                            let cursor = new BufferCursor(packetData);
                            cursor.skip(1);
                            if (!PacketManager.handle(packetId, this, player, cursor)) {
                                let packetName = PacketType[packetId];
                                if (packetName) {
                                    console.log(`[${player}] no handler for ${packetName}`, packetData);
                                } else {
                                    console.log(`[${player}] no handler for packet id ${packetId}`, packetData);
                                }
                            }
                        });
                    } else {
                        console.log(
                            `Player (${peer.address().address}) tried joining with unsupported protocol version ${data}`
                        );
                        peer.disconnectNow(DisconnectReason.WrongProtocolVersion);
                    }
                });

                host.start();
            }
        );
    }

    update() {
        this.updatePlayers();
    }

    updatePlayers() {
        for (let player of this.players) {
            if (player.state != PlayerState.Disconnected) {
                player.update(this);
                if (player.isPastJoinScreen()) {
                    let time = Date.now();
                    if (time - player.timers.worldUpdate >= 1000 / player.updatesPerSecond) {
                        let worldUpdateData = makeWorldUpdate(this);
                        player.send(worldUpdateData);
                        player.timers.worldUpdate = time;
                    }
                }
            }
        }
    }

    broadcast(packet: enet.Packet): boolean;
    broadcast(buf: Buffer, flags?: enet.PacketFlag): boolean;
    broadcast(cursor: BufferCursor, flags?: enet.PacketFlag): boolean;
    broadcast(data: enet.Packet | Buffer | BufferCursor, flags?: enet.PacketFlag): boolean {
        let packet!: enet.Packet;
        if (Buffer.isBuffer(data)) {
            packet = new enet.Packet(data, flags ?? enet.PACKET_FLAG.RELIABLE);
        } else if (data instanceof BufferCursor) {
            packet = new enet.Packet(data.buffer, flags ?? enet.PACKET_FLAG.RELIABLE);
        } else {
            packet = data;
        }
        for (let player of this.players) {
            if (player.state != PlayerState.Disconnected) player.send(packet);
        }
        return true;
    }
    broadcastFilter(packet: enet.Packet, filter: (player: Player) => boolean): boolean;
    broadcastFilter(buf: Buffer, filter: (player: Player) => boolean, flags?: enet.PacketFlag): boolean;
    broadcastFilter(cursor: BufferCursor, filter: (player: Player) => boolean, flags?: enet.PacketFlag): boolean;
    broadcastFilter(
        data: enet.Packet | Buffer | BufferCursor,
        filter: (player: Player) => boolean,
        flags?: enet.PacketFlag
    ): boolean {
        if (this.players.length == 0) return false;

        let packet!: enet.Packet;
        if (Buffer.isBuffer(data)) {
            packet = new enet.Packet(data, flags ?? enet.PACKET_FLAG.RELIABLE);
        } else if (data instanceof BufferCursor) {
            packet = new enet.Packet(data.buffer, flags ?? enet.PACKET_FLAG.RELIABLE);
        } else {
            packet = data;
        }
        for (let player of this.players) {
            if (player.state != PlayerState.Disconnected && filter(player)) player.send(packet);
        }
        return true;
    }

    setPlayerRespawnPoint(player: Player) {
        if (player.team != TeamId.Spectator) {
            let spawn: Volume = this.spawns[player.team];

            let dx: number = spawn.to.x - spawn.from.x;
            let dy: number = spawn.to.y - spawn.from.y;

            player.movement.position.x = spawn.from.x + dx * Math.random();
            player.movement.position.y = spawn.from.y + dy * Math.random();
            player.movement.position.z =
                this.map.findTopBlock(player.movement.position.x, player.movement.position.y) - 2.36;

            player.movement.forward_orientation.x = 0;
            player.movement.forward_orientation.y = 0;
            player.movement.forward_orientation.z = 0;
        }
    }

    getFreePlayer() {
        for (let p of this.players) {
            if (p.state == PlayerState.Disconnected) return p;
        }
    }
}
