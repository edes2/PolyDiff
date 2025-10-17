import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/authentification/auth.service';
import { GameMode } from '@common/enums/mode';
import { ServerEvent } from '@common/enums/socket-events';
// eslint-disable-next-line no-restricted-imports
import { ConfirmationComponent } from '@app/components/confirmation/confirmation.component';
import { ChatService } from '@app/services/communication/chat.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { GameService } from '@app/services/game/game.service';

@Component({
    selector: 'app-sidenav-link',
    templateUrl: './sidenav-link.component.html',
    styleUrls: ['./sidenav-link.component.scss'],
})
export class SidenavLinkComponent {
    @Input() goTo: string;
    @Input() mode: GameMode | null = null;

    private quitConfirmationPopup: MatDialogRef<ConfirmationComponent> | null;

    // eslint-disable-next-line max-params
    constructor(
        public router: Router,
        private authService: AuthService,
        public matDialog: MatDialog,
        private socketService: SocketClientService,
        private chatService: ChatService,
        private gameService: GameService,
    ) {}

    get manager() {
        return this.gameService.manager;
    }

    redirect() {
        if (this.mode !== null) {
            if (this.mode === GameMode.Classic || this.mode === GameMode.LimitedTime) {
                this.openQuitConfirmationPopup();
            } else if (this.mode === GameMode.Zen) {
                // TODO: puisque la logique est dans le Zen game page, comment unsubscribe aux events, etc.?
                this.openZenQuitConfirmationPopup();
            }
        } else {
            if (this.goTo === '/signin') {
                this.signOut();
            }
            this.router.navigate([this.goTo]);
        }
    }

    async signOut() {
        if (this.mode === null) {
            await this.authService.disconnect();
        }
    }

    openQuitConfirmationPopup() {
        this.quitConfirmationPopup = this.matDialog.open(ConfirmationComponent, {
            data: {
                message: 'Êtes-vous sûr de vouloir quitter?',
            },
        });
        this.quitConfirmationPopup.afterClosed().subscribe((choice: boolean) => {
            if (choice) {
                this.handleChatClose();
                this.socketService.emitEvent(ServerEvent.AbandonGame);
                if (this.goTo === '/signin') {
                    this.signOut();
                }
                this.router.navigate([this.goTo]);
            }
        });
    }

    openZenQuitConfirmationPopup() {
        this.quitConfirmationPopup = this.matDialog.open(ConfirmationComponent, {
            data: {
                message: 'Êtes-vous sûr de vouloir quitter?',
            },
        });
        this.quitConfirmationPopup.afterClosed().subscribe((choice: boolean) => {
            if (choice) {
                if (this.goTo === '/signin') {
                    this.signOut();
                }
                this.router.navigate([this.goTo]);
            }
        });
    }

    handleChatClose() {
        const uid = this.authService.getUserInfo()?.uid;
        if (!uid) throw new Error('No user connected');
        this.chatService.hidePrivateChannelBox();
        this.chatService.leavePrivateChannel(uid, this.manager.playingInfo.roomId);
        if (this.manager.playingInfo.players.length === 1) {
            this.manager.removeChat();
        }
    }
}
