import { Injectable } from '@angular/core';
import { MouseButton } from '@app/enums/mouse';
import { ServerEvent } from '@common/enums/socket-events';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { Vec2 } from '@common/interfaces/vec2';

@Injectable({
    providedIn: 'root',
})
export class MouseService {
    private position: Vec2 = { x: 0, y: 0 };

    mouseHitDetect(event: MouseEvent, socketService: SocketClientService, side: string): void {
        if (event.button === MouseButton.Left) {
            this.position = { x: event.offsetX, y: event.offsetY };
        }
        socketService.emitEvent(ServerEvent.MouseClick, {
            side,
            position: this.position,
        });
    }
}
