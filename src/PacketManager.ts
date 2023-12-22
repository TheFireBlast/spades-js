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
    handlers: Record<number, PacketHandler> = {};
    register(id: number, handler: PacketHandler) {
        this.handlers[id] = handler;
    }
    handle(id: number, ...args: Parameters<PacketHandler>) {
        let h = this.handlers[id];
        if (!h) return false;
        h(...args);
        return true;
    }
}

export function registerV0_75(pacman: PacketManager) {
    pacman.register(PacketType.PositionData, receivePositionData); // id 0 BOTH
    pacman.register(PacketType.OrientationData, receiveOrientationData); // id 1 BOTH
    // PM.register(PacketType.WorldUpdate, receiveWorldUpdate);  // id 2 S2C
    pacman.register(PacketType.InputData, receiveInputData); // id 3
    pacman.register(PacketType.WeaponInput, receiveWeaponInput); // id 4
    // PM.register(PacketType.HealthUpdate, receiveHealthUpdate);  // id 5
    // PM.register(PacketType.GrenadePacket, receiveGrenadePacket);  // id 6
    pacman.register(PacketType.SetTool, receiveSetTool); // id 7
    pacman.register(PacketType.SetColor, receiveSetColor); // id 8
    pacman.register(PacketType.ExistingPlayer, receiveExistingPlayer); // id 9
    // PM.register(PacketType.ShortPlayerDATA, receiveShortPlayerDATA);  // id 10
    // PM.register(PacketType.MoveObject, receiveMoveObject);  // id 11
    // PM.register(PacketType.CreatePlayer, receiveCreatePlayer);  // id 12
    pacman.register(PacketType.BlockAction, receiveBlockAction); // id 13
    // PM.register(PacketType.BlockLine, receiveBlockLine);  // id 14
    // PM.register(PacketType.StateData, receiveStateData);  // id 15
    // PM.register(PacketType.KillAction, receiveKillAction);  // id 16
    pacman.register(PacketType.ChatMessage, receiveChatMessage); // id 17
    // PM.register(PacketType.MapStart, receiveMapStart);  // id 18
    // PM.register(PacketType.MapChunk, receiveMapChunk);  // id 19
    // PM.register(PacketType.PlayerLeft, receivePlayerLeft);  // id 20
    // PM.register(PacketType.TerritoryCapture, receiveTerritoryCapture);  // id 21
    // PM.register(PacketType.ProgressBar, receiveProgressBar);  // id 22
    // PM.register(PacketType.IntelCapture, receiveIntelCapture);  // id 23
    // PM.register(PacketType.IntelPickup, receiveIntelPickup);  // id 24
    // PM.register(PacketType.IntelDrop, receiveIntelDrop);  // id 25
    // PM.register(PacketType.Restock, receiveRestock);  // id 26
    // PM.register(PacketType.FogColor, receiveFogColor);  // id 27
    // PM.register(PacketType.WeaponReload, receiveWeaponReload);  // id 28
    // PM.register(PacketType.ChangeTeam, receiveChangeTeam);  // id 29
    // PM.register(PacketType.ChangeWeapon, receiveChangeWeapon);  // id 30
    // PM.register(PacketType.MapCached, receiveMapCached);  // id 31
    // PM.register(PacketType.VersionRequest, receiveVersionRequest);  // id 33
    pacman.register(PacketType.VersionResponse, receiveVersionInfo); // id 34
}
