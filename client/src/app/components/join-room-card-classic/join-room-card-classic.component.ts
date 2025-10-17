import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { RoomsService } from '@app/services/rooms/rooms.service';
import { SECONDS_IN_MINUTE } from '@common/constants/time';
import { ClientEvent } from '@common/enums/socket-events';
import { EnrichedCardInfo } from '@common/interfaces/card-info';
import { PublicUserAccount, UUIDType, UserAccount } from '@common/interfaces/user';
import { WaitingRoomDTO } from '@common/interfaces/waiting-room';

@Component({
    selector: 'app-join-room-card-classic',
    templateUrl: './join-room-card-classic.component.html',
    styleUrls: ['./join-room-card-classic.component.scss'],
})
export class JoinRoomCardClassicComponent implements OnInit {
    @Input() cardId: UUIDType;
    @Input() roomInfo: WaitingRoomDTO;
    @ViewChild('image', { static: false }) private image!: ElementRef<HTMLImageElement>;

    cardInfo: EnrichedCardInfo;
    owner: UserAccount;
    cardName: string;

    // eslint-disable-next-line max-params
    constructor(
        private readonly socketService: SocketClientService,
        private readonly communicationService: CommunicationService,
        private readonly roomsService: RoomsService,
        private changeDetector: ChangeDetectorRef,
    ) {}

    private get roomPlayersUpdateEvent(): string {
        return ClientEvent.UpdateRoomPlayers + this.roomInfo.ownerId;
    }
    ngOnInit() {
        this.communicationService.cardInfoByIdGet(this.cardId).subscribe((cardInfo) => {
            this.cardInfo = cardInfo;
            this.displayName();
            this.displayImage();
        });

        if (this.roomInfo) {
            this.owner = this.roomInfo.players.find((player) => player.uid === this.roomInfo.ownerId) as UserAccount;
        }
        this.socketService.onEvent(this.roomPlayersUpdateEvent, (players: any) => {
            this.roomInfo.players = players as PublicUserAccount[];
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

    joinGame() {
        this.roomsService.joinRoom(this.roomInfo);
    }

    convertSecondsToTime(seconds: number): string {
        const minutes = Math.floor(seconds / SECONDS_IN_MINUTE);
        const remainingSeconds = seconds % SECONDS_IN_MINUTE;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}
