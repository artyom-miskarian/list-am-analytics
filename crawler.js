#!/usr/bin/env node

const MultiCategoryCrawler = require('./index.js');

async function runCrawl() {
    const crawler = new MultiCategoryCrawler();

    // Parse command line arguments
    const categories = process.argv[2] ? process.argv[2].split(',').map(Number) : [36];
    const minPrice = process.argv[3] ? parseInt(process.argv[3]) : 5000;
    const maxPrice = process.argv[4] ? parseInt(process.argv[4]) : 80000;

    // Configure crawler
    crawler.setCategories(categories);
    crawler.setPriceRange(minPrice, maxPrice);

    try {
        console.log('Starting scheduled crawl...');
        await crawler.run();
        console.log('Scheduled crawl completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Scheduled crawl failed:', error);
        process.exit(1);
    }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down...');
    process.exit(0);
});

// Run the crawl
runCrawl();