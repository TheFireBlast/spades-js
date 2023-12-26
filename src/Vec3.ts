import chalk from "chalk";
import * as util from "node:util";

export class Vec3 {
    constructor(
        public x = 0,
        public y = 0,
        public z = 0,
    ) {}
    get [0]() {
        return this.x;
    }
    get [1]() {
        return this.y;
    }
    get [2]() {
        return this.z;
    }
    *[Symbol.iterator]() {
        yield this.x;
        yield this.y;
        yield this.z;
    }
    equals(v: Vec3) {
        return this.x == v.x && this.y == v.y && this.z == v.z;
    }
    equalsInt(v: Vec3) {
        return this.x >> 0 == v.x >> 0 && this.y >> 0 == v.y >> 0 && this.z >> 0 == v.z >> 0;
    }
    len() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    lenSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }
    dist(v: Vec3) {
        return Math.sqrt((v.x - this.x) ** 2 + (v.y - this.y) ** 2 + (v.z - this.z) ** 2);
    }
    distSq(v: Vec3) {
        return (v.x - this.x) ** 2 + (v.y - this.y) ** 2 + (v.z - this.z) ** 2;
    }
    norm() {
        this.setLen(1);
        return this;
    }
    setLen(len: number) {
        if (len == 0) return this;
        let f = len / this.len();
        this.x *= f;
        this.y *= f;
        this.z *= f;
        return this;
    }
    mul(f: number): this;
    mul(v: Vec3): this;
    mul(x: number | Vec3): this {
        if (typeof x === "number") {
            this.x *= x;
            this.y *= x;
            this.z *= x;
        } else {
            this.x *= x.x;
            this.y *= x.y;
            this.z *= x.z;
        }
        return this;
    }
    div(f: number): this;
    div(v: Vec3): this;
    div(x: number | Vec3): this {
        if (typeof x === "number") {
            x = 1 / x;
            this.x *= x;
            this.y *= x;
            this.z *= x;
        } else {
            this.x /= x.x;
            this.y /= x.y;
            this.z /= x.z;
        }
        return this;
    }
    add(x: number, y: number, z: number): this;
    add(v: Vec3): this;
    add(x: number | Vec3, y?: number, z?: number): this {
        if (typeof x === "number") {
            this.x += x;
            this.y += y!;
            this.z += z!;
        } else {
            this.x += x.x;
            this.y += x.y;
            this.z += x.z;
        }
        return this;
    }
    sub(x: number, y: number, z: number): this;
    sub(v: Vec3): this;
    sub(x: number | Vec3, y?: number, z?: number): this {
        if (typeof x === "number") {
            this.x -= x;
            this.y -= y!;
            this.z -= z!;
        } else {
            this.x -= x.x;
            this.y -= x.y;
            this.z -= x.z;
        }
        return this;
    }
    floor() {
        this.x >>= 0;
        this.y >>= 0;
        this.z >>= 0;
        return this;
    }
    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.z = Math.round(this.z);
        return this;
    }
    ceil() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        this.z = Math.ceil(this.z);
        return this;
    }
    abs() {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        this.z = Math.abs(this.z);
        return this;
    }
    inv() {
        this.x = 1 / this.x;
        this.y = 1 / this.y;
        this.z = 1 / this.z;
        return this;
    }
    copy() {
        return new Vec3(this.x, this.y, this.z);
    }
    toString() {
        return `Vec3{${+this.x.toFixed(2)}, ${+this.y.toFixed(2)}, ${+this.z.toFixed(2)}}`;
    }
    [util.inspect.custom](depth: number, options: util.InspectOptionsStylized) {
        if (options.colors) {
            return `Vec3{${chalk.yellowBright(+this.x.toFixed(2))}, ${chalk.yellowBright(
                +this.y.toFixed(2),
            )}, ${chalk.yellowBright(+this.z.toFixed(2))}}`;
        } else {
            return this.toString();
        }
    }
}
