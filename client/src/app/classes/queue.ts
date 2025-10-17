export class Queue<T> {
    private rear: number;
    private front: number;
    private items: Map<number, T>;

    constructor(arr: T[] = []) {
        this.front = this.rear = 0;
        this.items = new Map<number, T>();
        this.concat(arr);
    }

    get size() {
        return this.rear - this.front;
    }

    push(item: T): void {
        this.items.set(this.rear++, item);
    }

    shift(): T | undefined {
        const item = this.items.get(this.front);
        this.items.delete(this.front++);
        return item;
    }

    concat(arr: T[]): void {
        arr.forEach((value: T) => {
            this.push(value);
        });
    }
}
