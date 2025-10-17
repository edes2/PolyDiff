import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameManager } from '@app/classes/game-managers/game-manager';
import { SocketClientService } from '@app/services/communication/socket-client.service';
import { ReplayService } from '@app/services/playing/replay.service';
import { SocketTestHelper } from '@app/stubs/socket-test-helper';
import { Socket } from 'socket.io-client';
import { ReplayComponent } from './replay.component';
import SpyObj = jasmine.SpyObj;
import Spy = jasmine.Spy;

describe('ReplayComponent', () => {
    let component: ReplayComponent;
    let fixture: ComponentFixture<ReplayComponent>;
    let gameManagerServiceSpy: SpyObj<GameManager>;
    let socketClientServiceSpy: SpyObj<SocketClientService>;
    let replayServiceSpy: SpyObj<ReplayService>;
    let socketHelper: SocketTestHelper;
    let spyPropertyGetter: <T, K extends keyof T>(spyObj: SpyObj<T>, propName: K) => Spy<() => T[K]>;

    beforeEach(async () => {
        socketClientServiceSpy = jasmine.createSpyObj('socketService', ['emitEvent', 'refreshEventHandler']);
        socketHelper = new SocketTestHelper();
        socketClientServiceSpy['socket'] = socketHelper as unknown as Socket;
        replayServiceSpy = jasmine.createSpyObj('ReplayService', ['restartReplayTimer', 'stopReplayTimer', 'startReplay']);
        gameManagerServiceSpy = jasmine.createSpyObj(
            'gameManagerService',
            ['restartCheatAfterPause', 'setReplayMultiplier', 'updateImages', 'resetInfoForReplay'],
            ['replayService', 'intervalId'],
        );
        spyPropertyGetter = <T, K extends keyof T>(spyObj: SpyObj<T>, propName: K): Spy<() => T[K]> => {
            return Object.getOwnPropertyDescriptor(spyObj, propName)?.get as Spy<() => T[K]>;
        };

        spyPropertyGetter(gameManagerServiceSpy, 'replayService').and.returnValue(replayServiceSpy);

        await TestBed.configureTestingModule({
            declarations: [ReplayComponent],
            providers: [
                { provide: GameManager, useValue: gameManagerServiceSpy },
                { provide: SocketClientService, useValue: socketClientServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ReplayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('replayButtonClick should call the proper methods', () => {
        const initReplaySpy = spyOn(component, 'initReplay');
        component.replayButtonClick();
        expect(replayServiceSpy.restartReplayTimer).toHaveBeenCalled();
        expect(initReplaySpy).toHaveBeenCalled();
    });

    it('togglePause should call the proper methods (it is now paused)', () => {
        component.isReplayPaused = false;
        const clearIntervalSpy = spyOn(window, 'clearInterval');
        spyPropertyGetter(gameManagerServiceSpy, 'intervalId').and.returnValue(2);
        component.togglePause();
        expect(component.isReplayPaused).toEqual(true);
        expect(clearIntervalSpy).toHaveBeenCalledWith(2);
        expect(replayServiceSpy.stopReplayTimer).toHaveBeenCalled();
    });

    it('togglePause should call the proper methods (it is now playing)', () => {
        component.isReplayPaused = true;
        component.togglePause();
        expect(component.isReplayPaused).toEqual(false);
        expect(gameManagerServiceSpy.restartCheatAfterPause).toHaveBeenCalled();
        expect(replayServiceSpy.startReplay).toHaveBeenCalledWith(component.replayMultiplier);
    });

    it("changeReplaySpeed should not call any methods (the multiplier wasn't changed)", () => {
        component.replayMultiplier = 2;
        const replayChangeSpy = spyOn(component.replayMultiplierChange, 'emit');
        component.changeReplaySpeed(2);
        expect(replayChangeSpy).not.toHaveBeenCalled();
        expect(gameManagerServiceSpy.setReplayMultiplier).not.toHaveBeenCalled();
        expect(replayServiceSpy.stopReplayTimer).not.toHaveBeenCalled();
        expect(replayServiceSpy.startReplay).not.toHaveBeenCalled();
    });

    it('changeReplaySpeed should call the proper methods (the multiplier was changed, but it was paused)', () => {
        component.replayMultiplier = 2;
        component.isReplayPaused = true;
        const replayChangeSpy = spyOn(component.replayMultiplierChange, 'emit');
        component.changeReplaySpeed(1);
        expect(replayChangeSpy).toHaveBeenCalledWith(1);
        expect(gameManagerServiceSpy.setReplayMultiplier).toHaveBeenCalledWith(1, component.isReplayPaused);
        expect(replayServiceSpy.stopReplayTimer).toHaveBeenCalled();
        expect(replayServiceSpy.startReplay).not.toHaveBeenCalled();
    });

    it("changeReplaySpeed should call the proper methods (the multiplier was changed, but it wasn't paused)", () => {
        component.replayMultiplier = 2;
        component.isReplayPaused = false;
        const replayChangeSpy = spyOn(component.replayMultiplierChange, 'emit');
        component.changeReplaySpeed(1);
        expect(replayChangeSpy).toHaveBeenCalledWith(1);
        expect(gameManagerServiceSpy.setReplayMultiplier).toHaveBeenCalledWith(1, component.isReplayPaused);
        expect(replayServiceSpy.stopReplayTimer).toHaveBeenCalled();
        expect(replayServiceSpy.startReplay).toHaveBeenCalledWith(1);
    });

    it('initReplay should call the proper methods', () => {
        component.isReplayPaused = true;
        component.replayMultiplier = 1;
        const setFlashServiceSpy = spyOn(component.setFlashService, 'emit');
        const isReplayingSpy = spyOn(component.isReplayingChange, 'emit');
        const isShortcutableSpy = spyOn(component.isShortcutableChange, 'emit');
        component.initReplay();
        expect(gameManagerServiceSpy.updateImages).toHaveBeenCalled();
        expect(gameManagerServiceSpy.resetInfoForReplay).toHaveBeenCalled();
        expect(setFlashServiceSpy).toHaveBeenCalledWith();
        expect(gameManagerServiceSpy.setReplayMultiplier).toHaveBeenCalledWith(component.replayMultiplier, true);
        expect(isReplayingSpy).toHaveBeenCalledWith(true);
        expect(isShortcutableSpy).toHaveBeenCalledWith(false);
        expect(component.isReplayPaused).toEqual(false);
        expect(replayServiceSpy.startReplay).toHaveBeenCalledWith(component.replayMultiplier);
    });
});
