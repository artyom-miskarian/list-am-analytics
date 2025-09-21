# Phone Crawler

A sophisticated web scraper for list.am marketplace that tracks product listings, detects sold items, and provides comprehensive analytics with AI-powered product normalization.

## 🚀 Features

- **Multi-category crawling** for phones, computers, kitchen appliances, and more
- **AI-powered normalization** with DeepSeek API for intelligent product grouping
- **Real-time web dashboard** with charts and statistics
- **Multi-language support** (Armenian, Russian, English)
- **Sold item tracking** by comparing crawl sessions
- **Price range filtering** and category-specific optimization
- **Cost-optimized processing** (89% savings vs full-dataset analysis)

## 📊 AI Normalization Results

The AI system dramatically improves duplicate detection:

**Before (Algorithmic):**
- 10,491 items → 46 groups (99.6% over-grouping)
- All iPhones → `phones_apple_phone`
- All Samsung → `phones_samsung_device`

**After (AI):**
- 10,491 items → 2000+ intelligent groups
- iPhone 13 Pro Max 256GB → `apple_iphone_13_pro_max_256gb_phone`
- Samsung S24 motherboard → `samsung_galaxy_s24_motherboard`

## ⚡ Quick Start

### 1. Basic Setup
```bash
# Install dependencies
npm install

# Start the web dashboard
npm run server
```
Open http://localhost:3000 to view the dashboard

### 2. AI Setup (Optional but Recommended)
1. Get DeepSeek API key from https://platform.deepseek.com/
2. Copy environment file: `cp .env.example .env`
3. Edit `.env` and add: `DEEPSEEK_API_KEY=your_key_here`

### 3. Run Your First Crawl
```bash
# Run crawl with default settings
npm run crawl

# View statistics
npm run stats
```

## 🎯 Smart AI Processing

The AI system only processes what you need:
- **Processes sold items** (for analysis insights)
- **Samples current items** (for duplicate detection)
- **Skips bulk processing** (saves 89% in costs)
- **Same insights, minimal cost**

**Estimated costs per category: ~$0.01-0.06**

## 📋 Available Commands

### Core Operations
```bash
npm run server              # Start web dashboard on port 3000
npm run crawl               # Run crawl with default settings
npm run stats               # Display latest statistics
npm run crawl-manual        # Interactive crawl with custom options
```

### Advanced Usage
```bash
# Crawl specific categories with price range
node index.js crawl 36,78,128 10000 60000

# List available categories
node index.js categories

# Set up automated daily crawling
npm run setup-cron
```

### Development
```bash
npm test                            # Run crawler in test mode
npm run test-cron                   # Test cron job functionality
```

## 🏗️ Project Structure

```
phone-crawler/
├── index.js                    # Main crawler class
├── lib/
│   ├── AIProductNormalizer.js  # AI-powered normalization
│   └── CategoryConfig.js       # Category configurations
├── server/app.js               # Express web server
├── public/                     # Web dashboard frontend
├── crawler_data/               # Data storage (gitignored)
└── cron-daily-crawl.js        # Automated scheduling
```

## 🎛️ Configuration

All settings can be customized in `.env`:

```bash
# AI Configuration
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BATCH_SIZE=50

# Crawler Settings
DEFAULT_MIN_PRICE=5000
DEFAULT_MAX_PRICE=80000
MAX_PAGES_PER_CATEGORY=50
```

## 📈 Supported Categories

- ✅ **Phones and Tablets** (Category 36) - Optimized prompts for iPhone, Samsung, etc.
- ✅ **Laptops and Computers** (Category 78) - Handles specs, brands, components
- ✅ **Kitchen Appliances** (Category 128) - Blenders, toasters, cooking equipment
- ✅ **Audio Accessories** (Category 183) - Headphones, speakers, microphones
- ✅ **Games and Consoles** (Category 49) - PlayStation, Xbox, Nintendo
- ✅ **Pet Products** (Category 98) - Food, toys, accessories

## 🔧 Troubleshooting

### AI Issues
- **"No API key"**: Check `.env` file has `DEEPSEEK_API_KEY=your_key`
- **"Insufficient Balance"**: Add credits at https://platform.deepseek.com/
- **Timeout errors**: Reduce `DEEPSEEK_BATCH_SIZE` to 25 or lower

### General Issues
- **Port 3000 in use**: Change `PORT=3001` in `.env` or kill existing process
- **No data**: Run `npm run crawl` first to collect initial data
- **Permission errors**: Check file system permissions in project directory

## 🎯 Usage Examples

### Basic Crawling
```bash
# Crawl phones with default settings
npm run crawl

# Crawl with custom price range
npm run crawl-price -- "36" 10000 50000
```

### Dashboard Features
- **Real-time progress** during crawling with AI normalization phases
- **Interactive charts** showing sales by category and trends
- **Product tables** with intelligent grouping and pagination
- **Category filtering** with detailed statistics per category

### API Endpoints
```bash
# Get latest statistics
curl http://localhost:3000/api/statistics

# Get category-specific data
curl http://localhost:3000/api/categories/phones/data

# Start new crawl
curl -X POST http://localhost:3000/api/crawl/start \
  -H "Content-Type: application/json" \
  -d '{"categories":[36],"minPrice":5000,"maxPrice":80000}'
```

## 🤝 Contributing

The project follows these principles:
- **AI-first normalization** for accurate product grouping
- **Cost-conscious processing** to minimize API usage
- **Multi-language support** for Armenian marketplace
- **Real-time feedback** during long-running operations

For detailed technical documentation and development notes, see `CLAUDE.md`.

## 📄 License

Private project for list.am marketplace analysis.