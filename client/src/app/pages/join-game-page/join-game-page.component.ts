import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CreationMultiComponent } from '@app/components/creation-multi/creation-multi.component';
import { RoomsService } from '@app/services/rooms/rooms.service';
import { GameMode, MAX_PLAYERS_PER_GAME } from '@common/enums/mode';
import { GameConfig } from '@common/interfaces/game-config';
import { WaitingRoomDTO } from '@common/interfaces/waiting-room';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-join-game-page',
    templateUrl: './join-game-page.component.html',
    styleUrls: ['./join-game-page.component.scss'],
})
export class JoinGamePageComponent implements OnInit, OnDestroy {
    waitingRooms: WaitingRoomDTO[] = [];
    waitingRoomsSubscription: Subscription | undefined;
    isClassic: boolean = false;
    isEmpty: boolean = true;
    mode: GameMode | undefined;

    // eslint-disable-next-line max-params
    constructor(private roomsService: RoomsService, private route: ActivatedRoute, private router: Router, public matDialog: MatDialog) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.mode = params['mode'];
        });

        this.isClassic = this.mode === GameMode.Classic;

        const roomsObservable = this.isClassic ? this.roomsService.classicWaitingGames$ : this.roomsService.limitedWaitingGames$;

        this.waitingRoomsSubscription = roomsObservable.subscribe((games: WaitingRoomDTO[]) => {
            this.waitingRooms = games.filter((game) => game.players.length < MAX_PLAYERS_PER_GAME);
            this.isEmpty = this.waitingRooms && this.waitingRooms.length === 0;
        });
        this.roomsService.fetchWaitingRooms();
    }

    joinRandomRoom(): void {
        this.roomsService.joinRandomRoom(this.isClassic ? GameMode.Classic : GameMode.LimitedTime);
    }

    ngOnDestroy(): void {
        if (this.waitingRoomsSubscription) this.waitingRoomsSubscription.unsubscribe();
    }

    async navigatePrevious() {
        this.router.navigate(['/options'], { queryParams: { mode: this.mode } });
    }

    redirectToCreateGame() {
        if (this.mode === GameMode.Classic) {
            this.router.navigate(['/create/game']);
        } else if (this.mode === GameMode.LimitedTime) {
            this.navigatePrevious().then(() => {
                this.startLimitedGameCreation();
            });
        }
    }

    private startLimitedGameCreation(): void {
        const dialogRef = this.matDialog.open(CreationMultiComponent, {
            data: {
                message: 'Configurer la partie',
                routerLink: undefined,
            },
        });
        dialogRef.componentInstance.mode = GameMode.LimitedTime;

        dialogRef.afterClosed().subscribe((choice) => {
            if (choice) {
                this.handleStartingLimitedGame(choice.duration, choice.cheatingMode, choice.limitedBonus);
            }
        });
    }

    private handleStartingLimitedGame(duration: number, cheatingAllowed: boolean, limitedBonus: number) {
        const config: GameConfig = {
            mode: GameMode.LimitedTime,
            duration,
            cheatingAllowed,
            timeBonus: limitedBonus,
        };

        this.roomsService.createRoom(config);
    }
}
