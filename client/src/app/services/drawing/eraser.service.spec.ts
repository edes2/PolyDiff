import { TestBed } from '@angular/core/testing';
import { EraserService } from './eraser.service';

describe('EraserService', () => {
    let service: EraserService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [EraserService] });
        service = TestBed.inject(EraserService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
