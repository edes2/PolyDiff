import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@app/services/authentification/auth.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private socketService: SocketClientService, private router: Router) {}

    async canActivate(): Promise<boolean> {
        try {
            let success = false;

            if (await this.authService.isConnected()) {
                if (!this.socketService.isConnected()) {
                    const token = await this.authService.getToken();
                    success = await this.socketService.initConnection(token);
                } else {
                    success = true;
                }
            }

            if (!success) {
                this.router.navigate(['signin']);
            }

            return success;
        } catch (error) {
            return false;
        }
    }
}
