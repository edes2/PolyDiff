import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AlertComponent } from '@app/components/alert/alert.component';
import { ChatContainerComponent } from '@app/components/chat-container/chat-container.component';
import { ChatWindowComponent } from '@app/components/chat-window/chat-window.component';
import { ConfigCardComponent } from '@app/components/config-card/config-card.component';
import { ConfirmationComponent } from '@app/components/confirmation/confirmation.component';
import { CreateRoomCardComponent } from '@app/components/create-room-card/create-room-card.component';
import { CreationMultiComponent } from '@app/components/creation-multi/creation-multi.component';
import { DifferenceAreaComponent } from '@app/components/difference-area/difference-area.component';
import { HistoryComponent } from '@app/components/history/history.component';
import { ImagePopupComponent } from '@app/components/image-popup/image-popup.component';
import { JoinRoomCardClassicComponent } from '@app/components/join-room-card-classic/join-room-card-classic.component';
import { JoinRoomCardLimitedComponent } from '@app/components/join-room-card-limited/join-room-card-limited.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { RadiusSelectionMenuComponent } from '@app/components/radius-selection-menu/radius-selection-menu.component';
import { ReplayComponent } from '@app/components/replay/replay.component';
import { SidenavLinkComponent } from '@app/components/sidenav-link/sidenav-link.component';
import { SidenavComponent } from '@app/components/sidenav/sidenav.component';
import { VoiceChatComponent } from '@app/components/voice-chat/voice-chat.component';
import { WaitingRoomPageComponent } from '@app/components/waiting-room/waiting-room.component';
import { WelcomeZenDialogComponent } from '@app/components/welcome-zen-dialog/welcome-zen-dialog.component';
import { ZenPlayAreaComponent } from '@app/components/zen-play-area/zen-play-area.component';
import { AuthInterceptor } from '@app/middleware/auth.interceptor';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { AuthAdminPageComponent } from '@app/pages/auth-admin-page/auth-admin-page.component';
import { AuthPageComponent } from '@app/pages/auth-page/auth-page.component';
import { ConfigPageComponent } from '@app/pages/config-page/config-page.component';
import { CreateFormPageComponent } from '@app/pages/create-form-page/create-form-page.component';
import { CreatePageComponent } from '@app/pages/create-page/create-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { JoinGamePageComponent } from '@app/pages/join-game-page/join-game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { OptionsPageComponent } from '@app/pages/options-page/options-page.component';
import { ProfilePageComponent } from '@app/pages/profile-page/profile-page.component';
import { SignupPageComponent } from '@app/pages/signup-page/signup-page/signup-page.component';
import { ZenGamePageComponent } from '@app/pages/zen-game-page/zen-game-page.component';
import { PopoutWindowModule } from 'angular-popout-window';
import { RatingPopupComponent } from './components/rating-popup/rating-popup.component';
import { LeaderboardPageComponent } from './pages/app/leaderboard-page/leaderboard-page.component';
import { AuthService } from './services/authentification/auth.service';

export let appInjector: Injector;

export const initializeAuth =
    (authService: AuthService): (() => Promise<void>) =>
    async () => {
        await authService.initAuthState();
    };

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        GamePageComponent,
        MainPageComponent,
        ConfigPageComponent,
        CreatePageComponent,
        ImagePopupComponent,
        DifferenceAreaComponent,
        ImagePopupComponent,
        RadiusSelectionMenuComponent,
        PlayAreaComponent,
        PopupMessageComponent,
        ConfirmationComponent,
        HistoryComponent,
        ReplayComponent,
        AlertComponent,
        AuthPageComponent,
        SidenavComponent,
        SidenavLinkComponent,
        SignupPageComponent,
        ProfilePageComponent,
        ChatWindowComponent,
        ChatContainerComponent,
        OptionsPageComponent,
        CreateFormPageComponent,
        CreationMultiComponent,
        JoinGamePageComponent,
        WaitingRoomPageComponent,
        CreateRoomCardComponent,
        JoinRoomCardClassicComponent,
        JoinRoomCardLimitedComponent,
        ConfigCardComponent,
        VoiceChatComponent,
        ZenGamePageComponent,
        WelcomeZenDialogComponent,
        ZenPlayAreaComponent,
        ZenGamePageComponent,
        WelcomeZenDialogComponent,
        ZenPlayAreaComponent,
        AuthAdminPageComponent,
        RatingPopupComponent,
        LeaderboardPageComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        MatListModule,
        MatDialogModule,
        MatSidenavModule,
        MatProgressSpinnerModule,
        MatButtonToggleModule,
        MatTableModule,
        MatIconModule,
        MatExpansionModule,
        MatIconModule,
        PopoutWindowModule,
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAuth,
            deps: [AuthService],
            multi: true,
        },
        { provide: MatDialogRef, useValue: [] },
        { provide: MAT_DIALOG_DATA, useValue: [] },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true,
        },
        PlayAreaComponent,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
    constructor(private injector: Injector) {
        appInjector = this.injector;
    }
}
