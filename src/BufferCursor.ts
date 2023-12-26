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
        if (this.pos + 1 > this.buffer.length) throw new RangeError("Can't write to buffer: too small");
        this.buffer.writeUInt8(value, this.pos);
        this.pos += 1;
    }
    writeUInt32(value: number) {
        if (this.pos + 4 > this.buffer.length) throw new RangeError("Can't write to buffer: too small");
        this.buffer.writeUInt32LE(value, this.pos);
        this.pos += 4;
    }
    writeFloat(value: number) {
        if (this.pos + 4 > this.buffer.length) throw new RangeError("Can't write to buffer: too small");
        this.buffer.writeFloatLE(value, this.pos);
        this.pos += 4;
    }
    writeVec3f(vec: Vec3) {
        if (this.pos + 12 > this.buffer.length) throw new RangeError("Can't write to buffer: too small");
        this.buffer.writeFloatLE(vec.x, this.pos);
        this.buffer.writeFloatLE(vec.y, this.pos + 4);
        this.buffer.writeFloatLE(vec.z, this.pos + 8);
        this.pos += 12;
    }
    writeVec3u32(vec: Vec3) {
        if (this.pos + 12 > this.buffer.length) throw new RangeError("Can't write to buffer: too small");
        this.buffer.writeUInt32LE(vec.x, this.pos);
        this.buffer.writeUInt32LE(vec.y, this.pos + 4);
        this.buffer.writeUInt32LE(vec.z, this.pos + 8);
        this.pos += 12;
    }
    writeColorRGB(color: Color) {
        if (this.pos + 3 > this.buffer.length) throw new RangeError("Can't write to buffer: too small");
        this.buffer.writeUInt8(color.b, this.pos);
        this.buffer.writeUInt8(color.g, this.pos + 1);
        this.buffer.writeUInt8(color.r, this.pos + 2);
        this.pos += 3;
    }
    writeColorARGB(color: Color) {
        if (this.pos + 4 > this.buffer.length) throw new RangeError("Can't write to buffer: too small");
        this.buffer.writeUInt8(color.b, this.pos);
        this.buffer.writeUInt8(color.g, this.pos + 1);
        this.buffer.writeUInt8(color.r, this.pos + 2);
        this.buffer.writeUInt8(color.a, this.pos + 3);
        this.pos += 4;
    }
    writeString(string: string, length = string.length) {
        // length = Math.min(string.length, length);
        if (this.pos + length > this.buffer.length) throw new RangeError("Can't write to buffer: too small");
        this.buffer.write(string, this.pos, length);
        this.pos += length;
    }
    writeNTString(string: string, length = string.length) {
        if (this.pos + length + 1 > this.buffer.length) throw new RangeError("Can't write to buffer: too small");
        this.buffer.write(string, this.pos, length);
        this.writeUInt8(0);
        this.pos += length + 1;
    }
    writeBuffer(buf: Buffer) {
        if (this.pos + buf.length > this.buffer.length) throw new RangeError("Can't write to buffer: too small");
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
        return new Vec3(
            this.readFloat(), //
            this.readFloat(),
            this.readFloat(),
        );
    }
    readVec3u32() {
        return new Vec3(
            this.readUInt32(), //
            this.readUInt32(),
            this.readUInt32(),
        );
    }
    readColorRGB() {
        let color = new Color();
        if (this.pos + 3 > this.buffer.length) return color;
        color.b = this.buffer.readUInt8(this.pos);
        color.g = this.buffer.readUInt8(this.pos + 1);
        color.r = this.buffer.readUInt8(this.pos + 2);
        color.a = 0;
        this.pos += 3;
        return color;
    }
    readColorARGB() {
        let color = new Color();
        if (this.pos + 3 > this.buffer.length) return color;
        color.b = this.buffer.readUInt8(this.pos);
        color.g = this.buffer.readUInt8(this.pos + 1);
        color.r = this.buffer.readUInt8(this.pos + 2);
        color.a = this.buffer.readUInt8(this.pos + 3);
        this.pos += 4;
        return color;
    }
    readRemaining() {
        let p = this.pos;
        this.pos = this.buffer.length;
        return this.buffer.subarray(p);
    }
    // readString() {
    //     if (this.pos + 4 > this.buffer.length) return;
    //     let data = this.buffer.read(this.pos);
    //     this.pos += 4;
    //     return data;
    // }
}
