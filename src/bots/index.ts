import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TECHNOC_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN не знайдено');

export const techBot = new TelegramBot(token, { polling: false });
