import { DiffValidatorService } from '@app/services/playing/diff-validator.service';
import { CardInfoService } from '@app/services/storage/card-info.service';
import { ImageFileSystemService } from '@app/services/storage/image-file-system.service';
import { CardInfo } from '@common/interfaces/card-info';
import { ImageSet } from '@common/interfaces/image';
import { OneDifferenceImageSet } from '@common/interfaces/one-difference-set';
import { Vec2 } from '@common/interfaces/vec2';
import Jimp from 'jimp';
import { Service } from 'typedi';

@Service()
export class OneDifferenceImagesService {
    constructor(private cardInfoService: CardInfoService, private imageService: ImageFileSystemService) {}

    async getRandomOneDifferenceImageSet(exclude?: string[]): Promise<OneDifferenceImageSet | null> {
        let allCards = await this.cardInfoService.getAllCardInfos();
        if (exclude) allCards = allCards.filter((card) => !exclude.includes(card.id));
        if (!allCards.length) return null;
        const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
        return this.buildOneDifferenceImage(randomCard);
    }

    isDifferenceValid(pixelClicked: Vec2, oneDifferenceSet: OneDifferenceImageSet): boolean {
        return oneDifferenceSet.difference.some((pixel: Vec2) => pixelClicked.x === pixel.x && pixelClicked.y === pixel.y);
    }

    async buildListOneDifferenceImages(): Promise<OneDifferenceImageSet[]> {
        const nextDifferences: OneDifferenceImageSet[] = [];
        for (const gameInfo of await this.cardInfoService.getAllCardInfos()) {
            nextDifferences.push(await this.buildOneDifferenceImage(gameInfo));
        }
        return nextDifferences;
    }

    async buildOneDifferenceImage(cardInfo: CardInfo): Promise<OneDifferenceImageSet> {
        const images: ImageSet = await this.imageService.getImageById(cardInfo.id);
        const difference = await this.getRandomDifference(cardInfo);
        return this.keepOnlyOneDifference(images, difference);
    }

    private async keepOnlyOneDifference(images: ImageSet, difference: Vec2[]): Promise<OneDifferenceImageSet> {
        // Load both left and right images from their URIs
        const leftImage = await Jimp.read(Buffer.from(images.leftUri.split(',')[1], 'base64'));
        const rightImage = await Jimp.read(Buffer.from(images.rightUri.split(',')[1], 'base64'));

        const leftImageClone = leftImage.clone();

        difference.forEach((pixel) => {
            // Get the color of the pixel from the right image
            const color = rightImage.getPixelColor(pixel.x, pixel.y);

            // Set this color to the corresponding pixel in the left image
            leftImageClone.setPixelColor(color, pixel.x, pixel.y);
        });

        // Convert the modified left image back to a base64 string
        const modifiedLeftUri = await leftImageClone.getBase64Async(Jimp.MIME_PNG);

        // Return the modified image
        return {
            cardId: images.cardId,
            leftUri: images.leftUri,
            rightUri: modifiedLeftUri,
            difference,
        };
    }

    private async getRandomDifference(cardInfo: CardInfo): Promise<Vec2[]> {
        const allDifferences = await DiffValidatorService.getAllDifferencesById(cardInfo.id);
        const randomIndex = Math.floor(Math.random() * allDifferences.length);
        const randomDifference = allDifferences[randomIndex];
        return DiffValidatorService.expandDifference(randomDifference, cardInfo.id);
    }
}
