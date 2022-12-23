import { Vec3 } from "./Vec3";
import { Color } from "./Color";

export class BufferCursor {
    pos: number = 0;
    constructor(public buffer: Buffer) {}
    static alloc(length: number) {
        return new BufferCursor(Buffer.alloc(length));
    }
    setPos(n: number) {
        this.pos = n;
    }
    skip(n: number) {
        this.pos += n;
    }

    writeUInt8(value: number) {
        if (this.pos + 1 > this.buffer.length) return;
        this.buffer.writeUInt8(value, this.pos);
        this.pos += 1;
    }
    writeUInt32(value: number) {
        if (this.pos + 4 > this.buffer.length) return;
        this.buffer.writeUInt32LE(value, this.pos);
        this.pos += 4;
    }
    writeFloat(value: number) {
        if (this.pos + 4 > this.buffer.length) return;
        this.buffer.writeFloatLE(value, this.pos);
        this.pos += 4;
    }
    writeVec3f(vec: Vec3) {
        this.writeFloat(vec.x);
        this.writeFloat(vec.y);
        this.writeFloat(vec.z);
    }
    writeColorRGB(color: Color) {
        if (this.pos + 3 > this.buffer.length) return;
        this.buffer.writeUInt8(color.b, this.pos + 0);
        this.buffer.writeUInt8(color.g, this.pos + 1);
        this.buffer.writeUInt8(color.r, this.pos + 2);
        this.pos += 3;
    }
    writeColorARGB(color: Color) {
        if (this.pos + 4 > this.buffer.length) return;
        this.buffer.writeUInt8(color.b, this.pos + 0);
        this.buffer.writeUInt8(color.g, this.pos + 1);
        this.buffer.writeUInt8(color.r, this.pos + 2);
        this.buffer.writeUInt8(color.a, this.pos + 3);
        this.pos += 4;
    }
    writeString(string: string, length = string.length) {
        // length = Math.min(string.length, length);
        if (this.pos + length > this.buffer.length) return;
        this.buffer.write(string, this.pos, length);
        this.pos += length;
    }
    // writeNTString(string: string, length = Number.MAX_SAFE_INTEGER) {
    //     if (this.pos + length + 1 > this.buffer.length) return;
    //     this.writeString(string, length);
    //     this.writeUInt8(0);
    // }
    writeBuffer(buf: Buffer) {
        if (this.pos + buf.length > this.buffer.length) return;
        buf.copy(this.buffer, this.pos);
        this.pos += buf.length;
    }

    readUInt8() {
        if (this.pos + 1 > this.buffer.length) return 0;
        let data = this.buffer.readUInt8(this.pos);
        this.pos += 1;
        return data;
    }
    readUInt32() {
        if (this.pos + 4 > this.buffer.length) return 0;
        let data = this.buffer.readUInt32LE(this.pos);
        this.pos += 4;
        return data;
    }
    readFloat() {
        if (this.pos + 4 > this.buffer.length) return 0;
        let data = this.buffer.readFloatLE(this.pos);
        this.pos += 4;
        return data;
    }
    readVec3f() {
        let vec = new Vec3();
        vec.x = this.readFloat();
        vec.y = this.readFloat();
        vec.z = this.readFloat();
        return vec;
    }
    readColorRGB() {
        let color = new Color();
        if (this.pos + 3 > this.buffer.length) return color;
        color.b = this.buffer.readUInt8(this.pos + 0);
        color.g = this.buffer.readUInt8(this.pos + 1);
        color.r = this.buffer.readUInt8(this.pos + 2);
        this.pos += 3;
        return color;
    }
    readColorARGB() {
        let color = new Color();
        if (this.pos + 3 > this.buffer.length) return color;
        color.b = this.buffer.readUInt8(this.pos + 0);
        color.g = this.buffer.readUInt8(this.pos + 1);
        color.r = this.buffer.readUInt8(this.pos + 2);
        color.a = this.buffer.readUInt8(this.pos + 3);
        this.pos += 4;
        return color;
    }
    readRemaining() {
        return this.buffer.subarray(this.pos);
    }
    // readString() {
    //     if (this.pos + 4 > this.buffer.length) return;
    //     let data = this.buffer.read(this.pos);
    //     this.pos += 4;
    //     return data;
    // }
}
