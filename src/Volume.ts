import { Vec3 } from "./Vec3";

export class Volume {
    constructor(
        public from = new Vec3(),
        public to = new Vec3(),
    ) {}
    getXYZ() {
        return [
            new Vec3(this.from.x, this.from.y, this.from.z),
            new Vec3(this.from.x, this.from.y, this.to.z),
            new Vec3(this.from.x, this.to.y, this.from.z),
            new Vec3(this.from.x, this.to.y, this.to.z),
            new Vec3(this.to.x, this.from.y, this.from.z),
            new Vec3(this.to.x, this.from.y, this.to.z),
            new Vec3(this.to.x, this.to.y, this.from.z),
            new Vec3(this.to.x, this.to.y, this.to.z),
        ];
    }
    getXY() {
        return [
            new Vec3(this.from.x, this.from.y, 0),
            new Vec3(this.from.x, this.to.y, 0),
            new Vec3(this.to.x, this.from.y, 0),
            new Vec3(this.to.x, this.to.y, 0),
        ];
    }
    getXZ() {
        return [
            new Vec3(this.from.x, 0, this.from.z),
            new Vec3(this.from.x, 0, this.to.z),
            new Vec3(this.to.x, 0, this.from.z),
            new Vec3(this.to.x, 0, this.to.z),
        ];
    }
    getYZ() {
        return [
            new Vec3(0, this.from.x, this.from.z),
            new Vec3(0, this.from.x, this.to.z),
            new Vec3(0, this.to.x, this.from.z),
            new Vec3(0, this.to.x, this.to.z),
        ];
    }
}
