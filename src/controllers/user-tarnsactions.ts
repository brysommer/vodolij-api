import axios from 'axios';
import moment from 'moment';
import e from 'express';
//import { logger } from './logger/index.js';

export const getUserTransactions = async (req: e.Request, res: e.Response) => {
    try {
        const { device, substract, cardId } = req.body;

        if (!device || !substract || !cardId) {
            return res.status(400);
        }

        const currentTime = moment();

        const endTime = currentTime.format('YYYY-MM-DD HH:mm:ss');
        const startTime = currentTime.subtract(substract, 'minutes').format('YYYY-MM-DD HH:mm:ss');

        const url = 'https://soliton.net.ua/water/api/water/index.php';

        const requestData = {
            device_id: device,
            ds: startTime,
            de: endTime,
        };
        interface ApiTransactionLog {
            cardid: string | number;
            date: string;
            wz: number; // Води замовлено
            wg: number; // Води видано
            mt: number; // Готівка
            mt_bn: number; // Картка (безготівка)
            mt_www: number; // Онлайн
            sd: number; // Решта
            logdelayed: 'Y' | 'N';
        }

        // 1. Описуємо можливі описи помилок (опціонально, для точності)
        type ErrorDescription = 'date invalid' | 'device invalid' | string;

        // 2. Базовий успішний інтерфейс
        interface SuccessResponse {
            status: 'success';
            log?: ApiTransactionLog[]; // Замініть any на конкретний тип вашого логу, якщо знаєте його структуру
        }

        // 3. Інтерфейс помилки
        interface ErrorResponse {
            status: 'error';
            descr: ErrorDescription;
        }

        // 4. Об'єднаний тип
        type ApiResponse = SuccessResponse | ErrorResponse;

        const response = await axios.post<ApiResponse>(url, requestData);

        if (response.data.status === 'error') {
            if (response.data.descr === 'date invalid') {
                //        logger.warn('Неправильна дата:', endTime, startTime);
            }
            if (response.data.descr === 'device invalid') {
                //        logger.warn('Неправильний апарат:', device);
            }
        }

        if (response.data.status === 'success') {
            interface TransactionData {
                device: any; // Замініть на тип вашого пристрою (напр. string)
                date: string;
                waterRequested: number;
                waterFullfilled: number;
                cashPaymant: number;
                cardPaymant: number;
                onlinePaymant: number;
                paymantChange: number;
                isAutorized: boolean;
                cardId: string | number;
            }

            if (response.data?.log === undefined) return;
            const log = response.data?.log;

            console.log(log);
            if (log.length > 0) {
                const lastTransaction = log.find((item) => item.cardid == cardId);

                const transactionData: TransactionData = {
                    device,
                    date: lastTransaction.date,
                    waterRequested: lastTransaction.wz,
                    waterFullfilled: lastTransaction.wg,
                    cashPaymant: lastTransaction.mt,
                    cardPaymant: lastTransaction.mt_bn,
                    onlinePaymant: lastTransaction.mt_www,
                    paymantChange: lastTransaction.sd,
                    isAutorized: lastTransaction.logdelayed === 'Y' && true,
                    cardId: lastTransaction.cardid,
                };
                //Тут ми записували транзакцію в реальному часі але це призводило до задвоювання данних в базі і відповідно статистиці. Поки потушим
                //Але памятаємо про те що можна повернути данні в реальному часі що може бути корисно в багатьох речах
                //createNewTransaction(transactionData);

                return transactionData;
            }
        }
    } catch (error) {
        //    logger.warn(`Transaction reqest unknown error ${error}`);
    }
};
export default getUserTransactions;
