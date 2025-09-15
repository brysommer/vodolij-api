import prisma from '../db/client';
import e from 'express';

export const createTransaction = async (req: e.Request, res: e.Response) => {
    try {
        const {
            device,
            date,
            waterFullfilled,
            waterRequested,
            cashPaymant,
            cardPaymant,
            onlinePaymant,
            paymantChange,
            cardId,
        } = req.body;

        if (!device || !date || !cardId) {
            return res.status(400);
        }

        const transaction = await prisma.bot_transactions.create({
            data: {
                device,
                date,
                waterFullfilled,
                waterRequested,
                cardPaymant,
                onlinePaymant,
                paymantChange,
                cashPaymant,
                cardId,
            },
        });

        return res.status(200).json(transaction).end();
    } catch (error) {
        console.log(error);
        return res.status(400);
    }
};

export const findTransaction = async (req: e.Request, res: e.Response) => {
    try {
        const { cardId } = req.params;

        const transactions = await prisma.bot_transactions.findMany({
            where: { cardId: Number(cardId) },
        });

        return res.status(200).json(transactions);
    } catch (error) {
        console.log(error);
        return res.status(400);
    }
};
