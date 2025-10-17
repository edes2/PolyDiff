/* eslint-disable @typescript-eslint/no-empty-function */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { UsernameInputComponent } from '@app/components/username-input/username-input.component';
import { DialogStub } from '@app/stubs/service-stubs';

describe('UsernameInputComponent', () => {
    let component: UsernameInputComponent;
    let fixture: ComponentFixture<UsernameInputComponent>;
    let dialogStub: DialogStub;

    beforeEach(async () => {
        dialogStub = new DialogStub();
        await TestBed.configureTestingModule({
            declarations: [UsernameInputComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: dialogStub,
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(UsernameInputComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should accept username if it is valid', () => {
        component.input.nativeElement.value = 'test';
        const matDialogRefSpy = spyOn(component['dialogRef'], 'close');
        component.validate();
        expect(matDialogRefSpy).toHaveBeenCalledWith('test');
    });

    it('should not accept username if it is invalid', () => {
        component.input.nativeElement.value = '';
        spyOn(component.input.nativeElement, 'focus').and.callFake(() => {});
        component.validate();
        expect(component.message).toEqual("Vous devez entrer un nom d'utilisateur.");
        expect(component.input.nativeElement.focus).toHaveBeenCalled();
    });

    it('should not accept username if it is invalid and has length above 0', () => {
        component.input.nativeElement.value = '  ';
        spyOn(component.input.nativeElement, 'focus').and.callFake(() => {});
        component.validate();
        expect(component.message).toEqual("Le nom d'utilisateur est invalide.");
        expect(component.input.nativeElement.focus).toHaveBeenCalled();
    });

    it('handleEnterEvent should call validate if right key is pressed', () => {
        const spy = spyOn(component, 'validate');
        component.handleEnterEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
        expect(spy).toHaveBeenCalled();
    });

    it('handleEnterEvent should not call validate if another key is pressed', () => {
        const spy = spyOn(component, 'validate');
        component.handleEnterEvent(new KeyboardEvent('keypress', { key: 't' }));
        expect(spy).not.toHaveBeenCalled();
    });

    it('clearWarningMessage should clear message', () => {
        component.message = 'test';
        component.clearWarningMessage();
        expect(component.message).toEqual('');
    });
});
