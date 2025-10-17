import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DuplicateCanvasCommand } from '@app/classes/duplicate-canvas-command';
import { ResetCanvasCommand } from '@app/classes/reset-canvas-command';
import { SwapCanvasesCommand } from '@app/classes/swap-canvases-command';
import { CanvasService } from '@app/services/creating/canvas.service';
import { ImageVerificationService } from '@app/services/creating/image-verification.service';
import { BaseDrawingService } from '@app/services/drawing/base-drawing.service';
import { CanvasCommandService } from '@app/services/drawing/canvas-command.service';
import { DrawingCommandManagerService } from '@app/services/drawing/drawing-command-manager.service';
import { EllipseDrawingService } from '@app/services/drawing/ellipse-drawing.service';
import { EraserService } from '@app/services/drawing/eraser.service';
import { FillService } from '@app/services/drawing/fill.service';
import { PaintingService } from '@app/services/drawing/painting.service';
import { RectangleDrawingService } from '@app/services/drawing/rectangle-drawing.service';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';

@Component({
    selector: 'app-difference-area',
    templateUrl: './difference-area.component.html',
    styleUrls: ['./difference-area.component.scss'],
})
export class DifferenceAreaComponent implements AfterViewInit {
    @Input() selectedCommand: string;
    @Input() thicknessPicked: number;
    @Input() colorPicked: string;
    @Output() newDrawingCommand = new EventEmitter<boolean>();
    @ViewChild('leftBackCanvas', { static: false }) private leftBackCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('rightBackCanvas', { static: false }) private rightBackCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('rightFrontCanvas', { static: false }) private rightFrontCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('leftFrontCanvas', { static: false }) private leftFrontCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('leftDisplayCanvas', { static: false }) private leftDisplayCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('rightDisplayCanvas', { static: false }) private rightDisplayCanvas!: ElementRef<HTMLCanvasElement>;

    readonly canvasHeight = IMAGE_HEIGHT;
    readonly canvasWidth = IMAGE_WIDTH;

    side: string;
    mouseIsOnCanvas: boolean = false;
    hasModifiedCanvas: boolean = false;

    currentCommandService: BaseDrawingService;

    drawingCommandServices: Map<string, BaseDrawingService> = new Map();
    canvasCommands: Map<string, SwapCanvasesCommand | DuplicateCanvasCommand | ResetCanvasCommand> = new Map();

    frontCanvases: Map<string, HTMLCanvasElement> = new Map();
    displayCanvases: Map<string, HTMLCanvasElement> = new Map();

    // This is beacause we chose to make a distinction between drawing
    //  and canvas switch commands and we want the unique instance.
    // eslint-disable-next-line max-params
    constructor(
        private readonly canvasService: CanvasService,
        private readonly imageVerificationService: ImageVerificationService,
        private readonly drawingCommandManagerService: DrawingCommandManagerService,
        private readonly canvasCommandService: CanvasCommandService,
    ) {
        this.drawingCommandServices
            .set('drawLine', new PaintingService(this.drawingCommandManagerService))
            .set('drawRectangle', new RectangleDrawingService(this.drawingCommandManagerService))
            .set('drawEllipse', new EllipseDrawingService(this.drawingCommandManagerService))
            .set('erase', new EraserService(this.drawingCommandManagerService))
            .set('fill', new FillService(this.drawingCommandManagerService));
    }

    ngAfterViewInit(): void {
        this.canvasService.setupBack(this.leftBackCanvas.nativeElement, this.rightBackCanvas.nativeElement);
        this.canvasService.setupFront(this.leftFrontCanvas.nativeElement, this.rightFrontCanvas.nativeElement);
        this.frontCanvases.set('left', this.leftFrontCanvas.nativeElement).set('right', this.rightFrontCanvas.nativeElement);
        this.displayCanvases.set('left', this.leftDisplayCanvas.nativeElement).set('right', this.rightDisplayCanvas.nativeElement);
        this.drawingCommandServices.get('drawLine')?.setFrontCanvases(this.frontCanvases);
        this.drawingCommandServices.get('drawRectangle')?.setFrontCanvases(this.frontCanvases);
        this.drawingCommandServices.get('drawRectangle')?.setDisplayCanvases(this.displayCanvases);
        this.drawingCommandServices.get('drawEllipse')?.setFrontCanvases(this.frontCanvases);
        this.drawingCommandServices.get('drawEllipse')?.setDisplayCanvases(this.displayCanvases);
        this.drawingCommandServices.get('erase')?.setFrontCanvases(this.frontCanvases);
        this.drawingCommandServices.get('fill')?.setFrontCanvases(this.frontCanvases);
        this.canvasService.resetBothBackgrounds();
    }

    onMouseDown(event: MouseEvent, side: string): void {
        this.mouseIsOnCanvas = true;
        this.side = side;
        const currentCommand = this.drawingCommandServices.get(this.selectedCommand);
        if (this.commandSelected() && currentCommand) {
            this.currentCommandService = currentCommand;
            this.currentCommandService.side = this.side;
            this.currentCommandService.onMouseDown(event, this.colorPicked, this.thicknessPicked);
        }
    }

    onMouseMove(event: MouseEvent): void {
        if (this.commandSelected() && this.mouseIsOnCanvas) {
            this.currentCommandService.onMouseMove(event);
        }
    }

    onMouseUp(event: MouseEvent): void {
        if (this.commandSelected() && this.mouseIsOnCanvas) {
            this.currentCommandService.onMouseUp(event);
            this.newDrawingCommand.emit(this.currentCommandService.hasRegisteredCommand);
        }
        this.mouseIsOnCanvas = false;
    }

    onKeyToggle(event: KeyboardEvent) {
        if (this.commandSelected()) {
            this.drawingCommandServices.get(this.selectedCommand)?.onKeyToggle(event);
        }
    }

    resetCanvas(side: string) {
        const frontCanvas = this.frontCanvases.get(side) as HTMLCanvasElement;
        const displayCanvas = this.displayCanvases.get(side) as HTMLCanvasElement;
        this.canvasCommandService.resetCanvas(frontCanvas, displayCanvas);
    }

    duplicateCanvas(sideToDuplicateFrom: string, sideToDuplicateOnto: string) {
        const canvasToDuplicateFrom = this.frontCanvases.get(sideToDuplicateFrom) as HTMLCanvasElement;
        const canvasToDuplicateOnto = this.frontCanvases.get(sideToDuplicateOnto) as HTMLCanvasElement;
        this.canvasCommandService.duplicateCanvas(canvasToDuplicateFrom, canvasToDuplicateOnto);
    }

    swapCanvases(): void {
        this.canvasCommandService.swapCanvases(this.leftFrontCanvas.nativeElement, this.rightFrontCanvas.nativeElement);
    }

    commandSelected(): boolean {
        return this.selectedCommand !== undefined;
    }

    async handleFileInput(event: Event, canvas: HTMLCanvasElement) {
        const element: HTMLInputElement = event.target as HTMLInputElement;
        if (element.files) {
            const file = element.files[0];
            if (await this.imageVerificationService.isValidFile(file)) {
                this.hasModifiedCanvas = true;
                this.canvasService.add(await this.imageVerificationService.convertFileToImage(element.files[0]), canvas);
            }
        }
        element.value = '';
    }

    handleResetButton(canvas: HTMLCanvasElement): void {
        this.canvasService.reset(canvas);
    }
}
