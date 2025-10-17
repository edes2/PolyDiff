import { Component, Input, OnInit } from '@angular/core';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { RoomsService } from '@app/services/rooms/rooms.service';
import { ClientEvent } from '@common/enums/socket-events';
import { PublicUserAccount, UserAccount } from '@common/interfaces/user';
import { WaitingRoomDTO } from '@common/interfaces/waiting-room';

@Component({
    selector: 'app-join-room-card-limited',
    templateUrl: './join-room-card-limited.component.html',
    styleUrls: ['./join-room-card-limited.component.scss'],
})
export class JoinRoomCardLimitedComponent implements OnInit {
    @Input() roomInfo!: WaitingRoomDTO;

    owner: UserAccount;

    readonly options: { create: string; join: string } = { create: 'Créer', join: 'Joindre' };

    buttonMultiText: string = this.options.create;
    cardName: string;

    // eslint-disable-next-line max-params
    constructor(private readonly socketService: SocketClientService, private readonly roomsService: RoomsService) {}

    private get roomPlayersUpdateEvent(): string {
        return ClientEvent.UpdateRoomPlayers + this.roomInfo.ownerId;
    }

    ngOnInit() {
        this.owner = this.roomInfo.players.find((player) => player.uid === this.roomInfo.ownerId) as UserAccount;
        // TODO subscribe to room update with players
        this.socketService.onEvent(this.roomPlayersUpdateEvent, (players: any) => {
            this.roomInfo.players = players as PublicUserAccount[];
        });
    }

    joinGame() {
        this.roomsService.joinRoom(this.roomInfo);
    }
}
