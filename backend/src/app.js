import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.router.js';
import userRouter from './modules/user/users.router.js';
import roomRouter from './modules/room/room.router.js';
import { errorHandlerMiddleware } from './common/middleware/errorHandler.Middleware.js';
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // or your frontend url
  credentials: true, // required to send cookies
}));
app.use(express.json());
app.use(cookieParser());
// app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/rooms', roomRouter);

app.use(errorHandlerMiddleware);

export default app;
