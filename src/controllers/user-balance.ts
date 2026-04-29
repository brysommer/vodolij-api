import axios from 'axios';

export const getExternalUserBalance = async (phone: string) => {
    // 1. Описуємо структуру картки
    interface WaterCard {
        ID: string; // "21599"
        Number: string; // "380966663874"
        Card: string; // "V966663874"
        Type: string; // "7"
        CardGroup: string; // "Універсальна"
        WaterQty: number; // 610 (наш головний показник)
        AllQty: number; // 17
        MoneyPerMonth: number;
        LitresPerDay: number;
        Discount: number; // 20
        status: string; // "ok"
    }

    // 2. Описуємо структуру користувача
    interface ExternalUser {
        uid: string;
        name: string;
        date_birth: string;
        phone: string;
        email: string;
        card: [WaterCard, any[]?];
    }

    // 3. Основний інтерфейс відповіді
    interface SolitonApiResponse {
        status: 'success' | 'error';
        user: ExternalUser;
    }

    try {
        const response = await axios.get<SolitonApiResponse>(
            `http://soliton.net.ua/water/api/user/index.php?phone=${phone}`,
        );

        if (response.data.status === 'success') {
            const userData = response.data.user;
            // Картка лежить у масиві card[0]
            const cardInfo = userData.card[0];

            return {
                name: userData.name,
                cardId: cardInfo.ID,
                waterBalance: cardInfo.WaterQty / 10, // Залишок літрів
                discount: cardInfo.Discount, // Знижка
                status: cardInfo.status,
            };
        }
        return null;
    } catch (error) {
        console.error(`Помилка API для номера ${phone}:`, error);
        return null;
    }
};
