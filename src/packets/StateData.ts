import { Server } from "../Server";
import { GamemodeType as GamemodeType, IntelFlag, PacketType } from "../enums";
import { Player, PlayerState } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function makeStateData(server: Server, player: Player) {
    let cursor = BufferCursor.alloc(104);

    cursor.writeUInt8(PacketType.StateData);
    cursor.writeUInt8(player.id);
    cursor.writeColorRGB(server.fogColor);
    cursor.writeColorRGB(server.teamColors[0]);
    cursor.writeColorRGB(server.teamColors[1]);
    cursor.writeString(server.teamNames[0], 10);
    cursor.writeString(server.teamNames[1], 10);
    if (server.gamemode.id == GamemodeType.CTF || server.gamemode.id == GamemodeType.TC) {
        cursor.writeUInt8(server.gamemode.id);
    } else {
        cursor.writeUInt8(0);
    }

    // MODE CTF:

    cursor.writeUInt8(server.gamemode.score[0]); // SCORE TEAM A
    cursor.writeUInt8(server.gamemode.score[1]); // SCORE TEAM B
    cursor.writeUInt8(server.gamemode.scoreLimit); // SCORE LIMIT

    server.gamemode.intelFlags = 0;

    if (server.gamemode.intelHeld[0]) {
        server.gamemode.intelFlags = IntelFlag.TeamB;
    } else if (server.gamemode.intelHeld[1]) {
        server.gamemode.intelFlags = IntelFlag.TeamA;
    } else if (server.gamemode.intelHeld[0] && server.gamemode.intelHeld[1]) {
        server.gamemode.intelFlags = IntelFlag.BothTeams;
    }

    cursor.writeUInt8(server.gamemode.intelFlags); // INTEL FLAGS

    if ((server.gamemode.intelFlags & IntelFlag.TeamA) == 0) {
        cursor.writeUInt8(server.gamemode.playerIntelTeam[1]);
        for (let i = 0; i < 11; ++i) {
            cursor.writeUInt8(255);
        }
    } else {
        cursor.writeVec3f(server.gamemode.intel[0]);
    }

    if ((server.gamemode.intelFlags & IntelFlag.TeamB) == 0) {
        cursor.writeUInt8(server.gamemode.playerIntelTeam[0]);
        for (let i = 0; i < 11; ++i) {
            cursor.writeUInt8(255);
        }
    } else {
        cursor.writeVec3f(server.gamemode.intel[1]);
    }

    cursor.writeVec3f(server.gamemode.base[0]);
    cursor.writeVec3f(server.gamemode.base[1]);

    return cursor.buffer;
}
