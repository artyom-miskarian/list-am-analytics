const ProductNormalizer = require('./lib/ProductNormalizer.js');
const fs = require('fs').promises;

async function testNormalization() {
    console.log('🔍 Testing Product Normalization with Real Data\n');

    try {
        // Load real phone data
        const phoneData = JSON.parse(await fs.readFile('./crawler_data/current_phones.json', 'utf-8'));
        const normalizer = new ProductNormalizer();

        console.log(`📊 Loaded ${phoneData.length} phone listings\n`);

        // Test with first 20 items for detailed analysis
        const sampleItems = phoneData.slice(0, 20);

        console.log('📝 SAMPLE NORMALIZATION RESULTS:\n');
        console.log('Original Title → Normalized Fingerprint');
        console.log('=' .repeat(80));

        sampleItems.forEach((item, index) => {
            const normalized = normalizer.normalizeTitle(item.title);
            console.log(`${index + 1}. ${item.title}`);
            console.log(`   → ${normalized}\n`);
        });

        // Get overall statistics
        const stats = normalizer.getNormalizationStats(phoneData);
        console.log('📈 NORMALIZATION STATISTICS:');
        console.log('=' .repeat(40));
        console.log(`Original items: ${stats.originalCount}`);
        console.log(`Unique normalized: ${stats.uniqueCount}`);
        console.log(`Duplicates found: ${stats.duplicatesFound}`);
        console.log(`Reduction: ${stats.reductionPercentage}\n`);

        // Find most common duplicates
        const titleCounts = {};
        phoneData.forEach(item => {
            const normalized = normalizer.normalizeTitle(item.title);
            if (normalized) {
                titleCounts[normalized] = (titleCounts[normalized] || 0) + 1;
            }
        });

        const duplicates = Object.entries(titleCounts)
            .filter(([title, count]) => count > 1)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        if (duplicates.length > 0) {
            console.log('🔄 TOP DUPLICATE GROUPS FOUND:');
            console.log('=' .repeat(40));
            duplicates.forEach(([normalizedTitle, count]) => {
                console.log(`${count}x: ${normalizedTitle}`);

                // Show original titles for this group
                const originalTitles = phoneData
                    .filter(item => normalizer.normalizeTitle(item.title) === normalizedTitle)
                    .map(item => item.title)
                    .slice(0, 3); // Show first 3 examples

                originalTitles.forEach(title => {
                    console.log(`     - "${title}"`);
                });
                console.log('');
            });
        }

        // Test similarity matching
        console.log('🎯 SIMILARITY MATCHING TEST:');
        console.log('=' .repeat(40));

        const testTitles = [
            "Xiaomi Redmi 15C 4G, 128 GB, blue",
            "Xiaomi Redmi 15C 4G, 128 GB, green",
            "Apple iPhone 12 Pro, 256 GB, blue",
            "iPhone 12 Pro 256GB Gold"
        ];

        for (let i = 0; i < testTitles.length; i++) {
            for (let j = i + 1; j < testTitles.length; j++) {
                const similarity = normalizer.calculateSimilarity(testTitles[i], testTitles[j]);
                console.log(`"${testTitles[i]}"`);
                console.log(`"${testTitles[j]}"`);
                console.log(`Similarity: ${(similarity * 100).toFixed(1)}%\n`);
            }
        }

        // Test grouping
        const groups = normalizer.groupSimilarItems(sampleItems.slice(0, 10), 0.7);
        console.log('👥 ITEM GROUPING TEST (threshold: 70%):');
        console.log('=' .repeat(40));
        groups.forEach((group, index) => {
            if (group.length > 1) {
                console.log(`Group ${index + 1} (${group.length} items):`);
                group.forEach(item => {
                    console.log(`  - ${item.title}`);
                });
                console.log('');
            }
        });

    } catch (error) {
        console.error('Error testing normalization:', error);
    }
}

// Run the test
testNormalization();