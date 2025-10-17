/* eslint-disable max-lines */
/* eslint-disable max-len */
import { Component, OnInit } from '@angular/core';
import { CommunicationService } from '@app/services/communication/communication.service';

@Component({
    selector: 'app-leaderboard-page',
    templateUrl: './leaderboard-page.component.html',
    styleUrls: ['./leaderboard-page.component.scss'],
})
export class LeaderboardPageComponent implements OnInit {
    users: any[] = [];

    constructor(private communicationService: CommunicationService) {}

    ngOnInit(): void {
        this.communicationService.getTop20().subscribe((users: any) => {
            this.users = users;
            users.forEach((user: any) => {
                this.communicationService.avatarGet(user.uid).subscribe((avatarUrl: string) => {
                    user.avatarUrl = avatarUrl;
                });
            });
        });
    }
}
