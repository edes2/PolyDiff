import { Vec2 } from './vec2';

export interface ClickValidation {
    side: string;
    position: Vec2;
}

export interface Message {
    content: string;
    emitterId: string;
    timestamp?: string;
    type?: string;
}

export interface EnrichedMessage extends Message {
    emitterName: string;
}

export interface PopupMessage {
    content: string;
    leftRouterLink?: string;
    rightRouterLink?: string;
    leftButtonText: string;
    rightButtonText?: string;
}
