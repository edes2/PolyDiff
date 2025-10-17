import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@app/services/authentification/auth.service';

@Injectable({
    providedIn: 'root',
})
export class ReverseAuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) {}

    async canActivate(): Promise<boolean> {
        if (await this.authService.isConnected()) {
            this.router.navigate(['home']);
            return false;
        }
        return true;
    }
}
