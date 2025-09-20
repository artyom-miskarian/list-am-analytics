class Dashboard {
    constructor() {
        this.charts = {};
        this.categories = {};
        this.allCategoryData = [];
        this.currentView = 'all';
        this.progressCheckInterval = null;

        // Pagination state
        this.pagination = {
            soldByTitle: {
                currentPage: 1,
                pageSize: 10,
                totalItems: 0,
                data: []
            },
            soldByNormalizedTitle: {
                currentPage: 1,
                pageSize: 10,
                totalItems: 0,
                data: []
            },
            allSoldItems: {
                currentPage: 1,
                pageSize: 10,
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
        // Sold by title pagination
        document.getElementById('soldByTitlePrevBtn').addEventListener('click', () => this.changePage('soldByTitle', -1));
        document.getElementById('soldByTitleNextBtn').addEventListener('click', () => this.changePage('soldByTitle', 1));
        document.getElementById('soldByTitlePageSize').addEventListener('change', (e) => this.changePageSize('soldByTitle', parseInt(e.target.value)));

        // Sold by normalized title pagination
        document.getElementById('soldByNormalizedTitlePrevBtn').addEventListener('click', () => this.changePage('soldByNormalizedTitle', -1));
        document.getElementById('soldByNormalizedTitleNextBtn').addEventListener('click', () => this.changePage('soldByNormalizedTitle', 1));
        document.getElementById('soldByNormalizedTitlePageSize').addEventListener('change', (e) => this.changePageSize('soldByNormalizedTitle', parseInt(e.target.value)));

        // All sold items pagination
        document.getElementById('allSoldItemsPrevBtn').addEventListener('click', () => this.changePage('allSoldItems', -1));
        document.getElementById('allSoldItemsNextBtn').addEventListener('click', () => this.changePage('allSoldItems', 1));
        document.getElementById('allSoldItemsPageSize').addEventListener('change', (e) => this.changePageSize('allSoldItems', parseInt(e.target.value)));
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadAllCategoryData(),
                this.loadAvailableCategories()
            ]);
            this.updateCategorySelect(); // Update dropdown after data is loaded
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading data:', error);
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
        this.hideSoldItemsAnalysis();
    }

    async showSingleCategoryView(categoryName) {
        try {
            const response = await fetch(`/api/categories/${categoryName}/data`);
            if (response.ok) {
                const categoryData = await response.json();
                this.updateSingleCategoryStats(categoryData);
                this.updateChartsForSingleCategory(categoryData);
                this.updateTablesForSingleCategory(categoryData);
                this.showSoldItemsAnalysis(categoryData);
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
        const container = document.querySelector('.categories-grid');

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

        // Combine all history data for trends chart
        const allHistory = [];
        const dateMap = new Map();

        this.allCategoryData.forEach(categoryData => {
            categoryData.history.forEach(stats => {
                const date = stats.date;
                if (!dateMap.has(date)) {
                    dateMap.set(date, { date, soldItems: 0, newItems: 0 });
                }
                const entry = dateMap.get(date);
                entry.soldItems += stats.soldItemsCount || 0;
                entry.newItems += stats.newItemsCount || 0;
            });
        });

        const combinedHistory = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        this.updateTrendsChart(combinedHistory);

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
        this.updateTrendsChart(history);

        // Hide the category chart section for single category view
        this.hideCategoryChart();
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
            allCurrentItems.push(...(categoryData.currentItems || []));
            allSoldItems.push(...(categoryData.latestStats.soldItems || []));
        });

        // Sort by price (descending) and take top items
        allCurrentItems.sort((a, b) => (b.price || 0) - (a.price || 0));
        allSoldItems.sort((a, b) => (b.price || 0) - (a.price || 0));

        this.updateCurrentItemsTable(allCurrentItems.slice(0, 20));
        this.updateSoldItemsTable(allSoldItems.slice(0, 20));
    }

    updateTablesForSingleCategory(categoryData) {
        this.updateCurrentItemsTable(categoryData.currentItems || []);
        this.updateSoldItemsTable(categoryData.latestStats.soldItems || []);
    }

    updateTrendsChart(history) {
        if (!history || history.length === 0) return;

        const ctx = document.getElementById('trendsChart').getContext('2d');

        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        const labels = history.map(h => h.date);
        const soldData = history.map(h => h.soldItems || 0);
        const newData = history.map(h => h.newItems || 0);

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Items Sold',
                        data: soldData,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'New Items',
                        data: newData,
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
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

        tbody.innerHTML = items.slice(0, 10).map(item => `
            <tr>
                <td>${this.escapeHtml(item.title)}</td>
                <td>${item.price?.toLocaleString()}֏</td>
                <td>${this.escapeHtml(item.location || '-')}</td>
                <td>${this.escapeHtml(item.category || '-')}</td>
            </tr>
        `).join('');
    }

    updateCurrentItemsTable(items) {
        const tbody = document.querySelector('#currentItemsTable tbody');

        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading">No current items available</td></tr>';
            return;
        }

        tbody.innerHTML = items.slice(0, 10).map(item => `
            <tr>
                <td>${this.escapeHtml(item.title)}</td>
                <td>${item.price?.toLocaleString()}֏</td>
                <td>${this.escapeHtml(item.location || '-')}</td>
                <td>${this.escapeHtml(item.category || '-')}</td>
                <td>${this.escapeHtml(item.date || '-')}</td>
            </tr>
        `).join('');
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

            // Add progress from current category being processed
            if (progress.currentPage > 0 && progress.completedCategories < progress.totalCategories) {
                const maxPages = progress.maxPagesPerCategory || 50;
                const currentCategoryProgress = Math.min(progress.currentPage / maxPages, 1);
                const categoryWeight = 100 / progress.totalCategories;
                const currentCategoryContribution = currentCategoryProgress * categoryWeight;

                percentage = Math.round(completedProgress + currentCategoryContribution);
            } else {
                percentage = Math.round(completedProgress);
            }

            // Ensure percentage doesn't exceed 100% until actually complete
            if (progress.status !== 'completed') {
                percentage = Math.min(percentage, 95);
            } else {
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
        if (progress.currentCategoryName) {
            const currentCategoryIndex = progress.completedCategories + 1;
            progressDetails.textContent = `Category ${currentCategoryIndex} of ${progress.totalCategories}: ${progress.currentCategoryName}`;
        } else {
            progressDetails.textContent = 'Preparing...';
        }

        // Update info items
        document.getElementById('currentCategory').textContent =
            progress.currentCategoryName || '-';
        document.getElementById('currentPage').textContent =
            progress.currentPage > 0 ? progress.currentPage : '-';
    }

    getStatusText(status) {
        const statusMap = {
            'idle': 'Ready',
            'starting': 'Starting...',
            'crawling': 'Crawling',
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


    populateSoldItemsAnalysis(categoryData) {
        // Store current category data for pagination refresh
        this.currentCategoryData = categoryData;

        // Reset pagination to first page when switching categories
        this.pagination.soldByTitle.currentPage = 1;
        this.pagination.soldByNormalizedTitle.currentPage = 1;
        this.pagination.allSoldItems.currentPage = 1;

        const stats = categoryData.latestStats;
        const soldItems = stats.soldItems || [];
        const soldByTitle = stats.soldItemsByTitle || {};
        const soldByNormalizedTitle = stats.soldItemsByNormalizedTitle || {};

        // Update summary stats
        document.getElementById('totalSoldCount').textContent = soldItems.length.toLocaleString();
        document.getElementById('uniqueSoldCount').textContent = Object.keys(soldByTitle).length.toLocaleString();


        // Update sold items by title table
        this.updateSoldItemsByTitleTable(soldByTitle, soldItems);

        // Update sold items by normalized title table
        this.updateSoldItemsByNormalizedTitleTable(soldByNormalizedTitle, soldItems);

        // Update complete sold items table
        this.updateAllSoldItemsTable(soldItems);
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

    updateSoldItemsByNormalizedTitleTable(soldByNormalizedTitle, soldItems) {
        const tbody = document.querySelector('#soldItemsByNormalizedTitleTable tbody');

        if (Object.keys(soldByNormalizedTitle).length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="loading">No normalized sold items data available</td></tr>';
            this.updatePaginationInfo('soldByNormalizedTitle', 0, 0, 0);
            this.updatePaginationControls('soldByNormalizedTitle', 1, 1);
            return;
        }

        // Sort entries by count descending
        const sortedEntries = Object.entries(soldByNormalizedTitle).sort(([,a], [,b]) => b - a);

        // Calculate pagination
        const totalItems = sortedEntries.length;
        const pageSize = this.pagination.soldByNormalizedTitle.pageSize;
        const currentPage = this.pagination.soldByNormalizedTitle.currentPage;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);

        // Get items for current page
        const pageItems = sortedEntries.slice(startIndex, endIndex);

        // Calculate average price from all sold items as a baseline
        const averagePrice = soldItems.length > 0
            ? Math.round(soldItems.reduce((sum, item) => sum + (item.price || 0), 0) / soldItems.length)
            : 0;

        tbody.innerHTML = pageItems
            .map(([normalizedTitle, count]) => `
                <tr>
                    <td style="max-width: 300px; word-wrap: break-word;"><code>${this.escapeHtml(normalizedTitle)}</code></td>
                    <td class="text-center"><strong>${count}</strong></td>
                    <td class="text-center">~${averagePrice.toLocaleString()}֏</td>
                </tr>
            `).join('');

        // Update pagination info and controls
        this.updatePaginationInfo('soldByNormalizedTitle', startIndex + 1, endIndex, totalItems);
        this.updatePaginationControls('soldByNormalizedTitle', currentPage, totalPages);
    }

    updateAllSoldItemsTable(soldItems) {
        const tbody = document.querySelector('#allSoldItemsTable tbody');


        if (soldItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading">No sold items available</td></tr>';
            this.updatePaginationInfo('allSoldItems', 0, 0, 0);
            this.updatePaginationControls('allSoldItems', 1, 1);
            return;
        }

        // Sort by price descending
        const sortedItems = soldItems.sort((a, b) => (b.price || 0) - (a.price || 0));

        // Calculate pagination
        const totalItems = sortedItems.length;
        const pageSize = this.pagination.allSoldItems.pageSize;
        const currentPage = this.pagination.allSoldItems.currentPage;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);

        // Get items for current page
        const pageItems = sortedItems.slice(startIndex, endIndex);

        tbody.innerHTML = pageItems
            .map(item => `
                <tr>
                    <td style="max-width: 300px; word-wrap: break-word;">${this.escapeHtml(item.title)}</td>
                    <td class="text-center">${(item.price || 0).toLocaleString()}֏</td>
                    <td>${this.escapeHtml(item.location || '-')}</td>
                    <td class="text-center">${item.date || '-'}</td>
                </tr>
            `).join('');

        // Update pagination info and controls
        this.updatePaginationInfo('allSoldItems', startIndex + 1, endIndex, totalItems);
        this.updatePaginationControls('allSoldItems', currentPage, totalPages);
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
        const soldByNormalizedTitle = stats.soldItemsByNormalizedTitle || {};

        switch (tableType) {
            case 'soldByTitle':
                this.updateSoldItemsByTitleTable(soldByTitle, soldItems);
                break;
            case 'soldByNormalizedTitle':
                this.updateSoldItemsByNormalizedTitleTable(soldByNormalizedTitle, soldItems);
                break;
            case 'allSoldItems':
                this.updateAllSoldItemsTable(soldItems);
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
}

document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});