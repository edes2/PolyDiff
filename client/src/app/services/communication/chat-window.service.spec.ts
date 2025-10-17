import { TestBed } from '@angular/core/testing';

import { ChatWindowService } from './chat-window.service';

describe('ChatWindowService', () => {
    let service: ChatWindowService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ChatWindowService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
