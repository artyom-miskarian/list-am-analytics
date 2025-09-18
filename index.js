const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const MultiCategoryNormalizer = require('./lib/MultiCategoryNormalizer.js');

class MultiCategoryCrawler {
    constructor() {
        this.dataDir = './crawler_data';
        this.logFile = path.join(this.dataDir, 'crawler.log');

        // Default settings - now configurable
        this.minPrice = 5000; // ֏
        this.maxPrice = 80000; // ֏
        this.categories = [36]; // Default to phones

        this.browser = null;
        this.normalizer = new MultiCategoryNormalizer();

        // Progress tracking
        this.isRunning = false;
        this.currentProgress = {
            isRunning: false,
            currentCategory: null,
            currentCategoryName: null,
            currentPage: 0,
            totalCategories: 0,
            completedCategories: 0,
            totalItems: 0,
            startTime: null,
            estimatedTimeRemaining: null,
            status: 'idle',
            estimatedPagesPerCategory: 10, // Rough estimate for progress calculation
            maxPagesPerCategory: 50 // Maximum pages we crawl per category
        };

        // Category definitions
        this.categoryDefinitions = {
            36: { name: 'Phones and Tablets', shortName: 'phones' },
            98: { name: 'Laptops and Computers', shortName: 'computers' },
            183: { name: 'Games and Consoles', shortName: 'games' },
            491: { name: 'Security and Smart Home', shortName: 'security' },
            179: { name: 'Media Streaming Devices', shortName: 'streaming' },
            180: { name: 'TV and Video Accessories', shortName: 'tv_accessories' },
            182: { name: 'Photo and Video Accessories', shortName: 'photo_accessories' },
            488: { name: 'Headphones', shortName: 'headphones' },
            78: { name: 'Audio Accessories', shortName: 'audio_accessories' },
            281: { name: 'Parts and Accessories for Quadcopters and Drones', shortName: 'drone_parts' },
            522: { name: 'Irons and Accessories', shortName: 'irons' },
            257: { name: 'Microwaves', shortName: 'microwaves' },
            264: { name: 'Coffee Makers & Accessories', shortName: 'coffee_makers' },
            263: { name: 'Tea Kettles', shortName: 'tea_kettles' },
            128: { name: 'Other Kitchen Appliances', shortName: 'kitchen_appliances' },
            528: { name: 'Cleaning Appliances', shortName: 'cleaning_appliances' },
            1109: { name: 'For Dogs', shortName: 'dog_products' },
            346: { name: 'Products for Cats', shortName: 'cat_products' }
        };

        this.init();
    }

    // Configure which categories to crawl
    setCategories(categories) {
        this.categories = Array.isArray(categories) ? categories : [categories];
        return this;
    }

    // Configure price range
    setPriceRange(min, max) {
        this.minPrice = min;
        this.maxPrice = max;
        return this;
    }

    // Get category hint for normalization
    getCategoryHint(categoryId) {
        const shortName = this.categoryDefinitions[categoryId]?.shortName;
        if (!shortName) return null;

        // Map shortNames to normalization hints
        const hintMap = {
            'phones': 'phones',
            'audio_accessories': 'audio',
            'headphones': 'audio',
            'kitchen_appliances': 'kitchen',
            'microwaves': 'kitchen',
            'coffee_makers': 'kitchen',
            'tea_kettles': 'kitchen',
            'cleaning_appliances': 'kitchen'
        };

        return hintMap[shortName] || null;
    }

    // Get category hints for multiple items
    getMultipleCategoryHints(items) {
        // For mixed categories, we'll pass items with their hints to the normalizer
        return items.map(item => ({
            ...item,
            categoryHint: this.getCategoryHint(item.category)
        }));
    }

    async init() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            this.log('Multi-category crawler initialized');
        } catch (error) {
            this.log(`Initialization error: ${error.message}`);
        }
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(logMessage.trim());

        try {
            await fs.appendFile(this.logFile, logMessage);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    async initBrowser() {
        if (!this.browser) {
            this.log('Launching browser...');
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled'
                ]
            });
        }
        return this.browser;
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.log('Browser closed');
        }
    }

    async getPageContent(url, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            let page = null;
            try {
                this.log(`Attempt ${attempt} to load ${url}`);

                const browser = await this.initBrowser();
                page = await browser.newPage();

                await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36');
                await page.setViewport({ width: 1920, height: 1080 });

                const response = await page.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000
                });

                if (response.status() === 403) {
                    this.log(`403 error on attempt ${attempt}`);
                    if (attempt < retries) {
                        await page.close();
                        await new Promise(resolve => setTimeout(resolve, 15000 * attempt));
                        continue;
                    }
                    throw new Error(`403 Forbidden after ${retries} attempts`);
                }

                await new Promise(resolve => setTimeout(resolve, 3000));

                const content = await page.content();
                await page.close();

                this.log(`Successfully loaded page content (${content.length} characters)`);
                return content;

            } catch (error) {
                this.log(`Attempt ${attempt} failed: ${error.message}`);

                if (page) {
                    try {
                        await page.close();
                    } catch (e) {
                        // Ignore close errors
                    }
                }

                if (attempt === retries) {
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
            }
        }
    }

    extractPrice(priceText) {
        if (!priceText) return null;

        const cleanPrice = priceText.replace(/[^\d.,]/g, '');
        const price = parseFloat(cleanPrice.replace(',', ''));

        return isNaN(price) ? null : price;
    }

    extractItemData($, element, categoryId) {
        try {
            const $item = $(element);

            const title = $item.find('.l').text().trim();
            if (!title) return null;

            const priceElement = $item.find('.p');
            const priceText = priceElement.text().trim();
            const price = this.extractPrice(priceText);

            if (!price || price < this.minPrice || price > this.maxPrice) {
                return null;
            }

            const href = $item.attr('href');
            const id = href ? href.match(/\/item\/(\d+)/)?.[1] : null;

            if (!id) return null;

            const location = $item.find('.at').text().trim();
            const date = $item.find('.d').text().trim();

            return {
                id,
                title,
                price,
                location,
                date,
                category: this.categoryDefinitions[categoryId]?.name || 'Unknown',
                categoryId,
                url: `https://www.list.am${href}`,
                crawledAt: new Date().toISOString()
            };
        } catch (error) {
            this.log(`Error extracting item data: ${error.message}`);
            return null;
        }
    }

    async scrapePage(categoryId, pageNumber = 1) {
        try {
            // Update progress
            this.currentProgress.currentPage = pageNumber;
            this.updateProgress();

            const baseUrl = `https://www.list.am/en/category/${categoryId}`;
            const filterParams = `?n=0&price1=${this.minPrice}&price2=${this.maxPrice}`;

            let url;
            if (pageNumber === 1) {
                url = `${baseUrl}${filterParams}`;
            } else {
                const baseUrlWithoutLang = baseUrl.replace('/en/', '/');
                url = `${baseUrlWithoutLang}/${pageNumber}${filterParams}`;
            }

            this.log(`Scraping ${this.categoryDefinitions[categoryId]?.name} - page ${pageNumber}: ${url}`);

            const content = await this.getPageContent(url);
            const $ = cheerio.load(content);
            const items = [];

            const listings = $('a[href*="/item/"]');
            this.log(`Found ${listings.length} listings on page ${pageNumber}`);

            listings.each((index, element) => {
                const item = this.extractItemData($, element, categoryId);
                if (item) {
                    items.push(item);
                }
            });

            const nextLink = $('a:contains("Next >")');
            const hasNextPage = nextLink.length > 0;

            this.log(`Page ${pageNumber}: Found ${items.length} items in price range, hasNextPage: ${hasNextPage}`);

            await new Promise(resolve => setTimeout(resolve, 5000));

            return { items, hasNextPage };
        } catch (error) {
            this.log(`Error scraping page ${pageNumber}: ${error.message}`);
            return { items: [], hasNextPage: false };
        }
    }

    async scrapeCategory(categoryId) {
        this.log(`Starting to scrape category ${categoryId} (${this.categoryDefinitions[categoryId]?.name})`);

        // Update progress for this category
        this.currentProgress.currentCategory = categoryId;
        this.currentProgress.currentCategoryName = this.categoryDefinitions[categoryId]?.name || 'Unknown';
        this.currentProgress.currentPage = 0;
        this.updateProgress();

        const allItems = [];
        let pageNumber = 1;
        let hasNextPage = true;
        let consecutiveFailures = 0;

        while (hasNextPage && consecutiveFailures < 3) {
            const { items, hasNextPage: nextPageExists } = await this.scrapePage(categoryId, pageNumber);

            if (items.length === 0) {
                consecutiveFailures++;
                this.log(`No items found on page ${pageNumber}, consecutive failures: ${consecutiveFailures}`);

                if (pageNumber > 1) {
                    break;
                }
            } else {
                consecutiveFailures = 0;
            }

            allItems.push(...items);
            hasNextPage = nextPageExists;
            pageNumber++;

            if (pageNumber > 50) {
                this.log('Reached maximum page limit (50), stopping');
                break;
            }
        }

        this.log(`Category ${categoryId} completed. Found ${allItems.length} items`);

        // Update completed categories count
        this.currentProgress.completedCategories++;
        this.currentProgress.totalItems += allItems.length;
        this.updateProgress();

        return allItems;
    }

    async scrapeAllCategories() {
        this.log('Starting to scrape all configured categories');
        const allItems = [];

        try {
            for (const categoryId of this.categories) {
                const categoryItems = await this.scrapeCategory(categoryId);
                allItems.push(...categoryItems);

                // Delay between categories
                if (this.categories.indexOf(categoryId) < this.categories.length - 1) {
                    this.log('Waiting before next category...');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
            }
        } finally {
            await this.closeBrowser();
        }

        this.log(`Scraping completed. Found ${allItems.length} total items across ${this.categories.length} categories`);
        return allItems;
    }

    getDataFiles(categories = null) {
        const cats = categories || this.categories;
        const categoryNames = cats.map(id => this.categoryDefinitions[id]?.shortName || id).join('_');

        return {
            current: path.join(this.dataDir, `current_${categoryNames}.json`),
            previous: path.join(this.dataDir, `previous_${categoryNames}.json`),
            statistics: path.join(this.dataDir, `statistics_${categoryNames}.json`)
        };
    }

    async saveCurrentData(items) {
        try {
            const files = this.getDataFiles();

            try {
                const currentData = await fs.readFile(files.current, 'utf-8');
                await fs.writeFile(files.previous, currentData);
                this.log('Previous data backed up');
            } catch (error) {
                this.log('No previous data to backup');
            }

            await fs.writeFile(files.current, JSON.stringify(items, null, 2));
            this.log(`Saved ${items.length} items to current data file`);
        } catch (error) {
            this.log(`Error saving data: ${error.message}`);
        }
    }

    async saveCurrentDataForCategory(items, categoryId) {
        try {
            // Create a temporary instance with only this category to get correct file names
            const originalCategories = this.categories;
            this.categories = [categoryId];
            const files = this.getDataFiles();
            this.categories = originalCategories; // Restore original categories

            try {
                const currentData = await fs.readFile(files.current, 'utf-8');
                await fs.writeFile(files.previous, currentData);
                this.log(`Previous data backed up for category ${categoryId}`);
            } catch (error) {
                this.log(`No previous data to backup for category ${categoryId}`);
            }

            await fs.writeFile(files.current, JSON.stringify(items, null, 2));
            this.log(`Saved ${items.length} items to current data file for category ${categoryId}`);
        } catch (error) {
            this.log(`Error saving data for category ${categoryId}: ${error.message}`);
        }
    }

    async loadData(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            this.log(`Could not load data from ${filePath}: ${error.message}`);
            return [];
        }
    }


    async calculateStatistics() {
        this.log('Calculating statistics');

        const files = this.getDataFiles();
        const currentItems = await this.loadData(files.current);
        const previousItems = await this.loadData(files.previous);

        if (previousItems.length === 0) {
            this.log('No previous data available for statistics');
            return null;
        }

        // Filter previous items to current price range to avoid false "sold" items
        // when price range has changed between crawls
        const filteredPreviousItems = previousItems.filter(item => {
            const price = item.price;
            return price && price >= this.minPrice && price <= this.maxPrice;
        });

        this.log(`Price range filtering: ${previousItems.length} -> ${filteredPreviousItems.length} previous items`);

        const currentIds = new Set(currentItems.map(item => item.id));
        const previousIds = new Set(filteredPreviousItems.map(item => item.id));

        const soldItems = filteredPreviousItems.filter(item => !currentIds.has(item.id));
        const newItems = currentItems.filter(item => !previousIds.has(item.id));

        // Group by category
        const soldByCategory = {};
        const newByCategory = {};

        soldItems.forEach(item => {
            const cat = item.category || 'Unknown';
            soldByCategory[cat] = (soldByCategory[cat] || 0) + 1;
        });

        newItems.forEach(item => {
            const cat = item.category || 'Unknown';
            newByCategory[cat] = (newByCategory[cat] || 0) + 1;
        });

        // Group sold items by title (with normalization)
        const soldByTitle = {};
        const soldByNormalizedTitle = {};
        soldItems.forEach(item => {
            if (item.title && item.title.trim()) {
                // Original title grouping
                soldByTitle[item.title] = (soldByTitle[item.title] || 0) + 1;

                // Normalized title grouping for better duplicate detection
                const categoryHint = this.getCategoryHint(item.category);
                const normalizedTitle = this.normalizer.normalizeTitle(item.title, categoryHint);
                if (normalizedTitle) {
                    soldByNormalizedTitle[normalizedTitle] = (soldByNormalizedTitle[normalizedTitle] || 0) + 1;
                }
            }
        });

        // Get normalization statistics
        const allCurrentItems = [...currentItems, ...filteredPreviousItems];
        const normalizationStats = this.normalizer.getNormalizationStats(allCurrentItems);

        const statistics = {
            date: new Date().toISOString().split('T')[0],
            categories: this.categories.map(id => ({
                id,
                name: this.categoryDefinitions[id]?.name || 'Unknown'
            })),
            priceRange: { min: this.minPrice, max: this.maxPrice },
            totalCurrentItems: currentItems.length,
            totalPreviousItems: filteredPreviousItems.length,
            soldItemsCount: soldItems.length,
            newItemsCount: newItems.length,
            soldByCategory,
            newByCategory,
            soldItemsByTitle: Object.entries(soldByTitle)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 20)
                .reduce((obj, [title, count]) => {
                    obj[title] = count;
                    return obj;
                }, {}),
            soldItemsByNormalizedTitle: Object.entries(soldByNormalizedTitle)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 20)
                .reduce((obj, [title, count]) => {
                    obj[title] = count;
                    return obj;
                }, {}),
            normalizationStats,
            soldItems: soldItems.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price,
                location: item.location,
                category: item.category
            }))
        };

        try {
            let allStatistics = [];
            try {
                const existingStats = await fs.readFile(files.statistics, 'utf-8');
                allStatistics = JSON.parse(existingStats);
            } catch (error) {
                // File doesn't exist yet
            }

            allStatistics.push(statistics);
            allStatistics = allStatistics.slice(-30);

            await fs.writeFile(files.statistics, JSON.stringify(allStatistics, null, 2));
            this.log(`Statistics calculated: ${soldItems.length} items sold, ${newItems.length} new items`);
        } catch (error) {
            this.log(`Error saving statistics: ${error.message}`);
        }

        return statistics;
    }

    async calculateStatisticsForCategory(categoryId) {
        this.log(`Calculating statistics for category ${categoryId}`);

        // Create a temporary instance with only this category to get correct file names
        const originalCategories = this.categories;
        this.categories = [categoryId];
        const files = this.getDataFiles();
        this.categories = originalCategories; // Restore original categories

        const currentItems = await this.loadData(files.current);
        const previousItems = await this.loadData(files.previous);

        if (previousItems.length === 0) {
            this.log(`No previous data available for statistics for category ${categoryId}`);
            return null;
        }

        // Filter previous items to current price range to avoid false "sold" items
        // when price range has changed between crawls
        const filteredPreviousItems = previousItems.filter(item => {
            const price = item.price;
            return price && price >= this.minPrice && price <= this.maxPrice;
        });

        this.log(`Price range filtering for category ${categoryId}: ${previousItems.length} -> ${filteredPreviousItems.length} previous items`);

        const currentIds = new Set(currentItems.map(item => item.id));
        const previousIds = new Set(filteredPreviousItems.map(item => item.id));

        const soldItems = filteredPreviousItems.filter(item => !currentIds.has(item.id));
        const newItems = currentItems.filter(item => !previousIds.has(item.id));

        // Group by category
        const soldByCategory = {};
        const newByCategory = {};

        soldItems.forEach(item => {
            const cat = item.category || 'Unknown';
            soldByCategory[cat] = (soldByCategory[cat] || 0) + 1;
        });

        newItems.forEach(item => {
            const cat = item.category || 'Unknown';
            newByCategory[cat] = (newByCategory[cat] || 0) + 1;
        });

        // Group sold items by title (with normalization)
        const soldByTitle = {};
        const soldByNormalizedTitle = {};
        const categoryHint = this.getCategoryHint(categoryId);
        soldItems.forEach(item => {
            if (item.title && item.title.trim()) {
                // Original title grouping
                soldByTitle[item.title] = (soldByTitle[item.title] || 0) + 1;

                // Normalized title grouping for better duplicate detection
                const normalizedTitle = this.normalizer.normalizeTitle(item.title, categoryHint);
                if (normalizedTitle) {
                    soldByNormalizedTitle[normalizedTitle] = (soldByNormalizedTitle[normalizedTitle] || 0) + 1;
                }
            }
        });

        // Get normalization statistics
        const allCurrentItems = [...currentItems, ...filteredPreviousItems];
        const normalizationStats = this.normalizer.getNormalizationStats(allCurrentItems, categoryHint);

        const statistics = {
            date: new Date().toISOString().split('T')[0],
            categories: [categoryId].map(id => ({
                id,
                name: this.categoryDefinitions[id]?.name || 'Unknown'
            })),
            priceRange: { min: this.minPrice, max: this.maxPrice },
            totalCurrentItems: currentItems.length,
            totalPreviousItems: filteredPreviousItems.length,
            soldItemsCount: soldItems.length,
            newItemsCount: newItems.length,
            soldByCategory,
            newByCategory,
            soldItemsByTitle: Object.entries(soldByTitle)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 20)
                .reduce((obj, [title, count]) => {
                    obj[title] = count;
                    return obj;
                }, {}),
            soldItemsByNormalizedTitle: Object.entries(soldByNormalizedTitle)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 20)
                .reduce((obj, [title, count]) => {
                    obj[title] = count;
                    return obj;
                }, {}),
            normalizationStats,
            soldItems: soldItems.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price,
                location: item.location,
                category: item.category
            }))
        };

        try {
            let allStatistics = [];
            try {
                const existingStats = await fs.readFile(files.statistics, 'utf-8');
                allStatistics = JSON.parse(existingStats);
            } catch (error) {
                // File doesn't exist yet
            }

            allStatistics.push(statistics);
            allStatistics = allStatistics.slice(-30);

            await fs.writeFile(files.statistics, JSON.stringify(allStatistics, null, 2));
            this.log(`Statistics calculated for category ${categoryId}: ${soldItems.length} items sold, ${newItems.length} new items`);
        } catch (error) {
            this.log(`Error saving statistics for category ${categoryId}: ${error.message}`);
        }

        return statistics;
    }

    async run() {
        // Initialize progress tracking
        this.isRunning = true;
        this.currentProgress = {
            isRunning: true,
            currentCategory: null,
            currentCategoryName: null,
            currentPage: 0,
            totalCategories: this.categories.length,
            completedCategories: 0,
            totalItems: 0,
            startTime: Date.now(),
            estimatedTimeRemaining: null,
            status: 'starting'
        };

        this.log('=== Starting crawl ===');
        this.log(`Categories: ${this.categories.map(id => this.categoryDefinitions[id]?.name).join(', ')}`);
        this.log(`Price range: ${this.minPrice}֏ - ${this.maxPrice}֏`);

        try {
            this.currentProgress.status = 'crawling';
            this.updateProgress();

            // Process each category individually to create separate data files
            for (const categoryId of this.categories) {
                await this.processCategoryIndividually(categoryId);
            }

            this.currentProgress.status = 'completed';
            this.log('=== All categories crawl completed successfully ===');
        } catch (error) {
            this.currentProgress.status = 'error';
            this.log(`Critical error during crawl: ${error.message}`);
        } finally {
            await this.closeBrowser();
            this.isRunning = false;
            this.currentProgress.isRunning = false;
            this.updateProgress();
        }
    }

    async processCategoryIndividually(categoryId) {
        const categoryName = this.categoryDefinitions[categoryId]?.name || 'Unknown';
        this.log(`\n=== Processing category: ${categoryName} ===`);

        try {
            // Scrape only this category
            const items = await this.scrapeCategory(categoryId);

            if (items.length === 0) {
                this.log(`No items found for category ${categoryName}, skipping data save`);
                return;
            }

            // Save data for this specific category
            await this.saveCurrentDataForCategory(items, categoryId);

            // Calculate statistics for this specific category
            const statistics = await this.calculateStatisticsForCategory(categoryId);

            if (statistics) {
                this.log(`${categoryName} - Statistics: ${statistics.soldItemsCount} items sold, ${statistics.newItemsCount} new items`);
                console.log(`\n${categoryName} - Sold items by category:`);
                Object.entries(statistics.soldByCategory).forEach(([category, count]) => {
                    console.log(`  ${category}: ${count} sold`);
                });
            }

            this.log(`=== ${categoryName} processing completed ===`);
        } catch (error) {
            this.log(`Error processing category ${categoryName}: ${error.message}`);
        }
    }


    async getLatestStatistics() {
        try {
            const files = this.getDataFiles();
            const allStatistics = await this.loadData(files.statistics);
            return allStatistics[allStatistics.length - 1] || null;
        } catch (error) {
            this.log(`Error getting latest statistics: ${error.message}`);
            return null;
        }
    }

    updateProgress() {
        // Calculate estimated time remaining
        if (this.currentProgress.startTime && this.currentProgress.completedCategories > 0) {
            const elapsed = Date.now() - this.currentProgress.startTime;
            const avgTimePerCategory = elapsed / this.currentProgress.completedCategories;
            const remainingCategories = this.currentProgress.totalCategories - this.currentProgress.completedCategories;
            this.currentProgress.estimatedTimeRemaining = Math.round(avgTimePerCategory * remainingCategories / 1000); // in seconds
        }
    }

    getProgress() {
        return { ...this.currentProgress };
    }

    resetProgress() {
        this.currentProgress = {
            isRunning: false,
            currentCategory: null,
            currentCategoryName: null,
            currentPage: 0,
            totalCategories: 0,
            completedCategories: 0,
            totalItems: 0,
            startTime: null,
            estimatedTimeRemaining: null,
            status: 'idle',
            estimatedPagesPerCategory: 10,
            maxPagesPerCategory: 50
        };
    }

    getCategoryDefinitions() {
        return this.categoryDefinitions;
    }
}

// Usage
const crawler = new MultiCategoryCrawler();

// Handle process termination
process.on('SIGINT', async () => {
    console.log('Received SIGINT, closing browser...');
    await crawler.closeBrowser();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, closing browser...');
    await crawler.closeBrowser();
    process.exit(0);
});

if (require.main === module) {
    const command = process.argv[2];

    if (command === 'crawl') {
        // Allow specifying categories and price range via command line
        const categories = process.argv[3] ? process.argv[3].split(',').map(Number) : [36];
        const minPrice = process.argv[4] ? parseInt(process.argv[4]) : 5000;
        const maxPrice = process.argv[5] ? parseInt(process.argv[5]) : 80000;

        crawler.setCategories(categories).setPriceRange(minPrice, maxPrice);
        crawler.run();
    } else if (command === 'stats') {
        crawler.getLatestStatistics().then(stats => {
            if (stats) {
                console.log('Latest Statistics:');
                console.log(JSON.stringify(stats, null, 2));
            } else {
                console.log('No statistics available yet');
            }
        });
    } else if (command === 'categories') {
        console.log('Available categories:');
        Object.entries(crawler.getCategoryDefinitions()).forEach(([id, info]) => {
            console.log(`  ${id}: ${info.name}`);
        });
    } else {
        console.log('Available commands:');
        console.log('  node index.js crawl [categories] [minPrice] [maxPrice]');
        console.log('    Example: node index.js crawl "36,98,183" 10000 50000');
        console.log('  node index.js stats      - Show latest statistics');
        console.log('  node index.js categories - Show all available categories');
    }
}

module.exports = MultiCategoryCrawler;