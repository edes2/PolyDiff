import { PlayerSocket } from '@app/interfaces/socket-services';
import { GameMode } from '@common/enums/mode';
import { ServerEvent } from '@common/enums/socket-events';
import { GameHistory } from '@common/interfaces/history';
import { AbstractManager } from './abstract-manager';

export abstract class AbstractMultiManager extends AbstractManager {
    startTimer(): void {
        super.startTimer();
    }

    endGame(): void {
        super.endGame();
    }

    override playerLeft(player: PlayerSocket) {
        this.playersList.splice(this.playersList.indexOf(player), 1);
        this.gameStatus.rageQuitters.push(player.user.uid);

        const noMorePlayers = this.playersList.length === 0;
        const classicKingOfTheHill = this.playersList.length === 1 && this.config.mode === GameMode.Classic;

        if (noMorePlayers || classicKingOfTheHill) {
            this.checkEndGame();
        } else {
            this.broadcast(ServerEvent.PlayerLeft, player.user.uid);
        }
    }

    /*
     * Return the player with the most difference found
     * If there is a tie, return the first player with the most difference found
     */
    protected getCurrentWinner(): PlayerSocket | null {
        // Discard rage quitters from the winner selection
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const eligiblePlayers = this.players.filter((player) => !this.gameStatus.rageQuitters.includes(player.user.uid));

        if (eligiblePlayers.length === 1) return eligiblePlayers[0];

        const hasNoWinner = eligiblePlayers.every((player) => this.getDifferenceCount(player.user.uid).count === 0);

        if (hasNoWinner) return null;

        const winner = eligiblePlayers.reduce((currentWinner, player) => {
            const currentWinnerDiffCount = this.getDifferenceCount(currentWinner.user.uid);
            const playerDiffCount = this.getDifferenceCount(player.user.uid);

            if (currentWinnerDiffCount.count === playerDiffCount.count) {
                return currentWinnerDiffCount.lastUpdate < playerDiffCount.lastUpdate ? currentWinner : player;
            } else {
                return currentWinnerDiffCount.count > playerDiffCount.count ? currentWinner : player;
            }
        }, this.players[0]);

        return winner;
    }

    protected buildGameHistory(): GameHistory {
        return {
            date: this.historyService.currentDate,
            startingTime: this.timeService.getStartingTime(),
            duration: this.timeService.getDuration(),
            gameMode: this.config.mode,
            playersId: this.players.map((player) => player.user.uid),
            winnerId: this.getCurrentWinner()?.user.uid,
            rageQuittersId: this.gameStatus.rageQuitters,
            differenceCounts: Array.from(this.diffFoundCounter.entries()).map(([uid, diffCount]) => [uid, diffCount.count]),
        };
    }
}
