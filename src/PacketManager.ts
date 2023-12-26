import * as fs from "node:fs";
import { Server } from "./Server";
import { PacketType } from "./enums";
import { BufferCursor } from "./BufferCursor";
import { Player } from "./Player";

import type * as PositionData from "./packets/PositionData";
import type * as OrientationData from "./packets/OrientationData";
import type * as WorldUpdate from "./packets/WorldUpdate";
import type * as InputData from "./packets/InputData";
import type * as WeaponInput from "./packets/WeaponInput";
import type * as HealthUpdate from "./packets/HealthUpdate";
import type * as GrenadePacket from "./packets/GrenadePacket";
import type * as SetTool from "./packets/SetTool";
import type * as SetColor from "./packets/SetColor";
import type * as ExistingPlayer from "./packets/ExistingPlayer";
import type * as ShortPlayerData from "./packets/ShortPlayerData";
import type * as MoveObject from "./packets/MoveObject";
import type * as CreatePlayer from "./packets/CreatePlayer";
import type * as BlockAction from "./packets/BlockAction";
import type * as BlockLine from "./packets/BlockLine";
import type * as StateData from "./packets/StateData";
import type * as KillAction from "./packets/KillAction";
import type * as ChatMessage from "./packets/ChatMessage";
import type * as MapStart from "./packets/MapStart";
import type * as MapChunk from "./packets/MapChunk";
import type * as PlayerLeft from "./packets/PlayerLeft";
import type * as TerritoryCapture from "./packets/TerritoryCapture";
import type * as ProgressBar from "./packets/ProgressBar";
import type * as IntelCapture from "./packets/IntelCapture";
import type * as IntelPickup from "./packets/IntelPickup";
import type * as IntelDrop from "./packets/IntelDrop";
import type * as Restock from "./packets/Restock";
import type * as FogColor from "./packets/FogColor";
import type * as WeaponReload from "./packets/WeaponReload";
import type * as ChangeTeam from "./packets/ChangeTeam";
import type * as ChangeWeapon from "./packets/ChangeWeapon";
import type * as VersionRequest from "./packets/VersionRequest";
import type * as VersionResponse from "./packets/VersionInfo";

export interface PacketHandler {
    (server: Server, sender: Player, cursor: BufferCursor): void;
}
export interface PacketMaker {
    (...args: any[]): Buffer;
}
export interface Packet {
    handle?: PacketHandler;
    make?: PacketMaker;
}

export type PacketList = Record<string | number, Packet>;

export class PacketManager<P extends PacketList = PacketList> {
    packets: P = {} as P;
    register(id: number, packet: Packet) {
        this.packets[id] = packet;
    }
    async _registerFile(id: number, path: string) {
        let packet: Packet = await import(path);
        this.register(id, packet);
    }
    async registerFile(id: number, path: string) {
        if (process.env.HMR == "true") {
            this.registerFileHMR(id, path);
        } else {
            let packetPath = require.resolve(`./packets/${path}`);
            await this._registerFile(id, packetPath);
        }
    }
    async registerFileHMR(id: number, packet: string) {
        let packetPath = require.resolve(`./packets/${packet}`);
        await this._registerFile(id, packetPath);

        let timer: NodeJS.Timeout | undefined;
        fs.watch(packetPath, (event) => {
            if (event == "change") {
                clearTimeout(timer);
                timer = setTimeout(async () => {
                    delete require.cache[packetPath];
                    await this._registerFile(id, packetPath);
                    console.log(`[HMR] Reloaded packet ${packet}`);
                }, 200);
            }
        });
    }
    handle(id: number, ...args: Parameters<PacketHandler>) {
        let packet = this.packets[id];
        if (!packet || !packet.handle) return false;
        packet.handle(...args);
        return true;
    }
    make<K extends keyof P = keyof P>(
        id: K extends keyof P ? K : never,
        ...args: P[K] extends Packet ? (P[K]["make"] extends PacketMaker ? Parameters<P[K]["make"]> : never) : never
    ): Buffer {
        if (typeof id !== "number") throw TypeError("Provided id is not a number");
        let packet = this.packets[id];
        if (!packet || !packet.make) throw new ReferenceError(`There is no \`make()\` for packet ${id}`);
        return packet.make(...args);
    }
    test<K extends keyof P>(id: K extends keyof P ? K : never, tttt: P[K]): void {}
}

export interface Packets0_75 extends PacketList {
    [PacketType.PositionData]: typeof PositionData;
    [PacketType.OrientationData]: typeof OrientationData;
    [PacketType.WorldUpdate]: typeof WorldUpdate;
    [PacketType.InputData]: typeof InputData;
    [PacketType.WeaponInput]: typeof WeaponInput;
    [PacketType.HealthUpdate]: typeof HealthUpdate;
    [PacketType.GrenadePacket]: typeof GrenadePacket;
    [PacketType.SetTool]: typeof SetTool;
    [PacketType.SetColor]: typeof SetColor;
    [PacketType.ExistingPlayer]: typeof ExistingPlayer;
    [PacketType.ShortPlayerData]: typeof ShortPlayerData;
    [PacketType.MoveObject]: typeof MoveObject;
    [PacketType.CreatePlayer]: typeof CreatePlayer;
    [PacketType.BlockAction]: typeof BlockAction;
    [PacketType.BlockLine]: typeof BlockLine;
    [PacketType.StateData]: typeof StateData;
    [PacketType.KillAction]: typeof KillAction;
    [PacketType.ChatMessage]: typeof ChatMessage;
    [PacketType.MapStart]: typeof MapStart;
    [PacketType.MapChunk]: typeof MapChunk;
    [PacketType.PlayerLeft]: typeof PlayerLeft;
    [PacketType.TerritoryCapture]: typeof TerritoryCapture;
    [PacketType.ProgressBar]: typeof ProgressBar;
    [PacketType.IntelCapture]: typeof IntelCapture;
    [PacketType.IntelPickup]: typeof IntelPickup;
    [PacketType.IntelDrop]: typeof IntelDrop;
    [PacketType.Restock]: typeof Restock;
    [PacketType.FogColor]: typeof FogColor;
    [PacketType.WeaponReload]: typeof WeaponReload;
    [PacketType.ChangeTeam]: typeof ChangeTeam;
    [PacketType.ChangeWeapon]: typeof ChangeWeapon;
    [PacketType.VersionRequest]: typeof VersionRequest;
    [PacketType.VersionResponse]: typeof VersionResponse;
}

export function registerV0_75(pacman: PacketManager<Packets0_75>) {
    pacman.registerFile(PacketType.PositionData, "PositionData"); // [0] BOTH
    pacman.registerFile(PacketType.OrientationData, "OrientationData"); // [1] BOTH
    pacman.registerFile(PacketType.WorldUpdate, "WorldUpdate"); // [2] S2C
    pacman.registerFile(PacketType.InputData, "InputData"); // [3] C2S ?
    pacman.registerFile(PacketType.WeaponInput, "WeaponInput"); // [4] C2S ?
    pacman.registerFile(PacketType.HealthUpdate, "HealthUpdate"); // [5] S2C
    pacman.registerFile(PacketType.GrenadePacket, "GrenadePacket"); // [6] ?
    pacman.registerFile(PacketType.SetTool, "SetTool"); // [7] BOTH
    pacman.registerFile(PacketType.SetColor, "SetColor"); // [8] BOTH
    pacman.registerFile(PacketType.ExistingPlayer, "ExistingPlayer"); // [9] BOTH
    pacman.registerFile(PacketType.ShortPlayerData, "ShortPlayerData"); // [10] ?
    pacman.registerFile(PacketType.MoveObject, "MoveObject"); // [11] S2C
    pacman.registerFile(PacketType.CreatePlayer, "CreatePlayer"); // [12] S2C
    pacman.registerFile(PacketType.BlockAction, "BlockAction"); // [13] BOTH
    pacman.registerFile(PacketType.BlockLine, "BlockLine"); // [14] BOTH
    pacman.registerFile(PacketType.StateData, "StateData"); // [15] S2C
    pacman.registerFile(PacketType.KillAction, "KillAction"); // [16] S2C
    pacman.registerFile(PacketType.ChatMessage, "ChatMessage"); // [17] BOTH
    pacman.registerFile(PacketType.MapStart, "MapStart"); // [18] S2C
    pacman.registerFile(PacketType.MapChunk, "MapChunk"); // [19] S2C
    pacman.registerFile(PacketType.PlayerLeft, "PlayerLeft"); // [20] S2C
    pacman.registerFile(PacketType.TerritoryCapture, "TerritoryCapture"); // [21] S2C
    pacman.registerFile(PacketType.ProgressBar, "ProgressBar"); // [22] S2C
    pacman.registerFile(PacketType.IntelCapture, "IntelCapture"); // [23] S2C
    pacman.registerFile(PacketType.IntelPickup, "IntelPickup"); // [24] S2C
    pacman.registerFile(PacketType.IntelDrop, "IntelDrop"); // [25] S2C
    pacman.registerFile(PacketType.Restock, "Restock"); // [26] S2C
    pacman.registerFile(PacketType.FogColor, "FogColor"); // [27] S2C
    pacman.registerFile(PacketType.WeaponReload, "WeaponReload"); // [28] BOTH
    pacman.registerFile(PacketType.ChangeTeam, "ChangeTeam"); // [29] C2S
    pacman.registerFile(PacketType.ChangeWeapon, "ChangeWeapon"); // [30] C2S
    pacman.registerFile(PacketType.VersionRequest, "VersionRequest"); // [33] ?
    pacman.registerFile(PacketType.VersionResponse, "VersionInfo"); // [34] C2S
}
