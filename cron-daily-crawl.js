#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DailyCrawlJob {
    constructor() {
        this.dataDir = './crawler_data';
        this.logFile = path.join(this.dataDir, 'cron.log');
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(logMessage.trim());

        try {
            await fs.appendFile(this.logFile, logMessage);
        } catch (error) {
            console.error('Failed to write to cron log file:', error);
        }
    }

    async findCrawledCategories() {
        try {
            const files = await fs.readdir(this.dataDir);
            const categoryIds = new Set();

            // Look for current_*.json files to identify previously crawled categories
            for (const file of files) {
                if (file.startsWith('current_') && file.endsWith('.json')) {
                    // Extract category names from filename
                    const categoryPart = file.replace('current_', '').replace('.json', '');

                    // Read the file to get category IDs from the data
                    try {
                        const data = JSON.parse(await fs.readFile(path.join(this.dataDir, file), 'utf-8'));
                        if (data.length > 0 && data[0].categoryId) {
                            categoryIds.add(data[0].categoryId);
                        }
                    } catch (error) {
                        this.log(`Could not read category data from ${file}: ${error.message}`);
                    }
                }
            }

            return Array.from(categoryIds);
        } catch (error) {
            this.log(`Error finding crawled categories: ${error.message}`);
            return [];
        }
    }

    async runCrawl(categoryIds) {
        if (categoryIds.length === 0) {
            this.log('No previously crawled categories found');
            return;
        }

        this.log(`Starting daily crawl for categories: ${categoryIds.join(', ')}`);

        try {
            const categoriesParam = categoryIds.join(',');
            const command = `node index.js crawl ${categoriesParam}`;

            this.log(`Executing: ${command}`);

            const { stdout, stderr } = await execAsync(command, {
                timeout: 3600000, // 1 hour timeout
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });

            if (stdout) {
                this.log(`Crawl output: ${stdout}`);
            }
            if (stderr) {
                this.log(`Crawl errors: ${stderr}`);
            }

            this.log('Daily crawl completed successfully');
        } catch (error) {
            this.log(`Error running daily crawl: ${error.message}`);
            if (error.stdout) {
                this.log(`Stdout: ${error.stdout}`);
            }
            if (error.stderr) {
                this.log(`Stderr: ${error.stderr}`);
            }
        }
    }

    async run() {
        this.log('=== Starting daily crawl job ===');

        try {
            await fs.mkdir(this.dataDir, { recursive: true });

            const categoryIds = await this.findCrawledCategories();
            await this.runCrawl(categoryIds);
        } catch (error) {
            this.log(`Critical error in daily crawl job: ${error.message}`);
        }

        this.log('=== Daily crawl job completed ===');
    }
}

// Run the daily crawl job
if (require.main === module) {
    const job = new DailyCrawlJob();
    job.run().catch(console.error);
}

module.exports = DailyCrawlJob;