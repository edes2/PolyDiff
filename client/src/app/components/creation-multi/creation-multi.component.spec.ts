import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreationMultiComponent } from './creation-multi.component';

describe('CreationMultiComponent', () => {
    let component: CreationMultiComponent;
    let fixture: ComponentFixture<CreationMultiComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CreationMultiComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CreationMultiComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
