// https://github.com/mourner/flatqueue/blob/main/index.js

// ISC License

// Copyright (c) 2022, Vladimir Agafonkin

// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.

// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
// OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
// TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
// THIS SOFTWARE.

interface WriteArrayLike<T> {
    length: number;
    [n: number]: T;
}

export default class FlatQueue<T = number> {
    private _length = 0;
    get length() {
        return this._length;
    }

    constructor(
        public ids: WriteArrayLike<T> = [],
        public values: WriteArrayLike<number> = [],
    ) {}

    clear() {
        this._length = 0;
    }

    push(item: T, priority: number) {
        let pos = this._length++;

        while (pos > 0) {
            const parent = (pos - 1) >> 1;
            const parentValue = this.values[parent];
            if (priority >= parentValue) break;
            this.ids[pos] = this.ids[parent];
            this.values[pos] = parentValue;
            pos = parent;
        }

        this.ids[pos] = item;
        this.values[pos] = priority;
    }

    pop() {
        if (this._length === 0) return undefined;

        const top = this.ids[0];
        this._length--;

        if (this._length > 0) {
            const id = (this.ids[0] = this.ids[this._length]);
            const value = (this.values[0] = this.values[this._length]);
            const halfLength = this._length >> 1;
            let pos = 0;

            while (pos < halfLength) {
                let left = (pos << 1) + 1;
                const right = left + 1;
                let bestIndex = this.ids[left];
                let bestValue = this.values[left];
                const rightValue = this.values[right];

                if (right < this._length && rightValue < bestValue) {
                    left = right;
                    bestIndex = this.ids[right];
                    bestValue = rightValue;
                }
                if (bestValue >= value) break;

                this.ids[pos] = bestIndex;
                this.values[pos] = bestValue;
                pos = left;
            }

            this.ids[pos] = id;
            this.values[pos] = value;
        }

        return top;
    }

    peek() {
        if (this._length === 0) return undefined;
        return this.ids[0];
    }

    peekValue() {
        if (this._length === 0) return undefined;
        return this.values[0];
    }

    shrink() {
        this.ids.length = this.values.length = this._length;
    }
}
