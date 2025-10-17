import { FlashManager, PlayAreaType } from '@app/classes/flash-manager';
import { ClickValidation } from '@common/interfaces/socket-communication';
import { Vec2 } from '@common/interfaces/vec2';

export class ZenFlashManager extends FlashManager {
    override executeBadClick(clickValidation: ClickValidation) {
        this.displayError(clickValidation.side, clickValidation.position);
    }

    override async executeGoodClick(difference: Vec2[]) {
        this.displayDifference(difference);
    }

    protected override displayError(side: string, position: Vec2) {
        const playArea = side === 'left' ? this.leftPlayArea : this.rightPlayArea;
        this.createPulseEffect(playArea, position);
    }

    /**
     * If you need more explanation on this black magic, go have a serious talk with OpenAI's engineers.
     */
    private createPulseEffect(playArea: PlayAreaType, click: Vec2) {
        const context = playArea.canvas.nativeElement.getContext('2d');

        if (!context) return;
        let radius = 10;
        let opacity = 1;
        const maxRadius = 30;
        const fadeOutRate = 0.05;

        const draw = () => {
            context.putImageData(playArea.originalImage, 0, 0);
            if (radius < maxRadius) {
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                radius += 0.5;
                opacity -= fadeOutRate;
                context.beginPath();
                context.arc(click.x, click.y, radius, 0, 2 * Math.PI);
                context.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
                context.lineWidth = 2;
                context.stroke();
                requestAnimationFrame(draw);
            }
        };
        draw();
    }
}
