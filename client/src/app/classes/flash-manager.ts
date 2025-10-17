import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { ZenPlayAreaComponent } from '@app/components/zen-play-area/zen-play-area.component';
import { HIGH_OPACITY, LOW_OPACITY } from '@app/constants/bmp';
import { CHEAT_DELAY, CHEAT_MODE_FREQUENCY } from '@app/constants/cheat';
import { CommunicationService } from '@app/services/communication/communication.service';
import { CanvasModificationService } from '@app/services/creating/canvas-modification.service';
import { ClickValidation } from '@common/interfaces/socket-communication';
import { Vec2 } from '@common/interfaces/vec2';

export type PlayAreaType = PlayAreaComponent | ZenPlayAreaComponent;

export class FlashManager {
    replayMultiplier: number = 1;
    goodAnswerAudio: HTMLAudioElement = new Audio('assets/audio/differenceFoundSound1.wav');
    badAnswerAudio: HTMLAudioElement = new Audio('assets/audio/errorSound1.wav');
    private currentCanvas: { left: ImageData; right: ImageData };
    private canvasModificationService = new CanvasModificationService();

    constructor(
        readonly leftPlayArea: PlayAreaType,
        readonly rightPlayArea: PlayAreaType,
        private readonly communicationService: CommunicationService,
    ) {
        this.communicationService.soundGet().subscribe((sounds: any) => {
            if (sounds.diffSound) {
                this.goodAnswerAudio = new Audio(sounds.diffSound);
            }
            if (sounds.errorSound) {
                this.badAnswerAudio = new Audio(sounds.errorSound);
            }
        });
        this.goodAnswerAudio.volume = 0.5;
        this.badAnswerAudio.volume = 0.5;
    }

    async flashPixelsByFrequency(diffs: Vec2[]): Promise<number> {
        return window.setInterval(async () => await this.flashPixels(diffs), CHEAT_MODE_FREQUENCY / this.replayMultiplier);
    }

    async executeGoodClick(difference: Vec2[]) {
        this.goodAnswerAudio.currentTime = 0;
        this.goodAnswerAudio.play();
        this.displayDifference(difference);
    }

    executeBadClick(clickValidation: ClickValidation) {
        this.badAnswerAudio.currentTime = 0;
        this.badAnswerAudio.play();
        this.displayError(clickValidation.side, clickValidation.position);
    }

    updateImages(left: string, right: string) {
        this.drawImageOnCanvas(this.leftPlayArea, left);
        this.drawImageOnCanvas(this.rightPlayArea, right);
    }

    drawImageOnCanvas(playArea: PlayAreaType, dataURL: string): void {
        const context: CanvasRenderingContext2D | null = playArea.getCanvasContext();
        if (!context) return;
        const img = new Image();
        img.onload = () => {
            context.drawImage(img, 0, 0);
            this.setCurrentImages();
            playArea.originalImage = playArea.getImageDataFromCanvas();
        };
        img.src = dataURL;
    }

    async displayDifference(diffs: Vec2[]): Promise<void> {
        this.clearDifference(diffs);
        this.flashPixels(diffs, 3);
    }

    protected displayError(side: string, position: Vec2) {
        if (side === 'left') {
            this.leftPlayArea.displayErrorMessage(position);
        } else {
            this.rightPlayArea.displayErrorMessage(position);
        }
    }

    protected async flashPixels(diffs: Vec2[], time: number = 1): Promise<void> {
        this.setCurrentImages();
        this.changeDifferenceOpacity(diffs, LOW_OPACITY);
        for (let i = 0; i < time; i++) {
            await this.wait(CHEAT_DELAY);
            this.changeDifferenceOpacity(diffs, HIGH_OPACITY);
            await this.wait(CHEAT_DELAY);
            this.changeDifferenceOpacity(diffs, LOW_OPACITY);
        }
    }

    protected setCurrentImages() {
        this.currentCanvas = {
            left: this.leftPlayArea.getImageDataFromCanvas(),
            right: this.rightPlayArea.getImageDataFromCanvas(),
        };
    }

    protected clearDifference(diffs: Vec2[]): void {
        let right: ImageData = this.rightPlayArea.getImageDataFromCanvas();
        const left: ImageData = this.leftPlayArea.getImageDataFromCanvas();
        right = this.canvasModificationService.restorePixels(diffs, left, right);
        this.rightPlayArea.drawImageDataOnCanvas(right);
    }

    protected changeDifferenceOpacity(diffs: Vec2[], opacity: number): void {
        this.currentCanvas.left = this.canvasModificationService.changePixelsOpacity(diffs, this.currentCanvas.left, opacity);
        this.currentCanvas.right = this.canvasModificationService.changePixelsOpacity(diffs, this.currentCanvas.right, opacity);
        this.leftPlayArea.drawImageDataOnCanvas(this.currentCanvas.left);
        this.rightPlayArea.drawImageDataOnCanvas(this.currentCanvas.right);
    }

    protected async wait(milisec: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, milisec / this.replayMultiplier);
        });
    }
}
