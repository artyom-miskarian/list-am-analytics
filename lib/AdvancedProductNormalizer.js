class AdvancedProductNormalizer {
    constructor() {
        // Enhanced Armenian translations with more comprehensive coverage
        this.armenianTranslations = {
            // Device types
            'հեռախոս': 'phone', 'հեռախոսի': 'phone',
            'պլանշետ': 'tablet', 'պլանշետի': 'tablet',
            'ժամացույց': 'watch', 'ժամացույցի': 'watch',
            'խելացի': 'smart',
            'երախիք': 'warranty', 'երաշխիք': 'warranty',
            'պատոնական': 'original', 'օրիգինալ': 'original',
            'նոր': 'new', 'նորը': 'new',
            'օգտագործված': 'used',
            'առաքում': 'delivery',
            'զրոներով': 'zeros', 'համարներ': 'numbers',
            'տեսականի': 'variety', 'մեծ': 'big', 'շատ': 'many',
            'բռնակ': 'holder', 'պահական': 'holder',
            'լիցքավորիչ': 'charger', 'լիցք': 'charger',
            'արևային': 'solar', 'պանելով': 'panel', 'պանել': 'panel',
            'բատարիա': 'battery', 'մարտկոց': 'battery',
            'էկրան': 'screen', 'դիսփլեյ': 'display',
            'անլար': 'wireless', 'լար': 'cable',
            'ապակի': 'glass', 'կափարիչ': 'case',
            'մասեր': 'parts', 'կտոր': 'part',
            'վարդագույն': 'pink', 'մոխրագույն': 'gray',
            'արծաթագույն': 'silver', 'ոսկեգույն': 'gold',
            'սև': 'black', 'սպիտակ': 'white',
            'կապույտ': 'blue', 'կանաչ': 'green',
            'կարմիր': 'red', 'մանուշակագույն': 'purple'
        };

        // Enhanced Russian translations
        this.russianTranslations = {
            'телефон': 'phone', 'телефона': 'phone',
            'планшет': 'tablet', 'планшета': 'tablet',
            'часы': 'watch', 'часов': 'watch',
            'умный': 'smart', 'умные': 'smart',
            'новый': 'new', 'новые': 'new', 'новая': 'new',
            'оригинал': 'original', 'оригинальный': 'original',
            'батарея': 'battery', 'аккумулятор': 'battery',
            'панель': 'panel', 'солнечная': 'solar',
            'держатель': 'holder', 'подставка': 'holder',
            'зарядное': 'charger', 'зарядка': 'charger',
            'устройство': 'device', 'девайс': 'device',
            'экран': 'screen', 'дисплей': 'display',
            'беспроводной': 'wireless', 'кабель': 'cable',
            'стекло': 'glass', 'чехол': 'case',
            'части': 'parts', 'запчасти': 'parts',
            'черный': 'black', 'белый': 'white',
            'синий': 'blue', 'зеленый': 'green',
            'красный': 'red', 'золотой': 'gold',
            'серебряный': 'silver', 'серый': 'gray',
            'розовый': 'pink', 'фиолетовый': 'purple'
        };

        // More precise brand mappings with aliases
        this.brandMappings = {
            'apple': 'apple',
            'iphone': 'apple',
            'ipad': 'apple',
            'iwatch': 'apple',
            'samsung': 'samsung',
            'galaxy': 'samsung',
            'xiaomi': 'xiaomi',
            'redmi': 'xiaomi',
            'mi': 'xiaomi',
            'poco': 'xiaomi',
            'huawei': 'huawei',
            'honor': 'huawei', // Honor is Huawei sub-brand
            'nokia': 'nokia',
            'oneplus': 'oneplus',
            'realme': 'realme',
            'oppo': 'oppo',
            'vivo': 'vivo',
            'lenovo': 'lenovo',
            'motorola': 'motorola',
            'lg': 'lg',
            'sony': 'sony',
            'asus': 'asus',
            'alcatel': 'alcatel',
            'blackberry': 'blackberry',
            'htc': 'htc',
            'meizu': 'meizu',
            'zte': 'zte',
            'dji': 'dji'
        };

        // Comprehensive model detection patterns
        this.modelPatterns = {
            // iPhone patterns - more specific
            apple: [
                /(?:iphone\s*)?(\d{1,2}(?:\s*pro)?(?:\s*max)?(?:\s*mini)?(?:\s*plus)?)/gi,
                /(?:iphone\s*)?(se)\s*(?:\(\d{4}\))?/gi,
                /(?:iphone\s*)?(x[rs]?)/gi,
                /(?:ipad)\s*(pro|air|mini)?(?:\s*(\d+))?/gi,
                /(?:apple\s*watch)\s*(series\s*\d+|\d+)/gi
            ],

            // Samsung patterns
            samsung: [
                /galaxy\s*([a-z]\d+[a-z]*(?:\s*(?:plus|pro|max|mini|ultra|fe))?)/gi,
                /galaxy\s*(s\d+[a-z]*(?:\s*(?:plus|pro|max|mini|ultra|fe))?)/gi,
                /galaxy\s*(note\s*\d+[a-z]*(?:\s*(?:plus|pro|max|mini|ultra|fe))?)/gi,
                /galaxy\s*(z\s*(?:flip|fold)\d*)/gi,
                /galaxy\s*(tab\s*[a-z]?\d+)/gi
            ],

            // Xiaomi patterns
            xiaomi: [
                /(?:redmi\s*)?(note\s*\d+[a-z]*(?:\s*(?:pro|plus|max|mini))?)/gi,
                /(?:redmi\s*)?(\d+[a-z]*(?:\s*(?:pro|plus|max|mini))?)/gi,
                /(?:mi\s*)?(\d+[a-z]*(?:\s*(?:pro|plus|max|mini|lite|t))?)/gi,
                /poco\s*([a-z]?\d+[a-z]*(?:\s*(?:pro|plus|max|mini))?)/gi
            ],

            // Huawei patterns
            huawei: [
                /(?:huawei\s*)?(p\d+[a-z]*(?:\s*(?:pro|plus|max|mini|lite))?)/gi,
                /(?:huawei\s*)?(mate\s*\d+[a-z]*(?:\s*(?:pro|plus|max|mini))?)/gi,
                /(?:huawei\s*)?(nova\s*\d+[a-z]*(?:\s*(?:pro|plus|max|mini))?)/gi,
                /(?:honor\s*)?(\d+[a-z]*(?:\s*(?:pro|plus|max|mini|lite))?)/gi
            ],

            // Generic patterns for other brands
            generic: [
                /([a-z]+\s*\d+[a-z]*(?:\s*(?:pro|plus|max|mini|lite|ultra))?)/gi
            ]
        };

        // Enhanced storage patterns with more formats
        this.storagePattern = /(\d+(?:\.\d+)?)\s*(gb|гб|գբ|mb|мб|մբ|tb|тб|տբ|gigs?|megs?|tera)/gi;

        // Color standardization with more variants
        this.colorMappings = {
            // English
            'black': 'black', 'white': 'white', 'blue': 'blue', 'red': 'red',
            'green': 'green', 'yellow': 'yellow', 'orange': 'orange',
            'purple': 'purple', 'pink': 'pink', 'brown': 'brown',
            'gold': 'gold', 'silver': 'silver', 'gray': 'gray', 'grey': 'gray',
            'rose': 'pink', 'space': 'gray', 'midnight': 'black',

            // Armenian
            'սև': 'black', 'սպիտակ': 'white', 'կապույտ': 'blue', 'կարմիր': 'red',
            'կանաչ': 'green', 'դեղին': 'yellow', 'նարնջագույն': 'orange',
            'մանուշակագույն': 'purple', 'վարդագույն': 'pink', 'շագանակագույն': 'brown',
            'ոսկեգույն': 'gold', 'արծաթագույն': 'silver', 'մոխրագույն': 'gray',

            // Russian
            'черный': 'black', 'белый': 'white', 'синий': 'blue', 'красный': 'red',
            'зеленый': 'green', 'желтый': 'yellow', 'оранжевый': 'orange',
            'фиолетовый': 'purple', 'розовый': 'pink', 'коричневый': 'brown',
            'золотой': 'gold', 'серебряный': 'silver', 'серый': 'gray'
        };

        // Accessory type detection
        this.accessoryPatterns = {
            'charger': ['charger', 'լիցքավորիչ', 'зарядное', 'зарядка'],
            'cable': ['cable', 'լար', 'кабель', 'провод'],
            'case': ['case', 'cover', 'կափարիչ', 'чехол', 'кейс'],
            'screen': ['screen', 'display', 'էկրան', 'դիսփլեյ', 'экран', 'дисплей'],
            'battery': ['battery', 'մարտկոց', 'բատարիա', 'батарея', 'аккумулятор'],
            'holder': ['holder', 'stand', 'բռնակ', 'պահական', 'держатель', 'подставка'],
            'glass': ['glass', 'ապակի', 'стекло'],
            'headphones': ['headphones', 'earphones', 'ականջակալ', 'наушники'],
            'powerbank': ['powerbank', 'power bank', 'power-bank', 'պաուեր բանկ']
        };

        // Enhanced noise words - more comprehensive
        this.noiseWords = [
            // Promotional terms
            'original', 'new', 'used', 'excellent', 'perfect', 'good', 'bad', 'best',
            'cheap', 'expensive', 'urgent', 'sale', 'special', 'exclusive', 'premium',
            'vip', 'gold', 'platinum', 'diamond', 'pro', 'professional',

            // Armenian promotional
            'նոր', 'օգտագործված', 'գերազանց', 'լավ', 'վատ', 'լավագույն', 'էժան', 'թանկ',
            'շտապ', 'վաճառք', 'հատուկ', 'եզակի', 'պրեմիում', 'ցանկացած', 'տեսակի',

            // Russian promotional
            'новый', 'использованный', 'отличный', 'хороший', 'плохой', 'лучший',
            'дешевый', 'дорогой', 'срочно', 'продажа', 'специальный', 'эксклюзивный',

            // Service terms
            'delivery', 'warranty', 'free', 'fast', 'quick', 'անվճար', 'արագ',
            'առաքում', 'երաշխիք', 'доставка', 'гарантия', 'бесплатно', 'быстро',

            // Technical noise
            'inner', 'outer', 'lcd', 'oled', 'amoled', 'ips', 'retina',
            'unlocked', 'locked', 'sim', 'dual', 'single', 'gsm', 'cdma'
        ];

        // Generation mappings for similar models
        this.generationMappings = {
            // iPhone generations that should be separate
            'iphone_6': 'iphone_6_gen',
            'iphone_6s': 'iphone_6s_gen',
            'iphone_7': 'iphone_7_gen',
            'iphone_8': 'iphone_8_gen',
            'iphone_x': 'iphone_x_gen',
            'iphone_11': 'iphone_11_gen',
            'iphone_12': 'iphone_12_gen',
            'iphone_13': 'iphone_13_gen',
            'iphone_14': 'iphone_14_gen',
            'iphone_15': 'iphone_15_gen',

            // Samsung Galaxy generations
            'galaxy_s8': 'galaxy_s8_gen',
            'galaxy_s9': 'galaxy_s9_gen',
            'galaxy_s10': 'galaxy_s10_gen',
            'galaxy_s20': 'galaxy_s20_gen',
            'galaxy_s21': 'galaxy_s21_gen',
            'galaxy_s22': 'galaxy_s22_gen',
            'galaxy_s23': 'galaxy_s23_gen',
            'galaxy_s24': 'galaxy_s24_gen'
        };
    }

    normalizeTitle(title) {
        if (!title || typeof title !== 'string') return '';

        let normalized = title.toLowerCase().trim();

        // Step 1: Clean and translate
        normalized = this.cleanText(normalized);
        normalized = this.translateText(normalized);

        // Step 2: Extract detailed components
        const components = this.extractDetailedComponents(normalized);

        // Step 3: Build high-quality fingerprint
        const fingerprint = this.buildAdvancedFingerprint(components);

        return fingerprint;
    }

    translateText(text) {
        let translated = text;

        // Replace Armenian words (order matters - longer phrases first)
        const armenianEntries = Object.entries(this.armenianTranslations)
            .sort(([a], [b]) => b.length - a.length);

        for (const [armenian, english] of armenianEntries) {
            const regex = new RegExp(`\\b${armenian}\\b`, 'gi');
            translated = translated.replace(regex, english);
        }

        // Replace Russian words
        const russianEntries = Object.entries(this.russianTranslations)
            .sort(([a], [b]) => b.length - a.length);

        for (const [russian, english] of russianEntries) {
            const regex = new RegExp(`\\b${russian}\\b`, 'gi');
            translated = translated.replace(regex, english);
        }

        return translated;
    }

    extractDetailedComponents(text) {
        if (!text || typeof text !== 'string') return this.getEmptyComponents();

        const components = {
            brand: null,
            model: null,
            subModel: null,
            generation: null,
            storage: null,
            color: null,
            type: null,
            accessoryType: null,
            variant: null
        };

        // Extract brand first
        for (const [pattern, brand] of Object.entries(this.brandMappings)) {
            const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
            if (regex.test(text)) {
                components.brand = brand;
                break;
            }
        }

        // Extract model using brand-specific patterns
        if (components.brand && this.modelPatterns[components.brand]) {
            for (const modelPattern of this.modelPatterns[components.brand]) {
                const match = text.match(modelPattern);
                if (match) {
                    let model = match[0].toLowerCase().trim();

                    // Clean up the model
                    model = model.replace(/^(iphone|galaxy|redmi|mi|poco|huawei|honor)\s*/i, '');

                    components.model = model;

                    // Check for sub-variants (pro, max, plus, mini)
                    if (model.includes('pro')) components.variant = 'pro';
                    if (model.includes('max')) components.variant = 'max';
                    if (model.includes('plus')) components.variant = 'plus';
                    if (model.includes('mini')) components.variant = 'mini';

                    break;
                }
            }
        }

        // Generic model extraction if brand-specific failed
        if (!components.model && components.brand) {
            for (const modelPattern of this.modelPatterns.generic) {
                const match = text.match(modelPattern);
                if (match) {
                    components.model = match[0].toLowerCase().trim();
                    break;
                }
            }
        }

        // Extract storage with improved parsing
        const storageMatch = text.match(this.storagePattern);
        if (storageMatch && storageMatch[1] && storageMatch[2]) {
            let size = parseFloat(storageMatch[1]);
            let unit = storageMatch[2].toLowerCase();

            // Normalize units
            if (unit.match(/gb|гб|գբ|gigs?/)) unit = 'gb';
            else if (unit.match(/mb|мб|մբ|megs?/)) unit = 'mb';
            else if (unit.match(/tb|тб|տբ|tera/)) unit = 'tb';

            // Convert to GB for standardization
            if (unit === 'mb') size = size / 1024;
            if (unit === 'tb') size = size * 1024;

            components.storage = `${Math.round(size)}gb`;
        }

        // Extract color
        for (const [colorPattern, standardColor] of Object.entries(this.colorMappings)) {
            const regex = new RegExp(`\\b${colorPattern}\\b`, 'gi');
            if (regex.test(text)) {
                components.color = standardColor;
                break;
            }
        }

        // Determine device type and accessory type
        components.type = this.determineDeviceType(text, components);
        if (components.type === 'accessory') {
            components.accessoryType = this.determineAccessoryType(text);
        }

        // Add generation info for known models
        const modelKey = `${components.brand}_${components.model}`.replace(/\s+/g, '_');
        if (this.generationMappings[modelKey]) {
            components.generation = this.generationMappings[modelKey];
        }

        return components;
    }

    determineDeviceType(text, components) {
        // Phone indicators
        if (text.includes('phone') ||
            text.includes('iphone') ||
            (components.brand && ['apple', 'samsung', 'xiaomi', 'huawei'].includes(components.brand) &&
             !text.includes('tablet') && !text.includes('watch') && !text.includes('ipad'))) {
            return 'phone';
        }

        // Tablet indicators
        if (text.includes('tablet') || text.includes('ipad') || text.includes('tab ')) {
            return 'tablet';
        }

        // Watch indicators
        if (text.includes('watch') || text.includes('smartwatch')) {
            return 'watch';
        }

        // Accessory indicators
        for (const accessoryType of Object.keys(this.accessoryPatterns)) {
            for (const pattern of this.accessoryPatterns[accessoryType]) {
                if (text.includes(pattern)) {
                    return 'accessory';
                }
            }
        }

        return 'device';
    }

    determineAccessoryType(text) {
        for (const [accessoryType, patterns] of Object.entries(this.accessoryPatterns)) {
            for (const pattern of patterns) {
                if (text.includes(pattern)) {
                    return accessoryType;
                }
            }
        }
        return 'other';
    }

    buildAdvancedFingerprint(components) {
        const parts = [];

        // Brand is essential
        if (components.brand) parts.push(components.brand);

        // Type differentiation
        if (components.type) parts.push(components.type);

        // For devices, include model and storage
        if (components.type !== 'accessory') {
            if (components.model) {
                // Use generation if available for better separation
                if (components.generation) {
                    parts.push(components.generation);
                } else {
                    parts.push(components.model);
                }
            }

            if (components.variant) parts.push(components.variant);
            if (components.storage) parts.push(components.storage);

            // For high-end devices, include color to differentiate better
            if (components.color &&
                (components.model?.includes('pro') ||
                 components.model?.includes('max') ||
                 (components.storage && parseInt(components.storage) >= 256))) {
                parts.push(components.color);
            }
        } else {
            // For accessories, be more specific
            if (components.accessoryType) parts.push(components.accessoryType);
            if (components.model) parts.push(components.model);
        }

        return parts.join('_').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    getEmptyComponents() {
        return {
            brand: null,
            model: null,
            subModel: null,
            generation: null,
            storage: null,
            color: null,
            type: null,
            accessoryType: null,
            variant: null
        };
    }

    cleanText(text) {
        let cleaned = text.toLowerCase();

        // Remove noise words more intelligently
        for (const noise of this.noiseWords) {
            // Don't remove if it's part of a model name
            if (!noise.match(/\d/)) { // Only remove non-numeric noise words
                const regex = new RegExp(`\\b${noise}\\b`, 'gi');
                cleaned = cleaned.replace(regex, '');
            }
        }

        // Remove special characters but preserve spaces and important punctuation
        cleaned = cleaned
            .replace(/[^\w\s\u0531-\u0587\u0400-\u04FF\-+]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return cleaned;
    }

    calculateSimilarity(title1, title2) {
        const normalized1 = this.normalizeTitle(title1);
        const normalized2 = this.normalizeTitle(title2);

        if (normalized1 === normalized2) return 1.0;

        // Enhanced similarity with component-aware comparison
        const components1 = this.extractDetailedComponents(this.translateText(this.cleanText(title1.toLowerCase())));
        const components2 = this.extractDetailedComponents(this.translateText(this.cleanText(title2.toLowerCase())));

        return this.componentSimilarity(components1, components2);
    }

    componentSimilarity(comp1, comp2) {
        let score = 0;
        let weights = 0;

        // Brand match (high weight)
        if (comp1.brand && comp2.brand) {
            weights += 3;
            if (comp1.brand === comp2.brand) score += 3;
        }

        // Model match (high weight)
        if (comp1.model && comp2.model) {
            weights += 3;
            if (comp1.model === comp2.model) score += 3;
            else if (this.modelsSimilar(comp1.model, comp2.model)) score += 1.5;
        }

        // Storage match (medium weight)
        if (comp1.storage && comp2.storage) {
            weights += 2;
            if (comp1.storage === comp2.storage) score += 2;
        }

        // Type match (medium weight)
        if (comp1.type && comp2.type) {
            weights += 2;
            if (comp1.type === comp2.type) score += 2;
        }

        // Color match (low weight for most devices)
        if (comp1.color && comp2.color) {
            weights += 1;
            if (comp1.color === comp2.color) score += 1;
        }

        return weights > 0 ? score / weights : 0;
    }

    modelsSimilar(model1, model2) {
        // Check if models are similar (e.g., note 12 vs note 12s)
        const cleanModel1 = model1.replace(/[^a-z0-9]/g, '');
        const cleanModel2 = model2.replace(/[^a-z0-9]/g, '');

        return cleanModel1.includes(cleanModel2) || cleanModel2.includes(cleanModel1);
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

    // Enhanced statistics with quality metrics
    getNormalizationStats(items) {
        const originalCount = items.length;
        const normalizedTitles = items.map(item => this.normalizeTitle(item.title));
        const uniqueNormalized = new Set(normalizedTitles.filter(t => t)); // Remove empty
        const uniqueCount = uniqueNormalized.size;

        const duplicatesFound = originalCount - uniqueCount;
        const reductionPercentage = ((duplicatesFound / originalCount) * 100).toFixed(1);

        // Quality metrics
        const emptyNormalized = normalizedTitles.filter(t => !t).length;
        const avgFingerprintLength = normalizedTitles
            .filter(t => t)
            .reduce((sum, t) => sum + t.split('_').length, 0) / uniqueCount || 0;

        return {
            originalCount,
            uniqueCount,
            duplicatesFound,
            reductionPercentage: `${reductionPercentage}%`,
            qualityMetrics: {
                emptyNormalized,
                avgComponentsPerFingerprint: avgFingerprintLength.toFixed(1),
                normalizationSuccess: `${((1 - emptyNormalized / originalCount) * 100).toFixed(1)}%`
            }
        };
    }
}

module.exports = AdvancedProductNormalizer;