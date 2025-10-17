import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CreationMultiComponent } from '@app/components/creation-multi/creation-multi.component';
import { CommunicationService } from '@app/services/communication/communication.service';
import { RoomsService } from '@app/services/rooms/rooms.service';
import { SECONDS_IN_MINUTE } from '@common/constants/time';
import { GameMode } from '@common/enums/mode';
import { EnrichedCardInfo } from '@common/interfaces/card-info';
import { GameConfig } from '@common/interfaces/game-config';
import { UUIDType } from '@common/interfaces/user';

@Component({
    selector: 'app-create-room-card',
    templateUrl: './create-room-card.component.html',
    styleUrls: ['./create-room-card.component.scss'],
})
export class CreateRoomCardComponent implements OnInit {
    @Input() cardId!: UUIDType;
    @ViewChild('image', { static: false }) private image!: ElementRef<HTMLImageElement>;

    cardInfo: EnrichedCardInfo;
    cardName: string;

    // eslint-disable-next-line max-params
    constructor(
        private readonly communicationService: CommunicationService,
        private matDialog: MatDialog,
        private changeDetector: ChangeDetectorRef,
        private roomsService: RoomsService,
    ) {}

    ngOnInit() {
        this.communicationService.cardInfoByIdGet(this.cardId).subscribe((cardInfo) => {
            this.cardInfo = cardInfo;
            this.displayName();
            this.displayImage();
        });
    }

    displayName(): void {
        const desiredLength = 20;
        this.cardName = this.cardInfo.name.substring(0, desiredLength);
        if (this.cardInfo.name.length > desiredLength) this.cardName += '...';
    }

    async displayImage() {
        this.changeDetector.detectChanges();
        this.communicationService.imageMiniatureGet(this.cardId).subscribe((image) => {
            if (image) {
                this.image.nativeElement.src = image;
            }
        });
    }

    startGameCreation(): void {
        const dialogRef = this.matDialog.open(CreationMultiComponent, {
            data: {
                message: 'Configurer la partie',
                routerLink: undefined,
            },
        });

        dialogRef.afterClosed().subscribe((choice) => {
            if (choice) {
                this.handleStartingGame(this.cardInfo.id, choice.duration, choice.cheatingMode);
            }
        });
    }

    handleStartingGame(cardId: string, duration: number, cheatingAllowed: boolean) {
        const config = {
            mode: GameMode.Classic,
            duration,
            cheatingAllowed,
            cardId,
        } as GameConfig;

        this.roomsService.createRoom(config);
    }

    convertSecondsToTime(seconds: number): string {
        const minutes = Math.floor(seconds / SECONDS_IN_MINUTE);
        const remainingSeconds = seconds % SECONDS_IN_MINUTE;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}
