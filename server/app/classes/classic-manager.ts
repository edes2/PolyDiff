import { PlayerSocket } from '@app/interfaces/socket-services';
import { TIMEOUT_EVENT } from '@app/services/playing/time.service';
import { ClientEvent, ServerEvent } from '@common/enums/socket-events';
import { EndGameInfo, PlayingInfo } from '@common/interfaces/game';
import { GameConfig, GameConfigClassic } from '@common/interfaces/game-config';
import { convertToPublicUserAccount } from '@common/interfaces/user';
import { Vec2 } from '@common/interfaces/vec2';
import { AbstractMultiManager } from './abtract-multi-manager';

export class ClassicManager extends AbstractMultiManager {
    /**
     * Start the game by sending the gameStarted event to all players, setting the difference
     * image and starting the timer.
     *
     * Note: This method assumes that all players are ready and pushed to the playersList.
     */
    override get config(): GameConfigClassic {
        return this.gameStatus.config as GameConfigClassic;
    }

    async setGameStatus(config: GameConfig, roomId: string): Promise<void> {
        const classicConfig = config as GameConfigClassic;
        const diffCount = (await this.cardInfoService.getCardInfoById(classicConfig.cardId)).diffCount;
        this.gameStatus = {
            config,
            diffCount,
            roomId,
            rageQuitters: [],
        };
    }

    async getPlayingInfo(): Promise<PlayingInfo> {
        const cardId = this.config.cardId;
        const cardInfo = await this.cardInfoService.getCardInfoById(cardId);

        const playersInGame = this.players.map((player) => {
            return {
                user: player.user,
                diffCount: this.getDifferenceCount(player.user.uid).count,
            };
        });

        return {
            cardInfo,
            roomId: this.gameStatus.roomId,
            ownerId: this.ownerId,
            players: playersInGame,
            mode: this.config.mode,
        };
    }

    override async startGame() {
        if (!this.playersList.length) throw new Error('No players in the game');

        this.isSolo = this.playersList.length === 1;

        const gameStartingInfo = { ownerId: this.owner.user.uid, mode: this.config.mode };
        this.broadcast(ClientEvent.GameStarted, gameStartingInfo);
        this.setDefaultDiffFoundCount();

        await this.setDifferenceImage();
        this.startTimer();
        this.broadcast(ClientEvent.StartOfGame);
    }

    override startTimer() {
        super.startTimer();

        this.timeService.timeoutSignal.on(TIMEOUT_EVENT, () => {
            this.checkEndGame();
        });
    }

    override async getCheat(): Promise<Vec2[]> {
        if (this.config.cheatingAllowed) {
            const cheat = this.diffValidatorService.getAllDifferences();
            return cheat;
        } else {
            return [];
        }
    }

    /*
     * Check if the game is ended and if so, end it.
     * The game is ended if:
     * - The time is out
     * - A player is unbeatable
     */
    checkEndGame(): void {
        const emptyGame = this.players.length === 0;
        const kingOfTheHill = !this.isSolo && this.players.length === 1;
        const maxDiffFound = this.totalDiffCount === this.gameStatus.diffCount;
        const timeout = this.timeService.isTimeout();
        const isUnbeatable = !this.isSolo && this.players.some((player) => this.isUnbeatable(player));
        if (emptyGame || kingOfTheHill || maxDiffFound || timeout || isUnbeatable) {
            this.endGame();
        }
    }

    async endGame() {
        super.endGame();

        const winner = this.getCurrentWinner();

        this.saveGameHistory();

        const endGameInfo: EndGameInfo = { winner: winner ? convertToPublicUserAccount(winner.user) : null };
        this.broadcast(ServerEvent.EndGame, endGameInfo);

        if (winner) {
            this.saveScore(winner.user.uid, false, this.config.cardId);
        }
    }

    private isUnbeatable(player: PlayerSocket): boolean {
        const diffCount = this.diffFoundCounter.get(player.user.uid)?.count;
        if (!diffCount) return false;

        const differencesLeft = this.gameStatus.diffCount - this.totalDiffCount;

        let isUnbeatable = true;

        this.players.forEach((p) => {
            if (p.user.uid !== player.user.uid) {
                const otherPlayerDiffFoundCount = this.getDifferenceCount(p.user.uid).count;
                const otherPotentialMax = otherPlayerDiffFoundCount + differencesLeft;
                if (otherPotentialMax >= diffCount) {
                    isUnbeatable = false;
                }
            }
        });

        return isUnbeatable;
    }

    private async setDifferenceImage(): Promise<void> {
        await this.diffValidatorService.setDifferenceImage(this.config.cardId);
    }
}
