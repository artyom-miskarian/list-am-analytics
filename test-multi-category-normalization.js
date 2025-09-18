const MultiCategoryNormalizer = require('./lib/MultiCategoryNormalizer.js');
const AdvancedProductNormalizer = require('./lib/AdvancedProductNormalizer.js');
const fs = require('fs').promises;

async function testMultiCategoryNormalization() {
    console.log('🔬 TESTING MULTI-CATEGORY NORMALIZATION\n');

    const multiNormalizer = new MultiCategoryNormalizer();
    const phoneNormalizer = new AdvancedProductNormalizer();

    // Test data files
    const testFiles = [
        { file: 'current_phones.json', category: 'phones', hint: null },
        { file: 'current_audio_accessories.json', category: 'audio_accessories', hint: 'audio' },
        { file: 'current_kitchen_appliances.json', category: 'kitchen_appliances', hint: 'kitchen' }
    ];

    for (const testFile of testFiles) {
        try {
            console.log(`📊 TESTING ${testFile.category.toUpperCase()}:`);
            console.log('='.repeat(60));

            const data = JSON.parse(await fs.readFile(`./crawler_data/${testFile.file}`, 'utf-8'));
            const sample = data.slice(0, 15); // Test with first 15 items

            console.log(`Loaded ${data.length} items, testing with first ${sample.length}\n`);

            // Show normalization examples
            console.log('SAMPLE NORMALIZATIONS:');
            sample.forEach((item, index) => {
                const multiNormalized = multiNormalizer.normalizeTitle(item.title, testFile.hint);
                const phoneNormalized = testFile.category === 'phones'
                    ? phoneNormalizer.normalizeTitle(item.title)
                    : 'N/A';

                console.log(`${index + 1}. ${item.title}`);
                console.log(`   Multi-Category: ${multiNormalized}`);
                if (phoneNormalized !== 'N/A') {
                    console.log(`   Phone-Only:     ${phoneNormalized}`);
                }
                console.log('');
            });

            // Get statistics
            const multiStats = multiNormalizer.getNormalizationStats(data, testFile.hint);
            console.log('NORMALIZATION STATISTICS:');
            console.log(`  Original items: ${multiStats.originalCount}`);
            console.log(`  Unique normalized: ${multiStats.uniqueCount}`);
            console.log(`  Duplicates found: ${multiStats.duplicatesFound}`);
            console.log(`  Reduction: ${multiStats.reductionPercentage}`);
            console.log(`  Success rate: ${multiStats.qualityMetrics.normalizationSuccess}`);
            console.log(`  Avg components: ${multiStats.qualityMetrics.avgComponentsPerFingerprint}`);

            // Show duplicate groups
            const titleGroups = {};
            data.forEach(item => {
                const normalized = multiNormalizer.normalizeTitle(item.title, testFile.hint);
                if (normalized) {
                    if (!titleGroups[normalized]) titleGroups[normalized] = [];
                    titleGroups[normalized].push(item.title);
                }
            });

            const duplicates = Object.entries(titleGroups)
                .filter(([title, items]) => items.length > 1)
                .sort(([,a], [,b]) => b.length - a.length)
                .slice(0, 5);

            if (duplicates.length > 0) {
                console.log('\nTOP DUPLICATE GROUPS:');
                duplicates.forEach(([normalized, titles]) => {
                    const uniqueTitles = [...new Set(titles)];
                    console.log(`${titles.length}x: ${normalized}`);
                    uniqueTitles.slice(0, 3).forEach(title => {
                        console.log(`     - ${title}`);
                    });
                    console.log('');
                });
            }

            console.log('\n' + '='.repeat(60) + '\n');

        } catch (error) {
            console.log(`❌ Could not test ${testFile.category}: ${error.message}\n`);
        }
    }

    // Category-specific pattern tests
    console.log('🎯 CATEGORY-SPECIFIC PATTERN TESTS:\n');

    const categoryTests = [
        {
            category: 'Audio Accessories',
            hint: 'audio',
            tests: [
                "Hollyland LARK M2 DUO 2-Person Wireless Combo Microphone System",
                "Mini - Ժուչոկ ձայնագրող սարք 150 ժամ (Բարձր Որակ)",
                "Միկրոֆոն մագնիտոֆոնի (СССР)",
                "Ձայնագրիչ շատ փոքր մինի - 8gb",
                "Marshall GV-2 Plus",
                "Գիթար Դասական Գիթառ",
                "Հեռախոսի և տեսախցիկի Boya M1 միկրոֆոն"
            ]
        },
        {
            category: 'Kitchen Appliances',
            hint: 'kitchen',
            tests: [
                "Օրավարձով BERG վարձով կուլեռ վարձույթ ջրի սարք դիսպենսեռ",
                "Тостер Տոստեր Xiaomi Toaster XMTSJ01FD * SMARTBOX *",
                "Ֆրի պատրաստող սարք (Фритюрница) RAF R.5221A 11L",
                "Բլենդեր BOSCH պրոֆեսիոնալ 2L",
                "Աերոգրիլ (panasonic)",
                "Ալյումինե կաթսա 50լիտր",
                "Պրոֆեսիոնալ մսաղաց"
            ]
        }
    ];

    categoryTests.forEach(test => {
        console.log(`${test.category}:`);
        console.log('-'.repeat(30));

        test.tests.forEach(title => {
            const normalized = multiNormalizer.normalizeTitle(title, test.hint);
            console.log(`${title}`);
            console.log(`→ ${normalized}`);
            console.log('');
        });

        console.log('');
    });

    // Compare with phone-only normalizer
    console.log('📱 PHONE NORMALIZATION COMPARISON:\n');

    const phoneTests = [
        "Samsung Galaxy A15 5G, 128 GB, blue",
        "Apple iPhone 12 Pro, 256 GB, blue",
        "Xiaomi Redmi Note 14, 128 GB, green"
    ];

    phoneTests.forEach(title => {
        const multiResult = multiNormalizer.normalizeTitle(title, 'phones');
        const phoneResult = phoneNormalizer.normalizeTitle(title);

        console.log(`${title}`);
        console.log(`Multi-Category: ${multiResult}`);
        console.log(`Phone-Only:     ${phoneResult}`);
        console.log('');
    });
}

// Run the test
testMultiCategoryNormalization();