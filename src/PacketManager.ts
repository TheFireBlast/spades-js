import { Server } from "./Server";
import { PacketType } from "./enums";
import { BufferCursor } from "./BufferCursor";
import { Player } from "./Player";
import { receiveBlockAction } from "./packets/BlockAction";
import { receiveExistingPlayer } from "./packets/ExistingPlayer";
import { receiveOrientationData } from "./packets/OrientationData";
import { receivePositionData } from "./packets/PositionData";
import { receiveVersionInfo } from "./packets/VersionInfo";
import { receiveSetTool } from "./packets/SetTool";
import { receiveSetColor } from "./packets/SetColor";
import { receiveInputData } from "./packets/InputData";
import { receiveWeaponInput } from "./packets/WeaponInput";
import { receiveChatMessage } from "./packets/ChatMessage";

export interface PacketHandler {
    (server: Server, sender: Player, cursor: BufferCursor): void;
}

export class PacketManager {
    static handlers: Record<number, PacketHandler> = {};
    static register(id: number, handler: PacketHandler) {
        this.handlers[id] = handler;
    }
    static handle(id: number, ...args: Parameters<PacketHandler>) {
        let h = this.handlers[id];
        if (!h) return false;
        h(...args);
        return true;
    }
}

PacketManager.register(PacketType.PositionData, receivePositionData); // id 0 BOTH
PacketManager.register(PacketType.OrientationData, receiveOrientationData); // id 1 BOTH
// PacketManager.register(PacketType.WorldUpdate, receiveWorldUpdate);  // id 2 S2C
PacketManager.register(PacketType.InputData, receiveInputData); // id 3
PacketManager.register(PacketType.WeaponInput, receiveWeaponInput); // id 4
// PacketManager.register(PacketType.HealthUpdate, receiveHealthUpdate);  // id 5
// PacketManager.register(PacketType.GrenadePacket, receiveGrenadePacket);  // id 6
PacketManager.register(PacketType.SetTool, receiveSetTool); // id 7
PacketManager.register(PacketType.SetColor, receiveSetColor); // id 8
PacketManager.register(PacketType.ExistingPlayer, receiveExistingPlayer); // id 9
// PacketManager.register(PacketType.ShortPlayerDATA, receiveShortPlayerDATA);  // id 10
// PacketManager.register(PacketType.MoveObject, receiveMoveObject);  // id 11
// PacketManager.register(PacketType.CreatePlayer, receiveCreatePlayer);  // id 12
PacketManager.register(PacketType.BlockAction, receiveBlockAction); // id 13
// PacketManager.register(PacketType.BlockLine, receiveBlockLine);  // id 14
// PacketManager.register(PacketType.StateData, receiveStateData);  // id 15
// PacketManager.register(PacketType.KillAction, receiveKillAction);  // id 16
PacketManager.register(PacketType.ChatMessage, receiveChatMessage); // id 17
// PacketManager.register(PacketType.MapStart, receiveMapStart);  // id 18
// PacketManager.register(PacketType.MapChunk, receiveMapChunk);  // id 19
// PacketManager.register(PacketType.PlayerLeft, receivePlayerLeft);  // id 20
// PacketManager.register(PacketType.TerritoryCapture, receiveTerritoryCapture);  // id 21
// PacketManager.register(PacketType.ProgressBar, receiveProgressBar);  // id 22
// PacketManager.register(PacketType.IntelCapture, receiveIntelCapture);  // id 23
// PacketManager.register(PacketType.IntelPickup, receiveIntelPickup);  // id 24
// PacketManager.register(PacketType.IntelDrop, receiveIntelDrop);  // id 25
// PacketManager.register(PacketType.Restock, receiveRestock);  // id 26
// PacketManager.register(PacketType.FogColor, receiveFogColor);  // id 27
// PacketManager.register(PacketType.WeaponReload, receiveWeaponReload);  // id 28
// PacketManager.register(PacketType.ChangeTeam, receiveChangeTeam);  // id 29
// PacketManager.register(PacketType.ChangeWeapon, receiveChangeWeapon);  // id 30
// PacketManager.register(PacketType.MapCached, receiveMapCached);  // id 31
// PacketManager.register(PacketType.VersionRequest, receiveVersionRequest);  // id 33
PacketManager.register(PacketType.VersionResponse, receiveVersionInfo); // id 34
