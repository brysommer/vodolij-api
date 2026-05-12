import e from 'express';
import { createTransaction, findTransaction } from '../controllers/bot-transactions';
import getUserTransactions from '../controllers/user-tarnsactions';
import getUserStatistic from '../controllers/bot-user-statistic';

export default (router: e.Router) => {
    router.post('/transactions/create', createTransaction);
    router.post('/transactions/usertransactions', getUserTransactions);
    router.get('/transactions/:cardId', findTransaction);
    router.get('/statistic/:cardId', getUserStatistic);
};
