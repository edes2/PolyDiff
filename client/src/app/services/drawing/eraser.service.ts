import { Injectable } from '@angular/core';
import { PaintingService } from '@app/services/drawing/painting.service';

@Injectable()
export class EraserService extends PaintingService {
    brushStyle: GlobalCompositeOperation = 'destination-out';
    lineCap: CanvasLineCap = 'square';
}
