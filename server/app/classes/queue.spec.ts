/* eslint-disable import/no-named-as-default-member */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai';
import { Queue } from '@app/classes/queue';
import sinon from 'sinon';

describe('Queue tests', () => {
    let queue: Queue<number>;

    beforeEach(() => {
        queue = new Queue();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(queue).to.exist;
    });

    it('constructor should initialize front and rear to zero', () => {
        expect(queue['front']).to.equal(0);
        expect(queue['rear']).to.equal(0);
    });

    it('constructor should call concat with the array given', () => {
        const queueConcatStub = sinon.stub(Queue.prototype, 'concat');
        new Queue<number>([0, 0, 1]);
        expect(queueConcatStub.calledOnce).to.be.true;
    });

    it('size should return zero if the rear is equal to the front', () => {
        queue['front'] = 10;
        queue['rear'] = 10;
        expect(queue.size).to.equal(0);
    });

    it('size should return the difference between the rear and the front', () => {
        const size = 19;
        queue['front'] = 4;
        queue['rear'] = queue['front'] + size;
        expect(queue.size).to.equal(size);
    });

    it('push should call set on the items attribute', () => {
        const rearValue = 12;
        const randomValue = 17;
        const itemsSetStub = sinon.stub(queue['items'], 'set');
        queue['rear'] = rearValue;
        queue.push(randomValue);
        expect(itemsSetStub.calledOnce).to.be.true;
        expect(itemsSetStub.getCall(0).args[0]).to.equal(rearValue);
        expect(itemsSetStub.getCall(0).args[1]).to.equal(randomValue);
    });

    it('push should increment the rear attribute', () => {
        const rearValue = 12;
        const randomValue = 17;
        sinon.stub(queue['items'], 'set');
        queue['rear'] = rearValue;
        queue.push(randomValue);
        expect(queue['rear']).to.equal(rearValue + 1);
    });

    it('shift should call get on the items attribute', () => {
        const frontValue = 12;
        const itemsGetStub = sinon.stub(queue['items'], 'get');
        queue['front'] = frontValue;
        queue.shift();
        expect(itemsGetStub.calledOnce).to.be.true;
        expect(itemsGetStub.getCall(0).args[0]).to.equal(frontValue);
    });

    it('shift should call delete on the items attribute', () => {
        const frontValue = 12;
        const itemsDeleteStub = sinon.stub(queue['items'], 'delete');
        queue['front'] = frontValue;
        queue.shift();
        expect(itemsDeleteStub.calledOnce).to.be.true;
        expect(itemsDeleteStub.getCall(0).args[0]).to.equal(frontValue);
    });

    it('shift should increment the front attribute', () => {
        const frontValue = 12;
        sinon.stub(queue['items'], 'set');
        queue['front'] = frontValue;
        queue.shift();
        expect(queue['front']).to.equal(frontValue + 1);
    });

    it('concat should call push as many times as the length of the array given', () => {
        const randomArray = [0, 1, 3, 2, 1, 0];
        const queuePushStub = sinon.stub(queue, 'push');
        queue.concat(randomArray);
        expect(queuePushStub.callCount).to.equal(randomArray.length);
    });
});
