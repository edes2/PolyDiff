import { Injectable } from '@angular/core';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { ClientEvent, ServerEvent } from '@common/enums/socket-events';
import { CardCreationInfo, EnrichedCardInfo } from '@common/interfaces/card-info';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CardsService {
    cards$: Observable<EnrichedCardInfo[]>;
    private cardsSubject = new BehaviorSubject<EnrichedCardInfo[]>([]);

    constructor(private communicationService: CommunicationService, private socketService: SocketClientService) {
        this.cards$ = this.cardsSubject.asObservable();
        this.subscribeToCardsEvents();
        this.fetchCards();
    }

    get cards(): EnrichedCardInfo[] {
        return this.cardsSubject.getValue();
    }

    async fetchCards(): Promise<void> {
        this.communicationService.allCardInfosGet().subscribe((cards: EnrichedCardInfo[]) => {
            this.cardsSubject.next(cards);
        });
    }

    add(card: EnrichedCardInfo): void {
        const currentCards = this.cardsSubject.getValue();
        this.cardsSubject.next([...currentCards, card]);
    }

    remove(cardId: string): void {
        const currentCards = this.cardsSubject.getValue();
        const updatedCards = currentCards.filter((card) => card.id !== cardId);
        this.cardsSubject.next(updatedCards);
    }

    getCardCount(): number {
        return this.cardsSubject.getValue()?.length ?? 0;
    }

    async saveCard(cardCreationInfo: CardCreationInfo): Promise<boolean> {
        return new Promise((resolve) => {
            this.communicationService.saveCardPost(cardCreationInfo).subscribe(() => {
                resolve(true);
            });
        });
    }

    private subscribeToCardsEvents(): void {
        this.socketService.onEvent(ServerEvent.CardsUpdated, (cards: EnrichedCardInfo[]) => {
            this.cardsSubject.next(cards);
        });

        this.socketService.onEvent(ClientEvent.CardDeleted, (cardId: string) => {
            this.remove(cardId);
        });

        this.socketService.onEvent(ClientEvent.CardCreated, (cardInfo: EnrichedCardInfo) => {
            this.add(cardInfo);
        });
    }
}
