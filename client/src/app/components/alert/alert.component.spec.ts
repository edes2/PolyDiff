import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogStub } from '@app/stubs/service-stubs';
import { AlertComponent } from './alert.component';

describe('AlertComponent', () => {
    let component: AlertComponent;
    let fixture: ComponentFixture<AlertComponent>;
    let dialogStub: DialogStub;

    beforeEach(async () => {
        dialogStub = new DialogStub();

        await TestBed.configureTestingModule({
            declarations: [AlertComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { message: 'test' } },
                { provide: MatDialogRef, useValue: dialogStub },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AlertComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('onClick should call close', () => {
        const closeSpy = spyOn(component.dialogRef, 'close').and.stub();
        component.onClick();
        expect(closeSpy).toHaveBeenCalled();
    });
});
