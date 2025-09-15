import prisma from '../db/client';

/**
 * Обчислює суму waterFullfilled за проміжок дат
 * @param startDate - початкова дата (включно)
 * @param endDate - кінцева дата (включно)
 * @returns Promise<number> - сума waterFullfilled
 */
const waterByTime = async (startDate: Date | string, endDate: Date | string): Promise<number> => {
    const result = await prisma.transactions.aggregate({
        _sum: { waterFullfilled: true },
        where: {
            date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        },
    });

    return Number(result._sum?.waterFullfilled?.toFixed(0)) ?? 0;
};

const userWaterByTime = async (
    startDate: Date | string,
    endDate: Date | string,
    card: number,
): Promise<number> => {
    const result = await prisma.transactions.aggregate({
        _sum: { waterFullfilled: true },
        where: {
            date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
            cardId: card,
        },
    });

    return Number(result._sum?.waterFullfilled?.toFixed(0)) ?? 0;
};

export { waterByTime, userWaterByTime };
