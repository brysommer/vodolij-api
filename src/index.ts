import e from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import router from './router';
import dotenv from 'dotenv';
dotenv.config();

const app = e();

app.use(
    cors({
        credentials: true,
    }),
);

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use('/', router());

const server = http.createServer(app);

server.listen(8080, () => {
    console.log(`Server running on http://localhost:8080/`);
});
