import * as fs from "node:fs";
import { Server } from "./Server";

declare global {
    let TEST_SERVER: Server;
}

if (process.argv.includes("--HMR")) process.env.HMR = "true";

let server = new Server(9001);
(global as any).TEST_SERVER = server;
server.start();

process.on("SIGINT", async () => {
    console.log("Stopping server...");
    await server.stop();
    process.exit(0);
});

if (process.env.HMR == "true") {
    useHMR("./Server", ["Server"]);
    useHMR("./Player", ["Player"]);
    useHMR("./Map", ["SpadesMap"]);
    useHMR("./Color", ["Color"]);
    useHMR("./BufferCursor", ["BufferCursor"]);
}

//TODO: support exported functions or turn packets into classes
//TODO: also reload nested imports
/**Only supports classes */
async function useHMR(path: string, exports: string[]) {
    const fullPath = require.resolve(path);

    const mod = await import(fullPath);

    let timer: NodeJS.Timeout | undefined;
    fs.watch(fullPath, (event) => {
        if (event == "change") {
            clearTimeout(timer);
            timer = setTimeout(async () => {
                delete require.cache[fullPath];
                for (const exp of exports) {
                    // const diff = [];
                    const latest = (await import(fullPath))[exp];
                    for (const k of Object.getOwnPropertyNames(latest.prototype)) {
                        const d = Object.getOwnPropertyDescriptor(latest.prototype, k);
                        if (!d) continue;
                        Object.defineProperty(mod[exp].prototype, k, d);
                    }
                    for (const k of Object.getOwnPropertyNames(latest)) {
                        if (k == "prototype") continue;
                        const d = Object.getOwnPropertyDescriptor(latest, k);
                        if (!d) continue;
                        Object.defineProperty(mod[exp], k, d);
                    }
                }
                console.log(`[HMR] Reloaded ${path}`);
            }, 200);
        }
    });
}
