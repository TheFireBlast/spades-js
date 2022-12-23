declare module "enet" {
    import events = require("events");

    interface AddressOptions {
        address: string;
        port: number;
    }
    class Address {
        constructor(ip: string);
        constructor(host: string, port: number);
        constructor(address: Address);
        constructor(pointer: number);
        address(): string;
        port(): number;
        host(): number;
    }
    export class Event {
        free(): void;
        type(): any;
        peer(): Peer;
        peerPtr(): any;
        packet(): Packet;
        data(): any;
        channelID(): any;
    }
    export class Host extends events.EventEmitter {
        start(intervalMs?: number): void;
        stop(): void;
        connect(address: any, channelCount: any, data: any, callback: any): any;
        send(ip: any, port: any, buff: any, callback: any): void;
        peers(): any;
        enableCompression(): any;
        disableCompression(): any;
        address(): {
            address: string;
            family: string;
            port: number;
        };
        broadcast(channel: any, packet: any): void;
        destroy(): void;
        firstStart(): void;
        flush(): void;
        isOffline(): any;
        isOnline(): any;
        receivedAddress():
            | {
                  address: string;
                  port: any;
              }
            | undefined;
        throttleBandwidth(): any;

        on(eventName: "connect", listener: (peer: Peer, data: any | undefined, outgoing: boolean) => void): this;
        on(eventName: "message", listener: (peer: Peer, packet: Packet, channelId: number) => void): this;
        on(
            eventName: "telex",
            listener: (buffer: Buffer, source: NonNullable<ReturnType<Host["receivedAddress"]>>) => void
        ): this;
        on(eventName: "error", listener: (error: unknown) => void): this;
        on(eventName: "destroy", listener: () => void): this;
    }
    export class Packet {
        constructor(pointer: number);
        constructor(buffer: Buffer, flags?: PacketFlag);
        constructor(str: string, flags?: PacketFlag);
        data(): Buffer;
        dataLength(): number;
        flags(): number;
        wasSent(): boolean;
        destroy(): void;
    }
    export class Peer extends events.EventEmitter {
        state(): any;
        incomingDataTotal(): any;
        outgoingDataTotal(): any;
        reliableDataInTransit(): any;
        send(channel: number, packet: any, callback?: Function): boolean;
        on(eventName: "connect", listener: () => void): this;
        on(eventName: "disconnect", listener: (data: unknown | 0) => void): this;
        on(eventName: "message", listener: (packet: Packet, channelId: number) => void): this;
        createWriteStream(channel: number): import("node:stream").Writable;
        createReadStream(channel: number): import("node:stream").Readable;
        createDuplexStream(channel: number): import("node:stream").Duplex;
        disconnect(data?: number): this;
        disconnectNow(data?: number): this;
        disconnectLater(data?: number): this;
        reset(): this;
        ping(): this;
        address(): AddressOptions;
    }
    //TODO: fix enums
    enum PacketFlag {
        RELIABLE,
        SENT,
        UNRELIABLE_FRAGMENT,
        UNSEQUENCED,
    }
    export const PACKET_FLAG: typeof PacketFlag;
    export const PEER_STATE: {
        ACKNOWLEDGING_CONNECT: number;
        ACKNOWLEDGING_DISCONNECT: number;
        CONNECTED: number;
        CONNECTING: number;
        CONNECTION_PENDING: number;
        CONNECTION_SUCCEEDED: number;
        DISCONNECTED: number;
        DISCONNECTING: number;
        DISCONNECT_LATER: number;
        ZOMBIE: number;
    };

    interface HostOptions {
        address?: Address | AddressOptions;
        peers?: number;
        channels?: number;
        down?: number;
        up?: number;
    }
    export function createServer(options: HostOptions, callback: (err: Error | undefined, host: Host) => void): Host;
    export function createClient(options: HostOptions, callback: (err: Error | undefined, host: Host) => void): Host;
    export function createServerFromSocket(options: HostOptions, callback: any): Host;
    export function createServer(callback: (err: Error | undefined, host: Host) => void): Host;
    export function createClient(callback: (err: Error | undefined, host: Host) => void): Host;
    export function createServerFromSocket(callback: any): Host;
    export function init(func: Function): void;
}
