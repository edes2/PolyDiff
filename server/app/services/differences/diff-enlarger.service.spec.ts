/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable import/no-named-as-default-member */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Queue } from '@app/classes/queue';
import { DIRECTIONS } from '@app/constants/differences';
import { Images, PixelVisitInfo } from '@app/interfaces/difference-services';
import { DiffEnlargerService } from '@app/services/differences/diff-enlarger.service';
import { PixelService } from '@app/services/differences/pixel.service';
import { Vec2 } from '@common/interfaces/vec2';
import { expect } from 'chai';
import Jimp from 'jimp';
import sinon, { SinonSpy, SinonStub, SinonStubbedInstance, createStubInstance } from 'sinon';

describe('DiffEnlargerService', () => {
    let service: DiffEnlargerService;
    let pixelService: SinonStubbedInstance<PixelService>;

    const POSITION: Vec2 = { x: 1, y: 0 };
    const DEFAULT_POSITION: Vec2 = { x: 0, y: 0 };
    const DEFAULT_PIXEL: PixelVisitInfo = { position: POSITION, direction: DIRECTIONS.north, diffPosition: DEFAULT_POSITION };

    beforeEach(() => {
        pixelService = createStubInstance(PixelService);
        service = new DiffEnlargerService(pixelService);
    });

    it('should be created', () => {
        expect(service).not.to.be.undefined;
    });

    it('setRadius should set the radius enlargement property', () => {
        const radiusEnlargement = 9;
        service.setRadius(radiusEnlargement);
        expect(service['radius']).to.equal(radiusEnlargement);
    });

    it('bfs should set the pixel at the given position black and then call bfsWithArray with the start pixels computed', () => {
        pixelService.drawBlack.callsFake(() => new Jimp(1, 1));
        const bfsWithArrayStub = sinon.stub(service, <any>'bfsWithArray').callsFake(() => new Jimp(1, 1));
        service.bfs({} as Images, DEFAULT_POSITION);
        expect(pixelService.drawBlack.calledOnce).to.be.true;
        expect(pixelService.getPixelsToVisitStart.calledOnce).to.be.true;
        expect(bfsWithArrayStub.calledOnce).to.be.true;
    });

    it('bfsWithArray should not do any modification to the difference image if array is empty', () => {
        const bfsWithArrayEnlargementSpy: SinonSpy = sinon.spy(service, <any>'bfsWithArrayEnlargement');
        service['bfsWithArray']({} as Images, new Queue<PixelVisitInfo>([]));
        expect(pixelService.isValidPosition.called).to.be.false;
        expect(pixelService.drawBlack.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
        expect(bfsWithArrayEnlargementSpy.called).to.be.false;
    });

    it('bfsWithArray should not do any modification to the difference image if position is invalid', () => {
        pixelService.isValidPosition.callsFake(() => false);
        const bfsWithArrayEnlargementSpy: SinonSpy = sinon.spy(service, <any>'bfsWithArrayEnlargement');
        service['bfsWithArray']({} as Images, new Queue<PixelVisitInfo>([DEFAULT_PIXEL]));
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.called).to.be.false;
        expect(pixelService.drawBlack.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
        expect(bfsWithArrayEnlargementSpy.called).to.be.false;
    });

    it('bfsWithArray should not do any modification to the difference image if the pixel is already black', () => {
        pixelService.isValidPosition.callsFake(() => true);
        pixelService.isBlack.callsFake(() => true);
        const bfsWithArrayEnlargement: SinonSpy = sinon.spy(service, <any>'bfsWithArrayEnlargement');
        service['bfsWithArray']({} as Images, new Queue<PixelVisitInfo>([DEFAULT_PIXEL]));
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(pixelService.drawBlack.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
        expect(bfsWithArrayEnlargement.called).to.be.false;
    });

    it('bfsWithArray should not do any modification to the difference image if the pixel is the same and not in enlargement range', () => {
        pixelService.isValidPosition.callsFake(() => true);
        pixelService.isBlack.callsFake(() => false);
        pixelService.isTheSame.callsFake(() => true);
        const isInEnlargementRadiusRangeStub: SinonStub = sinon.stub(service, <any>'isInEnlargementRadiusRange').callsFake(() => false);
        const bfsWithArrayEnlargement: SinonSpy = sinon.spy(service, <any>'bfsWithArrayEnlargement');
        service['bfsWithArray']({} as Images, new Queue<PixelVisitInfo>([DEFAULT_PIXEL]));
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(pixelService.isTheSame.calledOnce).to.be.true;
        expect(isInEnlargementRadiusRangeStub.calledOnce).to.be.true;
        expect(pixelService.drawBlack.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
        expect(bfsWithArrayEnlargement.called).to.be.false;
    });

    it('bfsWithArray should call bfsWithArrayEnlargement if there is a pixel still white in the valid radius range', () => {
        pixelService.isValidPosition.callsFake(() => true);
        pixelService.isBlack.callsFake(() => false);
        pixelService.isTheSame.callsFake(() => true);
        const isInEnlargementRadiusRangeStub: SinonStub = sinon.stub(service, <any>'isInEnlargementRadiusRange').callsFake(() => true);
        const bfsWithArrayEnlargementStub: SinonStub = sinon.stub(service, <any>'bfsWithArrayEnlargement').callsFake(() => new Jimp(1, 1));
        service['bfsWithArray']({} as Images, new Queue<PixelVisitInfo>([DEFAULT_PIXEL]));
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(pixelService.isTheSame.calledOnce).to.be.true;
        expect(pixelService.drawBlack.called).to.be.false;
        expect(isInEnlargementRadiusRangeStub.calledOnce).to.be.true;
        expect(bfsWithArrayEnlargementStub.calledOnce).to.be.true;
    });

    it('bfsWithArray should call drawBlack if the left and right are different and they correspond to a not black pixel in diff', () => {
        pixelService.isValidPosition.callsFake(() => true);
        pixelService.isBlack.callsFake(() => false);
        pixelService.isTheSame.callsFake(() => false);
        pixelService.getAdjacents.callsFake(() => []);
        service['bfsWithArray']({} as Images, new Queue<PixelVisitInfo>([DEFAULT_PIXEL]));
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(pixelService.isTheSame.calledOnce).to.be.true;
        expect(pixelService.drawBlack.calledOnce).to.be.true;
        expect(pixelService.getAdjacents.calledOnce).to.be.true;
    });

    it('bfsWithArrayEnlargement should not do any modification to the difference image if array is empty', () => {
        const isInEnlargementRadiusRangeSpy: SinonSpy = sinon.spy(service, <any>'isInEnlargementRadiusRange');
        service['bfsWithArrayEnlargement']({} as Images, new Queue<PixelVisitInfo>([]));
        expect(pixelService.isValidPosition.called).to.be.false;
        expect(pixelService.isBlack.called).to.be.false;
        expect(pixelService.drawBlack.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
        expect(isInEnlargementRadiusRangeSpy.called).to.be.false;
    });

    it('bfsWithArrayEnlargement should not do any modification to the difference image if position is invalid', () => {
        pixelService.isValidPosition.callsFake(() => false);
        const isInEnlargementRadiusRangeSpy: SinonSpy = sinon.spy(service, <any>'isInEnlargementRadiusRange');
        service['bfsWithArrayEnlargement']({} as Images, new Queue<PixelVisitInfo>([DEFAULT_PIXEL]));
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.called).to.be.false;
        expect(pixelService.drawBlack.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
        expect(isInEnlargementRadiusRangeSpy.called).to.be.false;
    });

    it('bfsWithArrayEnlargement should not do any modification to the difference image if the pixel is already black', () => {
        pixelService.isValidPosition.callsFake(() => true);
        pixelService.isBlack.callsFake(() => true);
        const isInEnlargementRadiusRangeStub: SinonStub = sinon.stub(service, <any>'isInEnlargementRadiusRange').callsFake(() => true);
        service['bfsWithArrayEnlargement']({} as Images, new Queue<PixelVisitInfo>([DEFAULT_PIXEL]));
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(isInEnlargementRadiusRangeStub.called).to.be.false;
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(pixelService.drawBlack.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
    });

    it('bfsWithArrayEnlargement should call drawBlack if the pixel is in the range and the left and right are not different', async () => {
        pixelService.isValidPosition.callsFake(() => true);
        pixelService.isBlack.callsFake(() => false);
        pixelService.getAdjacents.callsFake(() => []);
        const isInEnlargementRadiusRangeStub: SinonStub = sinon.stub(service, <any>'isInEnlargementRadiusRange').callsFake(() => true);
        service['bfsWithArrayEnlargement']({} as Images, new Queue<PixelVisitInfo>([DEFAULT_PIXEL]));
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(isInEnlargementRadiusRangeStub.calledOnce).to.be.true;
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(pixelService.drawBlack.calledOnce).to.be.true;
        expect(pixelService.getAdjacents.calledOnce).to.be.true;
    });

    it('isInEnlargementRadiusRange should return true if the distance between the position is smaller to the radius', () => {
        const radius = 3;
        let position: Vec2 = { x: 1, y: 1 };
        let diffPosition: Vec2 = { x: 2, y: 2 };
        expect(service['isInEnlargementRadiusRange'](position, diffPosition, radius)).to.be.true;
        position = { x: 1, y: 1 };
        diffPosition = { x: 3, y: 1 };
        expect(service['isInEnlargementRadiusRange'](position, diffPosition, radius)).to.be.true;
    });

    it('isInEnlargementRadiusRange should return true if the distance between the position is equal to the radius', () => {
        const radius = 9;
        let position: Vec2 = { x: 1, y: 1 };
        let diffPosition: Vec2 = { x: 4, y: 4 };
        expect(service['isInEnlargementRadiusRange'](position, diffPosition, radius)).to.be.true;
        position = { x: 10, y: 1 };
        diffPosition = { x: 10, y: 10 };
        expect(service['isInEnlargementRadiusRange'](position, diffPosition, radius)).to.be.true;
    });

    it('isInEnlargementRadiusRange should return false if the distance between the position is larger than the radius', () => {
        const radius = 9;
        const position: Vec2 = { x: 1, y: 1 };
        const diffPosition: Vec2 = { x: 9, y: 9 };
        expect(service['isInEnlargementRadiusRange'](position, diffPosition, radius)).to.be.false;
    });

    it('isInEnlargementRadiusRange should return false if the two position given are the same', () => {
        const radius = 9;
        const position: Vec2 = { x: 1, y: 1 };
        expect(service['isInEnlargementRadiusRange'](position, position, radius)).to.be.false;
    });
});
