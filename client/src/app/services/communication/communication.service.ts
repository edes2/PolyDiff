import { HttpClient, HttpErrorResponse, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AccountCreationResult, AccountCreationStatus } from '@common/interfaces/account-creation';
import { CardCreationInfo, EnrichedCardInfo } from '@common/interfaces/card-info';
import { PlayingInfo } from '@common/interfaces/game';
import { EnrichedGameHistory } from '@common/interfaces/history';
import { DifferenceImage, ImageSet } from '@common/interfaces/image';
import { Music, MusicType } from '@common/interfaces/music';
import { OneDifferenceImageSet } from '@common/interfaces/one-difference-set';
import { EnrichedMessage } from '@common/interfaces/socket-communication';
import { UUIDType, UserAccount } from '@common/interfaces/user';
import { Vec2 } from '@common/interfaces/vec2';
import { WaitingRoomDTO } from '@common/interfaces/waiting-room';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private readonly baseUrl: string = environment.mainServerUrl;
    private giphyApiKey = 'API';
    private giphyApiURL = 'API_URL';

    constructor(private readonly http: HttpClient) {}

    /* CARDS ROUTES */

    saveCardPost(cardCreationInfo: CardCreationInfo): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/cards/`, cardCreationInfo, {
            observe: 'response',
            responseType: 'text',
        });
    }

    cardDelete(cardId: string): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/cards/` + cardId, {
            observe: 'response',
            responseType: 'text',
        });
    }

    allCardDelete(): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/cards/`, {
            observe: 'response',
            responseType: 'text',
        });
    }

    cardInfoByIdGet(cardId: string): Observable<EnrichedCardInfo> {
        return this.http
            .get<EnrichedCardInfo>(`${this.baseUrl}/cards/${cardId}`)
            .pipe(catchError(this.handleError<EnrichedCardInfo>('cardInfoByIdGet')));
    }

    allCardInfosGet(): Observable<EnrichedCardInfo[]> {
        return this.http.get<EnrichedCardInfo[]>(`${this.baseUrl}/cards`).pipe(catchError(this.handleError<EnrichedCardInfo[]>('allCardInfosGet')));
    }

    cardResetScoresPut(cardId: string) {
        return this.http.put(`${this.baseUrl}/cards/scores/${cardId}`, {}, { observe: 'response', responseType: 'text' });
    }

    allCardsResetScoresPut() {
        return this.http.put(`${this.baseUrl}/cards/scores/`, {}, { observe: 'response', responseType: 'text' });
    }

    ratingPut(cardId: string, newRating: number) {
        return this.http.put(`${this.baseUrl}/cards/rating/`, { cardId, newRating });
    }

    /* IMAGES ROUTES */

    imageSetByIdGet(cardId: string): Observable<ImageSet> {
        return this.http.get<ImageSet>(`${this.baseUrl}/images/${cardId}`).pipe(catchError(this.handleError<ImageSet>('imageSetByIdGet')));
    }

    imageMiniatureGet(cardId: string): Observable<string> {
        return this.http.get<string>(`${this.baseUrl}/images/miniature/${cardId}`).pipe(catchError(this.handleError<string>('imageMiniatureGet')));
    }

    bothCanvasPost(leftCanvasURL: string, rightCanvasURL: string, radius: number): Observable<DifferenceImage> {
        return this.http
            .post<DifferenceImage>(`${this.baseUrl}/images/diff`, {
                leftUri: leftCanvasURL,
                rightUri: rightCanvasURL,
                radiusSize: radius,
            })
            .pipe(catchError(this.handleError<DifferenceImage>('bothCanvasPost')));
    }

    avatarGet(uid: string): Observable<string> {
        return this.http.get<string>(`${this.baseUrl}/images/avatar/` + uid).pipe(catchError(this.handleError<string>('avatarGet')));
    }

    avatarPut(uid: string, avatarUrl: string): Observable<boolean> {
        return this.http.put<boolean>(`${this.baseUrl}/images/avatar`, { uid, avatarUrl }).pipe(catchError(this.handleError<boolean>('avatarPut')));
    }

    differenceImageGet(cardId: string): Observable<string> {
        return this.http.get<string>(`${this.baseUrl}/images/diff/` + cardId).pipe(catchError(this.handleError<string>('differenceImageGet')));
    }

    /* SETTINGS ROUTES */

    // allSettingsGet(): Observable<SettingContainer> {
    //     return this.http.get<SettingContainer>(`${this.baseUrl}/settings`).pipe(catchError(this.handleError<SettingContainer>('allSettingsGet')));
    // }

    // settingsPut(settingContainer: SettingContainer) {
    //     return this.http.put(`${this.baseUrl}/settings/`, settingContainer, {
    //         observe: 'response',
    //         responseType: 'text',
    //     });
    // }

    /* GAMES ROUTES */

    allGamesHistoryGet(): Observable<EnrichedGameHistory[]> {
        return this.http
            .get<EnrichedGameHistory[]>(`${this.baseUrl}/games/history/`)
            .pipe(catchError(this.handleError<EnrichedGameHistory[]>('allGamesHistoryGet')));
    }

    lastGamesHistoryGet(uid: string): Observable<EnrichedGameHistory[]> {
        return this.http
            .get<EnrichedGameHistory[]>(`${this.baseUrl}/games/history/player/${uid}`)
            .pipe(catchError(this.handleError<EnrichedGameHistory[]>('lastGamesHistoryGet')));
    }

    allGamesHistoryDelete(): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/games/history/`, {
            observe: 'response',
            responseType: 'text',
        });
    }

    allGameroomsGet(): Observable<WaitingRoomDTO[]> {
        return this.http.get<WaitingRoomDTO[]>(`${this.baseUrl}/games/gameRooms/`);
    }

    getPlayingInfo(ownerId: UUIDType): Observable<PlayingInfo> {
        return this.http
            .get<PlayingInfo>(`${this.baseUrl}/games/playing-info/${ownerId}`)
            .pipe(catchError(this.handleError<PlayingInfo>('getPlayingInfo')));
    }
    getCheat(uid: string): Observable<Vec2[]> {
        return this.http.get<Vec2[]>(`${this.baseUrl}/games/cheat/${uid}`).pipe(catchError(this.handleError<Vec2[]>('getCheat')));
    }

    /*
     *   @param exclude: list of ids to exclude from the search (to avoid getting the same image set twice in a row)
     */
    getRandomOneDifferenceImageSet(exclude?: string[]): Observable<OneDifferenceImageSet> {
        const excludeQuery = exclude ? `?exclude=${exclude.join(',')}` : '';

        return this.http
            .get<OneDifferenceImageSet>(`${this.baseUrl}/games/random-one-difference-image-set${excludeQuery}`)
            .pipe(catchError(this.handleError<OneDifferenceImageSet>('getRandomOneDifferenceImageSet')));
    }

    getRandomMusic(type: MusicType): Observable<Music> {
        return this.http.get<Music>(`${this.baseUrl}/games/random-music/${type}`).pipe(catchError(this.handleError<Music>('getRandomMusic')));
    }

    /* USER ROUTES */

    signUp(username: string, email: string, password: string): Observable<AccountCreationResult> {
        return this.http.post<AccountCreationResult>(`${this.baseUrl}/users/signup`, { username, email, password }).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === HttpStatusCode.BadRequest) {
                    return of(error.error as AccountCreationResult);
                }
                return of({ status: AccountCreationStatus.UNKNOWN_ERROR } as AccountCreationResult);
            }),
        );
    }

    getUserProfile(): Observable<UserAccount> {
        return this.http.get<UserAccount>(`${this.baseUrl}/users/profile`).pipe(catchError(this.handleError<UserAccount>('getUserProfile')));
    }

    changeUsername(newUsername: string): Observable<boolean> {
        return this.http
            .post<boolean>(`${this.baseUrl}/users/username`, { username: newUsername })
            .pipe(catchError(this.handleError<boolean>('changeUsername')));
    }

    getConnections(uid: string) {
        return this.http.get(`${this.baseUrl}/users/connections/${uid}`);
    }

    /* CHAT ROUTES */

    getGlobalChat(chatId: string): Observable<EnrichedMessage[]> {
        // TODO: create another communication file for fastapi
        return this.http
            .get<EnrichedMessage[]>(`${environment.fastApiServerUrl}/global/channels/${chatId}`)
            .pipe(catchError(this.handleError<EnrichedMessage[]>('get_global_chat')));
    }

    getPrivateChat(chatId: string): Observable<EnrichedMessage[]> {
        // TODO: create another communication file for fastapi
        return this.http
            .get<EnrichedMessage[]>(`${environment.fastApiServerUrl}/private/channels/${chatId}`)
            .pipe(catchError(this.handleError<EnrichedMessage[]>('get_private_chat')));
    }

    getGeneralChat(): Observable<EnrichedMessage[]> {
        // TODO: create another communication file for fastapi
        return this.http
            .get<EnrichedMessage[]>(`${environment.fastApiServerUrl}/general`)
            .pipe(catchError(this.handleError<EnrichedMessage[]>('get_general_chat')));
    }

    // TODO: ADAPT THIS?
    getGlobalChannels(): Observable<string[]> {
        return this.http
            .get<string[]>(`${environment.fastApiServerUrl}/global/channels`)
            .pipe(catchError(this.handleError<string[]>('get_global_channels')));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getJoinedChannels(userId: string): Observable<string[]> {
        return (
            this.http
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .get<any>(`${environment.fastApiServerUrl}/global/users/${userId}`)
                .pipe(catchError(this.handleError<string[]>('get_joined_channels')))
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createGlobalChat(chatId: string): Observable<any> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.http.post<any>(`${environment.fastApiServerUrl}/global/channels`, { chatId });
    }

    /* EXTERNAL API ROUTES */

    searchGifs(query: string) {
        return this.http.get(`${this.giphyApiURL}/search?api_key=${this.giphyApiKey}&q=${query}&limit=10`);
    }

    soundPut(sound: string, soundType: string) {
        return this.http.put(`${this.baseUrl}/users/sound/`, { sound, soundType });
    }

    soundGet() {
        return this.http.get(`${this.baseUrl}/users/sound/`);
    }

    getTop20() {
        return this.http.get(`${this.baseUrl}/users/top20/`);
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
