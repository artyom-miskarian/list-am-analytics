class CategoryConfig {
    constructor() {
        // Map category IDs to normalization types
        this.categoryMappings = {
            // Phones and tablets
            36: 'phones',

            // Computers
            98: 'computers',

            // Kitchen appliances
            128: 'kitchen_appliances', // Other Kitchen Appliances
            257: 'microwaves',         // Microwaves
            263: 'kitchen_appliances', // Tea Kettles
            264: 'kitchen_appliances', // Coffee Makers & Accessories
            522: 'kitchen_appliances', // Irons and Accessories
            528: 'kitchen_appliances', // Cleaning Appliances

            // Audio
            78: 'audio_accessories',   // Audio Accessories
            488: 'audio_accessories',  // Headphones

            // Others - use generic approach for now
            179: 'electronics',        // Media Streaming Devices
            180: 'electronics',        // TV and Video Accessories
            182: 'electronics',        // Photo and Video Accessories
            183: 'electronics',        // Games and Consoles
            281: 'electronics',        // Drone Parts
            346: 'pet_products',       // Products for Cats
            491: 'electronics',        // Security and Smart Home
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

    // Get categories that should use AI normalization (high priority)
    getAIPrioritizedCategories() {
        return [
            { id: 36, type: 'phones', name: 'Phones and Tablets', priority: 'high' },
            { id: 98, type: 'computers', name: 'Laptops and Computers', priority: 'high' },
            { id: 128, type: 'kitchen_appliances', name: 'Kitchen Appliances', priority: 'medium' },
            { id: 257, type: 'microwaves', name: 'Microwaves', priority: 'medium' },
            { id: 78, type: 'audio_accessories', name: 'Audio Accessories', priority: 'medium' },
            { id: 488, type: 'audio_accessories', name: 'Headphones', priority: 'medium' }
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
        return ['phones', 'computers', 'kitchen_appliances', 'microwaves', 'audio_accessories'].includes(type);
    }

    // Get estimated cost for category based on optimized processing
    // Only processes sold items + 500 sample (vs all items)
    getEstimatedCost(categoryId) {
        const estimates = {
            // Optimized: ~100 sold + 500 sample = 600 items vs 5000 total (88% savings)
            36: { totalItems: 5000, processedItems: 600, cost: 0.01 },   // phones
            98: { totalItems: 15000, processedItems: 600, cost: 0.01 },  // computers
            128: { totalItems: 6000, processedItems: 600, cost: 0.01 },  // kitchen
            257: { totalItems: 1000, processedItems: 550, cost: 0.01 },  // microwaves
            78: { totalItems: 1200, processedItems: 600, cost: 0.01 },   // audio
            488: { totalItems: 5000, processedItems: 600, cost: 0.01 }   // headphones
        };

        return estimates[categoryId] || { totalItems: 1000, processedItems: 550, cost: 0.01 };
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