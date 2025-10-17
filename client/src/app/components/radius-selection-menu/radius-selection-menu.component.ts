import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { DEFAULT_RADIUS, RADIUS_SIZES } from '@app/constants/diff';

@Component({
    selector: 'app-radius-selection-menu',
    templateUrl: './radius-selection-menu.component.html',
    styleUrls: ['./radius-selection-menu.component.scss'],
})
export class RadiusSelectionMenuComponent implements OnInit {
    @Output() notify: EventEmitter<number> = new EventEmitter<number>();
    sizes: number[] = RADIUS_SIZES;
    selectedSize: number;

    ngOnInit(): void {
        this.selectedSize = DEFAULT_RADIUS;
        this.changeEnlargementRadius();
    }

    changeEnlargementRadius(): void {
        this.notify.emit(this.selectedSize);
    }
}
