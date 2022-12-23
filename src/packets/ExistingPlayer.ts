import { Server } from "../Server";
import { PacketType, TeamId } from "../enums";
import { Player, PlayerState } from "../Player";
import { BufferCursor } from "../BufferCursor";
import { ChatType, makeChatMessage } from "./ChatMessage";

export function makeExistingPlayer(server: Server, existingPlayer: Player) {
    let cursor = BufferCursor.alloc(28);
    cursor.writeUInt8(PacketType.ExistingPlayer);
    cursor.writeUInt8(existingPlayer.id); // ID
    cursor.writeUInt8(existingPlayer.team); // TEAM
    cursor.writeUInt8(existingPlayer.weapon); // WEAPON
    cursor.writeUInt8(existingPlayer.item); // HELD ITEM
    cursor.writeUInt32(existingPlayer.kills); // KILLS
    cursor.writeColorRGB(existingPlayer.blockColor); // COLOR
    cursor.writeString(existingPlayer.name, 16); // NAME
    return cursor.buffer;
}

export function receiveExistingPlayer(server: Server, sender: Player, cursor: BufferCursor) {
    cursor.skip(1); // Clients always send a "dumb" ID here since server has not sent them their ID yet
    sender.team = cursor.readUInt8();
    sender.weapon = cursor.readUInt8();
    sender.item = cursor.readUInt8();
    sender.kills = cursor.readUInt32();

    if (sender.team != 0 && sender.team != 1 && sender.team != 255) {
        console.log(`${sender} sent invalid team. Switching them to Spectator`);
        sender.team = TeamId.Spectator;
    }
    // server.num_team_users[player.team]++;

    cursor.skip(3); // cursor.readColorRGB();

    let nameBuf = cursor.readRemaining();
    let nameLen = nameBuf.indexOf(0);
    if (nameLen == -1) nameLen = nameBuf.length;
    let name!: string;
    //TODO: filter valid characters
    if (nameLen == 0) {
        name = "Deuce";
    } else {
        name = nameBuf.toString("ascii", 0, Math.min(nameLen, 16));
        if (name[0] == "#") name = "Deuce";
    }
    sender.name = name;
    sender.state = PlayerState.Spawning;

    //BUG: player team spectator undefined
    console.log(`${sender} joined ${server.teamNames[sender.team]}`);
    //TODO: put this broadcast in a better place
    server.broadcast(makeChatMessage(0, ChatType.System, `Welcome, ${sender.name}!`));

    //TODO: send MoveObject packet for intels
}
