/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { GameManager } from '@app/classes/game-managers/game-manager';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { MouseService } from '@app/services/playing/mouse.service';
import { ServerEvent } from '@common/enums/socket-events';
import SpyObj = jasmine.SpyObj;

describe('MouseService', () => {
    let service: MouseService;

    let gameManagerServiceSpy: SpyObj<GameManager>;
    let socketClientServiceSpy: SpyObj<SocketClientService>;

    beforeEach(() => {
        socketClientServiceSpy = jasmine.createSpyObj('socketService', ['emitEvent', 'refreshEventHandler']);
        gameManagerServiceSpy = jasmine.createSpyObj('gameManagerService', ['toggleCheat']);
        TestBed.configureTestingModule({
            declarations: [],
            providers: [
                { provide: GameManager, useValue: gameManagerServiceSpy },
                { provide: SocketClientService, useValue: socketClientServiceSpy },
            ],
        }).compileComponents();

        TestBed.configureTestingModule({}).compileComponents();
        service = TestBed.inject(MouseService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('initial mousePosition should be set to origin', () => {
        expect(service['position']).toEqual({ x: 0, y: 0 });
    });

    it('mouseHitDetect should emit a mouse click via the socket', () => {
        const side = 'left';
        const position = { x: 1, y: 2 };
        const mouseClick = new MouseEvent('click', { button: 0, clientX: position.x, clientY: position.y });
        service.mouseHitDetect(mouseClick, socketClientServiceSpy, side);
        expect(service['position']).toEqual(position);
        expect(socketClientServiceSpy.emitEvent.calls.argsFor(0)).toEqual([ServerEvent.MouseClick, { side, position }]);
    });
});
