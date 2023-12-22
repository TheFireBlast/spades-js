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
    getARGB() {
        const { a, r, g, b } = this;
        return (a << 24) | (r << 16) | (g << 8) | (b << 0);
    }
    toString() {
        return this.toStringRGBA();
    }
    toStringRGB() {
        return `rgb(${this.r},${this.g},${this.b})`;
    }
    toStringRGBA() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }
}
