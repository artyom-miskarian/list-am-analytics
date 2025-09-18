const ProductNormalizer = require('./lib/ProductNormalizer.js');
const AdvancedProductNormalizer = require('./lib/AdvancedProductNormalizer.js');
const fs = require('fs').promises;

async function compareNormalizers() {
    console.log('🔬 COMPARING BASIC vs ADVANCED NORMALIZATION\n');

    try {
        // Load real phone data
        const phoneData = JSON.parse(await fs.readFile('./crawler_data/current_phones.json', 'utf-8'));
        const basicNormalizer = new ProductNormalizer();
        const advancedNormalizer = new AdvancedProductNormalizer();

        console.log(`📊 Testing with ${phoneData.length} phone listings\n`);

        // Test problematic cases we identified earlier
        const problematicTitles = [
            "Samsung Galaxy A15 5G, 128 GB, blue",
            "Samsung Galaxy A15, 128 GB, blue",
            "Apple iPhone 6, 64 GB, Gray",
            "Apple iPhone 6, 64 GB, gold",
            "Solar Power Bank Original Արևային պանելով լիցքավորիչ солнечная батарея панель",
            "Անլար լիցքավորիչ",
            "Fast Charging Wireless Charger Anker",
            "Xiaomi Redmi 15C 4G, 128 GB, blue",
            "Xiaomi Redmi Note 14, 128 GB, green",
            "Apple iPhone 8 Plus, 64 GB, gray",
            "Apple iPhone 8 Plus, 64 GB, white",
            "Հեռախոսի, պլանշետի բռնակ, дежатель телефона",
            "Mobile Phone",
            "EXCLUSIVE * ViP - 044 77 77 19 - VIP - Համար",
            "055535363 ucom gold",
            "Apple iPhone 5s, 16 GB, gray",
            "Apple iPhone 5, 16 GB, silver"
        ];

        console.log('🎯 TESTING PROBLEMATIC CASES:\n');
        console.log('Original Title → Basic → Advanced');
        console.log('='.repeat(100));

        problematicTitles.forEach(title => {
            const basic = basicNormalizer.normalizeTitle(title);
            const advanced = advancedNormalizer.normalizeTitle(title);

            const improvement = basic !== advanced ? '✅' : '➖';
            console.log(`${improvement} ${title}`);
            console.log(`   Basic:    ${basic}`);
            console.log(`   Advanced: ${advanced}`);
            console.log('');
        });

        // Compare overall statistics
        console.log('📈 OVERALL STATISTICS COMPARISON:\n');

        const sample = phoneData.slice(0, 1000); // Test with first 1000 items
        const basicStats = basicNormalizer.getNormalizationStats(sample);
        const advancedStats = advancedNormalizer.getNormalizationStats(sample);

        console.log('BASIC NORMALIZER:');
        console.log(`  Original items: ${basicStats.originalCount}`);
        console.log(`  Unique normalized: ${basicStats.uniqueCount}`);
        console.log(`  Duplicates found: ${basicStats.duplicatesFound}`);
        console.log(`  Reduction: ${basicStats.reductionPercentage}`);
        console.log('');

        console.log('ADVANCED NORMALIZER:');
        console.log(`  Original items: ${advancedStats.originalCount}`);
        console.log(`  Unique normalized: ${advancedStats.uniqueCount}`);
        console.log(`  Duplicates found: ${advancedStats.duplicatesFound}`);
        console.log(`  Reduction: ${advancedStats.reductionPercentage}`);
        console.log(`  Quality metrics:`);
        console.log(`    Empty normalized: ${advancedStats.qualityMetrics.emptyNormalized}`);
        console.log(`    Avg components: ${advancedStats.qualityMetrics.avgComponentsPerFingerprint}`);
        console.log(`    Success rate: ${advancedStats.qualityMetrics.normalizationSuccess}`);
        console.log('');

        // Improvement analysis
        const basicReduction = parseFloat(basicStats.reductionPercentage);
        const advancedReduction = parseFloat(advancedStats.reductionPercentage);
        const improvement = advancedReduction - basicReduction;

        console.log('🚀 IMPROVEMENT ANALYSIS:');
        console.log(`  Reduction improvement: ${improvement.toFixed(1)}% points`);
        console.log(`  Quality improvement: ${advancedStats.qualityMetrics.normalizationSuccess} success rate`);

        // Test grouping quality
        console.log('\n🎯 GROUPING QUALITY TEST:\n');

        const basicGroups = basicNormalizer.groupSimilarItems(sample.slice(0, 100), 0.8);
        const advancedGroups = advancedNormalizer.groupSimilarItems(sample.slice(0, 100), 0.8);

        console.log(`Basic normalizer groups: ${basicGroups.length}`);
        console.log(`Advanced normalizer groups: ${advancedGroups.length}`);

        // Show some example groups
        console.log('\nADVANCED NORMALIZER - EXAMPLE GROUPS:');
        advancedGroups.slice(0, 5).forEach((group, index) => {
            if (group.length > 1) {
                console.log(`Group ${index + 1} (${group.length} items):`);
                group.forEach(item => {
                    const normalized = advancedNormalizer.normalizeTitle(item.title);
                    console.log(`  - ${item.title} → ${normalized}`);
                });
                console.log('');
            }
        });

        // Test similarity matching improvements
        console.log('🎯 SIMILARITY MATCHING IMPROVEMENTS:\n');

        const testPairs = [
            ["Samsung Galaxy A15 5G, 128 GB, blue", "Samsung Galaxy A15, 128 GB, blue"],
            ["Apple iPhone 6, 64 GB, Gray", "Apple iPhone 6, 64 GB, gold"],
            ["Xiaomi Redmi 15C 4G, 128 GB, blue", "Xiaomi Redmi Note 14, 128 GB, green"],
            ["Solar Power Bank Original", "Անլար լիցքավորիչ"]
        ];

        testPairs.forEach(([title1, title2]) => {
            const basicSim = basicNormalizer.calculateSimilarity(title1, title2);
            const advancedSim = advancedNormalizer.calculateSimilarity(title1, title2);

            console.log(`"${title1}"`);
            console.log(`"${title2}"`);
            console.log(`Basic similarity: ${(basicSim * 100).toFixed(1)}%`);
            console.log(`Advanced similarity: ${(advancedSim * 100).toFixed(1)}%`);

            const improvement = advancedSim > basicSim ? '📈 Better' :
                               advancedSim < basicSim ? '📉 Changed' : '➖ Same';
            console.log(`${improvement}\n`);
        });

    } catch (error) {
        console.error('Error testing normalization:', error);
    }
}

// Run the comparison
compareNormalizers();