import { techBot } from './index';
import { DateTime } from 'luxon';
import dotenv from 'dotenv';

dotenv.config();

const loggerChannel = process.env.LOGGER_CHANNEL_TOKEN;

const DEBUG = true;

// 🗽✨🎈🌞⛵🎃🚸

const logger = {
    now() {
        return DateTime.now().setZone('Europe/Kyiv').toFormat('yy-MM-dd HH:mm:ss');
    },

    async createNewLog(channelId: string, description: string) {
        let res;
        try {
            res = await techBot.sendMessage(channelId, description);
        } catch (err) {
            console.log(`🚩 ${this.now()} Impossible to create log: ${err}`);
        }
        if (res) {
            return res;
        }
        return;
    },

    async info(desc: string) {
        const channel = loggerChannel || '-1';
        const log = `🏂 ${this.now()} ${desc}`;
        const res = await this.createNewLog(channel, log);
        if (res && DEBUG) {
            console.log(`🏂 ${this.now()} ${desc}`);
        }
    },

    async warn(desc: string) {
        const channel = loggerChannel || '-1';
        const log = `🎈 ${this.now()} ${desc}`;
        const res = await this.createNewLog(channel, log);
        if (res && DEBUG) {
            console.log(log);
        }
    },

    async error(desc: string) {
        const channel = loggerChannel || '';
        const log = `🚩 ${this.now()} ${desc}`;
        const res = await this.createNewLog(channel, log);
        if (res) {
            console.log(log);
        }
    },
};

export { logger };
