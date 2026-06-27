import 'dotenv/config';
import app from './app.js';
import { connection } from './config/database.js';
import { processCleanup } from './workers/cleanup.worker.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
	try {
		await connection();

		const server = app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
			
			// Kích hoạt dọn dẹp các file rác còn tồn đọng ngay khi start
			processCleanup().catch(console.error);
			
			// Lên lịch dọn dẹp mỗi 1 giờ (3600000 ms)
			setInterval(() => {
				console.log('[Cron] Chạy tiến trình dọn dẹp ảnh mồ côi...');
				processCleanup().catch(console.error);
			}, 60 * 60 * 1000);
		});
		
		// Graceful Shutdown: Handle Uncaught Exceptions
		process.on('uncaughtException', (err) => {
			console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
			console.error(err.name, err.message, err.stack);
			process.exit(1);
		});

		// Graceful Shutdown: Handle Unhandled Promise Rejections
		process.on('unhandledRejection', (err) => {
			console.error('UNHANDLED REJECTION! 💥 Shutting down...');
			console.error(err.name, err.message, err.stack);
			server.close(() => {
				process.exit(1);
			});
		});

	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
};
startServer();
