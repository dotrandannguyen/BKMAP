import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const backendDir = path.resolve(process.cwd());
const reportPath = path.join(backendDir, '..', 'test_report.md');
const resultsJsonPath = path.join(backendDir, 'jest-results.json');

console.log('==================================================');
console.log('🚀 STARTING SYSTEM AUTOMATED TESTING SUITE...');
console.log('==================================================\n');

// Step 1: Run Jest with JSON output
const cmd = 'npx jest src/tests/system.integration.test.js --json --outputFile=jest-results.json --runInBand';

console.log(`Running command: ${cmd}\n`);
exec(cmd, { cwd: backendDir }, (error, stdout, stderr) => {
	console.log('Tests execution completed. Parsing results...');

	if (!fs.existsSync(resultsJsonPath)) {
		console.error('❌ Error: jest-results.json was not generated.');
		console.error(stderr || stdout);
		process.exit(1);
	}

	try {
		const resultsRaw = fs.readFileSync(resultsJsonPath, 'utf8');
		const results = JSON.parse(resultsRaw);

		const totalTests = results.numTotalTests || 0;
		const passedTests = results.numPassedTests || 0;
		const failedTests = results.numFailedTests || 0;
		const executionTime = ((Date.now() - results.startTime) / 1000).toFixed(2);

		console.log(`\n==================================================`);
		console.log(`📊 TEST RESULTS SUMMARY:`);
		console.log(`- Total Tests: ${totalTests}`);
		console.log(`- Passed: ${passedTests} ✅`);
		console.log(`- Failed: ${failedTests} ❌`);
		console.log(`- Duration: ${executionTime}s`);
		console.log(`==================================================\n`);

		// Generate Markdown Report
		let mdContent = `# BÁO CÁO KẾT QUẢ KIỂM THỬ HỆ THỐNG CHI TIẾT (BKMAP) 🗺️\n\n`;
		mdContent += `*Thời gian kiểm thử:* ${new Date().toLocaleString('vi-VN')}\n`;
		mdContent += `*Tổng số test case:* **${totalTests}** | *Đạt:* **${passedTests}** ✅ | *Thất bại:* **${failedTests}** ❌\n`;
		mdContent += `*Thời gian thực thi:* **${executionTime} giây**\n\n`;

		mdContent += `## I. BẢNG TỔNG HỢP CHI TIẾT CÁC KỊCH BẢN\n\n`;
		mdContent += `| Nhóm | Kịch bản | Trạng thái | Chi tiết lỗi (nếu có) |\n`;
		mdContent += `| :--- | :--- | :---: | :--- |\n`;

		if (results.testResults && results.testResults[0] && results.testResults[0].assertionResults) {
			const assertions = results.testResults[0].assertionResults;

			assertions.forEach((test) => {
				const fullTitle = test.title;
				const statusIcon = test.status === 'passed' ? '🟢 PASS' : '🔴 FAIL';
				
				// Group name (from describe blocks)
				const groupName = test.ancestorTitles.join(' > ') || 'Chung';
				
				// Extract error message
				let failureMsg = '-';
				if (test.failureMessages && test.failureMessages.length > 0) {
					failureMsg = test.failureMessages[0].split('\n')[0].replace(/\|/g, '\\|');
				}

				mdContent += `| ${groupName} | ${fullTitle} | **${statusIcon}** | ${failureMsg} |\n`;
			});
		} else {
			mdContent += `| - | Không tìm thấy kết quả chi tiết | - | - |\n`;
		}

		mdContent += `\n---\n*Báo cáo được sinh tự động bởi BKMAP Test Automation Runner.*\n`;

		fs.writeFileSync(reportPath, mdContent, 'utf8');
		console.log(`✅ System test report successfully written to: ${reportPath}`);

		// Cleanup JSON output
		if (fs.existsSync(resultsJsonPath)) {
			fs.unlinkSync(resultsJsonPath);
		}

		// Exit code based on test success
		process.exit(failedTests > 0 ? 1 : 0);

	} catch (err) {
		console.error('❌ Failed to parse test results JSON:', err.message);
		process.exit(1);
	}
});
