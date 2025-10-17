import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { SidenavLinkComponent } from './sidenav-link.component';

describe('SidenavLinkComponent', () => {
    let component: SidenavLinkComponent;
    let fixture: ComponentFixture<SidenavLinkComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SidenavLinkComponent],
            imports: [RouterTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(SidenavLinkComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
