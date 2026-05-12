import moment from 'moment';
import e from 'express';
import prisma from '../db/client';

export const getUserStatistic = async (req: e.Request, res: e.Response) => {
    try {
        let { cardId } = req.params;

        if (!cardId) {
            return res.status(400).json({ error: 'cardId is required' });
        }

        const numericCardId = Number(cardId);

        // Перевірка, чи це взагалі число, щоб не покласти базу
        if (isNaN(numericCardId)) {
            return res.status(400).json({ error: 'cardId must be a valid number' });
        }

        const now = new Date();

        // Визначаємо часові межі
        const startOfDay = moment().startOf('day').toDate();
        const startOfWeek = moment().startOf('week').toDate(); // За замовчуванням Неділя (або Понеділок залежно від локалі)
        const startOfMonth = moment().startOf('month').toDate();

        // 1. Статистика за День
        const dayAgg = await prisma.transactions.aggregate({
            _sum: { waterFullfilled: true },
            where: {
                cardId: numericCardId,
                date: { gte: startOfDay, lte: now },
            },
        });

        // 2. Статистика за Тиждень
        const weekAgg = await prisma.transactions.aggregate({
            _sum: { waterFullfilled: true },
            where: {
                cardId: numericCardId,
                date: { gte: startOfWeek, lte: now },
            },
        });

        // 3. Статистика за Місяць
        const monthAgg = await prisma.transactions.aggregate({
            _sum: { waterFullfilled: true },
            where: {
                cardId: numericCardId,
                date: { gte: startOfMonth, lte: now },
            },
        });

        return res.status(200).json({
            day: dayAgg._sum.waterFullfilled || 0,
            week: weekAgg._sum.waterFullfilled || 0,
            month: monthAgg._sum.waterFullfilled || 0,
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export default getUserStatistic;
