import * as enet from "enet";
import { Player, PlayerState } from "./Player";
import { MapInfo, SpadesMap } from "./Map";
import { Color } from "./Color";
import { BufferCursor } from "./BufferCursor";
import { Packet, PacketMaker, PacketManager, Packets0_75, registerV0_75 } from "./PacketManager";
import { ProtocolVersion, DisconnectReason, TeamId, GamemodeType, IntelFlag, PacketType } from "./enums";
import { Vec3 } from "./Vec3";
import { Volume } from "./Volume";
import * as WorldUpdate from "./packets/WorldUpdate";
import { getPackedSettings } from "http2";
import { ChatType } from "./packets/ChatMessage";
import { aosAddressFromIPV4 } from "./util";
import { BlockActionType } from "./packets/BlockAction";

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
    host?: enet.Host;
    packets: PacketManager<Packets0_75>;
    players: Player[] = [];
    map: SpadesMap;
    fogColor: Color = new Color(128, 232, 255);
    teamColors: [Color, Color] = [new Color(255, 0, 0), new Color(0, 0, 255)];
    teamNames: [string, string] = ["RED", "BLU"];
    gamemode: Gamemode = new Gamemode();
    spawns: [Volume, Volume];
    updateInterval: NodeJS.Timeout | undefined;

    constructor(public port: number) {
        if (process.env.HMR == "true") {
            console.log("HMR Enabled");
        }

        this.spawns = [
            new Volume(new Vec3(67, 238, 61), new Vec3(116, 273, 61)),
            new Volume(new Vec3(445, 238, 61), new Vec3(396, 273, 61)),
        ];
        for (let i = 0; i < 32; i++) {
            this.players[i] = new Player(i);
        }

        //TODO: use thread to parse vxlmap file
        console.log("loading map");
        this.map = SpadesMap.fromOptionsSync(new MapInfo("Border_Hallway.vxl", 512, 512, 64));
        console.log("map loaded");

        this.packets = new PacketManager();
        registerV0_75(this.packets);
    }

    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.host = enet.createServer(
                {
                    address: {
                        address: "0.0.0.0",
                        port: this.port,
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
                    console.log(`host ready on aos://${aosAddressFromIPV4("127.0.0.1")}:${host_addr.port}`);

                    this.updateInterval = setInterval(() => this.update(), 1000 / 60);

                    //TODO: disconnect players on server stop (SIGINT etc)
                    host.on("connect", (peer, data) => this.onPlayerConnect(peer, data));

                    host.start();
                    resolve();
                },
            );
        });
    }

    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.host) return resolve();
            for (const p of this.players) {
                if (p.state >= PlayerState.WaitingForMap) {
                    this.disconnect(p, undefined, false);
                }
            }
            this.host.once("destroy", () => resolve());
            this.host.destroy();
        });
    }

    onPlayerConnect(peer: enet.Peer, data: any) {
        this.broadcast(this.packets.make(PacketType.ChatMessage, 0, ChatType.All, "player is trying to join"));
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
            //TODO: store block update while player is downloading map
            peer.on("disconnect", () => this.onPlayerDisconnect(player));
            peer.on("message", (packet, channel) => this.onPlayerPacket(player, packet));
        } else {
            console.log(`Player (${peer.address().address}) tried joining with unsupported protocol version ${data}`);
            peer.disconnectNow(DisconnectReason.WrongProtocolVersion);
        }
    }
    onPlayerDisconnect(player: Player) {
        console.log(`${player} disconnected`);
        this.disconnect(player);
    }
    onPlayerPacket(player: Player, packet: enet.Packet) {
        let packetData = packet.data();
        let packetId = packetData[0];
        let cursor = new BufferCursor(packetData);
        cursor.skip(1);
        if (!this.packets.handle(packetId, this, player, cursor)) {
            let packetName = PacketType[packetId];
            if (packetName) {
                console.log(`[${player}] no handler for ${packetName}`, packetData);
            } else {
                console.log(`[${player}] no handler for packet id ${packetId}`, packetData);
            }
        }
    }

    disconnect(player: Player, reason?: DisconnectReason, broadcast: boolean = true) {
        if (broadcast && player.isPastJoinScreen())
            this.broadcastFilter(this.packets.make(PacketType.PlayerLeft, player), (p) => p != player);
        player.peer?.disconnect(reason);
        player.reset();
    }

    update() {
        this.updatePlayers();
    }

    updatePlayers() {
        for (let player of this.players) {
            if (player.state != PlayerState.Disconnected) {
                player.update(this);
                if (player.isPastJoinScreen()) {
                    if (player.timers.worldUpdate.use()) {
                        let worldUpdateData = WorldUpdate.make(this);
                        player.send(worldUpdateData);
                    }
                }
            }
        }
    }

    broadcastMake<P = typeof this.packets.packets, K extends keyof P = keyof P>(
        id: K extends keyof P ? K : never,
        ...args: P[K] extends Packet ? (P[K]["make"] extends PacketMaker ? Parameters<P[K]["make"]> : never) : never
    ): boolean {
        //@ts-expect-error
        return this.broadcast(this.packets.make(id, ...args));
    }
    broadcastMakeFilter<P = typeof this.packets.packets, K extends keyof P = keyof P>(
        id: K extends keyof P ? K : never,
        filter: (player: Player) => boolean,
        ...args: P[K] extends Packet ? (P[K]["make"] extends PacketMaker ? Parameters<P[K]["make"]> : never) : never
    ): boolean {
        //@ts-expect-error
        return this.broadcastFilter(this.packets.make(id, ...args), filter);
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
        flags?: enet.PacketFlag,
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

    getFreePlayer() {
        for (let p of this.players) {
            if (p.state == PlayerState.Disconnected) return p;
        }
    }

    private _getDummyScore(p: Player) {
        let score = 0;
        if (p.state == PlayerState.Disconnected) return Infinity;
        if (!p.alive) score += 1;
        if (!p.isPastJoinScreen()) score += 1;
        return score;
    }
    getDummyPlayers() {
        let p1!: Player;
        let p2!: Player;
        let best1: number = 0;
        let best2: number = 0;

        for (const p of this.players) {
            let score = this._getDummyScore(p);
            if (score == Infinity) {
                p1 = p2 = p;
                break;
            }
            if (score >= best2) {
                if (score >= best1) {
                    p2 = p1;
                    best2 = best1;
                    p1 = p;
                    best1 = score;
                } else {
                    p2 = p;
                    best2 = score;
                }
            }
        }

        return [p1, p2];
    }

    setBlock(pos: Vec3, color?: Color) {
        if (!color) return this.removeBlock(pos);
        pos.floor();
        if (!this.map.isValidPos(pos)) return;
        this.map.data.set_block(pos.x, pos.y, pos.z, 1);
        this.map.data.set_color(pos.x, pos.y, pos.z, color.getARGB());
        let dummy = this.getDummyPlayers();
        let _color = dummy[0].blockColor;
        this.broadcast(this.packets.make(PacketType.SetColor, dummy[0], color));
        this.broadcast(this.packets.make(PacketType.BlockAction, dummy[0], BlockActionType.Place, pos));
        this.broadcast(this.packets.make(PacketType.SetColor, dummy[0], _color));
        dummy[0].blockColor = _color;
    }
    removeBlock(pos: Vec3) {
        pos.floor();
        if (!this.map.isValidPos(pos)) return;
        this.map.data.set_block(pos.x, pos.y, pos.z, 0);
        let dummy = this.getDummyPlayers();
        let _color = dummy[0].blockColor;
        this.broadcast(this.packets.make(PacketType.BlockAction, dummy[0], BlockActionType.Break, pos));
        dummy[0].blockColor = _color;
    }
}
