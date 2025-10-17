import { Injectable } from '@angular/core';
import { CommunicationService } from '@app/services/communication/communication.service';
import { Music, MusicType } from '@common/interfaces/music';
import { OneDifferenceImageSet } from '@common/interfaces/one-difference-set';
import { Vec2 } from '@common/interfaces/vec2';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ZenModeService {
    clickValidation$: Observable<boolean>;

    constructor(private readonly communicationService: CommunicationService) {}

    getRandomImageSet(excludeIds?: string[]): Observable<OneDifferenceImageSet> {
        return this.communicationService.getRandomOneDifferenceImageSet(excludeIds);
    }

    isSuccessfulClick(set: OneDifferenceImageSet, clickPosition: Vec2): boolean {
        return set.difference.some((difference) => difference.x === clickPosition.x && difference.y === clickPosition.y);
    }

    getRandomMusic(type: MusicType): Observable<Music> {
        return this.communicationService.getRandomMusic(type);
    }
}
