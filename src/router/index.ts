import e from 'express';
import botTransaction from './bot-transaction';

const router = e.Router();

export default (): e.Router => {
    botTransaction(router);

    //тут наступні гілки роутера
    return router;
};
