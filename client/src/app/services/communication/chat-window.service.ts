import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ChatWindowService {
    currentChat: string = '';
    isChatManagerOpen = false;
    isChatWindowOpen = false;

    toggleManager() {
        this.isChatManagerOpen = !this.isChatManagerOpen;
    }

    toggleChatWindow() {
        this.isChatWindowOpen = !this.isChatWindowOpen;
    }

    updateCurrentChat(channelId: string) {
        if (channelId.length > 0) {
            this.currentChat = channelId;
        } else {
            this.currentChat = '';
        }
    }
}
