import dayjs from 'dayjs';
import prisma from '../../db/client';

export const collectDailyStatistics = async () => {
    // Отримуємо всі транзакції за вчора
    const transactions = await prisma.transactions.findMany({
        where: {
            date: {
                gte: dayjs().subtract(24, 'hour').toDate(),
            },
        },
        orderBy: {
            date: 'desc',
        },
    });

    // Загальні підрахунки
    const totalTransactions = transactions.length;
    const totalWater = Math.round(
        transactions.reduce((sum, t) => sum + (t.waterFullfilled || 0), 0),
    );
    const totalRevenue = transactions.reduce(
        (sum, t) => sum + (t.cashPaymant || 0) + (t.cardPaymant || 0) + (t.onlinePaymant || 0),
        0,
    );
    const cashRevenue = transactions.reduce((sum, t) => sum + (t.cashPaymant || 0), 0);
    const cardRevenue = transactions.reduce((sum, t) => sum + (t.cardPaymant || 0), 0);
    const onlineRevenue = transactions.reduce((sum, t) => sum + (t.onlinePaymant || 0), 0);
    const failedTransactions = transactions.filter((t) => t.waterFullfilled === 0).length;

    // Визначаємо топового користувача за обсягом налитої води
    const userStats: Record<string, number> = {};
    transactions.forEach((t) => {
        if (t.cardId) {
            userStats[t.cardId] = (userStats[t.cardId] || 0) + (t.waterFullfilled || 0);
        }
    });

    const topUserIdRaw = Object.keys(userStats).length
        ? Object.keys(userStats).reduce((a, b) => (userStats[a] > userStats[b] ? a : b))
        : null;
    const topUserId = topUserIdRaw ? Number(topUserIdRaw) : null;
    const topUserVolume = topUserId ? Math.round(userStats[topUserId]) : 0;

    // Визначаємо топовий автомат
    interface DeviceStat {
        count: number;
        volume: number;
    }
    const deviceStats: Record<string, DeviceStat> = {};
    transactions.forEach((t) => {
        deviceStats[t.device] = deviceStats[t.device] || { count: 0, volume: 0 };
        deviceStats[t.device].count += 1;
        deviceStats[t.device].volume += t.waterFullfilled || 0;
    });

    const topDeviceIdRaw = Object.keys(deviceStats).length
        ? Object.keys(deviceStats).reduce((a, b) =>
              deviceStats[a].count > deviceStats[b].count ? a : b,
          )
        : null;
    const topDeviceId = topDeviceIdRaw ? Number(topDeviceIdRaw) : null;
    const topDeviceTransactions = topDeviceId ? deviceStats[topDeviceId].count : 0;
    const topDeviceVolume = topDeviceId ? deviceStats[topDeviceId].volume : 0;

    // Записуємо дані у таблицю daily_statistics
    await prisma.daily_statistics.create({
        data: {
            date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
            totalWater,
            totalTransactions,
            uniqueUsers: Object.keys(userStats).length,
            topUserId,
            topUserVolume,
            topDeviceId,
            topDeviceTransactions,
            topDeviceVolume,
            totalRevenue,
            cashRevenue,
            cardRevenue,
            onlineRevenue,
            failedTransactions,
        },
    });
};
