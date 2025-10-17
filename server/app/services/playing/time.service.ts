import { AbstractManager } from '@app/classes/abstract-manager';
import { TimerInfo } from '@app/interfaces/timer';
import { ONE_SECOND_IN_MS, SECONDS_IN_MINUTE } from '@common/constants/time';
import { EventEmitter } from 'stream';

export const TIMEOUT_EVENT = 'timeout';

export class TimeService {
    timeoutSignal: EventEmitter = new EventEmitter();

    private startingTime: string;
    private absoluteStartingTime: number;
    private duration: string;
    private timer: NodeJS.Timer;
    private values: TimerInfo;
    private maxTimerValue: number | undefined;

    constructor(private manager: AbstractManager) {}

    getCurrentTime() {
        const date = new Date();
        const [hours, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];
        return `${this.convertToTwoDigits(hours)}:${this.convertToTwoDigits(minutes)}:${this.convertToTwoDigits(seconds)}`;
    }

    getDuration(): string {
        return this.duration;
    }

    getStartingTime(): string {
        return this.startingTime;
    }

    getTimerStringValue(): string {
        return this.values.stringValue;
    }

    setMaxTimerValue(maxValue: number): void {
        this.maxTimerValue = maxValue > 0 ? maxValue : undefined;
    }

    startTimer(value: number = 0, change: number = 1): void {
        if (this.timer) return;
        this.setStartTimerValues(value);
        this.startingTime = this.getCurrentTime();

        this.timer = setInterval(() => {
            this.emitTime(change);
            if (this.isTimeout()) {
                this.stopTimer();
                this.timeoutSignal.emit(TIMEOUT_EVENT);
            }
        }, ONE_SECOND_IN_MS);
        this.startingTime = this.getCurrentTime();
        this.absoluteStartingTime = Date.now();
    }

    stopTimer(): void {
        clearInterval(this.timer);
        this.setDuration();
    }

    setDuration(): void {
        const timeInSeconds = Math.floor((Date.now() - this.absoluteStartingTime) / ONE_SECOND_IN_MS);
        const minutes = Math.floor(timeInSeconds / SECONDS_IN_MINUTE);
        const seconds = timeInSeconds % SECONDS_IN_MINUTE;
        this.duration = `${this.convertToTwoDigits(minutes)}:${this.convertToTwoDigits(seconds)}`;
    }

    isTimeout(): boolean {
        return this.values.numeric === 0;
    }

    incrementTimer(increment: number): void {
        const newValue = this.values.numeric + increment;
        this.values.numeric = this.maxTimerValue ? Math.min(newValue, this.maxTimerValue) : newValue;
        this.values.stringValue = this.stringifyTime(this.values.numeric);
        this.manager.updateTimer(this.values.stringValue);
    }

    emitTime(change: number = 0, maxCap?: number): void {
        this.updateTimerValues(change, maxCap);
        this.manager.updateTimer(this.values.stringValue);
    }

    private setStartTimerValues(numeric: number) {
        const stringValue = this.stringifyTime(numeric);
        this.values = { numeric, stringValue };
    }

    private updateTimerValues(change: number, maxCap?: number): void {
        this.values.numeric += change;
        if (this.values.numeric < 0) {
            this.values.numeric = 0;
        } else if (maxCap && this.values.numeric > maxCap) {
            this.values.numeric = maxCap;
        }
        this.values.stringValue = this.stringifyTime(this.values.numeric);
    }

    private convertToTwoDigits(value: number): string {
        const minNumberTwoDigits = 10;
        return value >= minNumberTwoDigits ? value.toString() : '0' + value.toString();
    }

    private stringifyTime(time: number): string {
        const timeConversionFactor = 60;
        return this.convertToTwoDigits(Math.floor(time / timeConversionFactor)) + ':' + this.convertToTwoDigits(time % timeConversionFactor);
    }
}
