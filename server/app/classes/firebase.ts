import { FIREBASE_ADMIN_TOKEN } from '@app/env/firebase-admin-token';
import * as admin from 'firebase-admin';

export namespace Firebase {
    export type FirebaseApp = admin.app.App;
    export type FirebaseAuth = admin.auth.Auth;
    export type ServiceAccount = admin.ServiceAccount;

    const SERVICE_ACCOUNT: ServiceAccount = FIREBASE_ADMIN_TOKEN as ServiceAccount;

    const firebaseApp: FirebaseApp = admin.initializeApp({ credential: admin.credential.cert(SERVICE_ACCOUNT) });

    export const auth = (): FirebaseAuth => {
        return firebaseApp.auth();
    };

    export const app = (): FirebaseApp => {
        return firebaseApp;
    };
}
