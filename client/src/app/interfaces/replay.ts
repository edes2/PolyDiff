import { ClientEvent } from '@common/enums/socket-events';

export interface ReplayEvent {
    time: number;
    type: ClientEvent;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    arg: any;
}
