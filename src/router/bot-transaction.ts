import e from 'express';
import { createTransaction, findTransaction } from '../controllers/bot-transactions';

export default (router: e.Router) => {
    router.post('/transactions/create', createTransaction);
    router.get('/transactions/:cardId', findTransaction);
};
