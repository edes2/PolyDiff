/* istanbul ignore file */
// Too complex because using a worker would break the following tests.
import 'module-alias/register';
import { workerData, isMainThread, parentPort } from 'worker_threads';
import { PixelService } from '@app/services/differences/pixel.service';
import { DiffEnlargerService } from '@app/services/differences/diff-enlarger.service';
import { DiffDetectorService } from '@app/services/differences/diff-detector.service';

if (!isMainThread) {
    const computeDifferenceImage = async () => {
        const pixelService = new PixelService();
        const diffDetectorService = new DiffDetectorService(pixelService, new DiffEnlargerService(pixelService));
        const differenceImage = await diffDetectorService.buildDifferenceImage(workerData.radiusSize, workerData.leftUri, workerData.rightUri);
        parentPort?.postMessage(differenceImage);
    };
    computeDifferenceImage();
}
