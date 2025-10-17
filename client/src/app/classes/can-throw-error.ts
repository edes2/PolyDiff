import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';

export class CanThrowErrorPopup {
    constructor(protected readonly matDialog: MatDialog, protected readonly router: Router) {}

    protected throwError(message: string): void {
        this.matDialog
            .open(PopupMessageComponent, {
                disableClose: true,
                data: {
                    message: {
                        content: message,
                        leftButtonText: 'Retour',
                        leftRouterLink: 'home',
                    },
                },
            })
            .afterClosed()
            .subscribe(() => {
                this.router.navigate(['home']);
            });
    }
}
