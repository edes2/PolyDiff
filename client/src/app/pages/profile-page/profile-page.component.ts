/* eslint-disable max-lines */
/* eslint-disable max-len */
import { Component, OnInit } from '@angular/core';
import { AuthService } from '@app/services/authentification/auth.service';
import { CommunicationService } from '@app/services/communication/communication.service';
import { ImageVerificationService } from '@app/services/creating/image-verification.service';
import { GameMode } from '@common/enums/mode';
import { EnrichedGameHistory } from '@common/interfaces/history';
import { UserAccount } from '@common/interfaces/user';

@Component({
    selector: 'app-profile-page',
    templateUrl: './profile-page.component.html',
    styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
    info: UserAccount;
    history: EnrichedGameHistory[] = [];
    displayMessage: string = '';
    displayMessageColor: string = '';
    formUsername: string = '';
    avatarSrc: string;
    avatarHasBeenChanged = false;

    averageGameDuration: string = '';
    gamesPlayed: number;
    gamesWon: number;
    averageDiff: number;

    selectedDiffSound: string = '';
    selectedErrorSound: string = '';

    diffSoundHasBeenChanged = false;
    errorSoundHasBeenChanged = false;
    selectedSoundName: string = '';
    currentDiffSound: string = '';
    currentErrorSound: string = '';
    currentDiffSoundIndex: number;
    currentErrorSoundIndex: number;

    errorSounds: any[] = [
        { name: 'errorSound1', url: 'assets/audio/errorSound1.wav' },
        { name: 'errorSound2', url: 'assets/audio/errorSound2.wav' },
        { name: 'errorSound3', url: 'assets/audio/errorSound3.wav' },
    ];

    differenceFoundSounds: any[] = [
        { name: 'differenceFoundSound1', url: 'assets/audio/differenceFoundSound1.wav' },
        { name: 'differenceFoundSound2', url: 'assets/audio/differenceFoundSound2.wav' },
        { name: 'differenceFoundSound3', url: 'assets/audio/differenceFoundSound3.wav' },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connections: any = [];

    defaultAvatars: string[] = ['assets/avatar_man_1.png', 'assets/avatar_man_2.png', 'assets/avatar_woman_1.png', 'assets/avatar_woman_2.png'];
    selectedAvatarIndex: number = 0; // Default to the first avatar

    audio = new Audio();

    constructor(
        private authService: AuthService,
        private communicationService: CommunicationService,
        private imageService: ImageVerificationService,
    ) {}

    ngOnInit(): void {
        const userInfo = this.authService.getUserInfo();
        if (!userInfo) {
            // eslint-disable-next-line no-console
            console.error('User info not found');
            return;
        }
        this.info = userInfo;
        this.gamesWon = this.info.wins as number;
        this.fetchHistory();

        this.getAvatar();

        this.getConnectionsHistory();

        this.communicationService.soundGet().subscribe((sounds: any) => {
            if (sounds) {
                this.currentDiffSound = sounds.diffSound;
                this.currentErrorSound = sounds.errorSound;
                this.currentDiffSoundIndex = (this.getName(this.currentDiffSound) as number) - 1; // Index - 1 because the name of the sound is the index + 1
                this.currentErrorSoundIndex = (this.getName(this.currentErrorSound) as number) - 1; // Index - 1 because the name of the sound is the index + 1
            }
        });
    }
    // Faire une request au serveur pour obtenir avatar du user

    // loadSound(event: any, soundIdentifier: string): void {
    //     // http upload sound, if true, change sound locally
    //     const file = event.target.files[0];
    //     if (file) {
    //         const soundUrl = URL.createObjectURL(file);
    //         if (soundIdentifier === 'sound1') {
    //             this.soundSrc1 = soundUrl;
    //         } else if (soundIdentifier === 'sound2') {
    //             this.soundSrc2 = soundUrl;
    //         }
    //         // ... additional handling as needed
    //     }
    // }

    // resetSound(soundIdentifier: string): void {
    //     // http reset sound, get sound from server and change sound locally
    //     if (soundIdentifier === 'sound1') {
    //         this.soundSrc1 = null; // or set to the default sound URL if any
    //         // Additional logic if needed (e.g., resetting the file input)
    //     } else if (soundIdentifier === 'sound2') {
    //         this.soundSrc2 = null; // or set to the default sound URL if any
    //         // Additional logic if needed
    //     }
    // }

    selectAvatar(index: number): void {
        this.selectedAvatarIndex = index;
        this.loadImageFromPath(this.defaultAvatars[index]);
    }
    async fetchHistory(): Promise<void> {
        this.communicationService.lastGamesHistoryGet(this.info.uid).subscribe((history) => {
            this.history = history;
            this.calculateStats(this.history);
        });
    }

    getName(soundUrl: string): number {
        const regex = /(\d+)\.wav$/;
        const match = RegExp(regex).exec(soundUrl);
        if (!match) return 1;
        return match[1] as any;
    }

    getConnectionsHistory(): void {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.communicationService.getConnections(this.info.uid).subscribe((history) => {
            this.connections = history;
            this.connections.reverse();
        });
    }

    calculateStats(history: EnrichedGameHistory[]): void {
        this.averageGameDuration = this.calculateAverageDuration(history);
        this.gamesPlayed = this.calculateGamesPlayed(history);
        // this.gamesWon = this.calculateGamesWon(history);
        this.averageDiff = this.calculateAverageDiff(history);
    }

    calculateAverageDiff(games: EnrichedGameHistory[]): number {
        let totalDiff = 0.0;
        let totalGames = 0.0;
        games.forEach((game) => {
            totalDiff += this.getDifferenceCountForUid(game, this.info.uid);
            totalGames++;
        });
        return totalDiff / totalGames;
    }

    getDifferenceCountForUid(data: any, uid: string): number {
        const entry = data.differenceCounts.find((item: any) => item[0] === uid);
        return entry ? entry[1] : 0;
    }

    // TODO: IL FAUT SAUVEGARDER LE NOMBRE DE DIFFERENCES TROUVEES PAR PARTIE DANS LA DB.

    // TODO: A VERIFIER CE QU ON FAIT AVEC CE SYSTEME DE VICTOIRE.
    calculateGamesWon(games: EnrichedGameHistory[]) {
        return games.filter((game) => game.winnerId === this.info.uid && game.gameMode === GameMode.Classic).length;
    }

    calculateGamesPlayed(games: EnrichedGameHistory[]) {
        return games.length;
    }

    calculateAverageDuration(games: EnrichedGameHistory[]) {
        if (games.length === 0) return '';
        const durationToSeconds = (duration: string) => {
            const [minutes, seconds] = duration.split(':').map(Number);
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            return minutes * 60 + seconds;
        };

        const totalDurationInSeconds = games.reduce((acc, game) => {
            return acc + durationToSeconds(game.duration);
        }, 0);

        const averageDurationInSeconds = totalDurationInSeconds / games.length;

        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const averageMinutes = Math.floor(averageDurationInSeconds / 60);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const averageSeconds = Math.floor(averageDurationInSeconds % 60);

        const paddedMinutes = String(averageMinutes).padStart(2, '0');
        const paddedSeconds = String(averageSeconds).padStart(2, '0');
        return `${paddedMinutes}:${paddedSeconds}`;
    }

    async loadAudioFromPath(audio: any, audioType: string) {
        const audioPath = audio.url;
        fetch(audioPath)
            .then(async (response) => response.blob())
            .then((blob) => {
                const audioUrl = URL.createObjectURL(blob);
                if (audioType === 'diffSound') {
                    this.selectedDiffSound = audioUrl;
                    this.diffSoundHasBeenChanged = true;
                    this.selectedSoundName = audio.name;
                } else if (audioType === 'errorSound') {
                    this.selectedErrorSound = audioUrl;
                    this.errorSoundHasBeenChanged = true;
                    this.selectedSoundName = audio.name;
                }
            })
            .catch((error) => {
                console.error('Error fetching and processing audio:', error);
            });
    }

    async loadImageFromPath(imagePath: string) {
        fetch(imagePath)
            .then(async (response) => response.blob())
            .then((blob) => {
                const reader = new FileReader();
                reader.onload = async (e: ProgressEvent<FileReader>) => {
                    if (e.target && typeof e.target.result === 'string') {
                        const avatarSize = 128;
                        this.avatarSrc = await this.imageService.resizeImage(e.target.result, avatarSize);
                        this.avatarHasBeenChanged = true;
                    }
                };
                reader.onerror = (error) => {
                    // eslint-disable-next-line no-console
                    console.error('Error reading file:', error);
                };
                reader.readAsDataURL(blob);
            })
            .catch((error) => {
                // eslint-disable-next-line no-console
                console.error('Error fetching and processing image:', error);
            });
    }

    loadSound(index: number, soundType: string) {
        if (soundType === 'diffSound') {
            this.currentDiffSoundIndex = index;
            this.selectedDiffSound = this.differenceFoundSounds[index].url;
            this.diffSoundHasBeenChanged = true;
        } else if (soundType === 'errorSound') {
            this.currentErrorSoundIndex = index;
            this.selectedErrorSound = this.errorSounds[index].url;
            this.errorSoundHasBeenChanged = true;
        }
    }

    playSound(sound: string) {
        this.audio.pause();
        this.audio = new Audio(sound);
        this.audio.play();
    }

    async loadImage(event: Event) {
        const element: HTMLInputElement = event.target as HTMLInputElement;
        if (element.files && element.files.length > 0) {
            const file = element.files[0];

            const reader = new FileReader();

            reader.onload = async (e: ProgressEvent<FileReader>) => {
                if (e.target && typeof e.target.result === 'string') {
                    const avatarSize = 128;
                    this.avatarSrc = await this.imageService.resizeImage(e.target.result, avatarSize);
                    this.avatarHasBeenChanged = true;
                }
            };

            reader.onerror = (error) => {
                // eslint-disable-next-line no-console
                console.error('Error reading file:', error);
            };

            reader.readAsDataURL(file);
        }
        element.value = '';
    }

    getAvatar() {
        this.communicationService.avatarGet(this.info.uid).subscribe((avatarUrl: string) => {
            this.avatarSrc = avatarUrl;
        });
    }

    findDiffSound() {
        return this.differenceFoundSounds.find((sound) => sound.url === this.selectedDiffSound);
    }

    findErrorSound() {
        return this.errorSounds.find((sound) => sound.url === this.selectedErrorSound);
    }

    async onSubmit() {
        if (this.formUsername.length > 0) {
            this.communicationService.changeUsername(this.formUsername).subscribe((success) => {
                this.displayMessage = success ? "Le nom d'utilisateur a été changé avec succès" : "Le nom d'utilisateur est déjà pris";
                this.displayMessageColor = success ? 'green' : 'red';
                if (success) {
                    this.info.username = this.formUsername;
                }
                this.formUsername = '';
            });
        }

        if (this.diffSoundHasBeenChanged) {
            this.communicationService.soundPut(this.selectedDiffSound, 'diffSound').subscribe((success) => {
                // if success get Sound
                if (success) {
                    this.communicationService.soundGet().subscribe((sounds: any) => {
                        this.currentDiffSound = sounds.diffSound;
                    });
                    this.diffSoundHasBeenChanged = false;
                }
            });
        }

        if (this.errorSoundHasBeenChanged) {
            this.communicationService.soundPut(this.selectedErrorSound, 'errorSound').subscribe((success) => {
                if (success) {
                    this.communicationService.soundGet().subscribe((sounds: any) => {
                        this.currentErrorSound = sounds.errorSound;
                    });
                    this.errorSoundHasBeenChanged = false;
                }
            });
        }

        if (this.avatarSrc.length > 0 && this.avatarHasBeenChanged) {
            this.communicationService.avatarPut(this.info.uid, this.avatarSrc).subscribe((success) => {
                if (!success) {
                    this.getAvatar();
                }
                this.displayMessage = success ? "L'avatar a été modifié avec succès" : "L'avatar n'a pas pu être modifié";
                this.displayMessageColor = success ? 'green' : 'red';
                this.avatarHasBeenChanged = false;
            });
        }
    }
}
