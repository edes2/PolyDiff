import { PlayerSocket } from '@app/interfaces/socket-services';
import { OneDifferenceImagesService } from '@app/services/playing/one-difference.service';
import { TIMEOUT_EVENT } from '@app/services/playing/time.service';
import { ClientEvent, ServerEvent } from '@common/enums/socket-events';
import { EndGameInfo, PlayingInfo } from '@common/interfaces/game';
import { GameConfig } from '@common/interfaces/game-config';
import { GameHistory } from '@common/interfaces/history';
import { OneDifferenceImageSet } from '@common/interfaces/one-difference-set';
import { ClickValidation } from '@common/interfaces/socket-communication';
import { Vec2 } from '@common/interfaces/vec2';
import { Container } from 'typedi';
import { AbstractMultiManager } from './abtract-multi-manager';

/**
 * The LimitedTimeManager class manages the "Limited Time 1 Difference" mode.
 * It orchestrates the game flow, timing, and player interactions for this specific mode.
 *
 * Key Features:
 * - Supports 2 to 4 players.
 * - Presents pairs of images with only one difference to find.
 * - Increments a counter and adds time to a countdown timer upon correct identification.
 * - Ensures each image pair is unique throughout the game.
 * - Limits the maximum time on the countdown timer.
 * - Ends the game when the timer hits zero or no new images are available.
 *
 * Usage:
 * Instantiate at the start of the game mode to manage game progress, player responses, and time management.
 */
export class LimitedTimeManager extends AbstractMultiManager {
    private cardsId: string[] = [];
    private imagesSets: OneDifferenceImageSet[] = [];
    private currentImageIndex: number | null = null;

    get currentImageSet(): OneDifferenceImageSet | undefined {
        return this.currentImageIndex !== null ? this.imagesSets[this.currentImageIndex] : undefined;
    }

    override async startGame() {
        if (!this.playersList.length) throw new Error('No players in the game');

        this.setDefaultDiffFoundCount();

        this.isSolo = this.playersList.length === 1;

        const gameStartingInfo = { ownerId: this.owner.user.uid, mode: this.config.mode };
        this.broadcast(ClientEvent.GameStarted, gameStartingInfo);

        this.startTimer();
        this.broadcast(ClientEvent.StartOfGame);
        this.nextTurn();
    }

    async nextTurn() {
        const randomCardId = await this.getRandomUnusedCardId();
        if (!randomCardId) {
            await this.checkEndGame();
            return;
        }

        const imageSet = await this.buildOneDifferenceImageSet(randomCardId);

        this.addNewImageSet(imageSet);
        this.broadcast(ClientEvent.MoveNextSet, this.currentImageSet);
    }

    async getRandomUnusedCardId(): Promise<string | null> {
        const allCards = await this.cardInfoService.getAllCardInfos();
        const unusedCards = allCards.filter((card) => !this.cardsId.includes(card.id));
        if (!unusedCards.length) return null;
        return unusedCards[Math.floor(Math.random() * unusedCards.length)].id;
    }

    override async getPlayingInfo(): Promise<PlayingInfo> {
        return {
            roomId: this.gameStatus.roomId,
            ownerId: this.ownerId,
            mode: this.config.mode,
            players: this.playersWithDiffCount,
        };
    }

    setGameStatus(config: GameConfig, roomId: string) {
        this.gameStatus = {
            config,
            roomId,
            rageQuitters: [],
            diffCount: Infinity, // TEMP PATCH: Limited time has no difference count limit
        };
    }

    override startTimer() {
        this.timeService.setMaxTimerValue(this.config.duration);
        super.startTimer();

        this.timeService.timeoutSignal.on(TIMEOUT_EVENT, () => {
            this.checkEndGame();
        });
    }

    /*
     * Check if the game is ended and if so, end it.
     * The game is ended if:
     * - The time is out
     * - All the images have been sent
     */
    async checkEndGame() {
        const timeout = this.timeService.isTimeout();
        const emptyRoom = this.players.length === 0;
        if (emptyRoom || timeout || !(await this.isUnusedCardsStillAvailable())) {
            this.endGame();
        }
    }

    override async getCheat(): Promise<Vec2[]> {
        return this.config.cheatingAllowed && this.currentImageSet ? this.currentImageSet.difference : [];
    }

    async endGame() {
        super.endGame();

        const endGameInfo: EndGameInfo = { winner: null, isTimeout: this.timeService.isTimeout() };
        this.broadcast(ServerEvent.EndGame, endGameInfo);
        this.saveGameHistory();
    }

    async validateClick(player: PlayerSocket, clickInfo: ClickValidation) {
        if (this.gameEnded || !this.currentImageSet) return;
        const goodClick = this.isDifferenceValid(clickInfo.position);
        if (goodClick) {
            this.sendGoodClick(player, this.currentImageSet.difference);
            const bonus = this.config.timeBonus;
            if (bonus) this.timeService.incrementTimer(bonus);
            this.nextTurn();
        } else {
            this.sendBadClick(player, clickInfo);
        }
    }

    protected override buildGameHistory(): GameHistory {
        return {
            date: this.historyService.currentDate,
            startingTime: this.timeService.getStartingTime(),
            duration: this.timeService.getDuration(),
            gameMode: this.config.mode,
            playersId: this.players.map((player) => player.user.uid),
            winnerId: null,
            rageQuittersId: this.gameStatus.rageQuitters,
            differenceCounts: Array.from(this.diffFoundCounter.entries()).map(([uid, diffCount]) => [uid, diffCount.count]),
        };
    }

    private isDifferenceValid(pixelClicked: Vec2): boolean {
        const roundedPixelClicked: Vec2 = {
            x: Math.round(pixelClicked.x),
            y: Math.round(pixelClicked.y),
        };
        if (!this.currentImageSet) return false;
        const differencePixels = this.currentImageSet.difference;
        return differencePixels.some((pixel: Vec2) => roundedPixelClicked.x === pixel.x && roundedPixelClicked.y === pixel.y);
    }

    private addNewImageSet(imageSet: OneDifferenceImageSet) {
        this.cardsId.push(imageSet.cardId);
        this.imagesSets.push(imageSet);
        this.currentImageIndex = this.currentImageIndex === null ? 0 : this.currentImageIndex + 1;
    }

    private async buildOneDifferenceImageSet(cardId: string): Promise<OneDifferenceImageSet> {
        const cardInfo = await this.cardInfoService.getCardInfoById(cardId);
        const oneDifferenceService = Container.get(OneDifferenceImagesService);
        return oneDifferenceService.buildOneDifferenceImage(cardInfo);
    }

    /* Returns true if there are still unused cards available, false otherwise */
    private async isUnusedCardsStillAvailable(): Promise<boolean> {
        return (await this.getRandomUnusedCardId()) !== null;
    }
}
