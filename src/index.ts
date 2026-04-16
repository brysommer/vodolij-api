import e from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import router from './router';

import dotenv from 'dotenv';
dotenv.config();

import { daySummoryLog, import10minTransactions } from './statistic/import-all-transactions';
import nodeCron from 'node-cron';
import { botWeeklyUsersStatistic } from './statistic/weekly/weekly-statistic';
import { botMonthlyUsersStatistic } from './statistic/monthly/monthly-statistic';
import { DateTime } from 'luxon';
import { collectDailyStatistics } from './statistic/dayli/daily-summory';

const app = e();

app.use(bodyParser.json());
app.use('/', router());

const server = http.createServer(app);

server.listen(8080, () => {
    console.log(`Server running on http://localhost:8080/`);
});

nodeCron.schedule('*/10 * * * *', () => {
    console.log('System Date:', new Date().toString());
    console.log('Luxon Date:', DateTime.now().toString());
    import10minTransactions().catch(console.error);
});

nodeCron.schedule('0 0 * * *', () => {
    daySummoryLog().catch(console.error);
    collectDailyStatistics();
});

nodeCron.schedule('0 0 * * 0', () => {
    // Щонеділі о 00:00
    botWeeklyUsersStatistic();
});

nodeCron.schedule('0 0 1 * *', () => {
    // 1-го числа кожного місяця о 00:00
    botMonthlyUsersStatistic();
});
