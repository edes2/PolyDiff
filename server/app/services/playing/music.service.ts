import { Music, MusicType } from '@common/interfaces/music';
import fs from 'fs';
import path from 'path';
import { Service } from 'typedi';

const MUSIC_DIRECTORY = './assets/music/';
const NOT_FOUND = -1;
const VALID_EXTENSIONS = ['mp3', 'wav'];

@Service()
export class MusicService {
    getRandomMusic(type: MusicType): Music | null {
        const musicList = this.getAllMusic();
        const filteredMusicList = this.filterMusicByType(type, musicList);
        if (!filteredMusicList.length) return null;
        const randomIndex = Math.floor(Math.random() * filteredMusicList.length);
        return filteredMusicList[randomIndex];
    }

    getAllMusic(): Music[] {
        const files = fs.readdirSync(MUSIC_DIRECTORY);
        const musicList: Music[] = [];
        for (const file of files) {
            const music = this.extractMusicFromFile(file);
            if (music) musicList.push(music);
        }
        return musicList;
    }

    filterMusicByType(type: MusicType, musicList: Music[]): Music[] {
        return musicList.filter((music) => music.type === type);
    }

    /*
     * This method is used to extract the music object from the file name.
     * The file name must be in the format: <type>-<name>.<extension>
     */
    private extractMusicFromFile(file: string): Music | null {
        try {
            /* Extension */
            const extension = path.extname(file).substring(1);
            if (!VALID_EXTENSIONS.includes(extension)) return null;
            const mimeType = extension === 'mp3' ? 'audio/mpeg' : 'audio/wav';

            /* Validate name structure */
            const separationIndex = file.indexOf('-');
            const dotIndex = file.lastIndexOf('.');
            if (separationIndex === NOT_FOUND || dotIndex === NOT_FOUND || separationIndex >= dotIndex) return null;

            /* Type */
            const typeStr = file.substring(0, separationIndex);
            if (!Object.values(MusicType).includes(typeStr as MusicType)) return null;

            /* Name */
            const name = file.substring(separationIndex + 1, dotIndex);
            if (!name) return null;

            /* Raw audio */
            const audioBuffer = fs.readFileSync(path.join(MUSIC_DIRECTORY, file));
            const src = `data:${mimeType};base64,${audioBuffer.toString('base64')}`;
            if (!src) return null;

            return { src, type: typeStr as MusicType, name };
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}
