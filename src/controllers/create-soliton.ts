import prisma from '../db/client';
import e from 'express';
import axios from 'axios';
import { logger } from 'bots/logger';
import createCardApi from 'modules/createCard';

export const createSoliton = async (req: e.Request, res: e.Response) => {
    try {
        const { phone, first_name, last_name, date_birth, chat_id } = req.body;

        if (!phone || !first_name || !last_name || !date_birth || !chat_id) {
            return res.status(400);
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

        interface UserData {
            uid: string;
            name: string;
            date_birth: string;
            phone: string;
            email: string;
            card: [CardInfo, any[]];
        }

        interface SuccessResponse {
            status: 'success';
            user: UserData;
        }

        interface ErrorResponse {
            status: 'error';
            error: string;
        }

        type ApiResponse = SuccessResponse | ErrorResponse;

        const response = await axios.get<ApiResponse>(
            `http://soliton.net.ua/water/api/user/index.php?phone=${phone}`,
        );

        let newUser;

        if (response.data.status === 'error') {
            if (response.data.error === 'no user with this phone number') {
                const response = await axios.post<ApiResponse>(
                    'http://soliton.net.ua/water/api/user/add/index.php',
                    {
                        phone_number: phone,
                        first_name,
                        last_name,
                        date_birth,
                        email: 'example@gmail.com',
                    },
                );

                if (response.data.status === 'success') {
                    newUser = response.data.user;
                }
            }

            if (response.data.error === 'wrong phone number format') {
                logger.warn('Помилка створення користувача Солітон:' + response.data.error);
                return res.status(400);
            } else {
                logger.warn('Помилка створення користувача Солітон:' + response.data.error);
                return res.status(400);
            }
        }
        if (response.data.status === 'success') {
            const apiUser = await prisma.apiusers.findFirst(chat_id);

            const userCard = await prisma.users.findFirst(chat_id);
            apiUser
                ? await prisma.apiusers.update({
                      where: {
                          chat_id: chat_id, // Припускаємо, що chat_id — це унікальне поле (Unique) у схемі
                      },
                      data: {
                          user_id: parseInt(response.data.user.uid),
                          name: response.data.user.name,
                          birthdaydate: response.data.user.date_birth,
                          phone: response.data.user.phone,
                          // Додаємо перевірку на існування, щоб не отримати помилку на undefined
                          cardId: response.data.user.card[0]?.ID
                              ? Number(response.data.user.card[0].ID)
                              : null,
                      },
                  })
                : await prisma.apiusers.create({
                      // <-- відкриваємо дужку об'єкта аргументів
                      data: {
                          user_id: parseInt(response.data.user.uid),
                          chat_id: chat_id,
                          name: response.data.user.name,
                          // Переконайся, що date_birth — це об'єкт Date або валідний ISO рядок
                          birthdaydate: response.data.user.date_birth,
                          phone: response.data.user.phone,
                      },
                  });

            if (newUser) {
                logger.info(
                    `USER_ID: ${chat_id} registered. ${response.data.user.name}, ${response.data.user.date_birth}, ${response.data.user.phone}`,
                );

                const userCard = await createCardApi(chat_id, phone);

                userCard ? res.status(200).json(userCard) : res.status(400);
            }

            try {
                const solitonCardId = response.data.user.uid;
                const userCard = prisma.apiusers.update({
                    where: { chat_id },
                    data: { cardId: Number(solitonCardId) },
                });
            } catch (error) {
                logger.warn(chat_id + 'user ID update error' + phone);
            }
        } else {
            return res.status(400).json('new user not created');
        }
    } catch {
        logger.warn('user ID update error');
    }
};
