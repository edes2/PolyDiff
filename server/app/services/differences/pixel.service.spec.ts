/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable import/no-named-as-default-member */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DIRECTIONS, DIRECTIONS_LIST } from '@app/constants/differences';
import { BLACK_RGBA_VALUE, WHITE_RGBA_VALUE } from '@app/constants/image';
import { Direction, PixelVisitInfo } from '@app/interfaces/difference-services';
import { PixelService } from '@app/services/differences/pixel.service';
import { IMAGE_HEIGHT, IMAGE_WIDTH } from '@common/constants/image';
import { Vec2 } from '@common/interfaces/vec2';
import { expect } from 'chai';
import Jimp from 'jimp';
import sinon, { SinonSpy, SinonStub } from 'sinon';

describe('PixelService', () => {
    let service: PixelService;

    const POSITION: Vec2 = { x: 1, y: 0 };
    const DEFAULT_POSITION: Vec2 = { x: 0, y: 0 };
    const BLACK_IMAGE = new Jimp(2, 2, BLACK_RGBA_VALUE);
    const WHITE_IMAGE = new Jimp(2, 2, WHITE_RGBA_VALUE);
    const DEFAULT_PIXEL: PixelVisitInfo = { position: POSITION, direction: DIRECTIONS.north, diffPosition: DEFAULT_POSITION };

    beforeEach(() => {
        service = new PixelService();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(service).not.to.be.undefined;
    });

    it('getNextPixelWithDirection should call getPositionWithDirection and return the new direction but the same diffPosition', () => {
        const direction: Direction = DIRECTIONS.north;
        const getPositionWithDirectionStub: SinonStub = sinon.stub(service, <any>'getPositionWithDirection').callsFake(() => DEFAULT_POSITION);
        const result = service.getNextPixelWithDirection(DEFAULT_PIXEL, direction);
        expect(getPositionWithDirectionStub.calledOnce).to.be.true;
        expect(result.position).to.deep.equal(DEFAULT_POSITION);
        expect(result.diffPosition).to.deep.equal(DEFAULT_POSITION);
        expect(result.direction).to.deep.equal(direction);
    });

    it('getPixelsToVisitStart should call getAllAdjacents with return the same value for position and diffPosition', () => {
        const getAllAdjacentsStub: SinonStub = sinon.stub(service, 'getAllAdjacents').callsFake(() => [DEFAULT_PIXEL]);
        service.getPixelsToVisitStart(DEFAULT_POSITION);
        expect(getAllAdjacentsStub.calledOnce).to.be.true;
    });

    it('getAllAdjacents should return an array of the four adjacent pixels', () => {
        const getNextPixelWithDirectionStub: SinonStub = sinon.stub(service, 'getNextPixelWithDirection').returns(DEFAULT_PIXEL);
        const result = service.getAllAdjacents(DEFAULT_PIXEL);
        expect(getNextPixelWithDirectionStub.callCount).to.equal(DIRECTIONS_LIST.length);
        expect(result.length).to.equal(DIRECTIONS_LIST.length);
    });

    it('getAdjacents should return an array of the three adjacent pixels in the direction given', () => {
        const getNextPixelWithDirectionStub: SinonStub = sinon.stub(service, 'getNextPixelWithDirection').returns(DEFAULT_PIXEL);
        const result = service.getAdjacents(DEFAULT_PIXEL);
        expect(getNextPixelWithDirectionStub.callCount).to.equal(3);
        expect(result.length).to.equal(3);
    });

    it('getAdjacents should return an empty array if the direction given does not exist in DIRECTIONS_LIST', () => {
        const result = service.getAdjacents({ direction: { name: 'does not exist' } } as PixelVisitInfo);
        expect(result.length).to.equal(0);
    });

    it('isValidPosition should return false if at least one coordinate is negative', () => {
        let position: Vec2 = { x: -1, y: 0 };
        expect(service['isValidPosition'](position)).to.be.false;
        position = { x: 0, y: -1 };
        expect(service['isValidPosition'](position)).to.be.false;
    });

    it('isValidPosition should return false if the width coord is equal to the image width', () => {
        expect(service['isValidPosition']({ x: IMAGE_WIDTH, y: 0 })).to.be.false;
    });

    it('isValidPosition should return false if the height coord is equal to the image width', () => {
        expect(service['isValidPosition']({ x: 0, y: IMAGE_HEIGHT })).to.be.false;
    });

    it('isTheSame should return false if both pixels are different', () => {
        expect(service['isTheSame'](BLACK_IMAGE, WHITE_IMAGE, DEFAULT_POSITION)).to.be.false;
    });

    it('isTheSame should return true if both pixels are the same', () => {
        expect(service['isTheSame'](WHITE_IMAGE, WHITE_IMAGE, DEFAULT_POSITION)).to.be.true;
    });

    it("isBlack should return false if pixel isn't black", () => {
        expect(service['isBlack'](WHITE_IMAGE, DEFAULT_POSITION)).to.be.false;
    });

    it('isBlack should return true if pixel is black', () => {
        expect(service['isBlack'](BLACK_IMAGE, DEFAULT_POSITION)).to.be.true;
    });

    it('drawBlack should set the pixel given to black', () => {
        let image = new Jimp(2, 2, WHITE_RGBA_VALUE);
        const setPixelColorSpy: SinonSpy = sinon.spy(image, 'setPixelColor');
        image = service.drawBlack(image, DEFAULT_POSITION);
        expect(setPixelColorSpy.calledOnce).to.be.true;
        expect(image.getPixelColor(0, 0)).to.equal(BLACK_RGBA_VALUE);
    });

    it('drawWhite should set the pixel given to white', () => {
        let image = new Jimp(2, 2, BLACK_RGBA_VALUE);
        const setPixelColorSpy: SinonSpy = sinon.spy(image, 'setPixelColor');
        image = service.drawWhite(image, DEFAULT_POSITION);
        expect(setPixelColorSpy.calledOnce).to.be.true;
        expect(image.getPixelColor(0, 0)).to.equal(WHITE_RGBA_VALUE);
    });

    it('getPositionWithDirection should return position with direction', () => {
        const position: Vec2 = { x: 0, y: 0 };
        const direction: Direction = { x: 1, y: 1, name: '' };
        const expectedPosition: Vec2 = { x: 1, y: 1 };
        expect(service['getPositionWithDirection'](position, direction)).to.deep.equal(expectedPosition);
    });
});
