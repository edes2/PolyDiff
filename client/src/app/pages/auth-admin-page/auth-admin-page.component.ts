import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-auth-admin-page',
    templateUrl: './auth-admin-page.component.html',
    styleUrls: ['./auth-admin-page.component.scss'],
})
export class AuthAdminPageComponent {
    adminPassword: string = '';
    errorMessage: string;

    constructor(private router: Router) {}

    onSignInClick(): void {
        this.errorMessage = '';
        if (this.adminPassword === 'admin') {
            this.router.navigate(['/config']);
            return;
        }
        this.errorMessage = 'Mauvais mot de passe';
    }
    isEnabled(): boolean {
        return this.adminPassword.length > 0;
    }
}
