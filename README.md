# Phone Crawler

A sophisticated web scraper for list.am marketplace that tracks product listings, detects sold items, and provides comprehensive analytics with advanced multi-category normalization.

## Features

- **Multi-category crawling** for phones, audio accessories, kitchen appliances, and more
- **Advanced normalization** with 35-99% duplicate detection accuracy
- **Real-time web dashboard** with charts and statistics
- **Multi-language support** (Armenian, Russian, English)
- **Sold item tracking** by comparing crawl sessions
- **Price range filtering** and category-specific optimization

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the web dashboard:**
   ```bash
   npm run server
   ```
   Open http://localhost:3000 to view the dashboard

3. **Run a crawl:**
   ```bash
   npm run crawl
   ```

4. **View statistics:**
   ```bash
   npm run stats
   ```

## Available Commands

### Core Operations
- `npm run server` - Start web dashboard on port 3000
- `npm run crawl` - Run crawl with default settings
- `npm run stats` - Display latest statistics

### Testing
- `npm run test-multi-category` - Test normalization across categories
- `npm run test-advanced-normalization` - Test phone normalization
- `npm run test-normalization` - Test basic normalization

### Advanced Usage
```bash
# Crawl specific categories with price range
node index.js crawl 36,78,128 10000 60000

# List available categories
node index.js categories
```

## Performance

The advanced normalization system achieves:
- **Phones**: 99.1% duplicate reduction
- **Audio Accessories**: 35.2% duplicate reduction
- **Kitchen Appliances**: 64.4% duplicate reduction
- **100% processing success rate** across all categories

## Project Structure

- `index.js` - Main crawler class
- `lib/MultiCategoryNormalizer.js` - Advanced normalization engine
- `server/app.js` - Express web server
- `public/` - Web dashboard frontend
- `crawler_data/` - Data storage (gitignored)

## Technical Details

For detailed technical documentation, development notes, and API reference, see `CLAUDE.md`.