export class Vec3 {
    constructor(public x = 0, public y = 0, public z = 0) {}
    len() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }
    lenSq() {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }
    dist(v: Vec3) {
        return Math.sqrt((v.x - this.x) ** 2 + (v.y - this.y) ** 2 + (v.z - this.z) ** 2);
    }
    distSq(v: Vec3) {
        return (v.x - this.x) ** 2 + (v.y - this.y) ** 2 + (v.z - this.z) ** 2;
    }
    norm(len = this.len()) {
        if (len == 0) return this;
        let ilen = 1 / len;
        this.x *= ilen;
        this.y *= ilen;
        this.z *= ilen;
        return this;
    }
    copy() {
        return new Vec3(this.x, this.y, this.z);
    }
    toString() {
        return `Vec3{${this.x}, ${this.y}, ${this.z}}`;
    }
}
