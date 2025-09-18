class ProductNormalizer {
    constructor() {
        // Armenian to English translations for common terms
        this.armenianTranslations = {
            // Device types
            'հեռախոս': 'phone',
            'պլանշետ': 'tablet',
            'ժամացույց': 'watch',
            'երախիք': 'warranty',
            'պատոնական': 'original',
            'նոր': 'new',
            'օգտագործված': 'used',
            'առաքում': 'delivery',
            'զրոներով': 'zeros',
            'համարներ': 'numbers',
            'տեսականի': 'variety',
            'մեծ': 'big',
            'շատ': 'many',
            'բռնակ': 'holder',
            'լիցքավորիչ': 'charger',
            'արևային': 'solar',
            'պանելով': 'panel',
            'պանել': 'panel',
            'բատարիա': 'battery',
            'էկրան': 'screen',
            'դիսփլեյ': 'display'
        };

        // Russian to English translations
        this.russianTranslations = {
            'телефон': 'phone',
            'планшет': 'tablet',
            'часы': 'watch',
            'новый': 'new',
            'оригинал': 'original',
            'батарея': 'battery',
            'панель': 'panel',
            'солнечная': 'solar',
            'держатель': 'holder',
            'зарядное': 'charger',
            'устройство': 'device',
            'экран': 'screen',
            'дисплей': 'display'
        };

        // Brand standardization
        this.brandMappings = {
            'iphone': 'apple iphone',
            'apple iphone': 'apple iphone',
            'apple': 'apple',
            'samsung': 'samsung',
            'samsung galaxy': 'samsung galaxy',
            'xiaomi': 'xiaomi',
            'xiaomi redmi': 'xiaomi redmi',
            'huawei': 'huawei',
            'nokia': 'nokia',
            'oneplus': 'oneplus',
            'one plus': 'oneplus',
            'lenovo': 'lenovo',
            'lg': 'lg',
            'sony': 'sony',
            'motorola': 'motorola',
            'oppo': 'oppo',
            'vivo': 'vivo',
            'realme': 'realme',
            'honor': 'honor'
        };

        // Storage standardization
        this.storagePattern = /(\d+)\s*(gb|гб|գբ|mb|мб|մբ|tb|тб|տբ)/gi;

        // Model patterns for phones
        this.phoneModels = [
            // iPhone models
            /iphone\s*(se|mini|pro|plus|max)?\s*(\d+)\s*(pro|mini|plus|max)?/gi,
            // Samsung Galaxy models
            /galaxy\s*([a-z]\d+|s\d+|note\s*\d+|z\s*\w+)/gi,
            // Xiaomi models
            /redmi\s*(note\s*)?\d+[a-z]?/gi,
            /(mi\s*\d+[a-z]?|poco\s*[a-z]?\d+)/gi,
            // General model patterns
            /([a-z]+\s*\d+[a-z]?)/gi
        ];

        // Noise words to remove
        this.noiseWords = [
            'original', 'new', 'used', 'excellent', 'perfect', 'good', 'bad',
            'оригинал', 'новый', 'отличный', 'хороший', 'плохой',
            'նոր', 'օգտագործված', 'գերազանց', 'լավ', 'վատ',
            'vip', 'gold', 'premium', 'exclusive', 'special',
            'urgent', 'срочно', 'շտապ',
            'cheap', 'дешево', 'էժան',
            'expensive', 'дорого', 'թանկ',
            'sale', 'продажа', 'վաճառք',
            'quick', 'fast', 'быстро', 'արագ',
            'delivery', 'доставка', 'առաքում',
            'warranty', 'гарантия', 'երախիք'
        ];

        // Color standardization
        this.colorMappings = {
            'black': 'black', 'սև': 'black', 'черный': 'black',
            'white': 'white', 'սպիտակ': 'white', 'белый': 'white',
            'blue': 'blue', 'կապույտ': 'blue', 'синий': 'blue',
            'red': 'red', 'կարմիր': 'red', 'красный': 'red',
            'green': 'green', 'կանաչ': 'green', 'зеленый': 'green',
            'gold': 'gold', 'ոսկի': 'gold', 'золотой': 'gold',
            'silver': 'silver', 'արծաթ': 'silver', 'серебро': 'silver',
            'pink': 'pink', 'վարդագույն': 'pink', 'розовый': 'pink',
            'purple': 'purple', 'մանուշակագույն': 'purple', 'фиолетовый': 'purple',
            'gray': 'gray', 'գորշ': 'gray', 'серый': 'gray',
            'grey': 'gray', 'գորշ': 'gray', 'серый': 'gray'
        };
    }

    normalizeTitle(title) {
        if (!title || typeof title !== 'string') return '';

        let normalized = title.toLowerCase().trim();

        // Step 1: Translate Armenian and Russian words
        normalized = this.translateText(normalized);

        // Step 2: Extract and normalize components
        const components = this.extractComponents(normalized);

        // Step 3: Build normalized fingerprint
        const fingerprint = this.buildFingerprint(components);

        return fingerprint;
    }

    translateText(text) {
        let translated = text;

        // Replace Armenian words
        for (const [armenian, english] of Object.entries(this.armenianTranslations)) {
            const regex = new RegExp(armenian, 'gi');
            translated = translated.replace(regex, english);
        }

        // Replace Russian words
        for (const [russian, english] of Object.entries(this.russianTranslations)) {
            const regex = new RegExp(russian, 'gi');
            translated = translated.replace(regex, english);
        }

        return translated;
    }

    extractComponents(text) {
        const components = {
            brand: null,
            model: null,
            storage: null,
            color: null,
            type: null
        };

        // Extract brand
        for (const [pattern, brand] of Object.entries(this.brandMappings)) {
            const regex = new RegExp(pattern, 'gi');
            if (regex.test(text)) {
                components.brand = brand;
                break;
            }
        }

        // Extract storage
        const storageMatch = text.match(this.storagePattern);
        if (storageMatch) {
            const storage = storageMatch[0].toLowerCase()
                .replace(/гб|գբ/gi, 'gb')
                .replace(/мб|մբ/gi, 'mb')
                .replace(/тб|տբ/gi, 'tb')
                .replace(/\s+/g, '');
            components.storage = storage;
        }

        // Extract model
        for (const modelPattern of this.phoneModels) {
            const match = text.match(modelPattern);
            if (match) {
                components.model = match[0].toLowerCase().trim();
                break;
            }
        }

        // Extract color
        for (const [colorPattern, standardColor] of Object.entries(this.colorMappings)) {
            const regex = new RegExp(`\\b${colorPattern}\\b`, 'gi');
            if (regex.test(text)) {
                components.color = standardColor;
                break;
            }
        }

        // Determine device type
        if (text.includes('phone') || text.includes('iphone') || components.brand) {
            components.type = 'phone';
        } else if (text.includes('tablet') || text.includes('ipad')) {
            components.type = 'tablet';
        } else if (text.includes('watch')) {
            components.type = 'watch';
        } else if (text.includes('charger') || text.includes('cable')) {
            components.type = 'accessory';
        }

        return components;
    }

    buildFingerprint(components) {
        const parts = [];

        if (components.brand) parts.push(components.brand);
        if (components.model) parts.push(components.model);
        if (components.storage) parts.push(components.storage);
        if (components.type) parts.push(components.type);

        return parts.join('_').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    // Remove noise words and normalize whitespace
    cleanText(text) {
        let cleaned = text.toLowerCase();

        // Remove noise words
        for (const noise of this.noiseWords) {
            const regex = new RegExp(`\\b${noise}\\b`, 'gi');
            cleaned = cleaned.replace(regex, '');
        }

        // Remove extra punctuation and normalize whitespace
        cleaned = cleaned
            .replace(/[^\w\s\u0531-\u0587\u0400-\u04FF]/g, ' ') // Keep letters, numbers, Armenian, Cyrillic
            .replace(/\s+/g, ' ')
            .trim();

        return cleaned;
    }

    // Calculate similarity between two normalized titles
    calculateSimilarity(title1, title2) {
        const normalized1 = this.normalizeTitle(title1);
        const normalized2 = this.normalizeTitle(title2);

        if (normalized1 === normalized2) return 1.0;

        return this.jaccardSimilarity(normalized1, normalized2);
    }

    // Jaccard similarity for fingerprints
    jaccardSimilarity(str1, str2) {
        const set1 = new Set(str1.split('_'));
        const set2 = new Set(str2.split('_'));

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return intersection.size / union.size;
    }

    // Group items by similarity
    groupSimilarItems(items, threshold = 0.8) {
        const groups = [];
        const processed = new Set();

        for (let i = 0; i < items.length; i++) {
            if (processed.has(i)) continue;

            const group = [items[i]];
            processed.add(i);

            for (let j = i + 1; j < items.length; j++) {
                if (processed.has(j)) continue;

                const similarity = this.calculateSimilarity(items[i].title, items[j].title);
                if (similarity >= threshold) {
                    group.push(items[j]);
                    processed.add(j);
                }
            }

            groups.push(group);
        }

        return groups;
    }

    // Get statistics for normalization effectiveness
    getNormalizationStats(items) {
        const originalCount = items.length;
        const normalizedTitles = items.map(item => this.normalizeTitle(item.title));
        const uniqueNormalized = new Set(normalizedTitles);
        const uniqueCount = uniqueNormalized.size;

        const duplicatesFound = originalCount - uniqueCount;
        const reductionPercentage = ((duplicatesFound / originalCount) * 100).toFixed(1);

        return {
            originalCount,
            uniqueCount,
            duplicatesFound,
            reductionPercentage: `${reductionPercentage}%`
        };
    }
}

module.exports = ProductNormalizer;