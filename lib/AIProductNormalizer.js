const axios = require('axios');
require('dotenv').config();

class AIProductNormalizer {
    constructor(apiKey = null) {
        this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY;
        this.baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1/chat/completions';
        this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
        this.batchSize = parseInt(process.env.DEEPSEEK_BATCH_SIZE) || 50; // Process 50 items per API call for balanced performance

        if (!this.apiKey) {
            console.warn('⚠️ No DeepSeek API key provided. Add DEEPSEEK_API_KEY to your .env file.');
        }

        // Category-specific prompts
        this.categoryPrompts = this.initializeCategoryPrompts();
    }

    initializeCategoryPrompts() {
        return {
            phones: {
                context: `PHONES & TABLETS NORMALIZATION:
Focus on: brand, model, storage, color, condition, product type
Key distinctions: iPhone 12 vs 13, screens vs phones vs batteries vs motherboards
Armenian context: Էկրան=screen, մարտկոց=battery, պլատա=motherboard, Պատոնական=original, Երախիքով=warranty
Russian context: экран=screen, батарея=battery, оригинал=original

Expected fingerprints: brand_model_storage_color_type
Examples: apple_iphone_13_128gb_blue_phone, samsung_s24_screen_original, xiaomi_redmi_note_12_battery`,

                examples: [
                    {input: "Apple iPhone 13, 128 GB, blue", output: "apple_iphone_13_128gb_blue_phone"},
                    {input: "Էկրան iPhone 12 Pro OLED", output: "apple_iphone_12_pro_screen_oled"},
                    {input: "Samsung s24 պլատա", output: "samsung_galaxy_s24_motherboard"},
                    {input: "Xiaomi Redmi Note 14, 256 GB, green", output: "xiaomi_redmi_note_14_256gb_green_phone"}
                ]
            },

            computers: {
                context: `COMPUTERS & LAPTOPS NORMALIZATION:
Focus on: brand, model, processor, RAM, storage, screen size, graphics card
Key distinctions: laptops vs desktops vs components vs graphics cards
Armenian context: համակարգիչ=computer, նոութբուք=laptop, պրոցեսոր=processor, վիդեոկարտա=graphics card
Russian context: компьютер=computer, ноутбук=laptop, процессор=processor, видеокарта=graphics card

Expected fingerprints: brand_model_processor_ram_storage_type
Examples: apple_macbook_pro_m2_16gb_512gb_laptop, dell_inspiron_i5_8gb_256gb_laptop, nvidia_rtx_4090_graphics_card`,

                examples: [
                    {input: "Apple MacBook Pro M2, 16 GB, 512 GB", output: "apple_macbook_pro_m2_16gb_512gb_laptop"},
                    {input: "Dell Inspiron i5 8GB 256GB", output: "dell_inspiron_i5_8gb_256gb_laptop"},
                    {input: "RTX 4090 24GB", output: "nvidia_geforce_rtx_4090_24gb_graphics_card"},
                    {input: "AMD Ryzen 7 5800X", output: "amd_ryzen_7_5800x_processor"}
                ]
            },

            kitchen_appliances: {
                context: `KITCHEN APPLIANCES NORMALIZATION:
Focus on: brand, type, capacity, power, material, features
Key distinctions: toasters vs blenders vs fryers, capacity in liters, power in watts
Armenian context: տոստեր=toaster, բլենդեր=blender, աերոգրիլ=air_fryer, լիտր=liter, վատտ=watt
Russian context: тостер=toaster, блендер=blender, аэрогриль=air_fryer, литр=liter

Expected fingerprints: brand_type_capacity_power_features
Examples: xiaomi_toaster_professional, bosch_blender_2l_glass, raf_air_fryer_11l`,

                examples: [
                    {input: "Xiaomi Toaster XMTSJ01FD professional", output: "xiaomi_toaster_professional"},
                    {input: "BOSCH բլենդեր 2L", output: "bosch_blender_2l"},
                    {input: "RAF R.5221A 11L air fryer", output: "raf_air_fryer_11l"}
                ]
            },

            microwaves: {
                context: `MICROWAVES NORMALIZATION:
Focus on: brand, power (watts), capacity (liters), type (built-in/countertop)
Armenian context: միկրոալիք=microwave, լիտր=liter, վատտ=watt
Russian context: микроволновка=microwave, литр=liter, ватт=watt

Expected fingerprints: brand_power_capacity_type
Examples: panasonic_800w_20l_countertop, samsung_1000w_25l_builtin`,

                examples: [
                    {input: "Panasonic 800W 20L microwave", output: "panasonic_800w_20l_countertop"},
                    {input: "Samsung 1000W built-in microwave", output: "samsung_1000w_builtin_microwave"}
                ]
            },

            audio_accessories: {
                context: `AUDIO ACCESSORIES NORMALIZATION:
Focus on: brand, type, connectivity, features
Key distinctions: microphones vs speakers vs headphones vs cables
Armenian context: միկրոֆոն=microphone, բարձրախոս=speaker, ականջակալ=headphones, անլար=wireless
Russian context: микрофон=microphone, динамик=speaker, наушники=headphones, беспроводной=wireless

Expected fingerprints: brand_type_connectivity_features
Examples: hollyland_lark_m2_wireless_microphone, marshall_speaker_bluetooth, bose_headphones_wireless`,

                examples: [
                    {input: "Hollyland LARK M2 wireless microphone", output: "hollyland_lark_m2_wireless_microphone"},
                    {input: "Marshall Bluetooth speaker", output: "marshall_speaker_bluetooth"},
                    {input: "Bose wireless headphones", output: "bose_headphones_wireless"}
                ]
            },

            electronics: {
                context: `ELECTRONICS NORMALIZATION:
Focus on: brand, type, model, key features
Key distinctions: streaming devices vs TV accessories vs gaming vs security vs drones
Armenian context: ապահովություն=security, խաղեր=games, դրոն=drone, հեռուստացույց=TV
Russian context: безопасность=security, игры=games, дрон=drone, телевизор=TV

Expected fingerprints: brand_type_model_features
Examples: apple_tv_4k_streaming_device, playstation_5_gaming_console, ring_doorbell_security_camera`,

                examples: [
                    {input: "Apple TV 4K streaming device", output: "apple_tv_4k_streaming_device"},
                    {input: "PlayStation 5 gaming console", output: "playstation_5_gaming_console"},
                    {input: "Ring Video Doorbell security", output: "ring_doorbell_security_camera"},
                    {input: "DJI Mavic Air 2 drone", output: "dji_mavic_air_2_drone"}
                ]
            },

            pet_products: {
                context: `PET PRODUCTS NORMALIZATION:
Focus on: brand, animal type, product type, size/age
Key distinctions: cat vs dog products, food vs toys vs accessories
Armenian context: կատու=cat, շուն=dog, կեր=food, խաղալիք=toy
Russian context: кот=cat, собака=dog, корм=food, игрушка=toy

Expected fingerprints: brand_animal_type_size_features
Examples: royal_canin_cat_food_adult, kong_dog_toy_large, purina_dog_food_puppy`,

                examples: [
                    {input: "Royal Canin cat food adult", output: "royal_canin_cat_food_adult"},
                    {input: "Kong dog toy large size", output: "kong_dog_toy_large"},
                    {input: "Purina puppy food", output: "purina_dog_food_puppy"}
                ]
            },

            generic: {
                context: `GENERIC PRODUCT NORMALIZATION:
Focus on: brand, type, model, key identifying features
Use descriptive terms and maintain key differentiators
Multi-language support for Armenian and Russian terms

Expected fingerprints: brand_type_model_features
Examples: brand_producttype_model_feature`,

                examples: [
                    {input: "Generic product example", output: "generic_product_example"}
                ]
            }
        };
    }

    async normalizeTitle(title, categoryType = 'phones') {
        const batch = [{ title, id: 'single' }];
        const results = await this.normalizeBatch(batch, categoryType);
        return results[0]?.fingerprint || '';
    }

    async normalizeBatch(items, categoryType = 'phones', progressCallback = null) {
        if (!this.apiKey) {
            throw new Error('DeepSeek API key not configured');
        }

        const results = [];
        const batches = this.chunkArray(items, this.batchSize);

        console.log(`🤖 Processing ${items.length} items in ${batches.length} batches for category: ${categoryType}`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} items)...`);

            // Retry logic for each batch
            let batchResults = null;
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries && !batchResults) {
                try {
                    batchResults = await this.processBatch(batch, categoryType);
                    results.push(...batchResults);

                    // Call progress callback if provided
                    if (progressCallback) {
                        progressCallback(results.length, items.length);
                    }

                    break; // Success, exit retry loop
                } catch (error) {
                    retryCount++;
                    console.error(`❌ Error processing batch ${i + 1} (attempt ${retryCount}/${maxRetries}):`, error.message);

                    if (retryCount < maxRetries) {
                        const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
                        console.log(`⏳ Retrying batch ${i + 1} in ${retryDelay/1000}s...`);
                        await this.sleep(retryDelay);
                    } else {
                        // All retries failed, add failed items with empty fingerprints
                        console.error(`💥 Batch ${i + 1} failed after ${maxRetries} attempts`);
                        batch.forEach(item => {
                            results.push({
                                ...item,
                                fingerprint: '',
                                error: error.message
                            });
                        });
                    }
                }
            }

            // Rate limiting - wait between batches (only if not the last batch)
            if (i < batches.length - 1) {
                await this.sleep(1000); // 1 second delay between batches
            }
        }

        return results;
    }

    async processBatch(items, categoryType) {
        const prompt = this.buildBatchPrompt(items, categoryType);

        try {
            const response = await axios.post(this.baseURL, {
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1, // Low temperature for consistent results
                max_tokens: 4000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000, // 120 second timeout
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            const content = response.data.choices[0].message.content;
            return this.parseAIResponse(content, items);

        } catch (error) {
            console.error('DeepSeek API error:', error.response?.data || error.message);
            throw error;
        }
    }

    buildBatchPrompt(items, categoryType) {
        const categoryConfig = this.categoryPrompts[categoryType] || this.categoryPrompts.phones;

        const itemsList = items.map((item, index) =>
            `${index + 1}. "${item.title}"`
        ).join('\n');

        const examplesList = categoryConfig.examples.map(ex =>
            `"${ex.input}" → "${ex.output}"`
        ).join('\n');

        return `You are a product normalization expert for an Armenian marketplace.

${categoryConfig.context}

EXAMPLES:
${examplesList}

TASK: Create unique fingerprints for these ${items.length} product titles:

${itemsList}

REQUIREMENTS:
- Distinguish different models clearly (iPhone 12 vs 13, different storage/colors)
- Separate products vs parts (phone vs screen vs motherboard vs battery)
- Handle Armenian/Russian/English text
- Create fingerprints that group identical products but separate different ones
- Use lowercase, underscores, no special characters

Return JSON array with this exact format:
[
  {"index": 1, "fingerprint": "brand_model_spec_type"},
  {"index": 2, "fingerprint": "brand_model_spec_type"},
  ...
]

Only return the JSON array, no other text.`;
    }

    parseAIResponse(content, originalItems) {
        try {
            // Extract JSON from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Map results back to original items
            const results = [];
            for (const result of parsed) {
                const index = result.index - 1; // Convert to 0-based index
                if (index >= 0 && index < originalItems.length) {
                    results.push({
                        ...originalItems[index],
                        fingerprint: result.fingerprint || '',
                        aiProcessed: true
                    });
                }
            }

            // Fill in any missing items
            for (let i = 0; i < originalItems.length; i++) {
                if (!results.find(r => r === originalItems[i] ||
                    (r.id && r.id === originalItems[i].id))) {
                    results.push({
                        ...originalItems[i],
                        fingerprint: '',
                        aiProcessed: false,
                        error: 'Missing from AI response'
                    });
                }
            }

            return results;

        } catch (error) {
            console.error('Failed to parse AI response:', error.message);
            console.error('Raw content:', content.substring(0, 500));

            // Return original items with empty fingerprints
            return originalItems.map(item => ({
                ...item,
                fingerprint: '',
                aiProcessed: false,
                error: 'Parse error'
            }));
        }
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Statistics and analysis methods
    groupByFingerprint(items) {
        const groups = {};

        items.forEach(item => {
            const fp = item.fingerprint;
            if (!fp) return; // Skip items without fingerprints

            if (!groups[fp]) {
                groups[fp] = {
                    fingerprint: fp,
                    count: 0,
                    items: [],
                    avgPrice: 0,
                    priceRange: { min: Infinity, max: 0 },
                    categories: new Set()
                };
            }

            const group = groups[fp];
            group.count++;
            group.items.push(item);

            if (item.price) {
                group.priceRange.min = Math.min(group.priceRange.min, item.price);
                group.priceRange.max = Math.max(group.priceRange.max, item.price);
            }

            if (item.category) {
                group.categories.add(item.category);
            }
        });

        // Calculate average prices
        Object.values(groups).forEach(group => {
            const prices = group.items.map(item => item.price).filter(p => p);
            if (prices.length > 0) {
                group.avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
            }
            group.categories = Array.from(group.categories);
        });

        return groups;
    }

    findDuplicates(items, threshold = 2) {
        const groups = this.groupByFingerprint(items);
        return Object.values(groups)
            .filter(group => group.count >= threshold)
            .sort((a, b) => b.count - a.count);
    }

    calculateSoldItems(currentItems, previousItems) {
        const currentFingerprints = new Set(
            currentItems.map(item => item.fingerprint).filter(fp => fp)
        );

        const sold = previousItems.filter(item =>
            item.fingerprint && !currentFingerprints.has(item.fingerprint)
        );

        return this.groupByFingerprint(sold);
    }

    getNormalizationStats(items) {
        const total = items.length;
        const withFingerprints = items.filter(item => item.fingerprint).length;
        const uniqueFingerprints = new Set(
            items.map(item => item.fingerprint).filter(fp => fp)
        ).size;

        const successRate = ((withFingerprints / total) * 100).toFixed(1);
        const reductionRate = total > 0 ?
            (((total - uniqueFingerprints) / total) * 100).toFixed(1) : '0.0';

        return {
            totalItems: total,
            successfulNormalizations: withFingerprints,
            uniqueFingerprints,
            duplicatesFound: total - uniqueFingerprints,
            successRate: `${successRate}%`,
            reductionRate: `${reductionRate}%`,
            avgItemsPerFingerprint: uniqueFingerprints > 0 ?
                (total / uniqueFingerprints).toFixed(1) : '0.0'
        };
    }
}

module.exports = AIProductNormalizer;