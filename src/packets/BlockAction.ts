import { Server } from "../Server";
import { Vec3 } from "../Vec3";
import { PacketType } from "../enums";
import { Player, ToolType } from "../Player";
import { BufferCursor } from "../BufferCursor";

export enum BlockActionType {
    Place,
    Break,
    Tunnel,
    Explode,
}

export function make(agent: Player, actionType: BlockActionType, blockPos: Vec3) {
    let cursor = BufferCursor.alloc(15);
    cursor.writeUInt8(PacketType.BlockAction);
    cursor.writeUInt8(agent.id);
    cursor.writeUInt8(actionType);
    cursor.writeVec3u32(blockPos);
    return cursor.buffer;
}

export function handle(server: Server, sender: Player, cursor: BufferCursor) {
    if (sender.sprinting) return;
    cursor.skip(1); // player id, don't use
    const actionType = cursor.readUInt8();
    const blockPos = cursor.readVec3u32();

    console.log(`${sender} sent BlockAction{${BlockActionType[actionType]} with ${ToolType[sender.item]}} at ${blockPos}`);

    if (!server.map.isValidPos(blockPos)) return;

    if (
        !(
            (sender.item == ToolType.Spade &&
                (actionType == BlockActionType.Break || actionType == BlockActionType.Tunnel)) ||
            (sender.item == ToolType.Block && actionType == BlockActionType.Place) ||
            (sender.item == ToolType.Gun && actionType == BlockActionType.Break)
        )
    ) {
        console.log(
            `${sender} may be using BlockExploit with Item: ${ToolType[sender.item]} and Action: ${
                BlockActionType[actionType]
            }`,
        );
        return;
    }

    if (!(blockPos.dist(sender.movement.position) <= 4 || sender.item == 2)) {
        console.log("block action", {
            playerPos: sender.movement.position.toString(),
            blockPos: blockPos.toString(),
            distance: blockPos.dist(sender.movement.position),
            isValidPos: server.map.isValidPos(blockPos),
        });
        //HACK
        //TODO: manage player position first
        // return;
    }

    //TODO: check timers
    switch (actionType) {
        case BlockActionType.Place: {
            server.map._setBlock(blockPos, sender.blockColor);
            sender.blocks--;
            // server.updateCTFObjects();
            server.broadcastMake(PacketType.BlockAction, sender, actionType, blockPos);
            break;
        }

        case BlockActionType.Break: {
            if (sender.item == ToolType.Gun) {
                //TODO: check ammo
            }
            if (sender.item == ToolType.Spade) {
                if (sender.blocks < 50) {
                    sender.blocks++;
                }
            }
            server.map.data.set_air(blockPos.x, blockPos.y, blockPos.z);
            server.map.updateBlockBreak(blockPos);

            server.broadcastMakeFilter(
                PacketType.BlockAction,
                (p) => p.isPastStateData(),
                sender,
                actionType,
                blockPos,
            );
            break;
        }

        case BlockActionType.Tunnel: {
            // if (gamemode_block_checks(server, X, Y, Z) && gamemode_block_checks(server, X, Y, Z + 1) &&
            //     gamemode_block_checks(server, X, Y, Z - 1))
            // {
            //     uint64_t timeNow = get_nanos();
            //     if (diff_is_older_then(timeNow, &sender.timers.since_last_3block_dest, THREEBLOCK_DELAY) &&
            //         diff_is_older_then_dont_update(
            //         timeNow, sender.timers.since_last_block_dest, THREEBLOCK_DELAY) &&
            //         diff_is_older_then_dont_update(
            //         timeNow, sender.timers.since_last_block_plac, THREEBLOCK_DELAY))
            //     {
            //         for (uint32_t Z = Z - 1; Z <= Z + 1; Z++) {
            //             if (Z < 62) {
            //                 mapvxl_set_air(&server.s_map.map, X, Y, Z);
            //                 vector3i_t  position = {X, Y, z: Z};
            //                 vector3i_t* neigh    = get_neighbours(position);
            //                 mapvxl_set_air(&server.s_map.map, position.x, position.y, position.z);
            //                 for (int i = 0; i < 6; ++i) {
            //                     if (neigh[i].z < 62) {
            //                         check_node(server, neigh[i]);
            //                     }
            //                 }
            //             }
            //         }
            //         send_block_action(server, player, actionType, X, Y, Z);
            //     }
            // }
            break;
        }
    }
    // server.moveIntelAndTentDown();
}
