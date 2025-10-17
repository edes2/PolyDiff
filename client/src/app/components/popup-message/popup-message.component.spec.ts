import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PopupMessageComponent } from '@app/components/popup-message/popup-message.component';
import { DialogStub, RouterStub } from '@app/stubs/service-stubs';

describe('EndgamePopupComponent', () => {
    let component: PopupMessageComponent;
    let fixture: ComponentFixture<PopupMessageComponent>;
    let dialogStub: DialogStub;
    let routerStub: RouterStub;

    beforeEach(async () => {
        dialogStub = new DialogStub();
        routerStub = new RouterStub();
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [PopupMessageComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: dialogStub,
                },

                { provide: Router, useValue: routerStub },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PopupMessageComponent);
        component = fixture.componentInstance;
        component.data = {
            message: {
                content: '',
                leftRouterLink: '',
                leftButtonText: '',
            },
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('close should call dialogRef.close and navigate', () => {
        const route = 'route';
        const dialogRefCloseSpy = spyOn(component['dialogRef'], 'close');
        const routerNavigateSpy = spyOn(component['router'], 'navigate');
        component.close(route, 1);
        expect(dialogRefCloseSpy).toHaveBeenCalled();
        expect(routerNavigateSpy).toHaveBeenCalledWith([route]);
    });
});
