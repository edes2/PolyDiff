import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { CardsService } from '@app/services/cards/cards.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { EnrichedCardInfo } from '@common/interfaces/card-info';
import { Observable } from 'rxjs/internal/Observable';

@Component({
    selector: 'app-base-game-form',
    templateUrl: './base-game-form.component.html',
    styleUrls: ['./base-game-form.component.scss'],
})
export class BaseGameFormComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    obs: Observable<EnrichedCardInfo[]>;
    dataSource: MatTableDataSource<EnrichedCardInfo>;

    // Because we want to use a single instance of angular classes
    // eslint-disable-next-line max-params
    constructor(
        protected changeDetectorRef: ChangeDetectorRef,
        protected readonly communicationService: CommunicationService,
        protected matDialog: MatDialog,
        private cardsService: CardsService,
    ) {}

    ngOnInit() {
        this.getAllCardInfos();
    }

    getAllCardInfos(): Observable<EnrichedCardInfo[]> {
        this.communicationService.allCardInfosGet().subscribe((response) => {
            this.dataSource = new MatTableDataSource<EnrichedCardInfo>(response);
            this.changeDetectorRef.detectChanges();
            this.obs = this.dataSource.connect();
            this.dataSource.paginator = this.paginator;
        });
        this.cardsService.cards$.subscribe((cards: EnrichedCardInfo[]) => {
            this.dataSource.data = cards;
        });
        return this.obs;
    }

    isEmpty(): boolean {
        if (!this.dataSource) {
            return false;
        }
        return this.dataSource.data.length ? false : true;
    }
}
