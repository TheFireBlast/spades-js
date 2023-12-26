import * as fs from "node:fs";
import FlatQueue from "./FlatQueue";
import { Vec3 } from "./Vec3";
import { MapData } from "./vxl";
import { getNeighbors, wait } from "./util";
import { Color } from "./Color";

export class MapInfo {
    name: string;
    size: Vec3;
    constructor(name: string, dim_x: number, dim_y: number, dim_z: number) {
        this.name = name;
        this.size = new Vec3(dim_x, dim_y, dim_z);
    }
}

const colorBackup: [Vec3, Color][] = [];

export class SpadesMap {
    info: MapInfo;
    data: MapData;
    constructor(info: MapInfo, data: MapData) {
        this.info = info;
        this.data = data;
    }
    static async fromOptions(options: MapInfo) {
        const data = await fs.promises.readFile(options.name);
        const vxl = MapData.from_vxl(data);
        return new SpadesMap(options, vxl);
    }
    static fromOptionsSync(options: MapInfo) {
        const file_data = fs.readFileSync(options.name);
        const vxl = MapData.from_vxl(file_data);
        return new SpadesMap(options, vxl);
    }
    findTopBlock(x: number, y: number) {
        x >>= 0;
        y >>= 0;
        if (x > this.info.size.x || y > this.info.size.y) {
            return 0;
        }
        for (let z = 0; z < this.info.size.z; z++) {
            if (this.data.blocks[x][y][z]) {
                return z;
            }
        }
        return 0;
    }
    isValidPos(pos: Vec3) {
        return (
            pos.x < this.info.size.x &&
            pos.x >= 0 &&
            pos.y < this.info.size.y &&
            pos.y >= 0 &&
            pos.z < this.info.size.z &&
            pos.z >= 0
        );
    }
    _isSolid(pos: Vec3) {
        return this.data.is_solid(pos.x, pos.y, pos.z);
    }
    isSolid(pos: Vec3) {
        return this.isValidPos(pos) && this.data.is_solid(pos.x, pos.y, pos.z);
    }
    isEmpty(pos: Vec3) {
        return this.isValidPos(pos) && !this.data.is_solid(pos.x, pos.y, pos.z);
    }
    _getColor(pos: Vec3) {
        return Color.fromARGB(this.data.get_color(pos.x, pos.y, pos.z));
    }
    getColor(pos: Vec3) {
        return (
            (this.isValidPos(pos) &&
                this.data.is_solid(pos.x, pos.y, pos.z) &&
                Color.fromARGB(this.data.get_color(pos.x, pos.y, pos.z))) ||
            undefined
        );
    }
    _setBlock(pos: Vec3, color?: Color | undefined | false | 0) {
        if (color) {
            this.data.set_block(pos.x, pos.y, pos.z, 1);
            this.data.set_color(pos.x, pos.y, pos.z, color.getARGB());
        } else {
            this.data.set_block(pos.x, pos.y, pos.z, 0);
        }
    }
    setBlock(pos: Vec3, color?: Color | undefined | false | 0) {
        if (!this.isValidPos(pos)) return;
        if (color) {
            this.data.set_block(pos.x, pos.y, pos.z, 1);
            this.data.set_color(pos.x, pos.y, pos.z, color.getARGB());
        } else {
            this.data.set_block(pos.x, pos.y, pos.z, 0);
        }
    }
    async updateBlockBreak(blockPos: Vec3) {
        // console.time("updateBlockBreak");
        // await wait(800);
        const visited = new Map<number, number>();
        const visitedVec = new Map<Vec3, number>();

        let i = 0;
        for (const v of getNeighbors(blockPos)) {
            await this.checkFloatingBlocks(v, visited, visitedVec, i++);
        }
        // await wait(800);
        // colorBackup.forEach(([v, c]) => {
        //     if (this._isSolid(v)) TEST_SERVER.setBlock(v, c);
        // });
        // console.timeEnd("updateBlockBreak");
    }
    async checkFloatingBlocks(
        initialPos: Vec3,
        visited = new Map<number, number>(),
        visitedVec = new Map<Vec3, number>(),
        id = 0,
    ) {
        if (!this.isSolid(initialPos)) return;
        // console.time("checkFloatingBlocks");

        const S = this.info.size;
        const queue = new FlatQueue<Vec3>();
        queue.push(initialPos, 0);
        const key = (v: Vec3) => v.x + (v.y + v.z * S.y) * S.x;
        while (queue.length > 0) {
            const currentPos = queue.pop()!;
            const currentKey = key(currentPos);

            const isSolid = this.data.is_solid(currentPos.x, currentPos.y, currentPos.z);
            if (!isSolid || visited.get(currentKey) == id) continue;
            if (currentPos.z == S.z - 2 || (visited.has(currentKey) && visited.get(currentKey) != id)) {
                // Found ground

                // console.timeEnd("checkFloatingBlocks");
                // for (const [v, vid] of visitedVec) {
                //     if (vid == id && this.isSolid(v)) TEST_SERVER.setBlock(v, Color.green());
                // }

                return;
            }

            visited.set(currentKey, id);
            visitedVec.set(currentPos, id);
            for (const v of getNeighbors(currentPos)) {
                // const vk = key(v);
                if (this.isValidPos(v) /*  && !(visited.has(vk) && visited.get(vk) == id) */) {
                    queue.push(v, S.z - v.z);
                }
            }

            // if (!colorBackup.find((c) => c[0].equals(currentPos))) {
            //     colorBackup.push([currentPos, this._getColor(currentPos)]);
            // }
            // let val = ((1 - currentPos.dist(initialPos) / 20) * 255) >> 0;
            // let col = new Color();
            // col.r = id % 3 == 0 ? val : 100;
            // col.g = id % 3 == 1 ? val : 100;
            // col.b = id % 3 == 2 ? val : 100;
            // TEST_SERVER.setBlock(currentPos, col.clamp());
            // await wait(5 + Math.max(0, (1 - visited.size ** 2 / 50 ** 2) * 40));
        }

        // Did not find ground

        // for (const [v, vid] of visitedVec) {
        //     if (vid == id && this.isSolid(v)) TEST_SERVER.setBlock(v, Color.red());
        // }
        // await wait(500);
        for (const [v, vid] of visitedVec) {
            if (vid == id) {
                this.data.set_air(v.x, v.y, v.z);
                // TEST_SERVER.removeBlock(v);
            }
        }

        // console.timeEnd("checkFloatingBlocks");
    }
}
