import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { appInjector } from '@app/app.module';
import { AuthResult } from '@app/enums/auth-result';
import { AuthService } from '@app/services/authentification/auth.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { filter, firstValueFrom } from 'rxjs';

const PASSWORD_RESET_DELAY = 10000;
const DEBUG_AUTO_CONNECT = false;

const autoConnect = async () => {
    const authService = appInjector.get(AuthService);
    const router = appInjector.get(Router);

    const userData = localStorage.getItem('user');

    if (userData) {
        const user = JSON.parse(userData);
        await authService.authenticate(user.email, user.password);
        await firstValueFrom(authService.userInfo$.pipe(filter((userInfo) => userInfo !== null)));
        // At this point, userInfo should be defined
        console.log('UserInfo is defined:', authService.getUserInfo());
        router.navigate(['home']);
    }
};

@Component({
    selector: 'app-auth-page',
    templateUrl: './auth-page.component.html',
    styleUrls: ['./auth-page.component.scss'],
})
export class AuthPageComponent {
    errorMessage: string = '';
    resetMessage: string = '';

    email: string = '';
    password: string = '';

    resetPasswordDisabled: boolean = false;

    constructor(private authService: AuthService, private router: Router, private socketService: SocketClientService) {
        if (this.socketService.isConnected()) {
            this.socketService.disconnect(); // Disconnect from any previous session
        }

        if (DEBUG_AUTO_CONNECT) {
            try {
                autoConnect();
            } catch (e) {
                console.error(e);
            }
        }
    }

    async onSignInClick() {
        const authResult: AuthResult = await this.authService.authenticate(this.email, this.password);

        if (authResult === AuthResult.Success) {
            await firstValueFrom(this.authService.userInfo$.pipe(filter((userInfo) => userInfo !== null)));
            // At this point, userInfo should be defined
            console.log('UserInfo is defined:', this.authService.getUserInfo());
            this.router.navigate(['home']);
            this.saveUser();
        } else if (authResult === AuthResult.AlreadyConnected) {
            this.errorMessage = 'Vous êtes déjà connecté sur un autre appareil';
        } else {
            this.errorMessage = 'Le courriel ou le mot de passe est invalide';
        }
    }

    onSignUpClick() {
        this.router.navigate(['signup']);
    }

    isSignInEnabled() {
        return this.email.length > 0 && this.password.length > 0;
    }

    isResetEnabled() {
        return this.email.length > 0;
    }

    async resetPassword() {
        if (this.resetPasswordDisabled) {
            this.resetMessage = 'Veuillez attendre avant de réessayer.';
        } else if (await this.authService.resetPassword(this.email)) {
            this.resetMessage = 'Si le courriel est valide, un courriel vous a été envoyé pour réinitialiser votre mot de passe.';
            this.resetPasswordDisabled = true;
            setTimeout(() => {
                this.resetPasswordDisabled = false;
            }, PASSWORD_RESET_DELAY);
        } else {
            this.resetMessage = 'Une erreur est survenue lors de la réinitialisation du mot de passe.';
        }
    }

    private saveUser() {
        localStorage.setItem('user', JSON.stringify({ email: this.email, password: this.password }));
    }
}
