import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { getAuth, getIdToken } from 'firebase/auth';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const auth = getAuth();

        if (auth.currentUser) {
            return from(getIdToken(auth.currentUser)).pipe(
                switchMap((token) => {
                    const authorizedRequest = req.clone({
                        headers: req.headers.set('Authorization', `Bearer ${token}`),
                    });
                    return next.handle(authorizedRequest);
                }),
            );
        } else {
            return next.handle(req);
        }
    }
}
