import 'dotenv/config';
import app from './app.js';
import { connection } from './config/database.js';
import { processCleanup } from './workers/cleanup.worker.js';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
	try {
		await connection();

		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
			
			// Kích hoạt dọn dẹp các file rác còn tồn đọng (nếu server từng bị crash trước đó)
			processCleanup().catch(console.error);
		});
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
};
startServer();
