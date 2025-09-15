import { DateTime } from 'luxon';
import prisma from '../../db/client';
import { userWaterByTime } from '../total-water';
import { techBot } from '../../bots';
import dotenv from 'dotenv';

dotenv.config();

const topListChannel = process.env.TOP_CHANNEL_TOKEN || '1';

export const botMonthlyUsersStatistic = async () => {
    const users = await prisma.apiusers.findMany();
    const usersWithTotals = [];

    for (let user of users) {
        const cardId = Number(user?.cardId);
        let userTotal = 0;

        if (cardId) {
            const endTime = DateTime.now().setZone('Europe/Kyiv').toFormat('yyyy-MM-dd HH:mm:ss');
            const startTime = DateTime.now().minus({ days: 7 }).toFormat('yyyy-MM-dd HH:mm:ss');
            userTotal = await userWaterByTime(startTime, endTime, cardId);
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

    // Сортуємо користувачів за userTotal у порядку спадання
    const topUsers = usersWithTotals.sort((a, b) => b.userTotal - a.userTotal).slice(0, 5); // Отримуємо топ-5

    // Формуємо повідомлення для топ-10 користувачів
    const topUsersMessage = topUsers
        .map((user) => {
            return `ID: ${user.id}, Імя: ${user.name}, ТЕЛ: ${user.phone}, Карта: ${
                user.cards
            }, Набрано: ${user.userTotal.toFixed(0)} літрів`;
        })
        .join('\n');

    techBot.sendMessage(topListChannel, `Топ 5 користувачів за місяць:\n${topUsersMessage}`);

    // Логуюємо загальну кількість користувачів та воду
    const usersQuantity = users.length;
    const usersWaterTotal = usersWithTotals.reduce((sum, user) => sum + user.userTotal, 0);

    const monthlyAmountUpdate = await prisma.cards.updateMany({
        data: { LitersPerDay: 0 },
        where: {},
    });

    const summaryString = `Користувачів боту: ${usersQuantity},\nКількість налитої води, користувачами боту, за місяць: ${usersWaterTotal.toFixed(
        0,
    )} літрів.`;
    techBot.sendMessage(topListChannel, summaryString);
};
