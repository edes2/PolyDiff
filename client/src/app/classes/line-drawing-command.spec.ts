import { THEME_COLOR } from '@app/constants/theme';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { Vec2 } from '@common/interfaces/vec2';
import { CanvasTestHelper } from './canvas-test-helper';
import { LineDrawingCommand } from './line-drawing-command';

describe('LineDrawingCommand', () => {
    let command: LineDrawingCommand;
    let canvasStub: HTMLCanvasElement;
    const colorPicked = THEME_COLOR;
    const thickness = 1;

    beforeEach(() => {
        canvasStub = CanvasTestHelper.createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
        command = new LineDrawingCommand(canvasStub, colorPicked, thickness);
    });

    it('should create an instance', () => {
        expect(command).toBeTruthy();
    });

    it('moveTo should call moveTo on context', () => {
        const moveToSpy = spyOn(command['context'], 'moveTo');
        const point = { x: 0, y: 0 };
        command.moveTo(point);
        expect(moveToSpy).toHaveBeenCalledWith(point.x, point.y);
    });

    it('execute should call initialize', () => {
        const initializeSpy = spyOn(command, 'initialize');
        command.execute();
        expect(initializeSpy).toHaveBeenCalled();
    });

    it('execute should call beginPath on context', () => {
        const beginPathSpy = spyOn(command['context'], 'beginPath');
        command.execute();
        expect(beginPathSpy).toHaveBeenCalled();
    });

    it('execute should call drawPoint', () => {
        command['path'] = [{ x: 0, y: 0 }];
        const drawPointSpy = spyOn(command, 'drawPoint');
        command.execute();
        expect(drawPointSpy).toHaveBeenCalled();
    });

    it('execute should call closePath on context', () => {
        const closePathSpy = spyOn(command['context'], 'closePath');
        command.execute();
        expect(closePathSpy).toHaveBeenCalled();
    });

    it('drawPoint should call lineTo on context', () => {
        const lineToSpy = spyOn(command['context'], 'lineTo');
        const point: Vec2 = { x: 0, y: 0 };
        command.drawPoint(point);
        expect(lineToSpy).toHaveBeenCalledWith(point.x, point.y);
    });

    it('drawPoint should call stroke on context', () => {
        const strokeSpy = spyOn(command['context'], 'stroke');
        const point: Vec2 = { x: 0, y: 0 };
        command.drawPoint(point);
        expect(strokeSpy).toHaveBeenCalled();
    });

    it('addPointToPath should correctly add point to path', () => {
        const point: Vec2 = { x: Math.random(), y: Math.random() };
        command.addPointToPath(point);
        expect(command['path'][0]).toEqual(point);
    });

    it('beginPath should call beginPath on context', () => {
        const beginPathSpy = spyOn(command['context'], 'beginPath');
        command.beginPath();
        expect(beginPathSpy).toHaveBeenCalled();
    });

    it('closePath should call closePath on context', () => {
        const closePathSpy = spyOn(command['context'], 'closePath');
        command.closePath();
        expect(closePathSpy).toHaveBeenCalled();
    });

    it('setBrushStyle should correctly set the brushStyle', () => {
        const brushStyle: GlobalCompositeOperation = 'color';
        command.setBrushStyle(brushStyle);
        expect(command['brushStyle']).toEqual(brushStyle);
    });

    it('setLineCap should correctly set the line cap', () => {
        const lineCap: CanvasLineCap = 'butt';
        command.setLineCap(lineCap);
        expect(command['lineCap']).toEqual(lineCap);
    });
});
