import { Component, Input, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { GameMode } from '@common/enums/mode';

@Component({
    selector: 'app-sidenav',
    templateUrl: './sidenav.component.html',
    styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent {
    @ViewChild('sidenav') sidenav!: MatDrawer;
    @Input() mode: GameMode | null = null;
    isExpanded = false;
    socketClientService: SocketClientService;

    toggle() {
        this.sidenav.toggle();
        this.isExpanded = this.sidenav.opened;
    }
}
