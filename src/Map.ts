import * as fs from "node:fs";
import { Vec3 } from "./Vec3";
import { MapData } from "./vxl";

export class MapInfo {
    name: string;
    size: [x: number, y: number, z: number]; //TODO: vec3i
    constructor(name: string, dim_x: number, dim_y: number, dim_z: number) {
        this.name = name;
        this.size = [dim_x, dim_y, dim_z];
    }
}

export class SpadesMap {
    info: MapInfo;
    data: MapData;
    constructor(info: MapInfo, data: MapData) {
        this.info = info;
        this.data = data;
    }
    static from_options(options: MapInfo) {
        let file_data = fs.readFileSync(options.name);
        let vxl = MapData.from_vxl(file_data);
        return new SpadesMap(options, vxl);
    }
    findTopBlock(x: number, y: number) {
        x = x >> 0;
        y = y >> 0;
        if (x > this.info.size[0] || y > this.info.size[1]) {
            return 0;
        }
        for (let z = 0; z < this.info.size[2]; z++) {
            if (this.data.blocks[x][y][z]) {
                return z;
            }
        }
        return 0;
    }
    isValidPos(pos: Vec3) {
        return (
            pos.x < this.info.size[0] &&
            pos.x >= 0 &&
            pos.y < this.info.size[1] &&
            pos.y >= 0 &&
            pos.z < this.info.size[2] &&
            pos.z >= 0
        );
    }
}
