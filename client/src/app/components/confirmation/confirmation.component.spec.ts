import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DialogStub, RouterStub } from '@app/stubs/service-stubs';
import { ConfirmationComponent } from './confirmation.component';

describe('ConfirmationComponent', () => {
    let component: ConfirmationComponent;
    let fixture: ComponentFixture<ConfirmationComponent>;
    let routerStub: RouterStub;
    let dialogStub: DialogStub;

    beforeEach(async () => {
        routerStub = new RouterStub();
        dialogStub = new DialogStub();

        await TestBed.configureTestingModule({
            declarations: [ConfirmationComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogStub },
                { provide: Router, useValue: routerStub },
                { provide: MAT_DIALOG_DATA, useValue: { message: 'test', routerLink: 'link' } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('dialog should close and should call navigate after clicking on yes', async () => {
        const matDialogRefSpy = spyOn(component['dialogRef'], 'close');
        const routerSpy = spyOn(routerStub, 'navigate');
        component.onClick(true);
        expect(matDialogRefSpy).toHaveBeenCalledWith(true);
        expect(routerSpy).toHaveBeenCalledWith([component.data.routerLink]);
    });

    it('dialog should close after clicking on no', async () => {
        const matDialogRefSpy = spyOn(component['dialogRef'], 'close');
        component.onClick(false);
        expect(matDialogRefSpy).toHaveBeenCalledWith(false);
    });
});
