import { Server } from "../Server";
import { PacketType } from "../enums";
import { Player } from "../Player";
import { BufferCursor } from "../BufferCursor";

export function makeVersionRequest() {
    return Buffer.of(PacketType.VersionRequest);
}

export function receiveVersionInfo(server: Server, sender: Player, cursor: BufferCursor) {
    console.log("received version response");
    let client = cursor.readUInt8();
    let version_major = cursor.readUInt8();
    let version_minor = cursor.readUInt8();
    let version_revision = cursor.readUInt8();
    let os_info = cursor.readRemaining().toString();

    let clientCode = String.fromCharCode(client);
    let clientName =
        {
            o: "OpenSpades",
            B: "BetterSpades",
        }[clientCode] || `Unknown(${clientCode})`;
    let clientInfo = `${clientName}(${clientCode}) ${version_major}.${version_minor}.${version_revision} ${os_info}`;

    console.log(clientInfo);

    // if (player->client == 'o') {
    //     if (!(player->version_major == 0 && player->version_minor == 1 &&
    //         (player->version_revision == 3 || player->version_revision == 5)))
    //     {
    //         enet_peer_disconnect(player->peer, REASON_KICKED);
    //     }
    // } else if (player->client == 'B') {
    //     if (!(player->version_major == 0 && player->version_minor == 1 && player->version_revision == 5)) {
    //         enet_peer_disconnect(player->peer, REASON_KICKED);
    //     }
    // }
}
