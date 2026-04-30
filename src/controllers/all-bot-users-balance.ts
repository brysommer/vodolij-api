import prisma from '../db/client'; //
import { getExternalUserBalance } from './user-balance';
import dotenv from 'dotenv';
import { techBot } from '../bots';

dotenv.config();

const topListChannel = process.env.TOP_CHANNEL_TOKEN || '1';

// Допоміжна функція для затримки
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getAllBotUsersBalance = async () => {
    console.log('🚀 Запуск підрахунку загального балансу користувачів...');

    // 1. Беремо всіх юзерів з бази, у яких є номер телефону
    const users = await prisma.apiusers.findMany({
        where: {
            phone: { not: null },
        },
        select: {
            id: true,
            phone: true,
            name: true,
        },
    });

    let totalWaterLiters = 0;
    let processedCount = 0;
    let errorCount = 0;
    let usersCount = users.length;

    for (const user of users) {
        if (!user.phone) continue;

        // Чистимо номер телефону, якщо там є пробіли чи плюси (про всяк випадок)
        const cleanPhone = user.phone.replace(/\D/g, '');

        const balanceData = await getExternalUserBalance(cleanPhone);

        if (balanceData) {
            totalWaterLiters += balanceData.waterBalance;
            processedCount++;
            console.log(
                `[${processedCount}] Юзер: ${user.name} | Баланс: ${balanceData.waterBalance} л.`,
            );
        } else {
            errorCount++;
            console.warn(`⚠️ Не вдалося отримати дані для: ${user.phone}`);
        }

        // Робимо паузу 100мс між запитами, щоб не перевантажувати API
        await delay(100);
    }

    const report = `
    📊 ПІДСУМОК:
    - Всього оброблено: ${processedCount} юзерів
    - Помилок: ${errorCount}
    - ЗАГАЛЬНИЙ БАЛАНС: ${totalWaterLiters.toFixed(1)} літрів
    `;

    techBot.sendMessage(topListChannel, report);

    return { totalWaterLiters, usersCount };
};
