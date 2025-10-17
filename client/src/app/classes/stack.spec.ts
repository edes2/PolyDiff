/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack } from './stack';

describe('Stack', () => {
    let stack: Stack<any>;

    beforeEach(() => {
        stack = new Stack<any>();
    });

    it('should create an instance', () => {
        expect(stack).toBeTruthy();
    });

    it('pop should return undefined is stack is empty', () => {
        const element = stack.pop();
        expect(element).toEqual(undefined);
    });

    it('pop should return the correct item if stack is not empty', () => {
        const initialElement = 'this is a test';
        stack['items'].push(initialElement);
        const element = stack.pop();
        expect(element).toEqual(initialElement);
    });

    it('push should properly add the item to stack', () => {
        const initialElement = 'this is a test';
        const pushSpy = spyOn(stack['items'], 'push').and.callThrough();
        stack.push(initialElement);
        expect(pushSpy).toHaveBeenCalled();
        expect(stack['items'][0]).toEqual(initialElement);
    });

    it('isEmpty should return true if stack is empty and false otherwise', () => {
        expect(stack.isEmpty()).toEqual(true);

        const initialElement = 'this is a test';
        stack.push(initialElement);
        expect(stack.isEmpty()).toEqual(false);
    });

    it('clear should remove all items from stack', () => {
        const initialElement = 'this is a test';
        stack.push(initialElement);
        expect(stack['items'].length).toEqual(1);
        stack.clear();
        expect(stack['items'].length).toEqual(0);
    });

    it('stack iterator should iterate through all items', () => {
        stack.push(0);
        stack.push(1);
        stack.push(2);

        for (const { index, item } of stack) {
            expect(item).toEqual(index);
        }
    });
});
