import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RadiusSelectionMenuComponent } from '@app/components/radius-selection-menu/radius-selection-menu.component';
import { COMPONENT_STUBS } from '@app/stubs/component-stubs';

describe('RadiusSelectionMenuComponent', () => {
    let component: RadiusSelectionMenuComponent;
    let fixture: ComponentFixture<RadiusSelectionMenuComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RadiusSelectionMenuComponent, ...COMPONENT_STUBS],
        }).compileComponents();

        fixture = TestBed.createComponent(RadiusSelectionMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call changeEnlargementRadius', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = spyOn<any>(component, 'changeEnlargementRadius');
        component.ngOnInit();
        expect(spy).toHaveBeenCalled();
    });
});
