const DEFAULT_COLOR = 0xff674028;

//   class VxlError {
//     kind: VxlErrorType,
//     constructor(kind: VxlErrorType) {
//         this { kind }
//     }
//     toString() {
//         switch this.kind {
//             VxlErrorType::IOError(err) => write!(f, "failed to read vxl file: {err}"),
//             VxlErrorType::MalformedFile(pos) => write!(f, "malformed vxl data at {pos:#X}"),
//             VxlErrorType::SetBlock(x, y, z) => write!(f, "failed to set block {x} {y} {z}"),
//         }
//     }
// }

export class MapData {
    max_x = 512;
    max_y = 512;
    max_z = 64;
    blocks: Array<Array<Uint8Array>>;
    colors: Array<Array<Uint32Array>>;

    constructor() {
        this.blocks = new Array(this.max_x);
        for (let x = 0; x < this.max_x; x++) {
            this.blocks[x] = new Array(this.max_y);
            for (let y = 0; y < this.max_x; y++) {
                // this.blocks[x][y] = new Array(this.max_z).fill(0);
                this.blocks[x][y] = new Uint8Array(this.max_z); //.fill(0);
            }
        }

        this.colors = new Array(this.max_x);
        for (let x = 0; x < this.max_x; x++) {
            this.colors[x] = new Array(this.max_y);
            for (let y = 0; y < this.max_x; y++) {
                // this.colors[x][y] = new Array(this.max_z).fill(0);
                this.colors[x][y] = new Uint32Array(this.max_z); //.fill(0);
            }
        }
    }
    static from_vxl(data: Buffer): MapData {
        let vlx = new MapData();
        vlx.load_vxl(data);
        return vlx;
    }

    //TODO: add some checks to make sure we don't panic in case of malformed file
    load_vxl(data: Buffer): void {
        if (data.length % 4 != 0) {
            console.log("vxl input doesn't have the correct number of bytes");
        }
        let ptr = 0;
        for (let y = 0; y < this.max_y; y++) {
            for (let x = 0; x < this.max_x; x++) {
                for (let z = 0; z < this.max_z; z++) {
                    this.set_block(x, y, z, 1);
                    // this.set_color(x, y, z, DEFAULT_COLOR);
                }
                let z = 0;
                while (true) {
                    // length of span data (N*4 bytes including span header)
                    let span_length = data[ptr + 0];
                    // starting height of top colored run
                    let top_color_start = data[ptr + 1];
                    // ending height of top colored run (length is top_color_end-top_color_start+1)
                    let top_color_end = data[ptr + 2];
                    // starting height of air run (first span ignores value and assumes air_start=0)
                    // let air_start = data[ptr + 3];

                    // fill air run
                    for (let i = z; i < top_color_start; i++) {
                        this.set_block(x, y, i, 0);
                    }

                    // fill top colored run
                    let color_ptr = ptr + 4;
                    for (let i = top_color_start; i <= top_color_end; i++) {
                        this.set_color(x, y, i, data.readUInt32LE(color_ptr));
                        color_ptr += 4;
                    }

                    let len_bottom = top_color_end - top_color_start + 1;

                    // check for end of data marker
                    if (span_length == 0) {
                        // infer ACTUAL number of 4-byte chunks from the length of the color data
                        ptr += 4 * (len_bottom + 1);
                        break;
                    }

                    // infer the number of bottom colors in next span from chunk length
                    let len_top = span_length - 1 - len_bottom;

                    // now skip the pointer past the data to the beginning of the next span
                    ptr += data[ptr] * 4;

                    let bottom_color_end = data[ptr + 3]; // aka air start
                    let bottom_color_start = bottom_color_end - len_top;

                    // fill bottom colored run
                    for (z = bottom_color_start; z < bottom_color_end; z++) {
                        this.set_color(x, y, z, data.readUInt32LE(color_ptr));
                        color_ptr += 4;
                    }
                }
            }
        }
        if (ptr != data.length) {
            console.log("VxlError %i %i", ptr, data.length);
            throw new Error("Malformed vxl: did not consume whole data");
        }
    }

    set_block(x: number, y: number, z: number, t: number): void {
        if (!(x < 512 && y < 512 && z < 64)) {
            throw new Error(`tried to set block at (${x}, ${y}, ${z})`);
        }
        this.blocks[x][y][z] = t;
    }
    set_color(x: number, y: number, z: number, color: number): void {
        if (!(x < 512 && y < 512 && z < 64)) {
            throw new Error(`tried to set color at (${x}, ${y}, ${z})`);
        }
        this.colors[x][y][z] = color;
        // this.blocks[x][y][z] = 1;
    }
    find_top_block(x: number, y: number): number {
        for (let z = 0; z < 63; z++) {
            if (this.blocks[x][y][z] == 1) {
                return z;
            }
        }
        return 0;
    }
    is_surface(x: number, y: number, z: number): boolean {
        if (this.blocks[x][y][z] == 0) {
            return false;
        } else if (z == 0) {
            return true;
        } else if (x > 0 && this.blocks[x - 1][y][z] == 0) {
            return true;
        } else if (x + 1 < this.max_x && this.blocks[x + 1][y][z] == 0) {
            return true;
        } else if (y > 0 && this.blocks[x][y - 1][z] == 0) {
            return true;
        } else if (y + 1 < this.max_y && this.blocks[x][y + 1][z] == 0) {
            return true;
        } else if (z > 0 && this.blocks[x][y][z - 1] == 0) {
            return true;
        } else if (z + 1 < this.max_z && this.blocks[x][y][z + 1] == 0) {
            return true;
        } else {
            return false;
        }
    }
    is_solid(x: number, y: number, z: number): boolean {
        return this.blocks[x][y][z] == 1;
    }
    get_color(x: number, y: number, z: number): number {
        return this.colors[x][y][z];
    }
    set_air(x: number, y: number, z: number): void {
        this.blocks[x][y][z] = 0;
        this.colors[x][y][z] = DEFAULT_COLOR;
    }
    write_map(): Buffer {
        //The size of mapOut should be the max possible memory size of
        //uncompressed VXL format in memory given the XYZ size
        //which is map:max_x * map:max_y * (map:max_z / 2) * 8
        // let data = Buffer.alloc(this.max_x * this.max_y * (this.max_z / 2) * 8);
        let data = Buffer.alloc(this.max_x * this.max_y * (this.max_z / 2));
        let ptr = 0;

        for (let j = 0; j < this.max_y; j++) {
            for (let i = 0; i < this.max_x; i++) {
                let k = 0;
                while (k < this.max_z) {
                    // find the air region
                    let air_start = k;
                    while (k < this.max_z && this.blocks[i][j][k] == 0) {
                        k += 1;
                    }

                    // find the top region
                    let top_colors_start = k;
                    while (k < this.max_z && this.is_surface(i, j, k)) {
                        k += 1;
                    }
                    let top_colors_end = k;

                    // now skip past the solid voxels
                    while (k < this.max_z && this.blocks[i][j][k] == 1 && !this.is_surface(i, j, k)) {
                        k += 1;
                    }

                    // at the end of the solid voxels, we have colored voxels.
                    // in the "normal" case they're bottom colors; but it's
                    // possible to have air-color-solid-color-solid-color-air,
                    // which we encode as air-color-solid-0, 0-color-solid-air

                    // so figure out if we have any bottom colors at this point
                    let bottom_colors_start = k;

                    let z = k;
                    while (z < this.max_z && this.is_surface(i, j, z)) {
                        z += 1;
                    }

                    // if z = max_z, the bottom colors of this span are empty, because we'l emit as top colors
                    // otherwise, these are real bottom colors so we can write them

                    //redundant? using `if (z != this.max_z) k = z` instead
                    // if (z != this.max_z) {
                    //     while (this.is_surface(i, j, k)) {
                    //         k += 1;
                    //     }
                    // }
                    if (z != this.max_z) k = z;
                    let bottom_colors_end = k;

                    // now we're ready to write a span
                    let top_colors_len = top_colors_end - top_colors_start;
                    let bottom_colors_len = bottom_colors_end - bottom_colors_start;

                    let colors = top_colors_len + bottom_colors_len;

                    if (k == this.max_z) {
                        data.writeUInt8(0, ptr++);
                    } else {
                        data.writeUInt8(colors + 1, ptr++);
                    }
                    data.writeUInt8(top_colors_start, ptr++);
                    data.writeUInt8(top_colors_end - 1, ptr++);
                    data.writeUInt8(air_start, ptr++);

                    for (let z = 0; z < top_colors_len; z++) {
                        data.writeUInt32LE(this.colors[i][j][top_colors_start + z], ptr);
                        ptr += 4;
                    }
                    for (let z = 0; z < bottom_colors_len; z++) {
                        data.writeUInt32LE(this.colors[i][j][bottom_colors_start + z], ptr);
                        ptr += 4;
                    }
                }
            }
        }
        return data.subarray(0, ptr);
    }
}
