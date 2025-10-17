import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameMode } from '@common/enums/mode';

export enum HomePageRedirection {
    Classic = 'Classic',
    LimitedTime = 'limitedTime',
    Zen = 'Zen',
    Config = 'Config',
}

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    homePageRedirect = HomePageRedirection;

    constructor(private router: Router) {}

    redirect(destination: HomePageRedirection) {
        switch (destination) {
            case HomePageRedirection.Classic:
                this.router.navigate(['/options'], { queryParams: { mode: GameMode.Classic } });
                break;
            case HomePageRedirection.LimitedTime:
                this.router.navigate(['/options'], { queryParams: { mode: GameMode.LimitedTime } });
                break;
            case HomePageRedirection.Zen:
                this.router.navigate(['/zen-game']);
                break;
            case HomePageRedirection.Config:
                this.router.navigate(['/config']);
                break;
        }

        return undefined;
    }
}
