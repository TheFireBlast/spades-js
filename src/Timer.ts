export class Timer {
    last: number = 0;
    listeners: Set<() => void> = new Set();
    constructor(public delay: number) {}
    reset(now = Date.now()) {
        this.last = now;
    }
    clear() {
        this.last = 0;
        this.listeners.clear();
    }
    canUse(now = Date.now()) {
        return now - this.last >= this.delay;
    }
    use(now = Date.now()) {
        if (now - this.last >= this.delay) {
            this.last = now;
            return true;
        }
        return false;
    }
    wait(now = Date.now()) {
        return new Promise<void>((resolve, reject) => {
            if (now - this.last >= this.delay) {
                resolve();
            } else {
                const fn = () => {
                    this.listeners.delete(fn);
                    clearTimeout(timeout);
                    resolve();
                };
                this.listeners.add(fn);
                const timeout = setTimeout(fn, this.delay + this.last - now);
            }
        });
    }
}
