import prisma from '../../db/client';
import { techBot } from '../../bots';
import dotenv from 'dotenv';
import { DateTime } from 'luxon';
import { getAllBotUsersBalance } from 'controllers/all-bot-users-balance';
import { userWaterByTime } from 'statistic/total-water';

dotenv.config();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const createDailyBotSnapshot = async () => {
    console.log('🚀 Початок формування щоденного знімка аналітики...');

    const usersBalance = await getAllBotUsersBalance();

    // 3. Сегментуємо користувачів та збираємо дані з зовнішнього API
    let dauCount = 0;

    const users = await prisma.apiusers.findMany();
    const usersWithTotals = [];

    for (let user of users) {
        const cardId = Number(user?.cardId);
        let userTotal = 0;

        if (cardId) {
            const endTime = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
            const startTime = DateTime.now()
                .minus({ minutes: 1440 })
                .toFormat('yyyy-MM-dd HH:mm:ss');
            userTotal = await userWaterByTime(startTime, endTime, cardId);
            console.log(userTotal);
        }

        usersWithTotals.push({
            id: user.id,
            name: user.name,
            birthdayDate: user.birthdaydate,
            phone: user.phone,
            cards: cardId,
            userTotal,
        });
    }

    console.log(`📊 Обробимо ${users.length} користувачів...`);
    const usersWaterTotal = usersWithTotals.reduce((sum, user) => sum + user.userTotal, 0);

    const twentyFourHoursAgo = DateTime.now().minus({ hours: 24 }).toJSDate();

    const newUsersCount = await prisma.apiusers.count({
        where: {
            createdAt: {
                // Перевір, чи в схемі поле називається createdat чи createdAt
                gte: twentyFourHoursAgo, // gte = "greater than or equal" (більше або дорівнює)
            },
        },
    });
    const snapshot = await prisma.botAnalyticsDaylySnapshot.create({
        data: {
            newUsers: newUsersCount,
            inactiveUsers: usersBalance.usersCount - usersWithTotals.length,
            totalBalance: usersBalance.totalWaterLiters, // Зберігаємо літри
            dau: usersWithTotals.length,
            totalWater: usersWaterTotal,
        },
    });
};
