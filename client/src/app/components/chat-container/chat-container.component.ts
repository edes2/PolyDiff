import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChatWindowService } from '@app/services/communication/chat-window.service';
import { ChatService } from '@app/services/communication/chat.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { UUIDType } from '@common/interfaces/user';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chat-container',
    templateUrl: './chat-container.component.html',
    styleUrls: ['./chat-container.component.scss'],
})
export class ChatContainerComponent implements OnInit {
    @ViewChild('popoutWindow1') popoutWindowRef: ElementRef;

    searchQuery: string = '';
    newChatName: string = '';
    userID: string = '';
    openedChat: string = '';
    isChatManagerOpen = false;
    isPoppedOut = false;
    displayMessage: string = '';

    private userInfoSubscription: Subscription;

    // eslint-disable-next-line max-params
    constructor(
        public communicationService: CommunicationService,
        public chatService: ChatService,
        private authService: AuthService,
        private chatWindowService: ChatWindowService,
    ) {}

    ngOnInit(): void {
        const userInfo = this.authService.getUserInfo();
        if (!userInfo) {
            this.userInfoSubscription = this.authService.userInfo$.subscribe((user) => {
                if (user) {
                    this.initialize(user.uid);
                    this.userInfoSubscription.unsubscribe();
                }
            });
        } else {
            this.initialize(userInfo.uid);
        }
    }

    initialize(uid: UUIDType) {
        this.userID = uid;
        this.communicationService.getGlobalChannels().subscribe((data) => {
            this.chatService.channels = data;
            this.chatService.filteredChats = this.chatService.channels;
        });

        this.communicationService.getJoinedChannels(this.userID).subscribe((data: string[]) => {
            this.chatService.joinedChannels = data;
            // if (data === undefined || data.length === 0) {
            //     return;
            // }
            for (const channel of this.chatService.joinedChannels) {
                // ENTERING SOCKET FOR EACH ALREADY-JOINED CHANNEL
                this.enterChatSocket(channel);
            }
            if (!this.chatService.joinedChannels.includes('General')) {
                this.joinNewChat('General');
            }
        });

        if (this.chatWindowService.isChatManagerOpen) {
            this.isChatManagerOpen = true;
        }

        if (this.chatWindowService.currentChat.length > 0) {
            this.chatService.openedChat = this.chatWindowService.currentChat;
        }

        this.setupSockets();
    }

    setupSockets() {
        this.chatService.socket.off('deleted_channel');
        this.chatService.socket.off('channel_created');
        // REMOVING CHANNEL WHEN IT HAS BEEN DELETED
        this.chatService.socket.on('deleted_channel', (channelId: string) => {
            this.leaveChat(channelId);
            this.chatService.joinedChannels = this.chatService.joinedChannels.filter((item) => item !== channelId);
            this.chatService.channels = this.chatService.channels.filter((item) => item !== channelId);
            this.chatService.filteredChats = this.chatService.channels;
        });
        // ADDING CHANNEL WHEN CREATED
        this.chatService.socket.on('channel_created', (channelId: string) => {
            this.searchQuery = '';
            this.newChatName = '';
            this.chatService.channels.push(channelId);
            this.chatService.filteredChats = this.chatService.channels;
        });
    }

    // DISCONNECTING FROM SOCKET AND REMOVING CHANNEL FROM JOINEDCHANNELS LIST WHEN LEAVING CHAT
    leaveChat(chatId: string): void {
        this.chatService.leaveChannel(this.userID, chatId);
        this.chatService.joinedChannels = this.chatService.joinedChannels.filter((item) => item !== chatId);
        if (chatId === this.chatService.openedChat) {
            this.chatService.openedChat = '';
            this.chatWindowService.toggleChatWindow();
            this.chatWindowService.currentChat = this.chatService.openedChat;
        }
    }

    // JOINING SOCKET ROOM
    enterChatSocket(channelId: string): void {
        this.chatService.joinChannel(this.userID, channelId);
    }

    // JOINING SOCKET ROOM AND PUSHING CHANNEL TO JOINEDCHANNELS LIST
    joinNewChat(channelId: string): void {
        this.chatService.joinNewChannel(this.userID, channelId);
        this.chatService.joinedChannels.push(channelId);
    }

    filterChats() {
        this.chatService.filteredChats = this.chatService.channels.filter((channel) =>
            channel.toLowerCase().includes(this.searchQuery.toLowerCase()),
        );
    }

    // CHAT CREATION USING SOCKET TO NOTIFY ALL USERS.
    createChat() {
        if (!this.verifyWhitespaces(this.newChatName)) {
            this.displayMessage = "Il ne peut pas y avoir d'espaces dans le nom du canal.";
            return;
        }
        if (this.newChatName.length === 0) {
            this.displayMessage = 'Il faut rentrer un nom pour le canal.';
            return;
        }
        if (this.chatService.channels.includes(this.newChatName) || this.newChatName === 'General') {
            this.displayMessage = 'Ce nom de canal est déjà utilisé.';
            return;
        }
        this.chatService.socket.emit('newChat', this.newChatName);
        this.displayMessage = '';
    }

    // CHAT DELETION WITH SOCKET
    deleteChat(channelId: string) {
        this.chatService.deleteGlobalChannel(this.userID, channelId);
        if (channelId === this.chatService.openedChat) {
            this.chatService.openedChat = '';
            this.chatWindowService.toggleChatWindow();
            this.chatWindowService.currentChat = this.chatService.openedChat;
        }
    }

    // FOR HTML
    toggleChat(channel: string): void {
        if (this.chatService.joinedChannels.includes(channel)) {
            this.leaveChat(channel);
        } else {
            this.joinNewChat(channel);
        }
    }

    // FOR HTML
    openCloseChat(channelId: string) {
        if (this.chatService.openedChat === channelId) {
            this.chatService.openedChat = '';
        } else {
            this.chatService.openedChat = channelId;
        }
        this.chatWindowService.currentChat = this.chatService.openedChat;
    }

    // FOR HTML
    openChatManager() {
        this.isChatManagerOpen = !this.isChatManagerOpen;
        this.chatWindowService.toggleManager();
    }

    private verifyWhitespaces(inputText: string): boolean {
        // eslint-disable-next-line no-useless-escape, no-control-regex
        const invsibileCharsRegExp = /[\x00-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202E]/;
        return !invsibileCharsRegExp.test(inputText) && !/\s/.test(inputText);
    }
}
