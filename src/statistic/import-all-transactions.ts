import axios from 'axios';
import { DateTime } from 'luxon';
import { logger } from '../bots/logger';
import { techBot } from '../bots/index';
import dotenv from 'dotenv';
import prisma from '../db/client';
import { waterByTime } from './total-water';

dotenv.config();

const topListChannel = process.env.TOP_CHANNEL_TOKEN || '1';

const importTransactions = async (device: number, startTime: string, endTime: string) => {
    interface LogResponseSuccess {
        status: 'success';
        log: LogEntry[];
    }

    interface LogResponseError {
        status: 'error';
        descr: 'date invalid' | 'device invalid';
    }

    type LogResponse = LogResponseSuccess | LogResponseError;

    interface LogEntry {
        date: string;
        wz: string;
        wg: string;
        mt: string;
        mt_bn: string;
        mt_www: string;
        sd: string;
        logdelayed: string;
        cardid: string;
        bonus_on_card_before: string;
        bonus_on_card_after: string;
    }

    const url = 'https://soliton.net.ua/water/api/water/index.php';
    const requestData = {
        device_id: device,
        ds: startTime,
        de: endTime,
    };

    try {
        const response = (await axios.post<LogResponse>(url, requestData)).data;

        if (response.status === 'error') {
            if (response.descr === 'date invalid') {
                logger.warn('Неправильна дата:' + endTime + startTime);
            }
            if (response.descr === 'device invalid') {
                logger.warn('Неправильний апарат:' + device);
            }
        }

        if (response.status === 'success') {
            if (response?.log === undefined) return;
            const log = response?.log;
            if (log.length > 0) {
                for (let transaction of log) {
                    const transactionData = {
                        device,
                        date: DateTime.fromFormat(
                            transaction.date,
                            'yyyy-MM-dd HH:mm:ss',
                        ).toJSDate(),
                        waterRequested: Number(transaction.wz),
                        waterFullfilled: Number(transaction.wg),
                        cashPaymant: Number(transaction.mt),
                        cardPaymant: Number(transaction.mt_bn),
                        onlinePaymant: Number(transaction.mt_www),
                        paymantChange: Number(transaction.sd),
                        cardId: Number(transaction.cardid),
                    };

                    await prisma.transactions.create({ data: transactionData });
                }
            }
        }
    } catch (error) {
        logger.warn(`Transaction reqest unknown error ${error}`);
    }
};

const daySummoryLog = async () => {
    try {
        interface DevicesResponse {
            status: string;
            devices: Device[];
        }

        interface Device {
            id: string;
            name: string;
            lat: string | null;
            lon: string | null;
        }

        const locations = (
            await axios.get<DevicesResponse>('http://soliton.net.ua/water/api/devices')
        ).data;
        const machines = locations.devices;
        const devicesQuantity = machines.length - 4;
        const endTime = DateTime.now().setZone('Europe/Kyiv').toFormat('yyyy-MM-dd HH:mm:ss');
        const startTime = DateTime.now().minus({ minutes: 1440 }).toFormat('yyyy-MM-dd HH:mm:ss');

        for (let i = 4; i < machines.length; i++) {
            await importTransactions(Number(machines[i].id), startTime, endTime);
            if (i === machines.length - 1) {
                const totalWaterFulfilled = await waterByTime(startTime, endTime);

                const today = DateTime.now().toFormat('dd.LL.yyyy');
                const string = `${today}
                Мережа Водолій налічує  автоматів  ${devicesQuantity},
                Кількість налитої води за добу: ${totalWaterFulfilled} літрів.`;
                techBot.sendMessage(topListChannel, string);
            }
        }
    } catch (error) {}
};

export default daySummoryLog;
