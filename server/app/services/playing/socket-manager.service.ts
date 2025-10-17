/* eslint-disable max-lines */
import { AbstractManager } from '@app/classes/abstract-manager';
import { ClassicManager } from '@app/classes/classic-manager';
import { LimitedTimeManager } from '@app/classes/limited-time-manager';
import { PlayerSocket } from '@app/interfaces/socket-services';
import { tokenToUserInfo } from '@app/middleware/auth.middleware';
import { AuthService } from '@app/services/auth/auth.service';
import { CardInfoService } from '@app/services/storage/card-info.service';
import { HistoryService } from '@app/services/storage/history.service';
import { ScoreService } from '@app/services/storage/score.service';
import { UserService } from '@app/services/storage/user.service';
import { GameMode, MAX_PLAYERS_PER_GAME } from '@common/enums/mode';
import { ClientEvent, ServerEvent } from '@common/enums/socket-events';
import { CardInfo } from '@common/interfaces/card-info';
import { PlayingInfo } from '@common/interfaces/game';
import { GameConfig } from '@common/interfaces/game-config';
import { ClickValidation } from '@common/interfaces/socket-communication';
import { PublicUserAccount, UUIDType, UserAccount } from '@common/interfaces/user';
import { WaitingRoom, WaitingRoomDTO } from '@common/interfaces/waiting-room';
import { Server, Socket } from 'socket.io';
import { Container, Service } from 'typedi';

@Service()
export class SocketManagerService {
    private sio: Server;
    private clients = new Map<UUIDType, AbstractManager>(); // <OWNER UUID, Game Manager>
    private waitingRooms: WaitingRoom[] = [];
    private allGamesServices: [HistoryService, CardInfoService, ScoreService, UserService];

    constructor(private cardInfoService: CardInfoService, private authService: AuthService, private userService: UserService) {
        this.allGamesServices = [Container.get(HistoryService), this.cardInfoService, Container.get(ScoreService), this.userService];
        // UNCOMMENT TO DEBUG MEMORY LEAKS
        // setInterval(() => {
        //     console.log('there are', this.waitingRooms.length, 'waiting rooms');
        //     console.log('there are', this.clients.size, 'clients');
        //     console.log('nb of unique games', new Set(this.clients.values()).size);
        // }, 30000);
    }

    getManager(uid: UUIDType): AbstractManager | undefined {
        return this.clients.get(uid);
    }

    initialize(server: any) {
        this.sio = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
    }

    getClassicWaitingRooms(): WaitingRoom[] {
        return this.waitingRooms.filter((room) => room.mode === GameMode.Classic);
    }

    getWaitingRoomsForClients(): WaitingRoomDTO[] {
        return this.waitingRooms.map((room) => {
            return {
                cardId: room.cardId,
                roomId: room.roomId,
                players: this.playersToPublicAccounts(room.players),
                ownerId: room.owner,
                mode: room.mode,
            };
        });
    }

    handleSockets(): void {
        this.sio.on(ServerEvent.Connection, (socket: Socket) => {
            socket.on(ServerEvent.Authentification, async (token: string) => {
                let success = true;
                try {
                    const userInfo: UserAccount = await tokenToUserInfo(token);
                    if (this.authService.isNewSession(userInfo.uid)) {
                        this.authService.addNewUserSession(userInfo.uid);
                        this.handleProtectedSockets(socket, userInfo);
                    } else {
                        success = false;
                    }
                } catch (error) {
                    success = false;
                }

                socket.emit(ClientEvent.AuthentificationComplete, success);
                if (!success) {
                    socket.disconnect();
                }
            });
        });
    }

    async createCard(cardInfo: CardInfo): Promise<void> {
        this.sio.sockets.emit(ClientEvent.CardCreated, cardInfo);
        this.broadcastCardsUpdate();
    }

    async deleteCard(cardId: string): Promise<void> {
        await this.cardInfoService.deleteCard(cardId);
        this.waitingRooms.forEach((room) => {
            if (room.mode !== GameMode.LimitedTime && room.cardId === cardId) {
                this.broadcast(ServerEvent.RoomCanceled, room.roomId);
                this.destroyWaitingRoom(room.roomId);
            }
        });
        this.sio.sockets.emit(ClientEvent.CardDeleted, cardId);
        this.broadcastCardsUpdate();
    }

    async getPlayingInfo(ownerId: UUIDType): Promise<PlayingInfo | undefined> {
        const manager = this.getManager(ownerId);
        if (!manager) return;
        return manager.getPlayingInfo();
    }

    async broadcastCardsUpdate() {
        this.sio.sockets.emit(ServerEvent.CardsUpdated, await this.cardInfoService.getAllCardInfos());
    }

    private handleProtectedSockets(socket: Socket, user: UserAccount): void {
        const player = { user, socket } as PlayerSocket;

        this.userService.addConnection(user.uid);

        // socket.on(ServerEvent.StartSoloGame, async (playingInfo: PlayingInfo) => {
        //     // await this.startSoloGame(player, playingInfo);
        // });

        socket.on(
            ServerEvent.StartGameCreation,
            async (config: GameConfig, callback: (data: { players: PublicUserAccount[]; roomId: string }) => void) => {
                console.log('received a start game creation');
                console.log(user);
                await this.registerWaitingOwner(player, config);
                const waitingRoom = this.findWaitingRoom(player.user.uid);
                if (!waitingRoom) return;
                const players = this.playersToPublicAccounts(waitingRoom.players);
                callback({ players, roomId: waitingRoom.roomId });
            },
        );

        socket.on(ServerEvent.JoinMultiGame, async (ownerId: UUIDType, callback: (data: { success: boolean; roomId?: string }) => void) => {
            // TODO: handle the case where the users leaves the waiting room and joins back again.
            try {
                const waitingRoom = this.findWaitingRoom(ownerId);
                if (!waitingRoom) throw new Error('No waiting room found');
                this.joinRoom(player, ownerId);
                callback({ success: true, roomId: waitingRoom.roomId });
                this.broadcastRoomPlayers(waitingRoom);
                this.broadcastWaitingRooms();
            } catch (error) {
                callback({ success: false });
            }
        });

        socket.on(ServerEvent.KickPlayer, async (data) => {
            const waitingRoom = this.findWaitingRoom(data.ownerId);
            const dataToSend = { playerId: data.playerId, ownerId: data.ownerId };
            this.sio.emit(ServerEvent.KickPlayer, dataToSend);
            if (!waitingRoom) return;
            this.removePlayerFromRoom(waitingRoom, data.playerId);
            this.broadcastRoomPlayers(waitingRoom);
            this.broadcastWaitingRooms();
        });

        socket.on(ServerEvent.QuitWaitingRoom, async (data) => {
            const waitingRoom = this.findWaitingRoom(data.ownerId);
            if (!waitingRoom) return;
            this.removePlayerFromRoom(waitingRoom, data.playerId);
            this.broadcastRoomPlayers(waitingRoom);
            this.broadcastWaitingRooms();
        });

        socket.on(ServerEvent.DeleteWaitingRoom, async (data) => {
            const ownerId = data.ownerId;
            const waitingRoom = this.findWaitingRoom(ownerId);
            if (!waitingRoom) return;
            this.sio.emit(ServerEvent.RoomCanceled, waitingRoom.roomId);
            this.destroyGame(waitingRoom.owner);
            this.destroyWaitingRoom(waitingRoom.roomId);
            this.broadcastWaitingRooms();
        });

        socket.on(ServerEvent.StartMultiGame, async () => {
            this.startMultiGame(player);
        });

        socket.on(ServerEvent.MouseClick, async (clickInfo: ClickValidation) => {
            console.log('[SERVER] click received at position x: ', clickInfo.position.x, ' y: ', clickInfo.position.y);
            const manager = this.getManager(player.user.uid);
            if (!manager) return;
            manager.validateClick(player, clickInfo);
        });

        socket.on(ServerEvent.AbandonGame, () => {
            this.getManager(player.user.uid)?.playerLeft(player);
            this.removeClient(player);
        });

        socket.on(ServerEvent.Disconnect, () => {
            this.authService.removeUserSession(user.uid);
            this.userService.addDisconnection(user.uid);
            this.removeUserFromWaitingRooms(user.uid);
            this.removeUserFromGames(user.uid);
            this.removeClient(player);
        });
    }

    private removeUserFromWaitingRooms(uid: UUIDType) {
        let waitingRoom = this.findWaitingRoom(uid);
        do {
            if (waitingRoom) this.removePlayerFromRoom(waitingRoom, uid);
            waitingRoom = this.findWaitingRoom(uid);
        } while (waitingRoom);
    }

    private removeUserFromGames(uid: UUIDType) {
        const manager = this.getManager(uid);
        const player = manager?.players.find((p) => p.user.uid === uid);
        if (!manager || !player) return;
        manager.playerLeft(player);
    }

    // TODO: Refactor this method to handle the "solo" mode creation in a better way, without
    // hardcoding the game mode to multi before changing it to solo in the manager
    private async registerWaitingOwner(player: PlayerSocket, config: GameConfig) {
        const room = this.initGameCreation(player, config.mode, config.cardId);
        const isClassic = config.mode === GameMode.Classic;
        const manager = isClassic ? new ClassicManager(...this.allGamesServices) : new LimitedTimeManager(...this.allGamesServices);
        manager.endEmitter.on(ServerEvent.EndGame, async () => this.destroyGame(room.owner));
        await manager.setOwnerInfo(player);
        await manager.setGameStatus(config, room.roomId);
        this.clients.set(player.user.uid, manager);
    }

    private initGameCreation(owner: PlayerSocket, mode: GameMode, cardId?: string): WaitingRoom {
        const players = [owner];
        const room: WaitingRoom = {
            owner: owner.user.uid,
            players,
            roomId: this.generateUniqueRoomId(),
            cardId,
            mode,
        };

        this.waitingRooms.push(room);
        this.broadcastWaitingRooms();
        return room;
    }

    private removePlayerFromRoom(room: WaitingRoom, playerId: string) {
        room.players = room.players.filter((player) => player.user.uid !== playerId);
        if (room.players.length === 0) {
            this.destroyWaitingRoom(room.roomId);
            this.destroyGame(room.owner);
        }
        this.broadcastRoomPlayers(room);
    }

    private broadcastRoomPlayers(room: WaitingRoom) {
        const publicPlayers = this.playersToPublicAccounts(room.players);
        room.players.forEach((player) => {
            player.socket.emit(ClientEvent.UpdateRoomPlayers + room.owner, publicPlayers);
        });
    }
    private async joinRoom(player: PlayerSocket, ownerId: UUIDType) {
        const isAlreadyInRoom = this.findWaitingRoom(player.user.uid);
        if (isAlreadyInRoom) this.removePlayerFromRoom(isAlreadyInRoom, player.user.uid);

        const waitingRoom = this.findWaitingRoom(ownerId);
        if (waitingRoom && waitingRoom.players.length < MAX_PLAYERS_PER_GAME) {
            const alreadyInRoom = waitingRoom.players.find((p: PlayerSocket) => p.user.uid === player.user.uid);
            if (!alreadyInRoom) waitingRoom.players.push(player);
        }
    }

    private async startMultiGame(owner: PlayerSocket) {
        const gameManager = this.getManager(owner.user.uid);
        const waitingRoom = this.findWaitingRoom(owner.user.uid);
        if (!gameManager || !waitingRoom) return;

        gameManager.gameStarted = true;

        waitingRoom.players.forEach((player) => {
            gameManager.addPlayer(player);
            this.clients.set(player.user.uid, gameManager);
        });

        await gameManager.startGame();
        this.destroyWaitingRoom(waitingRoom.roomId);
    }

    private removeClient(player: PlayerSocket) {
        this.clients.delete(player.user.uid);
    }

    private async destroyWaitingRoom(roomId: string): Promise<void> {
        this.waitingRooms = this.waitingRooms.filter((game) => game.roomId !== roomId);
        this.broadcastWaitingRooms();
    }

    private async destroyGame(ownerId: string): Promise<void> {
        const manager = this.getManager(ownerId);
        if (!manager) return;
        const playersUid = manager.players.map((p) => p.user.uid).concat(manager.quitters);
        for (const playerUid of playersUid) {
            this.clients.delete(playerUid);
        }
    }

    private findWaitingRoom(playerId: UUIDType): WaitingRoom | undefined {
        const result = this.waitingRooms.find((game) => game.players.some((p) => p.user.uid === playerId));
        return result;
    }

    private broadcastWaitingRooms() {
        this.sio.sockets.emit(ClientEvent.UpdateWaitingRooms, this.getWaitingRoomsForClients());
    }

    private generateUniqueRoomId(): string {
        return Date.now().toString();
    }

    private playersToPublicAccounts(players: PlayerSocket[]): PublicUserAccount[] {
        return players.map((player) => {
            return {
                uid: player.user.uid,
                username: player.user.username,
            };
        });
    }

    private broadcast(event: string, data: any) {
        this.sio.sockets.emit(event, data);
    }
}
