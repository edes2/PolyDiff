/* istanbul ignore file */
/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */

import { Injectable } from '@angular/core';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { EnrichedCardInfo } from '@common/interfaces/card-info';
import { ImageSet } from '@common/interfaces/image';
import { Observable, of } from 'rxjs';

export const cardInfoStub: EnrichedCardInfo = {
    id: '2',
    difficulty: 'Facile',
    name: 'John1',
    bestScores1v1: [],
    bestScoresSolo: [],
    diffCount: 3,
};

export const imageSetStub: ImageSet = {
    cardId: '2',
    leftUri: 'leftUri',
    rightUri: 'rightUri',
};

@Injectable({
    providedIn: 'root',
})
export class CommunicationServiceStub {
    getGameInfoById(cardId: number): Observable<EnrichedCardInfo> {
        return of(cardInfoStub);
    }

    getImageSetById(cardId: number): Observable<ImageSet> {
        return of(imageSetStub);
    }
}

@Injectable({
    providedIn: 'root',
})
export class CanvasModificationServiceStub {
    setCanvas(canvas: HTMLCanvasElement): void {
        return;
    }

    drawImageDataOnCanvas(imgData: ImageData): void {
        return;
    }
}

@Injectable({
    providedIn: 'root',
})
export class SocketClientServiceStub extends SocketClientService {}

@Injectable({
    providedIn: 'root',
})
export class RouterStub {
    navigate(link: string[]): void {
        return;
    }
}

@Injectable({
    providedIn: 'root',
})
export class DialogStub {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function
    close(message: any = undefined): void {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    open(): void {}
}
