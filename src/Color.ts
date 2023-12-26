import * as util from "node:util";

export class Color {
    b: number = 0;
    g: number = 0;
    r: number = 0;
    a: number = 0;
    constructor(r = 0, g = 0, b = 0, a = 0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    static fromARGB(argb: number) {
        return new Color(
            (argb & 0x00ff0000) >> 16,
            (argb & 0x0000ff00) >> 8,
            (argb & 0x000000ff) >> 0,
            (argb & 0xff000000) >> 24,
        );
    }
    clamp() {
        this.r = Math.max(Math.min(this.r, 255), 0);
        this.g = Math.max(Math.min(this.g, 255), 0);
        this.b = Math.max(Math.min(this.b, 255), 0);
        this.a = Math.max(Math.min(this.a, 255), 0);
        return this;
    }
    getARGB() {
        const { a, r, g, b } = this;
        return (a << 24) | (r << 16) | (g << 8) | (b << 0);
    }

    equalsRGB(col: Color) {
        return this.r == col.r && this.g == col.g && this.b == col.b;
    }
    equalsRGBA(col: Color) {
        return this.r == col.r && this.g == col.g && this.b == col.b && this.a == col.a;
    }
    equals = this.equalsRGBA;

    toStringRGB() {
        return `rgb(${this.r},${this.g},${this.b})`;
    }
    toStringRGBA() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }
    toString() {
        return this.toStringRGBA();
    }
    [util.inspect.custom](depth: number, options: util.InspectOptionsStylized) {
        return this.toString();
    }

    static grayscale(value: number) {
        return new Color(value, value, value, 255);
    }

    static white() {
        return new Color(255, 255, 255, 255);
    }
    static black() {
        return new Color(0, 0, 0, 255);
    }
    static gray() {
        return new Color(111, 111, 111, 255);
    }
    static red() {
        return new Color(255, 0, 0, 255);
    }
    static green() {
        return new Color(0, 255, 0, 255);
    }
    static blue() {
        return new Color(0, 0, 255, 255);
    }
}
