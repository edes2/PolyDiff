import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FillDrawingCommand } from './fill-drawing.component';

describe('FillDrawingComponent', () => {
    let component: FillDrawingCommand;
    let fixture: ComponentFixture<FillDrawingCommand>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FillDrawingCommand],
        }).compileComponents();

        fixture = TestBed.createComponent(FillDrawingCommand);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
