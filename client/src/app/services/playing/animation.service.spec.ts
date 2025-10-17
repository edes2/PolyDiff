/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from '@angular/core/testing';
import { AnimationService } from './animation.service';
import { ElementRef } from '@angular/core';

describe('AnimationService', () => {
    let service: AnimationService;

    const defaultStyleObj = {
        width: '',
        height: '',
        zIndex: '',
        positin: '',
        top: '',
        left: '',
        animationDelay: '',
        animationDuration: '',
        animation: '',
        background: '',
    };

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AnimationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('setter animationArea should set the area attribute', () => {
        const area = { test: () => {} } as unknown as ElementRef;
        service.animationArea = area;
        expect(service['area']).toEqual(area);
    });

    it('startRain should set isActive attribute to true and change the overflow of area to hidden', () => {
        spyOn(window, 'setTimeout').and.stub();
        service['area'] = { nativeElement: { style: { overflow: '' } } as HTMLElement } as ElementRef;
        service.startRain();
        expect(service['isActive']).toEqual(true);
        expect(service['area'].nativeElement.style.overflow).toEqual('hidden');
    });

    it('startRain should not change the overflow of area if it is undefined', () => {
        spyOn(window, 'setTimeout').and.stub();
        service['area'] = undefined;
        service.startRain();
        expect(service['area']).toBeUndefined();
    });

    it('startRain should call setTimeout as many times as the number of iterations', () => {
        const numberOfIterations = 15;
        const setTimeoutSpy = spyOn(window, 'setTimeout').and.stub();
        spyOn(service, <any>'rain').and.stub();
        service['area'] = { nativeElement: { style: { overflow: '' } } as HTMLElement } as ElementRef;
        service.startRain();
        expect(setTimeoutSpy).toHaveBeenCalledTimes(numberOfIterations);
    });

    it('startRain should call setTimeout with a function that calls rain', () => {
        const setTimeoutSpy = spyOn(window, 'setTimeout').and.stub();
        const rainSpy = spyOn(service, <any>'rain').and.stub();
        service['area'] = { nativeElement: { style: { overflow: '' } } as HTMLElement } as ElementRef;
        service.startRain();
        setTimeoutSpy.calls.argsFor(0)[0]();
        expect(rainSpy).toHaveBeenCalled();
        expect(rainSpy.calls.count()).toEqual(1);
    });

    it('clearRain should set isActive attribute to false and change the overflow of area to visible', () => {
        spyOn(window, 'setTimeout').and.stub();
        spyOn(document, 'querySelectorAll').and.returnValue({ forEach: () => {} } as unknown as NodeListOf<Element>);
        service['area'] = { nativeElement: { style: { overflow: '' } } as HTMLElement } as ElementRef;
        service.clearRain();
        expect(service['isActive']).toEqual(false);
        expect(service['area'].nativeElement.style.overflow).toEqual('visible');
    });

    it('clearRain should not change the overflow of area if it is undefined', () => {
        spyOn(window, 'setTimeout').and.stub();
        spyOn(document, 'querySelectorAll').and.returnValue({ forEach: () => {} } as unknown as NodeListOf<Element>);
        service['area'] = undefined;
        service.clearRain();
        expect(service['area']).toBeUndefined();
    });

    it('clearRain should call remove on all html i element', () => {
        const element = { remove: () => {} } as HTMLElement;
        const elemRemoveSpy = spyOn(element, 'remove');
        spyOn(window, 'setTimeout').and.stub();
        service['rainDrops'] = [element, element];
        service['area'] = { nativeElement: { style: { overflow: '' } } as HTMLElement } as ElementRef;
        service.clearRain();
        expect(elemRemoveSpy).toHaveBeenCalledTimes(2);
    });

    it('rain should create i elements as many times as the number of lines value', () => {
        const numberOfLines = 50;
        const setColorSpy = spyOn(service, <any>'setColor').and.stub();
        const documentCreateElementSpy = spyOn(document, 'createElement').and.returnValue({ style: defaultStyleObj } as unknown as HTMLElement);
        service['isActive'] = true;
        service['area'] = undefined;
        service['rain']();
        expect(documentCreateElementSpy).toHaveBeenCalledTimes(numberOfLines);
        expect(setColorSpy).toHaveBeenCalledTimes(numberOfLines);
    });

    it('rain should appendChild with i elements as many times as the number of lines value', () => {
        const numberOfLines = 50;
        const element = { nativeElement: { appendChild: () => {} } } as ElementRef;
        const elementAppendChildSpy = spyOn(element.nativeElement, 'appendChild').and.stub();
        spyOn(service, <any>'setColor').and.stub();
        spyOn(document, 'createElement').and.returnValue({ style: defaultStyleObj } as unknown as HTMLElement);
        service['isActive'] = true;
        service['area'] = element;
        service['rain']();
        expect(elementAppendChildSpy).toHaveBeenCalledTimes(numberOfLines);
    });

    it('rain should not call anything if the isActive attribute is false', () => {
        const element = { nativeElement: { appendChild: () => {} } } as ElementRef;
        const elementAppendChildSpy = spyOn(element.nativeElement, 'appendChild').and.stub();
        const setColorSpy = spyOn(service, <any>'setColor').and.stub();
        const documentCreateElementSpy = spyOn(document, 'createElement').and.returnValue({ style: defaultStyleObj } as unknown as HTMLElement);
        service['isActive'] = false;
        service['area'] = element;
        service['rain']();
        expect(documentCreateElementSpy).not.toHaveBeenCalled();
        expect(setColorSpy).not.toHaveBeenCalled();
        expect(elementAppendChildSpy).not.toHaveBeenCalled();
    });

    it('setColor should set background color associated with the modulo result of 0', () => {
        const element = { style: defaultStyleObj } as unknown as HTMLElement;
        service['setColor'](element, 0);
        expect(element.style.background).toEqual('linear-gradient(transparent, #e096ec)');
    });

    it('setColor should set background color associated with the modulo result of 1', () => {
        const element = { style: defaultStyleObj } as unknown as HTMLElement;
        service['setColor'](element, 1);
        expect(element.style.background).toEqual('linear-gradient(transparent, #69f0ae)');
    });

    it('setColor should set background color associated with the modulo result of 2', () => {
        const element = { style: defaultStyleObj } as unknown as HTMLElement;
        service['setColor'](element, 2);
        expect(element.style.background).toEqual('linear-gradient(transparent, #9036aa)');
    });

    it('setColor should set background color associated with the modulo result of 3', () => {
        const element = { style: defaultStyleObj } as unknown as HTMLElement;
        service['setColor'](element, 3);
        expect(element.style.background).toEqual('linear-gradient(transparent, #fcba03)');
    });

    it('setColor should set background color associated with a modulo result of anything else', () => {
        const element = { style: defaultStyleObj } as unknown as HTMLElement;
        service['setColor'](element, 2 + 2);
        expect(element.style.background).toEqual('linear-gradient(transparent, #ffffff)');
    });
});
