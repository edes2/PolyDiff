/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-named-as-default-member */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Queue } from '@app/classes/queue';
import { DIRECTIONS, HARD_DIFF_COUNT, HARD_DIFF_PERCENTAGE, MAXIMAL_DIFF_COUNT, MINIMAL_DIFF_COUNT } from '@app/constants/differences';
import { BLACK_RGBA_VALUE, WHITE_RGBA_VALUE } from '@app/constants/image';
import { PixelVisitInfo } from '@app/interfaces/difference-services';
import { DiffDetectorService } from '@app/services/differences/diff-detector.service';
import { DiffEnlargerService } from '@app/services/differences/diff-enlarger.service';
import { PixelService } from '@app/services/differences/pixel.service';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { Vec2 } from '@common/interfaces/vec2';
import { expect } from 'chai';
import Jimp from 'jimp';
import sinon, { SinonStub, SinonStubbedInstance, createStubInstance } from 'sinon';

describe('DiffDetectorService', () => {
    let service: DiffDetectorService;
    let pixelService: SinonStubbedInstance<PixelService>;
    let diffEnlargerService: SinonStubbedInstance<DiffEnlargerService>;

    const DEFAULT_POSITION: Vec2 = { x: 0, y: 0 };
    const DEFAULT_PIXEL: PixelVisitInfo = { position: DEFAULT_POSITION, direction: DIRECTIONS.north, diffPosition: DEFAULT_POSITION };
    const BLACK_IMG = new Jimp(1, 1, BLACK_RGBA_VALUE);
    const WHITE_IMG = new Jimp(1, 1, WHITE_RGBA_VALUE);

    beforeEach(() => {
        pixelService = createStubInstance(PixelService);
        diffEnlargerService = createStubInstance(DiffEnlargerService);
        service = new DiffDetectorService(pixelService, diffEnlargerService);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(service).not.to.be.undefined;
    });

    it('getter differenceCount should return 0 if the differences is empty', () => {
        service['differences'] = [];
        expect(service['differenceCount']).to.equal(0);
    });

    it('getter differenceCount should return the length if the differences is not empty', () => {
        service['differences'] = [{ start: DEFAULT_POSITION }];
        expect(service['differenceCount']).to.equal(1);
    });

    it('getter difficulty should return "Invalide" if there is not a valid difference count', () => {
        sinon.stub(service, <any>'hasValidDifferenceCount').returns(false);
        expect(service['difficulty']).to.equal('Invalide');
    });

    it('getter difficulty should return "Facile" if there is less than 7 differences', () => {
        sinon.stub(service, <any>'hasValidDifferenceCount').returns(true);
        sinon.stub(service, <any>'differenceCount').returns(HARD_DIFF_COUNT - 1);
        sinon.stub(service, <any>'getDifferencesPercentage').returns(HARD_DIFF_PERCENTAGE);
        expect(service['difficulty']).to.equal('Facile');
    });

    it('getter difficulty should return "Facile" if there is more than 15% of variations', () => {
        sinon.stub(service, <any>'hasValidDifferenceCount').returns(true);
        sinon.stub(service, <any>'differenceCount').returns(HARD_DIFF_COUNT);
        sinon.stub(service, <any>'getDifferencesPercentage').returns(HARD_DIFF_PERCENTAGE + 1);
        expect(service['difficulty']).to.equal('Facile');
    });

    it('getter difficulty should return "Difficile" if there is more than 7 differences and less than 15% of variations', () => {
        sinon.stub(service, <any>'hasValidDifferenceCount').returns(true);
        sinon.stub(service, <any>'differenceCount').get(() => HARD_DIFF_COUNT);
        sinon.stub(service, <any>'getDifferencesPercentage').returns(HARD_DIFF_PERCENTAGE);
        expect(service['difficulty']).to.equal('Difficile');
    });

    it('getter differencesImageUrl should return the image of differences in the form of a base64 URL', async () => {
        service['images'].diff = BLACK_IMG;
        const getBase64AsyncStub: SinonStub = sinon.stub(service['images'].diff, 'getBase64Async').callsFake(async () => '');
        await service['differencesImageUrl'];
        expect(getBase64AsyncStub.calledOnce).to.be.true;
        expect(getBase64AsyncStub.getCall(0).calledWith(Jimp.MIME_PNG));
    });

    it('setter radius should call setRadius of diffEnlargerService', () => {
        const radiusEnlargement = 9;
        service['radius'] = radiusEnlargement;
        expect(diffEnlargerService.setRadius.calledOnce).to.be.true;
    });

    it('buildDifferenceImage should return all the information wanted by the client', async () => {
        const fakeDifficulty = 'Facile';
        const fakeDataUrl = 'randomJustForTestingPurpose';
        const setImagesStub: SinonStub = sinon.stub(service, <any>'setImages').callsFake(async () => {});
        const compareImagesStub: SinonStub = sinon.stub(service, <any>'compareImages').callsFake(() => {});
        sinon.stub(service, <any>'differenceCount').get(() => MAXIMAL_DIFF_COUNT);
        sinon.stub(service, <any>'difficulty').get(() => fakeDifficulty);
        sinon.stub(service, <any>'differencesImageUrl').get(async () => fakeDataUrl);
        sinon.stub(service, <any>'joinDifferences');
        expect(await service.buildDifferenceImage(3, '', '')).to.deep.equal({
            diffCount: MAXIMAL_DIFF_COUNT,
            difficulty: fakeDifficulty,
            uri: fakeDataUrl,
        });
        expect(setImagesStub.calledOnce).to.be.true;
        expect(compareImagesStub.calledOnce).to.be.true;
    });

    it('hasValidDifferenceCount should return false if there are less than 3 or more than 9 differences', () => {
        const differencesCountStub: SinonStub = sinon.stub(service, <any>'differenceCount').get(() => MAXIMAL_DIFF_COUNT + 1);
        expect(service['hasValidDifferenceCount']()).to.be.false;
        differencesCountStub.get(() => MINIMAL_DIFF_COUNT - 1);
        expect(service['hasValidDifferenceCount']()).to.be.false;
    });

    it('hasValidDifferenceCount should return true if there are between 3 and 9 differences', () => {
        const differencesCountStub: SinonStub = sinon.stub(service, <any>'differenceCount').get(() => MAXIMAL_DIFF_COUNT);
        expect(service['hasValidDifferenceCount']()).to.be.true;
        differencesCountStub.get(() => MINIMAL_DIFF_COUNT);
        expect(service['hasValidDifferenceCount']()).to.be.true;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        differencesCountStub.get(() => 5);
        expect(service['hasValidDifferenceCount']()).to.be.true;
    });

    it('getDifferencesPercentage should compute the percentage of different pixels with the nbOfDiffPixels attribute', () => {
        service['nbOfDiffPixels'] = (IMAGE_WIDTH * IMAGE_HEIGHT) / 2;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(service['getDifferencesPercentage']()).to.equal(50);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        service['nbOfDiffPixels'] = (IMAGE_WIDTH * IMAGE_HEIGHT) / 4;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(service['getDifferencesPercentage']()).to.equal(25);
    });

    it('joinDifferences should not start a bfsJoinability if the differences array is empty', async () => {
        sinon.stub(Jimp, 'read');
        const bfsJoinabilityStub = sinon.stub(service, <any>'bfsJoinability');
        await service['joinDifferences']();
        expect(bfsJoinabilityStub.called).to.be.false;
    });

    it('joinDifferences should not start a bfsJoinability if the difference pixel is not black when checking it', async () => {
        sinon.stub(Jimp, 'read');
        service['differences'] = [{ start: DEFAULT_POSITION }];
        pixelService.isBlack.callsFake(() => false);
        const bfsJoinabilityStub = sinon.stub(service, <any>'bfsJoinability');
        await service['joinDifferences']();
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(bfsJoinabilityStub.called).to.be.false;
    });

    it('joinDifferences should remove the difference pixel if it is not black when checking it', async () => {
        sinon.stub(Jimp, 'read');
        service['differences'] = [{ start: DEFAULT_POSITION }];
        pixelService.isBlack.callsFake(() => false);
        sinon.stub(service, <any>'bfsJoinability');
        await service['joinDifferences']();
        expect(service['differences'].length).to.equal(0);
        expect(service['differences']).to.deep.equal([]);
    });

    it('joinDifferences should start a bfsJoinability if the difference pixel is black when checking it', async () => {
        sinon.stub(Jimp, 'read');
        service['differences'] = [{ start: DEFAULT_POSITION }];
        pixelService.isBlack.callsFake(() => true);
        const bfsJoinabilityStub = sinon.stub(service, <any>'bfsJoinability');
        await service['joinDifferences']();
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(bfsJoinabilityStub.calledOnce).to.be.true;
    });

    it('joinDifferences should keep the difference pixel in the array if it is black when checking it', async () => {
        sinon.stub(Jimp, 'read');
        service['differences'] = [{ start: DEFAULT_POSITION }];
        pixelService.isBlack.callsFake(() => true);
        sinon.stub(service, <any>'bfsJoinability');
        await service['joinDifferences']();
        expect(service['differences'].length).to.equal(1);
        expect(service['differences']).to.deep.equal([{ start: DEFAULT_POSITION }]);
    });

    it('setImages should set the left and right images', async () => {
        const jimpReadStub: SinonStub = sinon.stub(Jimp, 'read').callsFake(async () => BLACK_IMG);
        await service['setImages']('data:image/png;base64 ', 'data:image/png;base64 ');
        expect(service['images'].left).to.deep.equal(BLACK_IMG);
        expect(service['images'].right).to.deep.equal(BLACK_IMG);
        expect(jimpReadStub.callCount).to.equal(2);
        jimpReadStub.restore();
    });

    it('compareImages should initialize the counts of differences and black pixels and then call compareImagesWithParam', () => {
        const initDifferencesImageStub: SinonStub = sinon.stub(service, <any>'initDifferencesImage').callsFake(() => {});
        const compareImagesWithParamStub: SinonStub = sinon.stub(service, <any>'compareImagesWithParam').callsFake(() => {});
        service['compareImages']();
        expect(service['differences']).to.deep.equal([]);
        expect(initDifferencesImageStub.calledOnce).to.be.true;
        expect(compareImagesWithParamStub.calledOnce).to.be.true;
        expect(compareImagesWithParamStub.getCall(0).calledWith(service['images'].left, service['images'].right)).to.be.true;
    });

    it('initDifferencesImage should initialize differences image', () => {
        service['images'].diff = WHITE_IMG;
        service['initDifferencesImage']();
        expect(service['images'].diff).not.to.deep.equal(WHITE_IMG);
    });

    it('compareImagesWithParam should call addDifference if the given pixel is not the same on left and right images', () => {
        const addDifferenceStub = sinon.stub(service, <any>'addDifference').callsFake(() => {});
        const isTheSameStub = pixelService.isTheSame.returns(false);
        service['compareImagesWithParam'](BLACK_IMG, WHITE_IMG);
        expect(isTheSameStub.calledOnce).to.be.true;
        expect(addDifferenceStub.calledOnce).to.be.true;
        expect(addDifferenceStub.getCall(0).calledWith(DEFAULT_POSITION)).to.be.true;
    });

    it('compareImagesWithParam should not call addDifference if the given pixel is the same on left and right images', () => {
        const addDifferenceStub: SinonStub = sinon.stub(service, <any>'addDifference').callsFake(() => {});
        const isTheSameStub = pixelService.isTheSame.returns(true);
        service['compareImagesWithParam'](WHITE_IMG, WHITE_IMG);
        expect(isTheSameStub.calledOnce).to.be.true;
        expect(addDifferenceStub.called).to.be.false;
    });

    it('addDifference should call updateDifferenceArray and startBfs if the differences image current index pixel is not already black', async () => {
        const updateDifferenceArrayStub = sinon.stub(service, <any>'updateDifferenceArray').callsFake(() => {});
        const startBfsStub = sinon.stub(service, <any>'startBfs').callsFake(() => {});
        pixelService.isBlack.returns(false);
        service['addDifference'](DEFAULT_POSITION);
        expect(updateDifferenceArrayStub.called).to.be.true;
        expect(startBfsStub.called).to.be.true;
    });

    it('addDifference should not call updateDifferenceArray and startBfs if the differences image current index pixel is already black', async () => {
        const updateDifferenceArrayStub = sinon.stub(service, <any>'updateDifferenceArray').callsFake(() => {});
        const startBfsStub = sinon.stub(service, <any>'startBfs').callsFake(() => {});
        pixelService.isBlack.returns(true);
        service['addDifference'](DEFAULT_POSITION);
        expect(updateDifferenceArrayStub.called).to.be.false;
        expect(startBfsStub.called).to.be.false;
    });

    it('updateDifferenceArray should update differences count via the array', () => {
        service['differences'] = [];
        service['updateDifferenceArray'](DEFAULT_POSITION);
        expect(service['differences'].length).to.equal(1);
        expect(service['differences']).to.deep.equal([{ start: DEFAULT_POSITION }]);
    });

    it('startBfs should update the differences image', () => {
        const notEmptyImg = new Jimp(2, 2);
        notEmptyImg.setPixelColor(1, 1, 1);
        const bfsStub = diffEnlargerService.bfs.callsFake(() => notEmptyImg);
        service['startBfs'](DEFAULT_POSITION);
        expect(service['images'].diff).to.deep.equal(notEmptyImg);
        expect(bfsStub.calledOnceWith(service['images'], DEFAULT_POSITION)).to.be.true;
    });

    it('bfsJoinability should return an empty array if an empty array of pixels to visit is given', async () => {
        service['bfsJoinability'](WHITE_IMG, new Queue<PixelVisitInfo>([]));
        expect(pixelService.isValidPosition.called).to.be.false;
        expect(pixelService.drawWhite.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
    });

    it('bfsJoinability should not do any modification to the difference image if position is invalid', async () => {
        pixelService.isValidPosition.callsFake(() => false);
        service['bfsJoinability'](WHITE_IMG, new Queue<PixelVisitInfo>([DEFAULT_PIXEL]));
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.called).to.be.false;
        expect(pixelService.drawWhite.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
    });

    it('bfsJoinability should not append the position if the corresponding pixel is not black (white)', async () => {
        pixelService.isValidPosition.callsFake(() => true);
        pixelService.isBlack.callsFake(() => false);
        service['bfsJoinability'](WHITE_IMG, new Queue<PixelVisitInfo>([DEFAULT_PIXEL]));
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(pixelService.drawWhite.called).to.be.false;
        expect(pixelService.getAdjacents.called).to.be.false;
    });

    it('bfsJoinability should append the position if the corresponding pixel is black and draw it white', async () => {
        pixelService.isValidPosition.callsFake(() => true);
        pixelService.isBlack.callsFake(() => true);
        pixelService.getAdjacents.callsFake(() => []);
        service['bfsJoinability'](WHITE_IMG, new Queue<PixelVisitInfo>([DEFAULT_PIXEL]));
        expect(pixelService.isValidPosition.calledOnce).to.be.true;
        expect(pixelService.isBlack.calledOnce).to.be.true;
        expect(pixelService.drawWhite.called).to.be.true;
        expect(pixelService.getAdjacents.called).to.be.true;
    });
});
