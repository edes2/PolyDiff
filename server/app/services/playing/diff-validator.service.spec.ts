/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable import/no-named-as-default-member */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Queue } from '@app/classes/queue';
import { DIRECTIONS } from '@app/constants/differences';
import { PixelVisitInfo } from '@app/interfaces/difference-services';
import { PixelService } from '@app/services/differences/pixel.service';
import { DiffValidatorService } from '@app/services/playing/diff-validator.service';
import { ImageFileSystemService } from '@app/services/storage/image-file-system.service';
import { Vec2 } from '@common/interfaces/vec2';
import { expect } from 'chai';
import Jimp from 'jimp';
import sinon, { SinonStub, SinonStubbedInstance, createStubInstance } from 'sinon';

describe('DiffValidatorService', () => {
    let service: DiffValidatorService;
    let pixelService: SinonStubbedInstance<PixelService>;
    let fileSystemService: SinonStubbedInstance<ImageFileSystemService>;

    const POSITION: Vec2 = { x: 1, y: 0 };
    const DEFAULT_POSITION: Vec2 = { x: 0, y: 0 };
    const RANDOM_IMAGE = new Jimp(3, 3);
    const DEFAULT_PIXEL: PixelVisitInfo = { position: POSITION, direction: DIRECTIONS.north, diffPosition: DEFAULT_POSITION };

    beforeEach(() => {
        pixelService = createStubInstance(PixelService);
        fileSystemService = createStubInstance(ImageFileSystemService);
        service = new DiffValidatorService(pixelService, fileSystemService);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(service).not.to.be.undefined;
    });

    it('setDifferenceImage should read the image file in the disk and convert it to a Jimp instance', async () => {
        fileSystemService.getDifferenceImageById.callsFake(async () => 'data:image/png;base64 ');
        const jimpReadStub: SinonStub = sinon.stub(Jimp, 'read').callsFake(async () => new Jimp(1, 1));
        await service.setDifferenceImage('');
        expect(fileSystemService.getDifferenceImageById.calledOnce).to.be.true;
        expect(jimpReadStub.calledOnce).to.be.true;
    });

    it('validateClick should return undefined if the differencePixels array is empty', async () => {
        const getDifferenceStub = sinon.stub(service, <any>'getDifference').callsFake(async () => []);
        expect(await service.validateClick(POSITION)).to.be.undefined;
        expect(getDifferenceStub.calledOnce).to.be.true;
    });

    it('validateClick should return the array of difference pixels if it is not empty', async () => {
        const getDifferenceStub = sinon.stub(service, <any>'getDifference').callsFake(async () => [POSITION, DEFAULT_POSITION]);
        expect(await service.validateClick(POSITION)).to.deep.equal([POSITION, DEFAULT_POSITION]);
        expect(getDifferenceStub.calledOnce).to.be.true;
    });

    it('getAllDifferences should call isBlack for each pixel in the difference image and add them to the array if they are black', async () => {
        pixelService.isBlack.callsFake(() => true);
        service['diffImage'] = RANDOM_IMAGE;
        const result = await service.getAllDifferences();
        expect(result.length).to.equal(RANDOM_IMAGE.getWidth() * RANDOM_IMAGE.getHeight());
        expect(pixelService.isBlack.callCount).to.equal(RANDOM_IMAGE.getWidth() * RANDOM_IMAGE.getHeight());
    });

    it('getAllDifferences should call isBlack for each pixel in the difference image and return an empty array if they are all white', async () => {
        pixelService.isBlack.callsFake(() => false);
        service['diffImage'] = RANDOM_IMAGE;
        const result = await service.getAllDifferences();
        expect(result.length).to.equal(0);
        expect(pixelService.isBlack.callCount).to.equal(RANDOM_IMAGE.getWidth() * RANDOM_IMAGE.getHeight());
    });

    it('getDifference should return an empty array if the pixel at the given position is not black', async () => {
        pixelService.isBlack.callsFake(() => false);
        expect(await service['getDifference'](POSITION)).to.deep.equal([]);
        expect(pixelService.isBlack.calledOnce).to.be.true;
    });

    it('getDifference should return an array of position from the difference bfs if the pixel at the given position is black', async () => {
        pixelService.isBlack.callsFake(() => true);
        const expectedArray = [POSITION, DEFAULT_POSITION];
        const startBfsStub: SinonStub = sinon.stub(service, <any>'startBfs').callsFake(async () => expectedArray);
        expect(await service['getDifference'](POSITION)).to.deep.equal(expectedArray);
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(startBfsStub.calledOnce).to.be.true;
    });

    it('startBfs should set the pixel at the given position white and then call bfsWithArray with the start pixels computed', async () => {
        pixelService.drawWhite.callsFake(() => new Jimp(1, 1));
        const expectedArray = [POSITION, DEFAULT_POSITION];
        const bfsWithArrayStub = sinon.stub(service, <any>'bfsWithArray').callsFake(async () => expectedArray);
        await service['startBfs'](DEFAULT_POSITION);
        expect(pixelService.drawWhite.calledOnce).to.be.true;
        expect(pixelService.getPixelsToVisitStart.calledOnce).to.be.true;
        expect(bfsWithArrayStub.calledOnce).to.be.true;
    });

    it('bfsWithArray should return an empty array if an empty array of pixels to visit is given', async () => {
        expect(await service['bfsWithArray'](new Queue<PixelVisitInfo>([]))).to.deep.equal([]);
        expect(pixelService.isValidPosition.called).to.be.false;
        expect(pixelService.drawWhite.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
    });

    it('bfsWithArray should not do any modification to the difference image if position is invalid', async () => {
        pixelService.isValidPosition.callsFake(() => false);
        expect(await service['bfsWithArray'](new Queue<PixelVisitInfo>([DEFAULT_PIXEL]))).to.deep.equal([]);
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.called).to.be.false;
        expect(pixelService.drawWhite.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
    });

    it('bfsWithArray should not append the position if the corresponding pixel is not black (white)', async () => {
        pixelService.isValidPosition.callsFake(() => true);
        pixelService.isBlack.callsFake(() => false);
        expect(await service['bfsWithArray'](new Queue<PixelVisitInfo>([DEFAULT_PIXEL]))).to.deep.equal([]);
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(pixelService.drawWhite.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
    });

    it('bfsWithArray should append the position if the corresponding pixel is black and draw it white', async () => {
        pixelService.isValidPosition.callsFake(() => true);
        pixelService.isBlack.callsFake(() => true);
        pixelService.getAdjacents.callsFake(() => []);
        expect(await service['bfsWithArray'](new Queue<PixelVisitInfo>([DEFAULT_PIXEL]))).to.deep.equal([POSITION]);
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(pixelService.drawWhite.called).to.be.true;
        expect(pixelService.getAdjacents.called).to.be.true;
    });
});
