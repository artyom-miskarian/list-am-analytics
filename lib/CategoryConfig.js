class CategoryConfig {
    constructor() {
        // Map category IDs to normalization types
        this.categoryMappings = {
            // Phones and tablets
            36: 'phones',

            // Computers
            98: 'computers',

            // Gaming
            183: 'games',              // Games and Consoles

            // Security
            491: 'security',           // Security and Smart Home

            // Media & TV
            179: 'streaming',          // Media Streaming Devices
            180: 'tv_accessories',     // TV and Video Accessories

            // Photo & Video
            182: 'photo_accessories',  // Photo and Video Accessories

            // Audio
            78: 'audio_accessories',   // Audio Accessories
            488: 'headphones',         // Headphones (separate from audio)

            // Drones
            281: 'drone_parts',        // Drone Parts and Accessories

            // Kitchen appliances
            128: 'kitchen_appliances', // Other Kitchen Appliances
            257: 'microwaves',         // Microwaves
            263: 'tea_kettles',        // Tea Kettles
            264: 'coffee_makers',      // Coffee Makers & Accessories

            // Home appliances
            522: 'irons',              // Irons and Accessories
            528: 'cleaning_appliances',// Cleaning Appliances

            // Pet products
            346: 'pet_products',       // Products for Cats
            1109: 'pet_products'       // For Dogs
        };

        // File naming mappings
        this.fileNameMappings = {
            36: 'phones',
            98: 'computers',
            78: 'audio_accessories',
            128: 'kitchen_appliances',
            257: 'microwaves',
            263: 'tea_kettles',
            264: 'coffee_makers',
            179: 'streaming',
            180: 'tv_accessories',
            182: 'photo_accessories',
            183: 'games',
            281: 'drone_parts',
            346: 'cat_products',
            488: 'headphones',
            491: 'security',
            522: 'irons',
            528: 'cleaning_appliances',
            1109: 'dog_products'
        };

        // Category display names
        this.categoryNames = {
            36: 'Phones and Tablets',
            98: 'Laptops and Computers',
            78: 'Audio Accessories',
            128: 'Other Kitchen Appliances',
            257: 'Microwaves',
            263: 'Tea Kettles',
            264: 'Coffee Makers & Accessories',
            179: 'Media Streaming Devices',
            180: 'TV and Video Accessories',
            182: 'Photo and Video Accessories',
            183: 'Games and Consoles',
            281: 'Parts and Accessories for Quadcopters and Drones',
            346: 'Products for Cats',
            488: 'Headphones',
            491: 'Security and Smart Home',
            522: 'Irons and Accessories',
            528: 'Cleaning Appliances',
            1109: 'For Dogs'
        };
    }

    getNormalizationType(categoryId) {
        return this.categoryMappings[categoryId] || 'generic';
    }

    getFileName(categoryId) {
        return this.fileNameMappings[categoryId] || `category_${categoryId}`;
    }

    getCategoryName(categoryId) {
        return this.categoryNames[categoryId] || `Category ${categoryId}`;
    }

    // Get categories that should use AI normalization (with priority)
    getAIPrioritizedCategories() {
        return [
            // High priority - most complex products
            { id: 36, type: 'phones', name: 'Phones and Tablets', priority: 'high' },
            { id: 98, type: 'computers', name: 'Laptops and Computers', priority: 'high' },
            { id: 183, type: 'games', name: 'Games and Consoles', priority: 'high' },

            // Medium priority - moderate complexity
            { id: 491, type: 'security', name: 'Security and Smart Home', priority: 'medium' },
            { id: 488, type: 'headphones', name: 'Headphones', priority: 'medium' },
            { id: 182, type: 'photo_accessories', name: 'Photo and Video Accessories', priority: 'medium' },
            { id: 128, type: 'kitchen_appliances', name: 'Kitchen Appliances', priority: 'medium' },
            { id: 257, type: 'microwaves', name: 'Microwaves', priority: 'medium' },
            { id: 78, type: 'audio_accessories', name: 'Audio Accessories', priority: 'medium' },

            // Low priority - simpler products
            { id: 179, type: 'streaming', name: 'Media Streaming Devices', priority: 'low' },
            { id: 180, type: 'tv_accessories', name: 'TV and Video Accessories', priority: 'low' },
            { id: 281, type: 'drone_parts', name: 'Drone Parts', priority: 'low' },
            { id: 264, type: 'coffee_makers', name: 'Coffee Makers', priority: 'low' },
            { id: 263, type: 'tea_kettles', name: 'Tea Kettles', priority: 'low' },
            { id: 522, type: 'irons', name: 'Irons', priority: 'low' },
            { id: 528, type: 'cleaning_appliances', name: 'Cleaning Appliances', priority: 'low' },
            { id: 346, type: 'pet_products', name: 'Cat Products', priority: 'low' },
            { id: 1109, type: 'pet_products', name: 'Dog Products', priority: 'low' }
        ];
    }

    // Get all supported categories for AI normalization
    getSupportedCategories() {
        return Object.keys(this.categoryMappings).map(id => ({
            id: parseInt(id),
            type: this.categoryMappings[id],
            fileName: this.fileNameMappings[id],
            name: this.categoryNames[id]
        }));
    }

    // Check if category supports AI normalization
    supportsAINormalization(categoryId) {
        const type = this.getNormalizationType(categoryId);
        // All categories with specific prompts now support AI normalization
        return [
            'phones', 'computers', 'games', 'security', 'streaming',
            'tv_accessories', 'photo_accessories', 'headphones', 'audio_accessories',
            'drone_parts', 'kitchen_appliances', 'microwaves', 'coffee_makers',
            'tea_kettles', 'irons', 'cleaning_appliances', 'pet_products'
        ].includes(type);
    }

    // Get estimated cost for category based on optimized processing
    // Only processes sold items (not all items)
    getEstimatedCost(categoryId) {
        const estimates = {
            // Based on actual data file sizes
            36: { totalItems: 4740, processedItems: 200, cost: 0.004 },   // phones
            98: { totalItems: 5015, processedItems: 200, cost: 0.004 },   // computers
            183: { totalItems: 2961, processedItems: 150, cost: 0.003 },  // games
            491: { totalItems: 1801, processedItems: 100, cost: 0.002 },  // security
            179: { totalItems: 551, processedItems: 50, cost: 0.001 },    // streaming
            180: { totalItems: 660, processedItems: 50, cost: 0.001 },    // tv_accessories
            182: { totalItems: 1901, processedItems: 100, cost: 0.002 },  // photo_accessories
            488: { totalItems: 1835, processedItems: 100, cost: 0.002 },  // headphones
            78: { totalItems: 432, processedItems: 50, cost: 0.001 },     // audio_accessories
            281: { totalItems: 152, processedItems: 30, cost: 0.0006 },   // drone_parts
            128: { totalItems: 2095, processedItems: 100, cost: 0.002 },  // kitchen_appliances
            257: { totalItems: 361, processedItems: 40, cost: 0.0008 },   // microwaves
            264: { totalItems: 296, processedItems: 40, cost: 0.0008 },   // coffee_makers
            263: { totalItems: 252, processedItems: 30, cost: 0.0006 },   // tea_kettles
            522: { totalItems: 539, processedItems: 50, cost: 0.001 },    // irons
            528: { totalItems: 916, processedItems: 60, cost: 0.0012 },   // cleaning_appliances
            346: { totalItems: 136, processedItems: 20, cost: 0.0004 },   // cat_products
            1109: { totalItems: 531, processedItems: 50, cost: 0.001 }    // dog_products
        };

        return estimates[categoryId] || { totalItems: 500, processedItems: 50, cost: 0.001 };
    }

    // Get the old (unoptimized) cost estimate for comparison
    getUnoptimizedCost(categoryId) {
        const estimates = {
            36: { items: 5000, cost: 0.08 },   // phones
            98: { items: 15000, cost: 0.24 },  // computers
            128: { items: 6000, cost: 0.10 },  // kitchen
            257: { items: 1000, cost: 0.02 },  // microwaves
            78: { items: 1200, cost: 0.02 },   // audio
            488: { items: 5000, cost: 0.08 }   // headphones
        };

        return estimates[categoryId] || { items: 1000, cost: 0.02 };
    }
}

module.exports = CategoryConfig;