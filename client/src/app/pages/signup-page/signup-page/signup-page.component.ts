import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/authentification/auth.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { AccountCreationStatus } from '@common/interfaces/account-creation';
import { filter, firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-signup-page',
    templateUrl: './signup-page.component.html',
    styleUrls: ['./signup-page.component.scss'],
})
export class SignupPageComponent {
    showError: boolean = false;
    errorMessage: string = '';

    username: string = '';
    password: string = '';
    rewritePassword: string = '';
    email: string = '';

    constructor(private communicationService: CommunicationService, private authService: AuthService, private router: Router) {}

    async onSignUpClick() {
        this.showError = false;
        this.errorMessage = '';

        if (this.password !== this.rewritePassword) {
            this.showError = true;
            this.errorMessage = 'Les mots de passe entrés ne sont pas les mêmes';
            return;
        }

        try {
            const result = await firstValueFrom(this.communicationService.signUp(this.username, this.email, this.password));
            if (result.status === AccountCreationStatus.SUCCESS) {
                await this.authService.authenticate(this.email, this.password);
                await firstValueFrom(this.authService.userInfo$.pipe(filter((user) => user !== null)));
                // At this point, userInfo should be defined
                console.log('UserInfo is defined:', this.authService.getUserInfo());
                const userInfo = this.authService.getUserInfo();
                const avatarUrl = await this.loadDefaultAvatar('./assets/default-avatar.png');
                if (userInfo) {
                    this.communicationService.avatarPut(userInfo.uid, avatarUrl).subscribe();
                }
                this.router.navigate(['/home']);
            } else {
                this.handleSignUpError(result.status);
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error while signing up', error);
        }
    }

    isSignUpDisabled(): boolean {
        return this.username === '' || this.password === '' || this.rewritePassword === '' || this.email === '';
    }

    async loadDefaultAvatar(imagePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fetch(imagePath)
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.blob();
                })
                .then((blob) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        if (reader.result && typeof reader.result === 'string') {
                            resolve(reader.result);
                        } else {
                            reject('Reader onload event returned without a string result');
                        }
                    };
                    reader.onerror = () => {
                        reject('FileReader encountered an error while reading the blob.');
                    };
                    reader.readAsDataURL(blob);
                })
                .catch((error) => {
                    // eslint-disable-next-line no-console
                    console.error('Error fetching and processing image:', error);
                    reject(error);
                });
        });
    }

    private handleSignUpError(status: AccountCreationStatus) {
        this.showError = true;

        switch (status) {
            case AccountCreationStatus.EMAIL_TAKEN:
                this.errorMessage = 'Cette adresse e-mail est déjà utilisée.';
                break;
            case AccountCreationStatus.USERNAME_TAKEN:
                this.errorMessage = "Ce nom d'utilisateur est déjà pris.";
                break;
            case AccountCreationStatus.INVALID_EMAIL:
                this.errorMessage = "L'adresse e-mail est invalide.";
                break;
            case AccountCreationStatus.INVALID_PASSWORD:
                this.errorMessage = 'Le mot de passe est invalide.';
                break;
            case AccountCreationStatus.INVALID_USERNAME:
                this.errorMessage = "Le nom d'utilisateur est invalide.";
                break;
            case AccountCreationStatus.UNKNOWN_ERROR:
                this.errorMessage = 'Une erreur inconnue est survenue.';
                break;
        }
    }
}
