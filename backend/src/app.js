import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './modules/auth/auth.router.js';
import userRouter from './modules/user/users.router.js';
import roomRouter from './modules/room/room.router.js';
import uploadRouter from './modules/upload/upload.router.js';
import path from 'path';
import { errorHandlerMiddleware } from './common/middleware/errorHandler.Middleware.js';
const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Allow any origin for development
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
// app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/upload', uploadRouter);

// Phục vụ thư mục uploads dạng static
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(errorHandlerMiddleware);

export default app;
