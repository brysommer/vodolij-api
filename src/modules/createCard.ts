import axios from 'axios';
import prisma from 'db/client.js';

const createCardApi = async (chat_id: number, phone: string) => {
    interface SuccessResponse {
        status: 'success';
        user: UserData;
    }

    interface ErrorResponse {
        status: 'error';
        error: string;
    }

    interface UserData {
        uid: string;
        name: string;
        date_birth: string;
        phone: string;
        email: string;
        card: [CardInfo, any[]];
    }

    interface CardInfo {
        ID: string;
        Number: string;
        Card: string;
        Type: string;
        CardGroup: string;
        WaterQty: number;
        AllQty: number;
        MoneyPerMonth: number;
        LitresPerDay: number;
        Discount: number;
        status: string;
    }

    type ApiResponse = SuccessResponse | ErrorResponse;

    await prisma.users.update({ where: { chat_id }, data: { isAuthenticated: true } });
    const userData = await prisma.apiusers.findFirst({ where: { chat_id } });
    const url = 'https://soliton.net.ua/water/api/card/link/index.php';
    const requestData = {
        user_id: userData.user_id,
        card_id: userData.phone,
    };
    const response = await axios.post<ApiResponse>(url, requestData);

    if (
        response.data.status === 'success' ||
        response.data.error === 'card already linked to user'
    ) {
        const userCard = await axios.get<ApiResponse>(
            `http://soliton.net.ua/water/api/user/index.php?phone=${phone}`,
        );

        if (userCard.data.status === 'success') {
            const virtualCard = userCard.data.user.card[0];

            await prisma.apiusers.update({
                where: { chat_id },
                data: { cardId: Number(virtualCard.ID) },
            });

            const card = await prisma.cards.create({
                data: {
                    cardId: Number(virtualCard.ID),
                    Number: virtualCard.Number,
                    Card: virtualCard.Card,
                    Type: virtualCard.Type,
                    CardGroup: virtualCard.CardGroup,
                    WaterQty: virtualCard.WaterQty,
                    AllQty: virtualCard.AllQty,
                    MoneyPerMonth: virtualCard.MoneyPerMonth,
                    LitersPerDay: virtualCard.LitresPerDay,
                    Discount: virtualCard.Discount,
                    status: virtualCard.status,
                },
            });

            await prisma.users.update({
                where: { chat_id },
                data: { lastname: userData.user_id.toString() },
            });
        }
        return userCard;
    }
};

export default createCardApi;
