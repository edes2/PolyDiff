import { TestBed } from '@angular/core/testing';

import { FillService } from './fill.service';

describe('FillService', () => {
    let service: FillService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(FillService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
