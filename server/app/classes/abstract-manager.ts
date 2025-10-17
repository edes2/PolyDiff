import { GameStatus } from '@app/interfaces/game-status';
import { DIFFERENCE_COUNT_ERROR, PlayerInGame, PlayerSocket } from '@app/interfaces/socket-services';
import { DiffValidatorService } from '@app/services/playing/diff-validator.service';
import { TimeService } from '@app/services/playing/time.service';
import { CardInfoService } from '@app/services/storage/card-info.service';
import { HistoryService } from '@app/services/storage/history.service';
import { ScoreService } from '@app/services/storage/score.service';
import { UserService } from '@app/services/storage/user.service';
import { SECONDS_IN_MINUTE, THREE_SECONDS_IN_MS } from '@common/constants/time';
import { ClientEvent, ServerEvent } from '@common/enums/socket-events';
import { Score } from '@common/interfaces/card-info';
import { DifferenceCount, PlayingInfo } from '@common/interfaces/game';
import { GameConfig } from '@common/interfaces/game-config';
import { GameHistory } from '@common/interfaces/history';
import { ClickValidation } from '@common/interfaces/socket-communication';
import { UUIDType } from '@common/interfaces/user';
import { Vec2 } from '@common/interfaces/vec2';
import EventEmitter from 'events';

// The last update is used in case of a draw. We want to make sure that the player who reached the score first wins.

export abstract class AbstractManager {
    gameStarted: boolean = false;
    gameEnded: boolean = false;
    gameStatus: GameStatus;
    isSolo: boolean = false;

    endEmitter: EventEmitter = new EventEmitter();

    protected ownerId: UUIDType;
    protected playersList: PlayerSocket[] = [];

    protected timeService: TimeService = new TimeService(this);
    protected diffValidatorService: DiffValidatorService = new DiffValidatorService();

    protected diffFoundCounter = new Map<UUIDType, DifferenceCount>();

    // eslint-disable-next-line max-params
    constructor(
        protected readonly historyService: HistoryService,
        protected readonly cardInfoService: CardInfoService,
        protected readonly scoreService: ScoreService,
        protected readonly userService: UserService,
    ) {}

    get owner(): PlayerSocket {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.playersList.find((player) => player.user.uid === this.ownerId)!;
    }

    get players(): PlayerSocket[] {
        return this.playersList;
    }

    get totalDiffCount(): number {
        return Array.from(this.diffFoundCounter.values()).reduce((acc, curr) => acc + curr.count, 0);
    }

    get config(): GameConfig {
        return this.gameStatus.config;
    }

    get playersWithDiffCount(): PlayerInGame[] {
        return this.players.map((player) => {
            return {
                user: player.user,
                diffCount: this.getDifferenceCount(player.user.uid).count,
            };
        });
    }

    get quitters(): UUIDType[] {
        return this.gameStatus.rageQuitters;
    }

    addPlayer(player: PlayerSocket) {
        const alreadyIn = this.playersList.find((p) => p.user.uid === player.user.uid);
        if (!alreadyIn) {
            this.playersList.push(player);
        }
    }

    async setOwnerInfo(player: PlayerSocket) {
        this.ownerId = player.user.uid;

        // Remove if already in the array
        this.playersList = this.playersList.filter((p) => p.user.uid !== this.ownerId);

        this.playersList.push(player);
    }

    async getCardName(cardId: string): Promise<string> {
        return (await this.cardInfoService.getCardInfoById(cardId)).name;
    }

    async sendAllDifferentPixels(socketId: string): Promise<void> {
        this.getUserInfo(socketId)?.socket.emit(ClientEvent.CheatMode, await this.diffValidatorService.getAllDifferences());
    }

    async sendRandomDifferentPixel(socketId: string): Promise<void> {
        const diffPositions = await this.diffValidatorService.getAllDifferences();
        const randomDiffPosition = diffPositions[Math.floor(Math.random() * diffPositions.length)];
        this.getUserInfo(socketId)?.socket.emit(ClientEvent.DrawHint, randomDiffPosition);
        setTimeout(() => {
            this.getUserInfo(socketId)?.socket.emit(ClientEvent.ClearHint, randomDiffPosition);
        }, THREE_SECONDS_IN_MS);
    }

    startTimer() {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        this.timeService.startTimer(this.config.duration, -1);
    }

    updateTimer(timeString: string) {
        this.broadcast(ClientEvent.Timer, timeString);
    }

    async validateClick(player: PlayerSocket, clickInfo: ClickValidation) {
        if (this.gameEnded) return;
        const difference = await this.diffValidatorService.validateClick(clickInfo.position);
        if (difference) {
            this.sendGoodClick(player, difference);
        } else {
            this.sendBadClick(player, clickInfo);
        }
        this.checkEndGame();
    }

    stopClicks() {
        this.broadcast(ClientEvent.StopClicks);
    }

    endGame() {
        this.stopGame();
        this.gameEnded = true;
        this.endEmitter.emit(ServerEvent.EndGame);
    }

    async saveGameHistory(): Promise<void> {
        const game = this.buildGameHistory();
        await this.historyService.addGameHistory(game);
        if (game.winnerId === null) return;
        if (game.playersId.length === 0) return;
        this.userService.addWin(game.winnerId as string);
        game.playersId
            .filter((playerId) => playerId !== game.winnerId)
            .forEach((id) => {
                this.userService.addLoss(id);
            });
    }

    // protected buildGameHistory(): GameHistory {
    //     return {
    //         date: this.historyService.currentDate,
    //         startingTime: this.timeService.getStartingTime(),
    //         duration: this.timeService.getDuration(),
    //         gameMode: this.config.mode,
    //         playersId: this.players.map((player) => player.user.uid),
    //         winnerId: this.getCurrentWinner()?.user.uid,
    //         rageQuittersId: this.gameStatus.rageQuitters,
    //         differenceCounts: Array.from(this.diffFoundCounter.entries()).map(([uid, diffCount]) => [uid, diffCount.count]),
    //     };
    // }

    async saveScore(winner: UUIDType, isSolo: boolean, cardId: string): Promise<number> {
        const gameDuration: string = this.timeService.getTimerStringValue();
        const seconds: number = this.convertTimeToSeconds(gameDuration);
        const newScore: Score = { playerId: winner, value: seconds };
        return await this.scoreService.getScorePosition(cardId, newScore, isSolo);
    }

    getOpponentsOf(uid: UUIDType): PlayerSocket[] {
        return this.playersList.filter((player) => player.user.uid !== uid);
    }

    isOwner(uid: UUIDType): boolean {
        return this.ownerId === uid;
    }

    getDifferenceCount(uid: UUIDType): DifferenceCount {
        return this.diffFoundCounter.get(uid) ?? { count: DIFFERENCE_COUNT_ERROR, lastUpdate: 0 };
    }

    protected setDefaultDiffFoundCount(): void {
        this.playersList.forEach((player) => {
            this.diffFoundCounter.set(player.user.uid, { count: 0, lastUpdate: 0 });
        });
    }

    protected sendGoodClick(player: PlayerSocket, difference: Vec2[]): void {
        this.broadcast(ClientEvent.DifferenceFoundClick, difference);
        this.incrementDiffFoundCount(player);
    }

    protected sendBadClick(player: PlayerSocket, clickInfo: ClickValidation): void {
        player.socket.emit(ClientEvent.ErrorClick, clickInfo);
    }

    protected stopGame() {
        this.timeService.stopTimer();
        this.stopClicks();
    }

    protected getUserInfo(socketId: string): PlayerSocket | undefined {
        return this.playersList.find((player) => player.socket.id === socketId);
    }

    protected incrementDiffFoundCount(player: PlayerSocket): void {
        const diffFoundCount = this.getDifferenceCount(player.user.uid).count + 1;
        this.diffFoundCounter.set(player.user.uid, { count: diffFoundCount, lastUpdate: Date.now() });
        this.broadcast(ClientEvent.UpdateDiffCount, Array.from(this.diffFoundCounter.entries()));
    }

    protected broadcast(event: string, data?: any): void {
        this.players.forEach((player) => {
            player.socket.emit(event, data);
        });
    }

    private convertTimeToSeconds(time: string): number {
        const [minutes, seconds] = time.split(':').map(Number);
        return minutes * SECONDS_IN_MINUTE + seconds;
    }

    abstract getPlayingInfo(): Promise<PlayingInfo>;
    abstract getCheat(): Promise<Vec2[]>;
    abstract startGame(): Promise<void>;
    abstract checkEndGame(): void;
    abstract playerLeft(player: PlayerSocket): void;
    protected abstract buildGameHistory(): GameHistory;
}
