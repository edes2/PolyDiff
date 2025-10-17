export type RawAudio = string;

export interface Music {
    type: MusicType;
    name: string;
    src: RawAudio;
}

export enum MusicType {
    Lofi = 'lofi',
    Classical = 'classical',
    Jazz = 'jazz',
    Nature = 'nature',
}
