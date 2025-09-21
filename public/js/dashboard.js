class Dashboard {
    constructor() {
        this.charts = {};
        this.categories = {};
        this.allCategoryData = [];
        this.currentView = 'all';
        this.progressCheckInterval = null;


        // Analytics data cache
        this.analyticsData = {
            priceTrends: {},
            marketVelocity: {},
            topPerformers: [],
            timeToSell: {}
        };

        // Pagination state
        this.pagination = {
            soldByNormalizedTitle: {
                currentPage: 1,
                pageSize: 15,
                totalItems: 0,
                data: []
            }
        };

        this.initializeEventListeners();
        this.loadData();
        this.setupAutoRefresh();
        this.checkCrawlStatus(); // Check if a crawl is already running
    }

    initializeEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadData());
        document.getElementById('crawlBtn').addEventListener('click', () => this.showCrawlModal());
        document.getElementById('categorySelect').addEventListener('change', (e) => this.switchCategory(e.target.value));

        // Pagination event listeners
        this.setupPaginationEventListeners();

        const modal = document.getElementById('modal');
        const closeBtn = modal.querySelector('.close');
        const crawlForm = document.getElementById('crawlForm');

        closeBtn.addEventListener('click', () => this.hideCrawlModal());
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.hideCrawlModal();
        });

        crawlForm.addEventListener('submit', (e) => this.handleCrawlSubmit(e));
    }

    setupPaginationEventListeners() {
        // Sold by normalized title pagination
        document.getElementById('soldByNormalizedTitlePrevBtn').addEventListener('click', () => this.changePage('soldByNormalizedTitle', -1));
        document.getElementById('soldByNormalizedTitleNextBtn').addEventListener('click', () => this.changePage('soldByNormalizedTitle', 1));
        document.getElementById('soldByNormalizedTitlePageSize').addEventListener('change', (e) => this.changePageSize('soldByNormalizedTitle', parseInt(e.target.value)));
    }


    async loadData() {
        try {
            await Promise.all([
                this.loadAllCategoryData(),
                this.loadAvailableCategories(),
                this.loadAnalyticsData()
            ]);
            this.updateCategorySelect(); // Update dropdown after data is loaded
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadAnalyticsData() {
        try {
            const [priceTrends, marketVelocity, topPerformers, timeToSell] = await Promise.all([
                fetch('/api/analytics/price-trends').then(r => r.json()).catch(() => ({})),
                fetch('/api/analytics/market-velocity').then(r => r.json()).catch(() => ({})),
                fetch('/api/analytics/top-performers').then(r => r.json()).catch(() => []),
                fetch('/api/analytics/time-to-sell').then(r => r.json()).catch(() => ({}))
            ]);

            this.analyticsData = {
                priceTrends,
                marketVelocity,
                topPerformers,
                timeToSell
            };
        } catch (error) {
            console.log('Failed to load analytics data');
        }
    }

    async loadAllCategoryData() {
        try {
            const response = await fetch('/api/categories/all-data');
            if (response.ok) {
                this.allCategoryData = await response.json();
            } else {
                this.allCategoryData = [];
            }
        } catch (error) {
            console.log('No category data available');
            this.allCategoryData = [];
        }
    }

    async loadAvailableCategories() {
        try {
            const response = await fetch('/api/categories');
            const categories = await response.json();
            this.categories = categories;
        } catch (error) {
            console.log('Failed to load categories');
        }
    }

    updateCategorySelect() {
        const select = document.getElementById('categorySelect');

        // Clear existing options except "All Categories"
        select.innerHTML = '<option value="all">All Categories</option>';

        // Add options for categories that have data
        this.allCategoryData.forEach(categoryData => {
            const option = document.createElement('option');
            option.value = categoryData.categoryName;
            option.textContent = categoryData.categoryInfo?.name || categoryData.categoryName;
            select.appendChild(option);
        });
    }

    switchCategory(categoryName) {
        this.currentView = categoryName;
        this.updateDisplay();
    }

    updateDisplay() {
        if (this.currentView === 'all') {
            this.showAllCategoriesView();
        } else {
            this.showSingleCategoryView(this.currentView);
        }
    }

    showAllCategoriesView() {
        this.updateTotalStats();
        this.updateCategoriesOverview();
        this.updateChartsForAllCategories();
        this.updateTablesForAllCategories();
        this.updateAnalyticsDisplay();
        this.hideSoldItemsAnalysis();
        this.showCategoriesOverviewBelowStats();
    }

    async showSingleCategoryView(categoryName) {
        try {
            const response = await fetch(`/api/categories/${categoryName}/data`);
            if (response.ok) {
                const categoryData = await response.json();
                this.updateSingleCategoryStats(categoryData);
                this.updateChartsForSingleCategory(categoryData);
                this.updateTablesForSingleCategory(categoryData);
                this.updateAnalyticsDisplayForCategory(categoryData);
                this.showSoldItemsAnalysis(categoryData);
                this.showCategoryOverviewInGrid(categoryData);
            }
        } catch (error) {
            console.error('Error loading single category data:', error);
        }
    }

    updateTotalStats() {
        const totals = this.allCategoryData.reduce((acc, categoryData) => {
            const stats = categoryData.latestStats;
            return {
                currentItems: acc.currentItems + (stats.totalCurrentItems || 0),
                soldItems: acc.soldItems + (stats.soldItemsCount || 0),
                newItems: acc.newItems + (stats.newItemsCount || 0)
            };
        }, { currentItems: 0, soldItems: 0, newItems: 0 });

        document.getElementById('totalCurrentItems').textContent = totals.currentItems.toLocaleString();
        document.getElementById('totalSoldItems').textContent = totals.soldItems.toLocaleString();
        document.getElementById('totalNewItems').textContent = totals.newItems.toLocaleString();
        document.getElementById('categoriesCount').textContent = this.allCategoryData.length.toString();

        // Show categories count for all categories view
        document.getElementById('categoriesCountItem').style.display = 'flex';

        // Update last crawl info
        this.updateLastCrawlInfo();
    }

    updateLastCrawlInfo() {
        if (this.allCategoryData.length === 0) {
            document.getElementById('lastCrawlDate').textContent = '-';
            document.getElementById('oldestCrawlDate').textContent = '-';
            document.getElementById('crawlStatus').textContent = 'No data';
            return;
        }

        const allDates = this.allCategoryData.map(categoryData => categoryData.latestStats.date).filter(Boolean);

        if (allDates.length === 0) {
            document.getElementById('lastCrawlDate').textContent = '-';
            document.getElementById('oldestCrawlDate').textContent = '-';
            document.getElementById('crawlStatus').textContent = 'No dates available';
            return;
        }

        allDates.sort();
        const mostRecent = allDates[allDates.length - 1];
        const oldest = allDates[0];

        document.getElementById('lastCrawlDate').textContent = this.formatDate(mostRecent);
        document.getElementById('oldestCrawlDate').textContent = this.formatDate(oldest);

        // Calculate status based on how recent the last crawl was
        const today = new Date().toISOString().split('T')[0];
        const daysDiff = this.getDaysDifference(mostRecent, today);

        let status = '';
        if (daysDiff === 0) {
            status = '✅ Up to date';
        } else if (daysDiff === 1) {
            status = '⚠️ 1 day old';
        } else if (daysDiff <= 7) {
            status = `⚠️ ${daysDiff} days old`;
        } else {
            status = `❌ ${daysDiff} days old`;
        }

        document.getElementById('crawlStatus').textContent = status;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getDaysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const timeDiff = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    updateCategoriesOverview() {
        // Target the specific categories-grid inside the all categories section
        const container = document.querySelector('#categoriesOverview .categories-grid');

        if (this.allCategoryData.length === 0) {
            container.innerHTML = '<div class="loading">No category data available</div>';
            return;
        }

        container.innerHTML = this.allCategoryData.map(categoryData => {
            const stats = categoryData.latestStats;
            const info = categoryData.categoryInfo;

            return `
                <div class="category-item-card">
                    <h4>${info?.name || categoryData.categoryName}</h4>
                    <div class="category-stats">
                        <div class="category-stat">
                            <span class="label">Items:</span>
                            <span class="value">${(stats.totalCurrentItems || 0).toLocaleString()}</span>
                        </div>
                        <div class="category-stat">
                            <span class="label">Sold:</span>
                            <span class="value">${(stats.soldItemsCount || 0).toLocaleString()}</span>
                        </div>
                        <div class="category-stat">
                            <span class="label">New:</span>
                            <span class="value">${(stats.newItemsCount || 0).toLocaleString()}</span>
                        </div>
                        <div class="category-stat">
                            <span class="label">Price Range:</span>
                            <span class="value">${(stats.priceRange?.min || 0).toLocaleString()}֏ - ${(stats.priceRange?.max || 0).toLocaleString()}֏</span>
                        </div>
                        <div class="category-stat">
                            <span class="label">Last Crawl:</span>
                            <span class="value">${this.formatDate(stats.date)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateSingleCategoryStats(categoryData) {
        const stats = categoryData.latestStats;

        document.getElementById('totalCurrentItems').textContent = (stats.totalCurrentItems || 0).toLocaleString();
        document.getElementById('totalSoldItems').textContent = (stats.soldItemsCount || 0).toLocaleString();
        document.getElementById('totalNewItems').textContent = (stats.newItemsCount || 0).toLocaleString();

        // Hide categories count for single category view
        document.getElementById('categoriesCountItem').style.display = 'none';

        // Update last crawl info for single category
        this.updateSingleCategoryLastCrawlInfo(categoryData);

        // Update categories overview to show only this category
        const container = document.querySelector('.categories-grid');
        const info = categoryData.categoryInfo;

        container.innerHTML = `
            <div class="category-item-card">
                <h4>${info?.name || categoryData.categoryName}</h4>
                <div class="category-stats">
                    <div class="category-stat">
                        <span class="label">Items:</span>
                        <span class="value">${(stats.totalCurrentItems || 0).toLocaleString()}</span>
                    </div>
                    <div class="category-stat">
                        <span class="label">Sold:</span>
                        <span class="value">${(stats.soldItemsCount || 0).toLocaleString()}</span>
                    </div>
                    <div class="category-stat">
                        <span class="label">New:</span>
                        <span class="value">${(stats.newItemsCount || 0).toLocaleString()}</span>
                    </div>
                    <div class="category-stat">
                        <span class="label">Price Range:</span>
                        <span class="value">${(stats.priceRange?.min || 0).toLocaleString()}֏ - ${(stats.priceRange?.max || 0).toLocaleString()}֏</span>
                    </div>
                    <div class="category-stat">
                        <span class="label">Last Crawl:</span>
                        <span class="value">${this.formatDate(stats.date)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    updateSingleCategoryLastCrawlInfo(categoryData) {
        const stats = categoryData.latestStats;
        const history = categoryData.history || [];

        if (!stats.date) {
            document.getElementById('lastCrawlDate').textContent = '-';
            document.getElementById('oldestCrawlDate').textContent = '-';
            document.getElementById('crawlStatus').textContent = 'No data';
            return;
        }

        // Get the oldest and newest crawl dates from history
        const allDates = history.map(h => h.date).filter(Boolean).sort();
        const oldestDate = allDates.length > 0 ? allDates[0] : stats.date;
        const newestDate = stats.date;

        document.getElementById('lastCrawlDate').textContent = this.formatDate(newestDate);
        document.getElementById('oldestCrawlDate').textContent = this.formatDate(oldestDate);

        // Calculate status for this specific category
        const today = new Date().toISOString().split('T')[0];
        const daysDiff = this.getDaysDifference(newestDate, today);

        let status = '';
        if (daysDiff === 0) {
            status = '✅ Current';
        } else if (daysDiff === 1) {
            status = '⚠️ 1 day ago';
        } else if (daysDiff <= 7) {
            status = `⚠️ ${daysDiff} days ago`;
        } else {
            status = `❌ ${daysDiff} days ago`;
        }

        document.getElementById('crawlStatus').textContent = status;
    }

    updateChartsForAllCategories() {
        // Show the category chart section for all categories view
        this.showCategoryChart();
        this.showPriceTrendsChart();

        // Update price trends chart
        this.updatePriceTrendsChart();

        // Combined category chart
        const combinedCategoryData = {};
        this.allCategoryData.forEach(categoryData => {
            const stats = categoryData.latestStats;
            const categoryName = categoryData.categoryInfo?.name || categoryData.categoryName;
            combinedCategoryData[categoryName] = stats.soldItemsCount || 0;
        });
        this.updateCategoryChart(combinedCategoryData);
    }

    updateChartsForSingleCategory(categoryData) {
        const history = categoryData.history.map(stats => ({
            date: stats.date,
            soldItems: stats.soldItemsCount || 0,
            newItems: stats.newItemsCount || 0
        }));

        // Hide the category chart section for single category view
        this.hideCategoryChart();
        this.hidePriceTrendsChart();
    }

    hideCategoryChart() {
        const categoryChart = document.getElementById('categoryChart');
        if (categoryChart) {
            const container = categoryChart.closest('.chart-container');
            if (container) {
                container.style.display = 'none';
            }
        }
    }

    showCategoryChart() {
        const categoryChart = document.getElementById('categoryChart');
        if (categoryChart) {
            const container = categoryChart.closest('.chart-container');
            if (container) {
                container.style.display = 'block';
            }
        }
    }

    updateTablesForAllCategories() {
        // Combine all current items
        const allCurrentItems = [];
        const allSoldItems = [];

        this.allCategoryData.forEach(categoryData => {
            console.log(`Category: ${categoryData.categoryName}`);
            const soldItems = categoryData.latestStats.soldItems || [];
            console.log(`Sold items count: ${soldItems.length}`);
            if (soldItems.length > 0) {
                console.log(`First sold item:`, soldItems[0]);
                console.log(`Prices in first 3 items:`, soldItems.slice(0, 3).map(item => item.price));
            }

            allCurrentItems.push(...(categoryData.currentItems || []));
            allSoldItems.push(...soldItems);
        });

        console.log(`Total sold items combined: ${allSoldItems.length}`);
        console.log(`Price range in combined data:`, {
            min: Math.min(...allSoldItems.map(item => item.price || 0)),
            max: Math.max(...allSoldItems.map(item => item.price || 0))
        });

        // For All Categories view, shuffle to show variety; for single category view, sort by price
        if (this.currentView === 'all') {
            // Shuffle items to show variety instead of always showing highest-priced items
            this.shuffleArray(allSoldItems);
            console.log(`Random sample of sold items:`, allSoldItems.slice(0, 5).map(item => ({title: item.title, price: item.price})));
        } else {
            // Sort by price (descending) for single category view
            allCurrentItems.sort((a, b) => (b.price || 0) - (a.price || 0));
            allSoldItems.sort((a, b) => (b.price || 0) - (a.price || 0));
            console.log(`Top 5 sold items by price:`, allSoldItems.slice(0, 5).map(item => ({title: item.title, price: item.price})));
        }

        this.updateSoldItemsTable(allSoldItems.slice(0, 20));
    }

    updateTablesForSingleCategory(categoryData) {
        this.updateSoldItemsTable(categoryData.latestStats.soldItems || []);
    }


    updateCategoryChart(soldByCategory) {
        const ctx = document.getElementById('categoryChart').getContext('2d');

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        const data = Object.entries(soldByCategory);
        if (data.length === 0) return;

        const labels = data.map(([category]) => category);
        const values = data.map(([, count]) => count);
        const colors = this.generateColors(labels.length);

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateSoldItemsTable(items) {
        const tbody = document.querySelector('#soldItemsTable tbody');

        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading">No sold items available</td></tr>';
            return;
        }

        // Show 20 items for category view, 10 for All Categories view
        const isAllCategoriesView = this.currentView === 'all';
        const itemsToShow = isAllCategoriesView ? 10 : 20;

        tbody.innerHTML = items.slice(0, itemsToShow).map(item => {
            // Debug: log price to console
            if (item.price === 80000) {
                console.log('Found 80000 price item:', item);
            }
            return `
            <tr>
                <td>${this.escapeHtml(item.title)}</td>
                <td>${item.price?.toLocaleString()}֏</td>
                <td>${this.escapeHtml(item.location || '-')}</td>
                <td>${this.escapeHtml(item.category || '-')}</td>
            </tr>
            `;
        }).join('');
    }


    showCrawlModal() {
        document.getElementById('modal').style.display = 'block';
        this.loadCategoriesInModal();
    }

    hideCrawlModal() {
        document.getElementById('modal').style.display = 'none';
    }

    loadCategoriesInModal() {
        const container = document.getElementById('categoriesSelector');

        if (!this.categories || Object.keys(this.categories).length === 0) {
            container.innerHTML = '<div class="loading">No categories available</div>';
            return;
        }

        const selectAllCheckbox = `
            <div class="category-checkbox select-all">
                <input type="checkbox" id="cat_all" value="all">
                <label for="cat_all"><strong>Select All Categories</strong></label>
            </div>
            <hr style="margin: 10px 0; border: 1px solid #e0e0e0;">
        `;

        const checkboxes = Object.entries(this.categories)
            .map(([id, info]) => `
                <div class="category-checkbox">
                    <input type="checkbox" id="cat_${id}" value="${id}" class="category-item">
                    <label for="cat_${id}">${this.escapeHtml(info.name)}</label>
                    <span class="category-id">${id}</span>
                </div>
            `)
            .join('');

        container.innerHTML = selectAllCheckbox + checkboxes;

        // Add event listener for "Select All" functionality
        this.setupSelectAllFunctionality();
    }

    setupSelectAllFunctionality() {
        const selectAllCheckbox = document.getElementById('cat_all');
        const categoryCheckboxes = document.querySelectorAll('.category-item');

        if (!selectAllCheckbox) return;

        // Handle "Select All" checkbox change
        selectAllCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            categoryCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });

        // Handle individual category checkbox changes
        categoryCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // Update "Select All" state based on individual checkboxes
                const allChecked = Array.from(categoryCheckboxes).every(cb => cb.checked);
                const noneChecked = Array.from(categoryCheckboxes).every(cb => !cb.checked);

                if (allChecked) {
                    selectAllCheckbox.checked = true;
                    selectAllCheckbox.indeterminate = false;
                } else if (noneChecked) {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = false;
                } else {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = true;
                }
            });
        });
    }

    async handleCrawlSubmit(e) {
        e.preventDefault();

        const selectedCategories = Array.from(
            document.querySelectorAll('#categoriesSelector input[type="checkbox"]:checked')
        ).map(checkbox => checkbox.value)
         .filter(value => value !== 'all') // Exclude the "select all" checkbox
         .map(value => parseInt(value));

        if (selectedCategories.length === 0) {
            alert('⚠️ Please select at least one category to crawl.');
            return;
        }

        const minPrice = parseInt(document.getElementById('crawlMinPrice').value);
        const maxPrice = parseInt(document.getElementById('crawlMaxPrice').value);

        try {
            const response = await fetch('/api/crawl/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    categories: selectedCategories,
                    minPrice,
                    maxPrice
                })
            });

            if (response.ok) {
                this.hideCrawlModal();
                // Start monitoring progress immediately
                this.startProgressMonitoring();
                setTimeout(() => this.checkCrawlStatus(), 1000); // Check status after 1 second
            } else {
                throw new Error('Failed to start crawl');
            }
        } catch (error) {
            alert('Error starting crawl: ' + error.message);
        }
    }

    setupAutoRefresh() {
        setInterval(() => {
            this.loadData();
        }, 30000); // Refresh every 30 seconds
    }

    async checkCrawlStatus() {
        try {
            const response = await fetch('/api/crawl/status');
            const data = await response.json();

            if (data.isRunning) {
                this.showProgress(data.progress);
                this.startProgressMonitoring();
            } else {
                this.hideProgress();
                this.stopProgressMonitoring();
            }
        } catch (error) {
            console.error('Error checking crawl status:', error);
        }
    }

    startProgressMonitoring() {
        if (this.progressCheckInterval) return; // Already monitoring

        this.progressCheckInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/crawl/status');
                const data = await response.json();

                if (data.isRunning) {
                    this.updateProgress(data.progress);
                } else {
                    this.hideProgress();
                    this.stopProgressMonitoring();
                    this.loadData(); // Refresh data when crawl completes
                }
            } catch (error) {
                console.error('Error monitoring progress:', error);
            }
        }, 2000); // Check every 2 seconds during crawling
    }

    stopProgressMonitoring() {
        if (this.progressCheckInterval) {
            clearInterval(this.progressCheckInterval);
            this.progressCheckInterval = null;
        }
    }

    showProgress(progress) {
        const progressSection = document.getElementById('progressSection');
        progressSection.style.display = 'block';
        progressSection.classList.add('show');
        this.updateProgress(progress);

        // Disable crawl button while running
        const crawlBtn = document.getElementById('crawlBtn');
        crawlBtn.disabled = true;
        crawlBtn.textContent = '🕷️ Crawling...';
    }

    hideProgress() {
        const progressSection = document.getElementById('progressSection');
        progressSection.style.display = 'none';
        progressSection.classList.remove('show');

        // Re-enable crawl button
        const crawlBtn = document.getElementById('crawlBtn');
        crawlBtn.disabled = false;
        crawlBtn.textContent = '🕷️ Start Crawl';
    }

    updateProgress(progress) {
        if (!progress) return;

        // Update status
        const statusElement = document.getElementById('progressStatus');
        const statusText = this.getStatusText(progress.status);
        statusElement.textContent = statusText;

        // Calculate percentage with more granular progress
        let percentage = 0;
        if (progress.totalCategories > 0) {
            // Base progress from completed categories
            const completedProgress = (progress.completedCategories / progress.totalCategories) * 100;
            const categoryWeight = 100 / progress.totalCategories;

            // Add progress from current category being processed
            if (progress.completedCategories < progress.totalCategories) {
                let currentCategoryProgress = 0;

                // During crawling phase of current category
                if (progress.currentPage > 0 && progress.status === 'crawling') {
                    const maxPages = progress.maxPagesPerCategory || 50;
                    currentCategoryProgress = Math.min(progress.currentPage / maxPages, 1) * 0.9; // 90% of category for crawling
                }
                // During statistics phase
                else if (progress.status === 'calculating_statistics') {
                    currentCategoryProgress = 0.9; // 90% for statistics phase
                }
                // During AI normalization phase
                else if (progress.status === 'ai_normalizing' && progress.aiNormalizationProgress) {
                    const aiProgress = progress.aiNormalizationProgress;
                    if (aiProgress.itemsTotal > 0) {
                        const aiPercentage = (aiProgress.itemsProcessed / aiProgress.itemsTotal);
                        currentCategoryProgress = 0.9 + (aiPercentage * 0.1); // 90% + up to 10% for AI
                    } else {
                        currentCategoryProgress = 0.9;
                    }
                }

                const currentCategoryContribution = currentCategoryProgress * categoryWeight;
                percentage = Math.round(completedProgress + currentCategoryContribution);
            } else {
                percentage = Math.round(completedProgress);
            }

            // Handle final completion
            if (progress.status === 'completed') {
                percentage = 100;
            }
        }

        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        progressFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage}%`;

        // Update progress details
        const progressDetails = document.getElementById('progressDetails');
        if (progress.status === 'ai_normalizing' && progress.aiNormalizationProgress) {
            const aiProgress = progress.aiNormalizationProgress;
            progressDetails.textContent = `AI Processing: ${aiProgress.itemsProcessed}/${aiProgress.itemsTotal} sold items`;
        } else if (progress.status === 'calculating_statistics') {
            progressDetails.textContent = 'Analyzing crawled data and calculating statistics...';
        } else if (progress.currentCategoryName) {
            const currentCategoryIndex = progress.completedCategories + 1;
            progressDetails.textContent = `Category ${currentCategoryIndex} of ${progress.totalCategories}: ${progress.currentCategoryName}`;
        } else {
            progressDetails.textContent = 'Preparing...';
        }

        // Update info items
        if (progress.status === 'ai_normalizing' && progress.aiNormalizationProgress) {
            document.getElementById('currentCategory').textContent = 'AI Normalization';
            document.getElementById('currentPage').textContent =
                `${progress.aiNormalizationProgress.itemsProcessed}/${progress.aiNormalizationProgress.itemsTotal}`;
        } else {
            document.getElementById('currentCategory').textContent =
                progress.currentCategoryName || '-';
            document.getElementById('currentPage').textContent =
                progress.currentPage > 0 ? progress.currentPage : '-';
        }
    }

    getStatusText(status) {
        const statusMap = {
            'idle': 'Ready',
            'starting': 'Starting...',
            'crawling': 'Crawling',
            'calculating_statistics': 'Analyzing Data...',
            'ai_normalizing': 'AI Normalizing Products...',
            'completed': 'Completed',
            'error': 'Error'
        };
        return statusMap[status] || status;
    }

    formatEstimatedTime(timeInSeconds) {
        if (!timeInSeconds || timeInSeconds <= 0) return '-';

        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }


    generateColors(count) {
        const colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
            '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#795548'
        ];

        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }

    showSoldItemsAnalysis(categoryData) {
        const container = document.getElementById('soldItemsAnalysisContainer');
        container.style.display = 'block';

        // Populate the analysis with the category data
        this.populateSoldItemsAnalysis(categoryData);
    }

    hideSoldItemsAnalysis() {
        const container = document.getElementById('soldItemsAnalysisContainer');
        container.style.display = 'none';
    }

    showCategoriesOverviewBelowStats() {
        // Show the full-width categories overview below stats (All Categories view)
        const container = document.getElementById('categoriesOverviewSection');
        const cardInGrid = document.getElementById('categoryOverviewCard');
        container.style.display = 'block';
        cardInGrid.style.display = 'none';
    }

    showCategoryOverviewInGrid(categoryData) {
        // Show single category overview in the stats grid (Category Details view)
        const container = document.getElementById('categoriesOverviewSection');
        const cardInGrid = document.getElementById('categoryOverviewCard');
        const title = document.getElementById('categoryOverviewTitle');
        const gridContainer = document.getElementById('categoryOverviewGrid');

        container.style.display = 'none';
        cardInGrid.style.display = 'block';
        title.textContent = '📂 Category Overview';

        // Update the grid content with single category data
        this.updateSingleCategoryOverview(categoryData, gridContainer);
    }

    hideCategoriesOverview() {
        const container = document.getElementById('categoriesOverviewSection');
        const cardInGrid = document.getElementById('categoryOverviewCard');
        container.style.display = 'none';
        cardInGrid.style.display = 'none';
    }

    updateSingleCategoryOverview(categoryData, gridContainer) {
        const stats = categoryData.latestStats;
        const info = categoryData.categoryInfo;

        const categoriesGridInSingle = gridContainer.querySelector('.categories-grid');
        categoriesGridInSingle.innerHTML = `
            <div class="category-item-card">
                <h4>${info?.name || categoryData.categoryName}</h4>
                <div class="category-stats">
                    <div class="category-stat">
                        <span class="label">Items:</span>
                        <span class="value">${(stats.totalCurrentItems || 0).toLocaleString()}</span>
                    </div>
                    <div class="category-stat">
                        <span class="label">Sold:</span>
                        <span class="value">${(stats.soldItemsCount || 0).toLocaleString()}</span>
                    </div>
                    <div class="category-stat">
                        <span class="label">New:</span>
                        <span class="value">${(stats.newItemsCount || 0).toLocaleString()}</span>
                    </div>
                    <div class="category-stat">
                        <span class="label">Price Range:</span>
                        <span class="value">${(stats.priceRange?.min || 0).toLocaleString()}֏ - ${(stats.priceRange?.max || 0).toLocaleString()}֏</span>
                    </div>
                    <div class="category-stat">
                        <span class="label">Last Crawl:</span>
                        <span class="value">${this.formatDate(stats.date)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    populateSoldItemsAnalysis(categoryData) {
        // Store current category data for pagination refresh
        this.currentCategoryData = categoryData;

        // Reset pagination to first page when switching categories
        this.pagination.soldByNormalizedTitle.currentPage = 1;

        const stats = categoryData.latestStats;
        const soldItems = stats.soldItems || [];
        const soldByTitle = stats.soldItemsByTitle || {};
        // Use the new allSoldFingerprints data structure (nested under aiNormalization)
        const allSoldFingerprints = (stats.aiNormalization && stats.aiNormalization.allSoldFingerprints) || {};

        // Update summary stats
        document.getElementById('totalSoldCount').textContent = soldItems.length.toLocaleString();
        document.getElementById('uniqueSoldCount').textContent = Object.keys(soldByTitle).length.toLocaleString();


        // Update sold items by normalized title table
        this.updateSoldItemsByNormalizedTitleTable(allSoldFingerprints, soldItems);

        // Create pie chart for category-specific view with normalized data
        const isAllCategoriesView = this.currentView === 'all';
        if (!isAllCategoriesView && Object.keys(allSoldFingerprints).length > 0) {
            this.updateSoldProductsPieChart(allSoldFingerprints);
        } else {
            document.getElementById('soldProductsPieChartContainer').style.display = 'none';
        }
    }

    updateSoldItemsByTitleTable(soldByTitle, soldItems) {
        const tbody = document.querySelector('#soldItemsByTitleTable tbody');


        if (Object.keys(soldByTitle).length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="loading">No sold items data available</td></tr>';
            this.updatePaginationInfo('soldByTitle', 0, 0, 0);
            this.updatePaginationControls('soldByTitle', 1, 1);
            return;
        }

        // Create a map to get the last price for each title
        const titlePriceMap = {};
        soldItems.forEach(item => {
            if (item.title && item.price) {
                titlePriceMap[item.title] = item.price; // Map original title to its price
            }
        });

        // Sort entries by count descending
        const sortedEntries = Object.entries(soldByTitle).sort(([,a], [,b]) => b - a);

        // Calculate pagination
        const totalItems = sortedEntries.length;
        const pageSize = this.pagination.soldByTitle.pageSize;
        const currentPage = this.pagination.soldByTitle.currentPage;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);

        // Get items for current page
        const pageItems = sortedEntries.slice(startIndex, endIndex);

        tbody.innerHTML = pageItems
            .map(([title, count]) => `
                <tr>
                    <td style="max-width: 300px; word-wrap: break-word;">${this.escapeHtml(title)}</td>
                    <td class="text-center"><strong>${count}</strong></td>
                    <td class="text-center">${(titlePriceMap[title] || 0).toLocaleString()}֏</td>
                </tr>
            `).join('');

        // Update pagination info and controls
        this.updatePaginationInfo('soldByTitle', startIndex + 1, endIndex, totalItems);
        this.updatePaginationControls('soldByTitle', currentPage, totalPages);
    }

    updateSoldItemsByNormalizedTitleTable(allSoldFingerprints, soldItems) {
        const tbody = document.querySelector('#soldItemsByNormalizedTitleTable tbody');

        if (Object.keys(allSoldFingerprints).length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="loading">No normalized sold items data available</td></tr>';
            this.updatePaginationInfo('soldByNormalizedTitle', 0, 0, 0);
            this.updatePaginationControls('soldByNormalizedTitle', 1, 1);
            return;
        }

        // Convert new format to sortable entries
        const sortedEntries = Object.entries(allSoldFingerprints)
            .filter(([fingerprint]) => {
                // Filter out fingerprints with 2 or more "unknown" values
                const unknownCount = (fingerprint.match(/unknown/g) || []).length;
                return unknownCount < 2;
            })
            .map(([fingerprint, data]) => {
                // Handle both new format {count: X, avgPrice: Y} and legacy format (just number)
                const count = typeof data === 'object' ? data.count : data;
                const avgPrice = typeof data === 'object' ? data.avgPrice : 0;
                return [fingerprint, count, avgPrice];
            })
            .sort(([,a], [,b]) => b - a); // Sort by count descending

        // Calculate pagination
        const totalItems = sortedEntries.length;
        const pageSize = this.pagination.soldByNormalizedTitle.pageSize;
        const currentPage = this.pagination.soldByNormalizedTitle.currentPage;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);

        // Get items for current page
        const pageItems = sortedEntries.slice(startIndex, endIndex);

        tbody.innerHTML = pageItems
            .map(([normalizedTitle, count, avgPrice]) => `
                <tr>
                    <td style="max-width: 300px; word-wrap: break-word;">${this.escapeHtml(this.cleanFingerprint(normalizedTitle))}</td>
                    <td class="text-center"><strong>${count}</strong></td>
                    <td class="text-center">${(avgPrice || 0).toLocaleString()}֏</td>
                </tr>
            `).join('');

        // Update pagination info and controls
        this.updatePaginationInfo('soldByNormalizedTitle', startIndex + 1, endIndex, totalItems);
        this.updatePaginationControls('soldByNormalizedTitle', currentPage, totalPages);
    }


    normalizeItemTitle(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    shuffleArray(array) {
        // Fisher-Yates shuffle algorithm
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    changePage(tableType, direction) {
        const paginationState = this.pagination[tableType];
        if (!paginationState) return;

        const newPage = paginationState.currentPage + direction;
        if (newPage < 1) return;

        paginationState.currentPage = newPage;

        // Refresh only the specific table with new pagination
        if (this.currentCategoryData) {
            this.refreshSpecificTable(tableType);
        }
    }

    changePageSize(tableType, newSize) {
        const paginationState = this.pagination[tableType];
        if (!paginationState) return;

        paginationState.pageSize = parseInt(newSize);
        paginationState.currentPage = 1; // Reset to first page

        // Refresh only the specific table with new pagination
        if (this.currentCategoryData) {
            this.refreshSpecificTable(tableType);
        }
    }

    refreshSpecificTable(tableType) {
        const stats = this.currentCategoryData.latestStats;
        const soldItems = stats.soldItems || [];
        const soldByTitle = stats.soldItemsByTitle || {};
        const allSoldFingerprints = (stats.aiNormalization && stats.aiNormalization.allSoldFingerprints) || {};

        switch (tableType) {
            case 'soldByTitle':
                this.updateSoldItemsByTitleTable(soldByTitle, soldItems);
                break;
            case 'soldByNormalizedTitle':
                this.updateSoldItemsByNormalizedTitleTable(allSoldFingerprints, soldItems);
                break;
        }
    }

    updatePaginationInfo(tableType, start, end, total) {
        const infoElement = document.getElementById(`${tableType}Info`);
        if (infoElement) {
            infoElement.textContent = `Showing ${start} - ${end} of ${total.toLocaleString()} items`;
        }
    }

    updatePaginationControls(tableType, currentPage, totalPages) {
        const prevBtn = document.getElementById(`${tableType}PrevBtn`);
        const nextBtn = document.getElementById(`${tableType}NextBtn`);
        const pageInfo = document.getElementById(`${tableType}PageInfo`);

        if (prevBtn) {
            prevBtn.disabled = currentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
        }

        if (pageInfo) {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }
    }


    updateSoldProductsPieChart(allSoldFingerprints) {
        const container = document.getElementById('soldProductsPieChartContainer');
        const canvas = document.getElementById('soldProductsPieChart');
        const ctx = canvas.getContext('2d');

        // Show container
        container.style.display = 'block';

        // Destroy existing chart if it exists
        if (this.charts.soldProductsPie) {
            this.charts.soldProductsPie.destroy();
        }

        // Prepare data - take top 10 products and handle new data structure
        const entries = Object.entries(allSoldFingerprints)
            .filter(([fingerprint]) => {
                // Filter out fingerprints with 2 or more "unknown" values
                const unknownCount = (fingerprint.match(/unknown/g) || []).length;
                return unknownCount < 2;
            })
            .map(([fingerprint, data]) => {
                // Handle both new format {count: X, avgPrice: Y} and legacy format (just number)
                const count = typeof data === 'object' ? data.count : data;
                return [fingerprint, count];
            })
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        if (entries.length === 0) {
            container.style.display = 'none';
            return;
        }

        const labels = entries.map(([fingerprint, count]) => {
            // Clean up the fingerprint for display
            const cleaned = this.cleanFingerprint(fingerprint);
            const truncated = cleaned.length > 25 ? cleaned.substring(0, 25) + '...' : cleaned;
            return `${truncated} (${count})`;
        });
        const data = entries.map(([, count]) => count);
        const colors = this.generateColors(entries.length);

        this.charts.soldProductsPie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color + 'CC'),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} sold (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    cleanFingerprint(fingerprint) {
        // Clean up the fingerprint for display
        return fingerprint
            .replace(/_/g, ' ')                     // Replace underscores with spaces
            .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
            .replace(/\s+/g, ' ')                   // Normalize whitespace
            .trim();                                // Remove leading/trailing whitespace
    }

    // New analytics methods
    updateAnalyticsDisplay() {
        this.updateMarketVelocityDisplay();
        this.updateTopPerformersTable();
        this.updateTimeToSellMetrics();
    }

    updateAnalyticsDisplayForCategory(categoryData) {
        this.updateMarketVelocityDisplayForCategory(categoryData);
        this.updateTopPerformersTableForCategory(categoryData);
        this.updateTimeToSellMetricsForCategory(categoryData);
    }

    updateMarketVelocityDisplay() {
        const container = document.getElementById('marketVelocity');
        const velocity = this.analyticsData.marketVelocity;

        if (Object.keys(velocity).length === 0) {
            container.innerHTML = '<div class="loading">No velocity data available</div>';
            return;
        }

        const velocityCards = Object.entries(velocity).map(([category, data]) => {
            const trendIcon = data.trend === 'increasing' ? '📈' :
                             data.trend === 'decreasing' ? '📉' : '➡️';

            return `
                <div class="velocity-card">
                    <h4>${category}</h4>
                    <div class="velocity-metric">
                        <span class="velocity-number">${data.itemsPerDay}</span>
                        <span class="velocity-label">items/day</span>
                        <span class="velocity-trend">${trendIcon}</span>
                    </div>
                    <div class="velocity-details">
                        <small>${data.totalSoldRecent} sold recently</small>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="velocity-grid">${velocityCards}</div>`;
    }

    updateTopPerformersTable() {
        const tbody = document.querySelector('#topPerformersTable tbody');
        const performers = this.analyticsData.topPerformers;

        if (!performers || performers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading">No top performers data available</td></tr>';
            return;
        }

        tbody.innerHTML = performers.slice(0, 15).map(item => `
            <tr>
                <td style="max-width: 200px; word-wrap: break-word;">${this.escapeHtml(item.product)}</td>
                <td>${this.escapeHtml(item.category)}</td>
                <td class="text-center"><strong>${item.timesSold}</strong></td>
                <td class="text-center">${item.avgPrice.toLocaleString()}֏</td>
                <td class="text-center">${item.revenue.toLocaleString()}֏</td>
            </tr>
        `).join('');
    }

    updateTimeToSellMetrics() {
        const container = document.getElementById('timeToSellMetrics');
        const metrics = this.analyticsData.timeToSell;

        if (Object.keys(metrics).length === 0) {
            container.innerHTML = '<div class="loading">No time-to-sell data available</div>';
            return;
        }

        const metricsCards = Object.entries(metrics).map(([category, data]) => `
            <div class="time-metric-card">
                <h4>${category}</h4>
                <div class="metric-grid">
                    <div class="metric-item">
                        <span class="metric-value">${data.estimatedDaysToSell}</span>
                        <span class="metric-label">days to sell</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${data.turnoverRate}%</span>
                        <span class="metric-label">turnover rate</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${data.avgInventory.toLocaleString()}</span>
                        <span class="metric-label">avg inventory</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${data.avgSoldPerCrawl}</span>
                        <span class="metric-label">avg sold/crawl</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `<div class="time-metrics-grid">${metricsCards}</div>`;
    }

    updatePriceTrendsChart() {
        const ctx = document.getElementById('priceTrendsChart').getContext('2d');

        if (this.charts.priceTrends) {
            this.charts.priceTrends.destroy();
        }

        const trends = this.analyticsData.priceTrends;
        if (Object.keys(trends).length === 0) return;

        const datasets = [];
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
        let colorIndex = 0;

        Object.entries(trends).forEach(([category, data]) => {
            if (data.length > 1) {
                datasets.push({
                    label: category,
                    data: data.map(d => ({ x: d.date, y: d.avgPrice })),
                    borderColor: colors[colorIndex % colors.length],
                    backgroundColor: colors[colorIndex % colors.length] + '20',
                    fill: false,
                    tension: 0.1
                });
                colorIndex++;
            }
        });

        if (datasets.length === 0) return;

        this.charts.priceTrends = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Average Price (֏)'
                        },
                        beginAtZero: false
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    showPriceTrendsChart() {
        const chart = document.getElementById('priceTrendsChart');
        if (chart) {
            const container = chart.closest('.chart-container');
            if (container) {
                container.style.display = 'block';
            }
        }
    }

    hidePriceTrendsChart() {
        const chart = document.getElementById('priceTrendsChart');
        if (chart) {
            const container = chart.closest('.chart-container');
            if (container) {
                container.style.display = 'none';
            }
        }
    }

    // Category-specific analytics methods
    updateMarketVelocityDisplayForCategory(categoryData) {
        const container = document.getElementById('marketVelocity');
        const categoryName = categoryData.categoryInfo?.name || categoryData.categoryName;
        const recentHistory = categoryData.history.slice(-7); // Last 7 days

        if (recentHistory.length < 2) {
            container.innerHTML = '<div class="loading">Not enough data for velocity calculation</div>';
            return;
        }

        const totalSold = recentHistory.reduce((sum, stats) => sum + (stats.soldItemsCount || 0), 0);
        const dailyAvg = totalSold / recentHistory.length;
        const trend = recentHistory.length >= 3 ? this.calculateTrend(recentHistory) : 'stable';
        const trendIcon = trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️';

        container.innerHTML = `
            <div class="velocity-grid">
                <div class="velocity-card">
                    <h4>${categoryName}</h4>
                    <div class="velocity-metric">
                        <span class="velocity-number">${Math.round(dailyAvg * 10) / 10}</span>
                        <span class="velocity-label">items/day</span>
                        <span class="velocity-trend">${trendIcon}</span>
                    </div>
                    <div class="velocity-details">
                        <small>${totalSold} sold recently</small>
                    </div>
                </div>
            </div>
        `;
    }

    updateTopPerformersTableForCategory(categoryData) {
        const tbody = document.querySelector('#topPerformersTable tbody');
        const stats = categoryData.latestStats;
        const soldByTitle = stats.soldItemsByTitle || {};
        const allSoldFingerprints = (stats.aiNormalization && stats.aiNormalization.allSoldFingerprints) || {};

        // Use AI-normalized data if available, otherwise fall back to title-based
        const dataToUse = Object.keys(allSoldFingerprints).length > 0 ? allSoldFingerprints : soldByTitle;

        if (Object.keys(dataToUse).length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading">No top performers data available for this category</td></tr>';
            return;
        }

        const performers = Object.entries(dataToUse)
            .map(([product, data]) => {
                const count = typeof data === 'object' ? data.count : data;
                const avgPrice = typeof data === 'object' ? data.avgPrice : 0;

                if (count >= 2) { // Only include products sold multiple times
                    return {
                        product: this.cleanProductName(product),
                        category: categoryData.categoryInfo?.name || categoryData.categoryName,
                        timesSold: count,
                        avgPrice: Math.round(avgPrice),
                        revenue: Math.round(count * avgPrice)
                    };
                }
                return null;
            })
            .filter(item => item !== null)
            .sort((a, b) => b.timesSold - a.timesSold)
            .slice(0, 15);

        if (performers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading">No products sold multiple times in this category</td></tr>';
            return;
        }

        tbody.innerHTML = performers.map(item => `
            <tr>
                <td style="max-width: 200px; word-wrap: break-word;">${this.escapeHtml(item.product)}</td>
                <td>${this.escapeHtml(item.category)}</td>
                <td class="text-center"><strong>${item.timesSold}</strong></td>
                <td class="text-center">${item.avgPrice.toLocaleString()}֏</td>
                <td class="text-center">${item.revenue.toLocaleString()}֏</td>
            </tr>
        `).join('');
    }

    updateTimeToSellMetricsForCategory(categoryData) {
        const container = document.getElementById('timeToSellMetrics');
        const categoryName = categoryData.categoryInfo?.name || categoryData.categoryName;
        const history = categoryData.history.slice(-10); // Last 10 crawls

        if (history.length < 2) {
            container.innerHTML = '<div class="loading">Not enough data for time-to-sell calculation</div>';
            return;
        }

        // Estimate time-to-sell based on inventory turnover
        const avgInventory = history.reduce((sum, stats) => sum + (stats.totalCurrentItems || 0), 0) / history.length;
        const avgSold = history.reduce((sum, stats) => sum + (stats.soldItemsCount || 0), 0) / history.length;
        const estimatedDaysToSell = avgSold > 0 ? Math.round(avgInventory / avgSold) : 0;
        const turnoverRate = avgInventory > 0 ? Math.round((avgSold / avgInventory) * 100) : 0;

        container.innerHTML = `
            <div class="time-metrics-grid">
                <div class="time-metric-card">
                    <h4>${categoryName}</h4>
                    <div class="metric-grid">
                        <div class="metric-item">
                            <span class="metric-value">${estimatedDaysToSell}</span>
                            <span class="metric-label">days to sell</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">${turnoverRate}%</span>
                            <span class="metric-label">turnover rate</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">${Math.round(avgInventory).toLocaleString()}</span>
                            <span class="metric-label">avg inventory</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">${Math.round(avgSold)}</span>
                            <span class="metric-label">avg sold/crawl</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    calculateTrend(history) {
        if (history.length < 3) return 'stable';

        const recent = history.slice(-3);
        const first = recent[0].soldItemsCount || 0;
        const last = recent[recent.length - 1].soldItemsCount || 0;

        if (last > first * 1.2) return 'increasing';
        if (last < first * 0.8) return 'decreasing';
        return 'stable';
    }

    cleanProductName(name) {
        return name
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace(/\s+/g, ' ')
            .trim();
    }

}

document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});