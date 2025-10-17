/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MAX_CHAR_PER_MESSAGE } from '@app/constants/message';
import { AuthService } from '@app/services/authentification/auth.service';
import { ChatWindowService } from '@app/services/communication/chat-window.service';
import { ChatService } from '@app/services/communication/chat.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { EnrichedMessage, Message } from '@common/interfaces/socket-communication';
import { UUIDType } from '@common/interfaces/user';

@Component({
    selector: 'app-chat-window',
    templateUrl: './chat-window.component.html',
    styleUrls: ['./chat-window.component.scss'],
})
export class ChatWindowComponent implements OnChanges, OnInit {
    @Input() channelId: string;
    @Input() rightPosition: number;
    @Output() destroy = new EventEmitter<string>();
    isChatBubbleOpen = false;
    messages: EnrichedMessage[] = [];
    inputText: string = '';
    userUid: string;

    selectedChannel: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gifSearchResults: any[] = [];
    selectedGif: string | null = null;
    gifInputText: string = '';
    isGifPanelOpen = false;

    avatarUrls: { [userId: string]: string } = {};

    // eslint-disable-next-line max-params
    constructor(
        private authService: AuthService,
        public chatService: ChatService,
        private chatWindowService: ChatWindowService,
        private communicationService: CommunicationService,
    ) {}

    ngOnInit(): void {
        if (this.chatWindowService.isChatWindowOpen) {
            this.isChatBubbleOpen = true;
        }
    }
    // eslint-disable-next-line no-unused-vars
    async ngOnChanges(changes: SimpleChanges) {
        // RESET SOCKETS TO NOT RECEIVE MULTIPLE TIMES THE MESSAGES
        this.chatService.socket.removeAllListeners('receive_message');
        const token = this.authService.getUserInfo();
        if (!token) {
            // eslint-disable-next-line no-console
            console.log('Error, no token!');
            return;
        }
        this.userUid = token.uid;
        // GET THE CHAT HISTORY FOR THIS SPECIFIC CHAT
        if (this.channelId === 'General') {
            this.messages = await this.chatService.getGeneralChatHistory();
        } else if (this.channelId.startsWith('PrivateChat: ')) {
            this.messages = await this.chatService.getPrivateChatHistory(this.channelId);
        } else {
            this.messages = await this.chatService.getGlobalChatHistory(this.channelId);
        }

        this.messages.forEach((message) => {
            this.fetchAndSetAvatarUrl(message.emitterId);
        });

        // JOIN THE CHAT SOCKET
        this.chatService.socket.on('receive_message', (data) => {
            if (data['chatId'] === this.channelId) {
                const message: EnrichedMessage = data['message'];
                this.messages.push(message);
                if (!this.avatarUrls[message.emitterId]) {
                    this.fetchAndSetAvatarUrl(message.emitterId);
                }
            }
        });
    }

    fetchAndSetAvatarUrl(uid: string) {
        if (!this.avatarUrls[uid]) {
            // Only fetch if not already fetched
            this.getAvatarUrl(uid)
                .then((url) => {
                    this.avatarUrls[uid] = url;
                })
                .catch((error) => {
                    // eslint-disable-next-line no-console
                    console.error(`Failed to fetch avatar for user ${uid}`, error);
                });
        }
    }

    getTimestamp(message: EnrichedMessage): string {
        if (!message.timestamp) return '';
        // return in format: 5 Jan HH:MM AM/PM
        const date = new Date(message.timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour = hours % 12 || 12;
        const minutesString = minutes < 10 ? '0' + minutes : minutes;
        return `${day} ${this.monthToString(month)} ${year} ${hour}:${minutesString} ${ampm}`;
    }

    monthToString(month: number): string {
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][month];
    }

    async getAvatarUrl(uid: string): Promise<string> {
        return new Promise((resolve, rejects) => {
            this.communicationService.avatarGet(uid).subscribe((result) => {
                if (result === '') {
                    rejects('No avatar found');
                }
                resolve(result);
            });
        });
    }

    searchGifs(query: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.communicationService.searchGifs(query).subscribe((response: any) => {
            this.gifSearchResults = response.data;
        });
    }

    toggleGifPanel() {
        this.isGifPanelOpen = !this.isGifPanelOpen;
    }

    sendGif(gif: any) {
        this.selectedGif = gif.images.original.url;
        if (this.selectedGif) {
            const messageObject: Message = {
                content: this.selectedGif,
                emitterId: this.userUid,
                type: 'gif',
            };
            this.chatService.socket.emit('send_message', { message: messageObject, chatId: this.channelId });
            this.selectedGif = null; // Reset selected GIF
            this.gifInputText = '';
            this.gifSearchResults = [];
        }
    }

    isSelf(uid: UUIDType) {
        return uid === this.userUid;
    }

    isGifMessage(message: EnrichedMessage): boolean {
        return message.type === 'gif' || message.content.startsWith('data:image/gif;base64');
    }

    isImageMessage(message: EnrichedMessage): boolean {
        return message.type === 'image' || message.content.startsWith('data:image/png;base64');
    }

    isPlainMessage(message: EnrichedMessage): boolean {
        return !this.isGifMessage(message) && !this.isImageMessage(message);
    }

    // FOR HTML
    openChatBubble() {
        this.isChatBubbleOpen = !this.isChatBubbleOpen;
        this.chatWindowService.toggleChatWindow();
    }

    // FOR HTML, WHEN SENDING A MESSAGE
    sendButton(): void {
        if (this.isValidChatMessage(this.inputText)) {
            this.sendChatMessage(this.inputText);
        }
        this.inputText = '';
    }

    // SENDING A MESSAGE THROUGH SOCKET
    sendChatMessage(message: string): void {
        const userinfo = this.authService.getUserInfo();
        if (userinfo?.uid) {
            const messageObject: Message = {
                content: message,
                emitterId: userinfo.uid,
            };
            this.chatService.socket.emit('send_message', { message: messageObject, chatId: this.channelId });
        }
    }

    // VERIFY CHAT ENTRY
    private isValidChatMessage(inputText: string): boolean {
        // eslint-disable-next-line no-useless-escape, no-control-regex
        const invsibileCharsRegExp = /[\x00-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202E]/;
        return !invsibileCharsRegExp.test(inputText) && /\S/.test(inputText) && inputText.length <= MAX_CHAR_PER_MESSAGE;
    }
}
