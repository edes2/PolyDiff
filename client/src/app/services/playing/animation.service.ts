import { ElementRef, Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AnimationService {
    private area: ElementRef | undefined = undefined;
    private isActive: boolean = false;
    private rainDrops: HTMLElement[] = [];

    set animationArea(area: ElementRef) {
        this.area = area;
    }

    startRain(): void {
        this.isActive = true;
        if (this.area) this.area.nativeElement.style.overflow = 'hidden';

        const rainIterations = 15;
        const delayBetweenIterations = 500;
        for (let i = 0; i < rainIterations; ++i) {
            setTimeout(() => this.rain(), i * delayBetweenIterations);
        }
    }

    clearRain(): void {
        this.isActive = false;
        if (this.area) this.area.nativeElement.style.overflow = 'visible';
        this.rainDrops.forEach((element) => element.remove());
    }

    private rain(): void {
        if (!this.isActive) return;

        // Source : https://www.youtube.com/watch?v=YhXxBhInJMI
        let i = 0;
        const amountOfLines = 50;
        while (i < amountOfLines) {
            const lineWidthFactor = 5;
            const defaultLineWidth = 0.2;
            const animationTimeFactor = -20;

            const drop = document.createElement('i');
            drop.style.width = defaultLineWidth + Math.random() * lineWidthFactor + 'px';
            drop.style.height = '200px';

            drop.style.zIndex = '2';
            drop.style.position = 'absolute';
            drop.style.top = '-200px';
            drop.style.left = Math.floor(Math.random() * this.area?.nativeElement.offsetWidth) + 'px';

            drop.style.animationDelay = Math.random() * animationTimeFactor + 's';
            drop.style.animationDuration = 1 + Math.random() * animationTimeFactor + 's';
            drop.style.animation = 'animate 8s linear infinite';

            this.setColor(drop, i++);
            this.area?.nativeElement.appendChild(drop);
            this.rainDrops.push(drop);
        }
    }

    private setColor(drop: HTMLElement, index: number): void {
        const colorPossibilities = 5;
        switch (index % colorPossibilities) {
            case 0:
                drop.style.background = 'linear-gradient(transparent, #e096ec)';
                break;
            case 1:
                drop.style.background = 'linear-gradient(transparent, #69f0ae)';
                break;
            case 2:
                drop.style.background = 'linear-gradient(transparent, #9036aa)';
                break;
            case 3:
                drop.style.background = 'linear-gradient(transparent, #fcba03)';
                break;
            default:
                drop.style.background = 'linear-gradient(transparent, #ffffff)';
        }
    }
}
