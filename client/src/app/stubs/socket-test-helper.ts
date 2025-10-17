// The use for eslint-disable is to preserve the lisibility.
// The goal of this class is to help with the tests that uses sockets, so coverage is trivial.
/* istanbul ignore file */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

export class SocketTestHelper {
    private static callbacks = new Map<string, (params: any) => void>();

    manager = {
        connect: () => {},
        open: () => {},
        reconnection: () => {},
        reconnectionAttempts: () => {},
        reconnectionDelay: () => {},
        reconnectionDelayMax: () => {},
        socket: () => {},
        timeout: () => {},
    };

    on(event: string, callback: (params: any) => void): void {
        SocketTestHelper.callbacks.set(event, callback);
    }

    emit(_: string, ...__: any): void {
        return;
    }

    connect(): void {
        return;
    }

    disconnect(): void {
        return;
    }

    close(): void {
        return;
    }

    peerSideEmit(event: string, params?: any) {
        const callback = SocketTestHelper.callbacks.get(event);
        if (callback) callback(params);
    }

    hasListeners(event: string): boolean {
        return SocketTestHelper.callbacks.has(event);
    }

    removeListener(event: string): void {
        SocketTestHelper.callbacks.delete(event);
    }
}
