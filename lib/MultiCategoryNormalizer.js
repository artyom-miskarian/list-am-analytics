class MultiCategoryNormalizer {
    constructor() {
        // Enhanced translations with audio and kitchen terms
        this.armenianTranslations = {
            // Device types
            'հեռախոս': 'phone', 'հեռախոսի': 'phone',
            'պլանշետ': 'tablet', 'պլանշետի': 'tablet',
            'ժամացույց': 'watch', 'ժամացույցի': 'watch',
            'խելացի': 'smart',

            // Audio equipment
            'միկրոֆոն': 'microphone', 'միկրաֆոն': 'microphone',
            'ղեկավարիչ': 'controller', 'բարձրախոս': 'speaker',
            'ականջակալ': 'headphones', 'ձայնագրող': 'recorder',
            'ձայնագրիչ': 'recorder', 'ժուչոկ': 'mini',
            'գիթար': 'guitar', 'գիթառ': 'guitar',
            'դասական': 'classical', 'փոքր': 'small',
            'մինի': 'mini', 'անլար': 'wireless',
            'լար': 'cable', 'կաբել': 'cable',
            'հեռակառավարվող': 'remote', 'կառաոկե': 'karaoke',
            'օրավարձով': 'rental', 'վարձով': 'rental',

            // Kitchen appliances
            'կուլեռ': 'cooler', 'կուլլեր': 'cooler',
            'ջրի': 'water', 'ջուր': 'water',
            'դիսպենսեռ': 'dispenser', 'սարք': 'device',
            'տաք': 'hot', 'սառը': 'cold',
            'տոստեր': 'toaster', 'բլենդեր': 'blender',
            'մսաղաց': 'meat_grinder', 'մուլտիեփիչ': 'multicooker',
            'եփիչ': 'cooker', 'աերոգրիլ': 'air_fryer',
            'ճարպաջեռոց': 'air_fryer', 'ֆրի': 'fryer',
            'պատրաստող': 'maker', 'պրոֆեսիոնալ': 'professional',
            'բուտերբրոդնիցա': 'sandwich_maker', 'վաֆլենիցա': 'waffle_maker',
            'կաթսա': 'pot', 'ալյումինե': 'aluminum',
            'էլեկտրական': 'electric', 'լիտր': 'liter',
            'օգտագործած': 'used', 'նոր': 'new',
            'սենսորային': 'sensor', 'հզոր': 'powerful',
            'որակյալ': 'quality', 'ֆիրմայի': 'brand',
            'օրիգինալ': 'original',

            // General terms
            'երախիք': 'warranty', 'երաշխիք': 'warranty',
            'պատոնական': 'original', 'օրիգինալ': 'original',
            'նոր': 'new', 'նորը': 'new',
            'օգտագործված': 'used',
            'առաքում': 'delivery',
            'բարձր': 'high', 'որակ': 'quality',
            'շատ': 'very', 'լրիվ': 'completely',
            'մեծ': 'big', 'փոքր': 'small',
            'սև': 'black', 'սպիտակ': 'white',
            'կապույտ': 'blue', 'կանաչ': 'green',
            'կարմիր': 'red', 'վարդագույն': 'pink',
            'մոխրագույն': 'gray', 'արծաթագույն': 'silver',
            'ոսկեգույն': 'gold'
        };

        // Enhanced Russian translations
        this.russianTranslations = {
            // Phones/devices
            'телефон': 'phone', 'планшет': 'tablet', 'часы': 'watch',
            'умный': 'smart', 'новый': 'new', 'оригинал': 'original',

            // Audio equipment
            'микрофон': 'microphone', 'динамик': 'speaker',
            'наушники': 'headphones', 'колонка': 'speaker',
            'магнитофон': 'tape_recorder', 'усилитель': 'amplifier',
            'гитара': 'guitar', 'клавишные': 'keyboard',
            'беспроводной': 'wireless', 'кабель': 'cable',
            'провод': 'cable', 'звук': 'sound',
            'аудио': 'audio', 'запись': 'recording',

            // Kitchen appliances
            'тостер': 'toaster', 'блендер': 'blender',
            'мясорубка': 'meat_grinder', 'мультиварка': 'multicooker',
            'аэрогриль': 'air_fryer', 'фритюрница': 'fryer',
            'соковыжималка': 'juicer', 'кофеварка': 'coffee_maker',
            'чайник': 'kettle', 'кастрюля': 'pot',
            'сковорода': 'pan', 'духовка': 'oven',
            'микроволновка': 'microwave', 'холодильник': 'refrigerator',
            'морозильник': 'freezer', 'посудомойка': 'dishwasher',
            'электрический': 'electric', 'газовый': 'gas',
            'профессиональный': 'professional', 'кухонный': 'kitchen',
            'литр': 'liter', 'объем': 'volume',
            'мощность': 'power', 'ватт': 'watt',

            // General
            'устройство': 'device', 'прибор': 'appliance',
            'качество': 'quality', 'размер': 'size',
            'цвет': 'color', 'материал': 'material',
            'сталь': 'steel', 'пластик': 'plastic',
            'стекло': 'glass', 'алюминий': 'aluminum'
        };

        // Multi-category brand mappings
        this.brandMappings = {
            // Phone brands
            'apple': 'apple', 'iphone': 'apple', 'ipad': 'apple',
            'samsung': 'samsung', 'galaxy': 'samsung',
            'xiaomi': 'xiaomi', 'redmi': 'xiaomi', 'mi': 'xiaomi', 'poco': 'xiaomi',
            'huawei': 'huawei', 'honor': 'huawei',
            'nokia': 'nokia', 'oneplus': 'oneplus',

            // Audio brands
            'marshall': 'marshall', 'bose': 'bose', 'sony': 'sony',
            'sennheiser': 'sennheiser', 'audio-technica': 'audio-technica',
            'shure': 'shure', 'akg': 'akg', 'beyerdynamic': 'beyerdynamic',
            'jbl': 'jbl', 'harman': 'harman', 'yamaha': 'yamaha',
            'hollyland': 'hollyland', 'boya': 'boya',
            'fosi': 'fosi', 'cypress': 'cypress',

            // Kitchen appliance brands
            'bosch': 'bosch', 'siemens': 'siemens', 'panasonic': 'panasonic',
            'philips': 'philips', 'tefal': 'tefal', 'moulinex': 'moulinex',
            'kenwood': 'kenwood', 'kitchenaid': 'kitchenaid',
            'vitamix': 'vitamix', 'ninja': 'ninja',
            'instant': 'instant', 'crockpot': 'crockpot',
            'cuisinart': 'cuisinart', 'breville': 'breville',
            'berg': 'berg', 'neptun': 'neptun', 'raf': 'raf',
            'fluger': 'fluger'
        };

        // Category-specific type detection
        this.categoryPatterns = {
            // Audio equipment types
            audio: {
                'microphone': ['microphone', 'mic', 'միկրոֆոն', 'միկրաֆոն', 'микрофон'],
                'speaker': ['speaker', 'բարձրախոս', 'динамик', 'колонка'],
                'headphones': ['headphones', 'headset', 'ականջակալ', 'наушники'],
                'recorder': ['recorder', 'ձայնագրող', 'ձայնագրիչ', 'магнитофон'],
                'guitar': ['guitar', 'գիթար', 'գիթառ', 'гитара'],
                'amplifier': ['amplifier', 'amp', 'усилитель'],
                'cable': ['cable', 'լար', 'կաբել', 'кабель', 'провод'],
                'converter': ['converter', 'փոխարկիչ', 'конвертер'],
                'visualizer': ['visualizer', 'տեսական', 'визуализатор']
            },

            // Kitchen appliance types
            kitchen: {
                'cooler': ['cooler', 'կուլեռ', 'կուլլեր', 'кулер'],
                'dispenser': ['dispenser', 'դիսպենսեռ', 'диспенсер'],
                'toaster': ['toaster', 'տոստեր', 'тостер'],
                'blender': ['blender', 'բլենդեր', 'блендер'],
                'fryer': ['fryer', 'ֆրի', 'ճարպաջեռոց', 'фритюрница'],
                'air_fryer': ['air fryer', 'aerogrill', 'աերոգրիլ', 'аэрогриль'],
                'meat_grinder': ['meat grinder', 'մսաղաց', 'мясорубка'],
                'multicooker': ['multicooker', 'multi cooker', 'մուլտիեփիչ', 'мультиварка'],
                'juicer': ['juicer', 'հյութարկիչ', 'соковыжималка'],
                'coffee_maker': ['coffee maker', 'սուրճարար', 'кофеварка'],
                'kettle': ['kettle', 'թեյնիկ', 'чайник'],
                'pot': ['pot', 'pan', 'կաթսա', 'кастрюля'],
                'sandwich_maker': ['sandwich maker', 'բուտերբրոդնիցա', 'сэндвичница'],
                'waffle_maker': ['waffle maker', 'վաֆլենիցա', 'вафельница']
            }
        };

        // Capacity/size patterns
        this.capacityPattern = /(\d+(?:\.\d+)?)\s*(l|liter|litre|լիտր|литр|gb|гб|գբ|ml|մլ|мл)/gi;

        // Model patterns for appliances
        this.applianceModels = {
            audio: [
                /([a-z]+[-\s]*[a-z]*\d+[a-z]*(?:[-\s]*[a-z]*\d*)*)/gi, // General audio model patterns
                /(lark\s*m\d+)/gi, // Hollyland Lark series
                /(gv[-\s]*\d+)/gi, // Marshall GV series
                /(ah[-\s]*\d+[a-z]*)/gi, // Fosi Audio series
                /(dct[-\s]*\d+[a-z]*)/gi // Cypress DCT series
            ],
            kitchen: [
                /([a-z]+[-\s]*\d+[a-z]*(?:[-\s]*[a-z]*\d*)*)/gi, // General appliance models
                /(xmtsj\d+[a-z]*)/gi, // Xiaomi toaster models
                /(r\.?\d+[a-z]*)/gi // RAF models
            ]
        };

        // Noise words
        this.noiseWords = [
            'original', 'new', 'used', 'excellent', 'perfect', 'good', 'bad', 'best',
            'cheap', 'expensive', 'urgent', 'sale', 'special', 'exclusive', 'premium',
            'vip', 'gold', 'platinum', 'professional', 'smartbox', 'megashopping',
            'delivery', 'warranty', 'free', 'fast', 'quick', 'rental',
            'նոր', 'օգտագործված', 'գերազանց', 'լավ', 'վատ', 'լավագույն', 'էժան', 'թանկ',
            'շտապ', 'վաճառք', 'հատուկ', 'եզակի', 'պրեմիում', 'պրոֆեսիոնալ', 'օրավարձով',
            'новый', 'использованный', 'отличный', 'хороший', 'плохой', 'лучший',
            'дешевый', 'дорогой', 'срочно', 'продажа', 'специальный', 'профессиональный'
        ];
    }

    normalizeTitle(title, categoryHint = null) {
        if (!title || typeof title !== 'string') return '';

        let normalized = title.toLowerCase().trim();

        // Step 1: Clean and translate
        normalized = this.cleanText(normalized);
        normalized = this.translateText(normalized);

        // Step 2: Extract components based on category
        const components = this.extractCategoryComponents(normalized, categoryHint);

        // Step 3: Build category-aware fingerprint
        const fingerprint = this.buildCategoryFingerprint(components, categoryHint);

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

    extractCategoryComponents(text, categoryHint) {
        const components = {
            brand: null,
            model: null,
            type: null,
            subType: null,
            capacity: null,
            material: null,
            features: [],
            category: categoryHint
        };

        // Extract brand
        for (const [pattern, brand] of Object.entries(this.brandMappings)) {
            const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
            if (regex.test(text)) {
                components.brand = brand;
                break;
            }
        }

        // Extract capacity/size
        const capacityMatch = text.match(this.capacityPattern);
        if (capacityMatch && capacityMatch[1] && capacityMatch[2]) {
            let size = parseFloat(capacityMatch[1]);
            let unit = capacityMatch[2].toLowerCase();

            // Normalize units
            if (unit.match(/l|liter|litre|լիտր|литр/)) unit = 'l';
            else if (unit.match(/ml|մլ|мл/)) {
                unit = 'l';
                size = size / 1000; // Convert ml to l
            }
            else if (unit.match(/gb|гб|գբ/)) unit = 'gb';

            components.capacity = `${Math.round(size * 100) / 100}${unit}`;
        }

        // Category-specific type detection
        const categoryType = this.determineCategoryType(text, categoryHint);
        components.type = categoryType.type;
        components.subType = categoryType.subType;

        // Extract model for appliances
        if (categoryHint && this.applianceModels[categoryHint]) {
            for (const modelPattern of this.applianceModels[categoryHint]) {
                const match = text.match(modelPattern);
                if (match && match[0].length > 2) { // Avoid single letters
                    components.model = match[0].toLowerCase().trim();
                    break;
                }
            }
        }

        // Extract features
        if (text.includes('wireless') || text.includes('անլար') || text.includes('беспроводной')) {
            components.features.push('wireless');
        }
        if (text.includes('professional') || text.includes('պրոֆեսիոնալ') || text.includes('профессиональный')) {
            components.features.push('professional');
        }
        if (text.includes('mini') || text.includes('մինի') || text.includes('мини')) {
            components.features.push('mini');
        }

        return components;
    }

    determineCategoryType(text, categoryHint) {
        const result = { type: null, subType: null };

        // Use category hint to focus search
        if (categoryHint && this.categoryPatterns[categoryHint]) {
            const patterns = this.categoryPatterns[categoryHint];

            for (const [type, keywords] of Object.entries(patterns)) {
                for (const keyword of keywords) {
                    if (text.includes(keyword)) {
                        result.type = type;
                        return result;
                    }
                }
            }
        }

        // Fallback: general type detection
        if (text.includes('microphone') || text.includes('mic')) {
            result.type = 'microphone';
        } else if (text.includes('speaker') || text.includes('բարձրախոս')) {
            result.type = 'speaker';
        } else if (text.includes('guitar') || text.includes('գիթար')) {
            result.type = 'guitar';
        } else if (text.includes('toaster') || text.includes('տոստեր')) {
            result.type = 'toaster';
        } else if (text.includes('blender') || text.includes('բլենդեր')) {
            result.type = 'blender';
        } else if (text.includes('cooler') || text.includes('կուլեռ')) {
            result.type = 'cooler';
        } else if (text.includes('phone') || text.includes('հեռախոս')) {
            result.type = 'phone';
        } else {
            result.type = 'device';
        }

        return result;
    }

    buildCategoryFingerprint(components, categoryHint) {
        const parts = [];

        // Add category prefix for better separation
        if (categoryHint) parts.push(categoryHint);

        // Brand is important for all categories
        if (components.brand) parts.push(components.brand);

        // Type is crucial for categorization
        if (components.type) parts.push(components.type);

        // Model for specific identification
        if (components.model) parts.push(components.model);

        // Capacity for kitchen appliances and storage devices
        if (components.capacity) parts.push(components.capacity);

        // Features for differentiation
        if (components.features.length > 0) {
            parts.push(...components.features);
        }

        return parts.join('_').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    cleanText(text) {
        let cleaned = text.toLowerCase();

        // Remove noise words more intelligently
        for (const noise of this.noiseWords) {
            if (!noise.match(/\d/)) { // Only remove non-numeric noise words
                const regex = new RegExp(`\\b${noise}\\b`, 'gi');
                cleaned = cleaned.replace(regex, '');
            }
        }

        // Remove special characters but preserve important ones
        cleaned = cleaned
            .replace(/[^\w\s\u0531-\u0587\u0400-\u04FF\-\.]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return cleaned;
    }

    // Enhanced statistics
    getNormalizationStats(items, categoryHint = null) {
        const originalCount = items.length;
        const normalizedTitles = items.map(item => this.normalizeTitle(item.title, categoryHint));
        const uniqueNormalized = new Set(normalizedTitles.filter(t => t));
        const uniqueCount = uniqueNormalized.size;

        const duplicatesFound = originalCount - uniqueCount;
        const reductionPercentage = ((duplicatesFound / originalCount) * 100).toFixed(1);

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

module.exports = MultiCategoryNormalizer;