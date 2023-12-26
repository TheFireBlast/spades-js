import { Vec3 } from "./Vec3";

interface HitResult {
    success: boolean;
    voxelPosition: Vec3;
    position: Vec3;
    normal: Vec3;
}

// Rewrite of https://github.com/fenomas/fast-voxel-raycast

export function raytrace(
    getVoxel: (v: Vec3) => boolean,
    origin: Vec3,
    direction: Vec3,
    maxDist: number = 512,
): HitResult {
    // algo below is as described by this paper:
    // http://www.cse.chalmers.se/edu/year/2010/course/TDA361/grid.pdf

    direction = direction.copy().norm();

    let t = 0;
    const pos = origin.copy().floor();
    const step = new Vec3(
        direction.x > 0 ? 1 : -1, //
        direction.y > 0 ? 1 : -1,
        direction.z > 0 ? 1 : -1,
    );
    // direction is already normalized
    const tDelta = direction.copy().inv().abs();
    const dist = new Vec3(
        step.x > 0 ? pos.x + 1 - origin.x : origin.x - pos.x,
        step.y > 0 ? pos.y + 1 - origin.y : origin.y - pos.y,
        step.z > 0 ? pos.z + 1 - origin.z : origin.z - pos.z,
    );
    // location of nearest voxel boundary, in units of t
    const tMax = tDelta.copy().mul(dist);
    let steppedIndex = -1;

    // main loop along raycast vector
    while (t <= maxDist) {
        // exit check
        if (getVoxel(pos)) {
            let normal = new Vec3();
            if (steppedIndex === 0) normal.x = -step.x;
            if (steppedIndex === 1) normal.y = -step.y;
            if (steppedIndex === 2) normal.z = -step.z;
            return {
                success: true,
                voxelPosition: pos,
                position: origin.copy().add(direction.mul(t)),
                normal,
            };
        }

        // advance t to next nearest voxel boundary
        if (tMax.x < tMax.y) {
            if (tMax.x < tMax.z) {
                pos.x += step.x;
                t = tMax.x;
                tMax.x += tDelta.x;
                steppedIndex = 0;
            } else {
                pos.z += step.z;
                t = tMax.z;
                tMax.z += tDelta.z;
                steppedIndex = 2;
            }
        } else {
            if (tMax.y < tMax.z) {
                pos.y += step.y;
                t = tMax.y;
                tMax.y += tDelta.y;
                steppedIndex = 1;
            } else {
                pos.z += step.z;
                t = tMax.z;
                tMax.z += tDelta.z;
                steppedIndex = 2;
            }
        }
    }

    return {
        success: false,
        voxelPosition: pos,
        position: origin.copy().add(direction.mul(t)),
        normal: new Vec3(),
    };
}
