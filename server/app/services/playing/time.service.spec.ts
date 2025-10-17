/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable import/no-named-as-default-member */
import { AbstractManager } from '@app/classes/abstract-manager';
import { TimeService } from '@app/services/playing/time.service';
import { expect } from 'chai';
import sinon, { createStubInstance, SinonFakeTimers, SinonSpy, SinonStub, SinonStubbedInstance } from 'sinon';

describe('TimeService tests', () => {
    let service: TimeService;
    let abstractManager: SinonStubbedInstance<AbstractManager>;

    beforeEach(() => {
        abstractManager = createStubInstance(AbstractManager);
        service = new TimeService(abstractManager);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should be created', () => {
        expect(service).to.exist;
        expect(service['manager']).to.equal(abstractManager);
    });

    it('getCurrentTime should return the time in string (over 10)', () => {
        sinon.stub(Date.prototype, 'getHours').returns(10);
        sinon.stub(Date.prototype, 'getMinutes').returns(10);
        sinon.stub(Date.prototype, 'getSeconds').returns(10);
        expect(service['getCurrentTime']()).to.equal('10:10:10');
    });

    it('startTimer should call the emitTime method and init the values to 0', async () => {
        const fakeTimer: SinonFakeTimers = sinon.useFakeTimers();
        const emitTimeStub: SinonStub = sinon.stub(service, <any>'emitTime');
        sinon.stub(service, 'getCurrentTime');
        service['values'] = { numeric: 99, stringValue: '01:39' };
        service['startTimer']();
        await fakeTimer.tickAsync(1100);
        fakeTimer.restore();
        expect(emitTimeStub.calledOnce).to.be.true;
        expect(emitTimeStub.calledWith(1)).to.be.true;
        expect(service['values']).to.deep.equal({ numeric: 0, stringValue: '00:00' });
    });

    it('startTimer should not call the emitTime method and init the values to 0 if the timer is undefined', async () => {
        const fakeTimer: SinonFakeTimers = sinon.useFakeTimers();
        const emitTimeStub: SinonStub = sinon.stub(service, <any>'emitTime');
        sinon.stub(service, 'getCurrentTime');
        service['timer'] = {} as NodeJS.Timer;
        service['values'] = { numeric: 99, stringValue: '01:39' };
        service['startTimer']();
        await fakeTimer.tickAsync(1100);
        fakeTimer.restore();
        expect(emitTimeStub.calledOnce).to.be.false;
    });

    it('startTimer should update the timer once every second', async () => {
        const fakeTimer: SinonFakeTimers = sinon.useFakeTimers();
        const emitTimeSpy: SinonSpy = sinon.spy(service, <any>'emitTime');
        sinon.stub(service, 'getCurrentTime');
        service['values'] = { numeric: 0, stringValue: '00:00' };
        service['startTimer']();
        await fakeTimer.tickAsync(10100);
        fakeTimer.restore();
        expect(emitTimeSpy.callCount).to.equal(10);
        expect(emitTimeSpy.calledWith(1)).to.be.true;
        expect(service['values']).to.deep.equal({ numeric: 10, stringValue: '00:10' });
    });

    it('stopTimer should call the clearInterval method', () => {
        sinon.stub(service, 'setDuration');
        const clearIntervalStub: SinonStub = sinon.stub(global, 'clearInterval');
        service['stopTimer']();
        expect(clearIntervalStub.calledOnce).to.be.true;
    });

    it('stopTimer should call the setDuration method', () => {
        const setDurationStub: SinonStub = sinon.stub(service, 'setDuration');
        sinon.stub(global, 'clearInterval');
        service['stopTimer']();
        expect(setDurationStub.calledOnce).to.be.true;
    });

    it('setDuration should call the right functions', () => {
        const mathFloorSpy = sinon.stub(Math, 'floor');
        const dateSpy = sinon.stub(Date, 'now');
        const convertSpy = sinon.stub(service, <any>'convertToTwoDigits');
        service.setDuration();
        expect(mathFloorSpy.calledTwice).to.be.true;
        expect(dateSpy.calledOnce).to.be.true;
        expect(convertSpy.calledTwice).to.be.true;
    });

    it('getStartingTime should return the starting time', () => {
        const time = 'test-time';
        service['startingTime'] = time;
        expect(service.getStartingTime()).to.equal(time);
    });

    it('getDuration should return the duration', () => {
        const duration = 'test-duration';
        service['duration'] = duration;
        expect(service.getDuration()).to.equal(duration);
    });

    it("getTimerStringValue should return the timer's string value", () => {
        const timerValue = 'test-value';
        service['values'] = { numeric: 0, stringValue: timerValue };
        expect(service.getTimerStringValue()).to.deep.equal(timerValue);
    });

    it('emitTime should call the updateTimerValues method and the updateTimer method of the manager', () => {
        const timeValues = { numeric: 1, stringValue: '00:01' };
        const updateTimerValuesStub: SinonStub = sinon.stub(service, <any>'updateTimerValues');
        service['values'] = timeValues;
        service['emitTime'](1);
        expect(updateTimerValuesStub.calledOnce).to.be.true;
        expect(updateTimerValuesStub.calledWith(1, undefined)).to.be.true;
        expect(abstractManager.updateTimer.calledOnce).to.be.true;
        expect(abstractManager.updateTimer.calledWith('00:01')).to.be.true;
    });

    it('emitTime should call the updateTimerValues method and the updateTimer method of the manager with default change', () => {
        const timeValues = { numeric: 1, stringValue: '00:01' };
        const updateTimerValuesStub: SinonStub = sinon.stub(service, <any>'updateTimerValues');
        service['values'] = timeValues;
        service['emitTime']();
        expect(updateTimerValuesStub.calledOnce).to.be.true;
        expect(updateTimerValuesStub.calledWith(0, undefined)).to.be.true;
        expect(abstractManager.updateTimer.calledOnce).to.be.true;
        expect(abstractManager.updateTimer.calledWith('00:01')).to.be.true;
    });

    it('updateTimer should update the timer', () => {
        service['values'] = { numeric: 0, stringValue: '00:00' };
        service['updateTimerValues'](1);
        expect(service['values']).to.deep.equal({ numeric: 1, stringValue: '00:01' });
        service['values'] = { numeric: 59, stringValue: '00:59' };
        service['updateTimerValues'](1);
        expect(service['values']).to.deep.equal({ numeric: 60, stringValue: '01:00' });
    });

    it('updateTimer should update the timer with max cap', () => {
        service['values'] = { numeric: 120, stringValue: '2:00' };
        service['updateTimerValues'](1, 120);
        expect(service['values']).to.deep.equal({ numeric: 120, stringValue: '02:00' });
    });

    it('convertToTwoDigits should return the number as a string with two digits', () => {
        expect(service['convertToTwoDigits'](1)).to.equal('01');
        expect(service['convertToTwoDigits'](10)).to.equal('10');
    });

    it('stringifyTime should return the number as a string with two digits', () => {
        expect(service['stringifyTime'](1)).to.equal('00:01');
        expect(service['stringifyTime'](10)).to.equal('00:10');
        expect(service['stringifyTime'](60)).to.equal('01:00');
        expect(service['stringifyTime'](100)).to.equal('01:40');
    });

    it('updateTimerValues should call stringifyTime', () => {
        const stringifyTimeStub = sinon.stub(service, <any>'stringifyTime');
        service['values'] = { numeric: 1, stringValue: '1' };
        service['updateTimerValues'](7, 5);
        expect(stringifyTimeStub.calledOnce).to.be.true;
    });

    it('updateTimerValues should set value to 0', () => {
        sinon.stub(service, <any>'stringifyTime');
        service['values'] = { numeric: -1, stringValue: '1' };
        service['updateTimerValues'](0, 5);
        expect(service['values'].numeric).equal(0);
    });
});
