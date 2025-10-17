import { TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { ReverseAuthGuard } from './reverse-auth.guard';

describe('ReverseAuthGuard', () => {
    let guard: ReverseAuthGuard;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
        });
        guard = TestBed.inject(ReverseAuthGuard);
    });

    it('should be created', () => {
        expect(guard).toBeTruthy();
    });
});
