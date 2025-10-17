export class Stack<T> {
    private items: T[] = [];

    pop(): T | undefined {
        if (this.items.length === 0) {
            return;
        }
        return this.items.pop();
    }

    push(item: T): void {
        this.items.push(item);
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    clear(): void {
        this.items.length = 0;
    }

    [Symbol.iterator]() {
        let index = -1;
        return {
            next: () => ({ value: this.items[++index], done: !(index in this.items) }),
        };
    }
}
