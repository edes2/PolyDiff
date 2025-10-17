import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WaitingRoomPageComponent } from '@app/components/waiting-room/waiting-room.component';
import { AuthGuard } from '@app/guards/auth-gard/auth.guard';
import { LeaderboardPageComponent } from '@app/pages/app/leaderboard-page/leaderboard-page.component';
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

const routes: Routes = [
    { path: '', redirectTo: '/signin', pathMatch: 'full' },
    { path: 'signin', component: AuthPageComponent },
    { path: 'signup', component: SignupPageComponent },
    { path: 'home', component: MainPageComponent, canActivate: [AuthGuard] },
    { path: 'options', component: OptionsPageComponent, canActivate: [AuthGuard] },
    { path: 'create/game', component: CreateFormPageComponent, canActivate: [AuthGuard] },
    { path: 'config', component: ConfigPageComponent, canActivate: [AuthGuard] },
    { path: 'join/multi', component: JoinGamePageComponent, canActivate: [AuthGuard] },
    { path: 'config/create', component: CreatePageComponent, canActivate: [AuthGuard] },
    { path: 'auth-admin', component: AuthAdminPageComponent, canActivate: [AuthGuard] },
    { path: 'profile', component: ProfilePageComponent, canActivate: [AuthGuard] },
    { path: 'leaderboard', component: LeaderboardPageComponent, canActivate: [AuthGuard] },
    { path: 'waiting-room', component: WaitingRoomPageComponent, canActivate: [AuthGuard] },
    { path: 'game/multi/:gameOwnerId', component: GamePageComponent, canActivate: [AuthGuard] },
    { path: 'game/solo/:gameOwnerId', component: GamePageComponent, canActivate: [AuthGuard] },
    { path: 'zen-game', component: ZenGamePageComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: 'home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
