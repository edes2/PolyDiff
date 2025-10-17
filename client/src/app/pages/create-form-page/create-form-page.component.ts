import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CardsService } from '@app/services/cards/cards.service';
import { GameMode } from '@common/enums/mode';
import { EnrichedCardInfo } from '@common/interfaces/card-info';

@Component({
    selector: 'app-create-form-page',
    templateUrl: './create-form-page.component.html',
    styleUrls: ['./create-form-page.component.scss'],
})
export class CreateFormPageComponent implements OnInit {
    gameCardsInfo: EnrichedCardInfo[] = [];
    isEmpty: boolean = true;
    sortAscending: boolean = false;

    constructor(private cardService: CardsService, private changeDetector: ChangeDetectorRef, private router: Router) {}

    ngOnInit(): void {
        this.cardService.cards$.subscribe((cards: EnrichedCardInfo[]) => {
            this.gameCardsInfo = cards ?? [];
            this.isEmpty = this.gameCardsInfo && this.gameCardsInfo.length === 0;
            this.changeDetector.detectChanges();
        });
        this.gameCardsInfo = this.cardService.cards;
    }
    navigatePrevious(): void {
        this.router.navigate(['/options'], { queryParams: { mode: GameMode.Classic } });
    }
    sortCards(): void {
        this.sortAscending = !this.sortAscending;
        this.sortGameCards();
    }
    sortGameCards(): void {
        this.gameCardsInfo.sort((a, b) => {
            if (this.sortAscending) {
                return (a.rating || 0) - (b.rating || 0);
            } else {
                return (b.rating || 0) - (a.rating || 0);
            }
        });
    }
}
