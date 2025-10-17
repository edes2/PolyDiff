import { Injectable } from '@angular/core';
import { EnrichedMessage } from '@common/interfaces/socket-communication';
import { Socket, io } from 'socket.io-client';
import { CommunicationService } from 'src/app/services/communication/communication.service';
import { environment } from 'src/environments/environment';
import { ChatWindowService } from './chat-window.service';
@Injectable({
    providedIn: 'root',
})
export class ChatService {
    channels: string[] = [];
    joinedChannels: string[] = [];
    filteredChats: string[] = [];
    openedChat: string = '';
    messages: EnrichedMessage[] = [];
    socket: Socket;
    currentPrivateChat: string | undefined;

    constructor(private readonly communicationService: CommunicationService, private chatWindowService: ChatWindowService) {
        this.connect();
    }

    connect() {
        // TODO: server url in env
        this.socket = io(environment.fastApiServerUrl.replace('/api', ''), {
            path: '/ws',
            transports: ['websocket'],
            upgrade: false,
            autoConnect: false,
        });
        this.socket.connect();
        this.setupSockets();
    }

    async getGlobalChatHistory(chatId: string): Promise<EnrichedMessage[]> {
        return new Promise((resolve) => {
            this.communicationService.getGlobalChat(chatId).subscribe((data) => {
                resolve(data);
            });
        });
    }

    async getPrivateChatHistory(chatId: string): Promise<EnrichedMessage[]> {
        return new Promise((resolve) => {
            this.communicationService.getPrivateChat(chatId).subscribe((data) => {
                resolve(data);
            });
        });
    }

    async getGeneralChatHistory(): Promise<EnrichedMessage[]> {
        return new Promise((resolve) => {
            this.communicationService.getGeneralChat().subscribe((data) => {
                resolve(data);
            });
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setupSockets() {}

    deletePrivateChannel(channel: string) {
        this.socket.emit('deleteChannel', { channelId: 'PrivateChat: ' + channel });
    }

    joinPrivateChannel(uid: string, channel: string) {
        this.openedChat = 'PrivateChat: ' + channel;
        this.joinChannel(uid, 'PrivateChat: ' + channel);
    }

    getGlobalChannels() {
        // HTTP GET REQUEST, on reçoit tous les canaux crées
        // Il y a une methode dans communication service
    }

    // eslint-disable-next-line no-unused-vars
    createPrivateChannel(usernames: string[]) {
        // Channel pour les parties, waiting room et canaux d'amis.
    }

    joinNewChannel(userId: string, channelId: string) {
        // Utilisé pour les globalChat, waiting room et canaux d'amis.
        this.socket.emit('joinNewChannel', { channelId, userId });
    }

    joinChannel(userId: string, channelId: string) {
        // Utilisé pour les globalChat, waiting room et canaux d'amis.
        this.socket.emit('joinChannel', { channelId, userId });
    }

    leaveChannel(userId: string, channelId: string) {
        this.socket.emit('leaveChannel', { userId, channelId });
    }

    deleteGlobalChannel(userId: string, channelId: string) {
        this.socket.emit('deleteChannel', { channelId, userId });
    }

    leavePrivateChannel(uid: string, channel: string) {
        this.leaveChannel(uid, channel);
        this.openedChat = '';
        this.chatWindowService.toggleChatWindow();
        this.chatWindowService.currentChat = this.openedChat;
    }

    hidePrivateChannelBox() {
        this.currentPrivateChat = undefined;
    }

    addPrivateChannel(privateChannelId: string) {
        const chatName = 'PrivateChat: ' + privateChannelId;
        this.currentPrivateChat = chatName;
    }
}
