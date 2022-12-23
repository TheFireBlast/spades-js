import fs from "fs";
import crypto from "crypto";
import { MapData } from "../src/vxl";
import { expect } from "chai";

describe("Border_Hallway.vxl", function () {
    let borderHallwayVxl = fs.readFileSync("Border_Hallway.vxl");
    var parsedMap: MapData;
    it("should parse correctly", function () {
        this.timeout(5000);
        parsedMap = MapData.from_vxl(borderHallwayVxl);
        //TODO: check blocks and colors
    });
    it("writing should yield same input", function () {
        this.timeout(5000);
        let buf = parsedMap.write_map();
        let correctHash = crypto.createHash("md5").update(borderHallwayVxl).digest("hex");
        let receivedHash = crypto.createHash("md5").update(buf).digest("hex");
        expect(correctHash).to.equal(receivedHash, "md5 hashes do not match");
    });
});
