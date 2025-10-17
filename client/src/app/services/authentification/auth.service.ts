import { Injectable } from '@angular/core';
import { AuthResult } from '@app/enums/auth-result';
import { FIREBASE_CONFIG } from '@app/env/firebase-config';
import { CommunicationService } from '@app/services/communication/communication.service';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { UserAccount } from '@common/interfaces/user';
import { initializeApp } from 'firebase/app';
import {
    User,
    browserSessionPersistence,
    getAuth,
    onAuthStateChanged,
    sendPasswordResetEmail,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    userConnectedSubject = new BehaviorSubject<boolean>(false);
    userConnected$ = this.userConnectedSubject.asObservable();
    userInfoSubject = new BehaviorSubject<UserAccount | null>(null);
    userInfo$ = this.userInfoSubject.asObservable();
    private firebaseApp = initializeApp(FIREBASE_CONFIG);
    private firebaseAuth = getAuth(this.firebaseApp);
    // private userInfo: UserAccount | null = null;

    constructor(private communicationService: CommunicationService, private socketService: SocketClientService) {
        setPersistence(this.firebaseAuth, browserSessionPersistence)
            .then(() => {
                onAuthStateChanged(this.firebaseAuth, this.authStateChangeHandler.bind(this));
            })
            .catch((error) => {
                console.error('Error setting persistence:', error);
            });
    }

    async authenticate(email: string, password: string): Promise<AuthResult> {
        this.userConnectedSubject.next(false);
        try {
            const userCredential = await signInWithEmailAndPassword(this.firebaseAuth, email, password);
            const token = await userCredential.user.getIdToken();
            const connectionSuccessful = await this.socketService.initConnection(token);
            if (connectionSuccessful) {
                await this.fetchUserInfo();
                this.userConnectedSubject.next(true);
                return AuthResult.Success;
            }
            return AuthResult.AlreadyConnected;
        } catch (error) {
            return AuthResult.Failure;
        }
    }

    async isConnected(): Promise<boolean> {
        return new Promise((resolve) => {
            onAuthStateChanged(this.firebaseAuth, (user) => {
                this.authStateChangeHandler(user);
                resolve(!!user);
            });
        });
    }

    async getToken(): Promise<string> {
        return this.firebaseAuth.currentUser?.getIdToken() ?? Promise.reject('No user connected');
    }

    getUserInfo(): UserAccount | null {
        return this.userInfoSubject.getValue();
    }

    async disconnect() {
        try {
            this.socketService.disconnect();
            await signOut(this.firebaseAuth);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error while disconnecting', error);
        }
    }

    async resetPassword(email: string): Promise<boolean> {
        const auth = getAuth();
        try {
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error) {
            return false;
        }
    }

    async initAuthState(): Promise<void> {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(this.firebaseAuth, async (user) => {
                await this.authStateChangeHandler(user);
                resolve();
                unsubscribe(); // Ne plus écouter après la première réponse
            });
        });
    }

    private async authStateChangeHandler(user: User | null): Promise<void> {
        this.userConnectedSubject.next(!!user);
        if (user) {
            this.fetchUserInfo();
        } else {
            // this.userInfo = null;
            this.userInfoSubject.next(null);
            // TODO: Replace redirection by a dialog with a message
            // this.router.navigate(['/signin']);
        }
    }

    private async fetchUserInfo(): Promise<void> {
        try {
            const userInfo = await firstValueFrom(this.communicationService.getUserProfile());
            this.userInfoSubject.next(userInfo);
        } catch (error) {
            this.userInfoSubject.next(null);
        }
    }
}
