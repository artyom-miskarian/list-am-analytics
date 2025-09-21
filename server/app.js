const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const cron = require('node-cron');

const MultiCategoryCrawler = require('../index.js');
const DailyCrawlJob = require('../cron-daily-crawl.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const crawler = new MultiCategoryCrawler();

app.get('/api/statistics', async (req, res) => {
    try {
        const stats = await crawler.getLatestStatistics();
        if (!stats) {
            return res.status(404).json({ error: 'No statistics available' });
        }
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

app.get('/api/statistics/history', async (req, res) => {
    try {
        const files = crawler.getDataFiles();
        const allStatistics = await loadData(files.statistics);
        res.json(allStatistics);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get statistics history' });
    }
});

app.get('/api/items/current', async (req, res) => {
    try {
        const files = crawler.getDataFiles();
        const currentItems = await loadData(files.current);
        res.json(currentItems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get current items' });
    }
});

app.get('/api/items/sold', async (req, res) => {
    try {
        const stats = await crawler.getLatestStatistics();
        if (!stats || !stats.soldItems) {
            return res.status(404).json({ error: 'No sold items data available' });
        }
        res.json(stats.soldItems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get sold items' });
    }
});

app.get('/api/categories', (req, res) => {
    try {
        const categories = crawler.getCategoryDefinitions();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

app.get('/api/categories/all-data', async (req, res) => {
    try {
        const allCategoryData = await getAllCategoryData();
        res.json(allCategoryData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get all category data' });
    }
});

app.get('/api/categories/:categoryShortName/data', async (req, res) => {
    try {
        const { categoryShortName } = req.params;
        const categoryData = await getCategoryData(categoryShortName);
        if (!categoryData) {
            return res.status(404).json({ error: 'Category data not found' });
        }
        res.json(categoryData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get category data' });
    }
});

app.post('/api/crawl/start', async (req, res) => {
    try {
        const { categories, minPrice, maxPrice } = req.body;

        if (categories) crawler.setCategories(categories);
        if (minPrice != null && maxPrice != null && !isNaN(minPrice) && !isNaN(maxPrice)) {
            crawler.setPriceRange(minPrice, maxPrice);
        }

        crawler.run().then(() => {
            console.log('Manual crawl completed');
        }).catch(error => {
            console.error('Manual crawl failed:', error);
        });

        res.json({ message: 'Crawl started' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start crawl' });
    }
});

app.get('/api/crawl/status', async (req, res) => {
    try {
        const files = crawler.getDataFiles();

        let lastCrawlTime = null;
        try {
            const stats = await fs.stat(files.current);
            lastCrawlTime = stats.mtime;
        } catch (error) {
            // File doesn't exist
        }

        // Get the real-time progress from the crawler
        const progress = crawler.getProgress();

        res.json({
            lastCrawlTime,
            isRunning: crawler.isRunning || false,
            progress: progress
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get crawl status' });
    }
});

// New analytics endpoints
app.get('/api/analytics/price-trends', async (req, res) => {
    try {
        const priceTrends = await getPriceTrends();
        res.json(priceTrends);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get price trends' });
    }
});

app.get('/api/analytics/market-velocity', async (req, res) => {
    try {
        const velocity = await getMarketVelocity();
        res.json(velocity);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get market velocity' });
    }
});

app.get('/api/analytics/top-performers', async (req, res) => {
    try {
        const topPerformers = await getTopPerformers();
        res.json(topPerformers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get top performers' });
    }
});

app.get('/api/analytics/time-to-sell', async (req, res) => {
    try {
        const timeToSell = await getTimeToSellMetrics();
        res.json(timeToSell);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get time-to-sell metrics' });
    }
});

async function loadData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.log(`Could not load data from ${filePath}: ${error.message}`);
        return [];
    }
}

async function getAllCategoryData() {
    const dataDir = './crawler_data';
    const categoryDefinitions = crawler.getCategoryDefinitions();

    try {
        const files = await fs.readdir(dataDir);
        const statisticsFiles = files.filter(f => f.startsWith('statistics_') && f.endsWith('.json'));

        const allData = [];

        for (const statsFile of statisticsFiles) {
            const categoryName = statsFile.replace('statistics_', '').replace('.json', '');
            const statsPath = path.join(dataDir, statsFile);
            const currentPath = path.join(dataDir, `current_${categoryName}.json`);

            const stats = await loadData(statsPath);
            const currentItems = await loadData(currentPath);

            if (stats.length > 0) {
                // Find the statistics entry with the most sold items, fallback to latest if none have sold items
                const statsWithSoldItems = stats.filter(s => s.soldItemsCount > 0);
                const latestStats = statsWithSoldItems.length > 0
                    ? statsWithSoldItems.reduce((prev, current) =>
                        (current.soldItemsCount > prev.soldItemsCount) ? current : prev
                    )
                    : stats[stats.length - 1];

                // Find category info
                const categoryInfo = Object.values(categoryDefinitions).find(
                    cat => cat.shortName === categoryName
                );

                allData.push({
                    categoryName,
                    categoryInfo,
                    latestStats,
                    currentItems: currentItems.slice(0, 20), // Limit for performance
                    history: stats
                });
            }
        }

        return allData;
    } catch (error) {
        console.error('Error getting all category data:', error);
        return [];
    }
}

async function getCategoryData(categoryShortName) {
    const dataDir = './crawler_data';
    const categoryDefinitions = crawler.getCategoryDefinitions();

    try {
        const statsPath = path.join(dataDir, `statistics_${categoryShortName}.json`);
        const currentPath = path.join(dataDir, `current_${categoryShortName}.json`);
        const previousPath = path.join(dataDir, `previous_${categoryShortName}.json`);

        const stats = await loadData(statsPath);
        const currentItems = await loadData(currentPath);
        const previousItems = await loadData(previousPath);

        if (stats.length === 0) {
            return null;
        }

        // Find the statistics entry with the most sold items, fallback to latest if none have sold items
        const statsWithSoldItems = stats.filter(s => s.soldItemsCount > 0);
        const latestStats = statsWithSoldItems.length > 0
            ? statsWithSoldItems.reduce((prev, current) =>
                (current.soldItemsCount > prev.soldItemsCount) ? current : prev
            )
            : stats[stats.length - 1];

        // Find category info
        const categoryInfo = Object.values(categoryDefinitions).find(
            cat => cat.shortName === categoryShortName
        );

        return {
            categoryName: categoryShortName,
            categoryInfo,
            latestStats,
            currentItems,
            previousItems,
            history: stats
        };
    } catch (error) {
        console.error(`Error getting category data for ${categoryShortName}:`, error);
        return null;
    }
}

// Analytics functions
async function getPriceTrends() {
    const allCategoryData = await getAllCategoryData();
    const trends = {};

    allCategoryData.forEach(categoryData => {
        const categoryName = categoryData.categoryInfo?.name || categoryData.categoryName;
        const history = categoryData.history.slice(-30); // Last 30 entries

        trends[categoryName] = history.map(stats => {
            const soldItems = stats.soldItems || [];
            const avgPrice = soldItems.length > 0
                ? soldItems.reduce((sum, item) => sum + (item.price || 0), 0) / soldItems.length
                : 0;

            return {
                date: stats.date,
                avgPrice: Math.round(avgPrice),
                soldCount: stats.soldItemsCount || 0,
                totalItems: stats.totalCurrentItems || 0
            };
        });
    });

    return trends;
}

async function getMarketVelocity() {
    const allCategoryData = await getAllCategoryData();
    const velocity = {};

    allCategoryData.forEach(categoryData => {
        const categoryName = categoryData.categoryInfo?.name || categoryData.categoryName;
        const recentHistory = categoryData.history.slice(-7); // Last 7 days

        if (recentHistory.length >= 2) {
            const totalSold = recentHistory.reduce((sum, stats) => sum + (stats.soldItemsCount || 0), 0);
            const dailyAvg = totalSold / recentHistory.length;

            velocity[categoryName] = {
                itemsPerDay: Math.round(dailyAvg * 10) / 10,
                totalSoldRecent: totalSold,
                trend: recentHistory.length >= 3 ? calculateTrend(recentHistory) : 'stable'
            };
        }
    });

    return velocity;
}

async function getTopPerformers() {
    const allCategoryData = await getAllCategoryData();
    const performers = [];

    allCategoryData.forEach(categoryData => {
        const stats = categoryData.latestStats;
        const soldByTitle = stats.soldItemsByTitle || {};
        const allSoldFingerprints = (stats.aiNormalization && stats.aiNormalization.allSoldFingerprints) || {};

        // Use AI-normalized data if available, otherwise fall back to title-based
        const dataToUse = Object.keys(allSoldFingerprints).length > 0 ? allSoldFingerprints : soldByTitle;

        Object.entries(dataToUse).forEach(([product, data]) => {
            const count = typeof data === 'object' ? data.count : data;
            const avgPrice = typeof data === 'object' ? data.avgPrice : 0;

            if (count >= 2) { // Only include products sold multiple times
                performers.push({
                    product: cleanProductName(product),
                    category: categoryData.categoryInfo?.name || categoryData.categoryName,
                    timesSold: count,
                    avgPrice: Math.round(avgPrice),
                    revenue: Math.round(count * avgPrice)
                });
            }
        });
    });

    return performers.sort((a, b) => b.timesSold - a.timesSold).slice(0, 20);
}

async function getTimeToSellMetrics() {
    const allCategoryData = await getAllCategoryData();
    const metrics = {};

    allCategoryData.forEach(categoryData => {
        const categoryName = categoryData.categoryInfo?.name || categoryData.categoryName;
        const history = categoryData.history.slice(-10); // Last 10 crawls

        if (history.length >= 2) {
            // Estimate time-to-sell based on inventory turnover
            const avgInventory = history.reduce((sum, stats) => sum + (stats.totalCurrentItems || 0), 0) / history.length;
            const avgSold = history.reduce((sum, stats) => sum + (stats.soldItemsCount || 0), 0) / history.length;

            const estimatedDaysToSell = avgSold > 0 ? Math.round(avgInventory / avgSold) : 0;

            metrics[categoryName] = {
                estimatedDaysToSell,
                avgInventory: Math.round(avgInventory),
                avgSoldPerCrawl: Math.round(avgSold),
                turnoverRate: avgInventory > 0 ? Math.round((avgSold / avgInventory) * 100) : 0
            };
        }
    });

    return metrics;
}

function calculateTrend(history) {
    if (history.length < 3) return 'stable';

    const recent = history.slice(-3);
    const first = recent[0].soldItemsCount || 0;
    const last = recent[recent.length - 1].soldItemsCount || 0;

    if (last > first * 1.2) return 'increasing';
    if (last < first * 0.8) return 'decreasing';
    return 'stable';
}

function cleanProductName(name) {
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/\s+/g, ' ')
        .trim();
}

// Initialize daily cron job
const dailyCrawlJob = new DailyCrawlJob();

// Schedule daily crawl at 2:00 AM Armenia time (GMT+4)
// Cron format: minute hour day month weekday
// 0 2 * * * = Every day at 2:00 AM
cron.schedule('0 2 * * *', async () => {
    console.log('Starting scheduled daily crawl...');
    await dailyCrawlJob.run();
}, {
    timezone: "Asia/Yerevan"
});

console.log('Daily crawl job scheduled for 2:00 AM Armenia time');

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Daily crawl cron job is active');
});