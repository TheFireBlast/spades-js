import { MapInfo } from "./Map";
import { Vec3 } from "./Vec3";

export function aosAddressFromIPV4(ip: string | number[]) {
    if (typeof ip == "string") {
        ip = ip.split(".").map((x) => +x);
    }
    return ip[0] | (ip[1] << 8) | (ip[2] << 16) | (ip[3] << 24);
}

export function getNeighbors(pos: Vec3) {
    return [
        new Vec3(1, 0, 0),
        new Vec3(-1, 0, 0),
        new Vec3(0, 1, 0),
        new Vec3(0, -1, 0),
        new Vec3(0, 0, 1),
        new Vec3(0, 0, -1),
    ].map((v) => v.add(pos));
}

export function getDirections() {
    return [
        new Vec3(1, 0, 0),
        new Vec3(-1, 0, 0),
        new Vec3(0, 1, 0),
        new Vec3(0, -1, 0),
        new Vec3(0, 0, 1),
        new Vec3(0, 0, -1),
    ];
}

export function* traverse(from: Vec3, to: Vec3) {
    from = from.copy().floor();
    to = to.copy().floor();
    const dir = to.copy().sub(from).norm();
    from.add(0.5, 0.5, 0.5);
    while (!from.equalsInt(to)) {
        yield from.copy().floor();
        from.add(dir);
    }
    yield from.copy().floor();
}

/**AOS BlockLine style line traversal */
export function* traverseAdjacent(from: Vec3, to: Vec3, size: Vec3, max: number = Infinity) {
    let count = 0;

    let dir = to.copy().sub(from);
    let step = new Vec3(
        dir.x < 0 ? -1 : 1, //
        dir.y < 0 ? -1 : 1,
        dir.z < 0 ? -1 : 1,
    );
    let dirAbs = dir.copy().abs();
    let tmax = new Vec3();

    // tmax = new Vec3(512, 512, 512).mul(Math.max(dir.x, dir.y, dir.z)).div(dir);
    if (dirAbs.x >= dirAbs.y && dirAbs.x >= dirAbs.z) {
        tmax.x = 512;
        tmax.y = (dirAbs.x * 512) / dirAbs.y;
        tmax.z = (dirAbs.x * 512) / dirAbs.z;
    } else if (dirAbs.y >= dirAbs.z) {
        tmax.x = (dirAbs.y * 512) / dirAbs.x;
        tmax.y = 512;
        tmax.z = (dirAbs.y * 512) / dirAbs.z;
    } else {
        tmax.x = (dirAbs.z * 512) / dirAbs.x;
        tmax.y = (dirAbs.z * 512) / dirAbs.y;
        tmax.z = 512;
    }

    let delta = tmax.copy().mul(2);
    let pos = from.copy();
    while (true) {
        yield pos.copy();
        count++;

        if (count >= max || pos.equals(to)) break;

        if (tmax.z <= tmax.x && tmax.z <= tmax.y) {
            pos.z += step.z;
            if (pos.z >= size.z) break;
            tmax.z += delta.z;
        } else if (tmax.x < tmax.y) {
            pos.x += step.x;
            if (pos.x >= size.x) break;
            tmax.x += delta.x;
        } else {
            pos.y += step.y;
            if (pos.y >= size.y) break;
            tmax.y += delta.y;
        }
    }
}

export function wait(ms: number) {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
}
