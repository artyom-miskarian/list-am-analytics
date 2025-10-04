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
Focus on: brand, model, storage, color, product type (phone/screen/battery/case/charger/memory_card)
Key distinctions: Separate phones from parts and accessories
- Phones: Full devices with storage (GB/TB)
- Parts: էկրան/screen, մարտկոց/battery, պլատա/motherboard, chip
- Accessories: case/պատյան, charger/լիցքավորիչ, SD card, cable
Armenian: էկրան=screen, մարտկոց=battery, պլատա=motherboard, պատյան=case, օրիգինալ=original
Russian: экран=screen, батарея/аккумулятор=battery, оригинал=original, чехол=case

Expected fingerprints: brand_model_[storage]_[color]_type
Examples: apple_iphone_13_128gb_blue_phone, samsung_a30_battery, iphone_14_pro_max_screen, sandisk_128gb_sd_card`,

                examples: [
                    {input: "Apple iPhone 13, 128 GB, blue", output: "apple_iphone_13_128gb_blue_phone"},
                    {input: "Էկրան iPhone 12 Pro OLED", output: "apple_iphone_12_pro_screen_oled"},
                    {input: "Samsung A30 Մարտկոց (battery) Օրիգինալ որակի", output: "samsung_a30_battery_original"},
                    {input: "Micro SD chip 128GB San Disc", output: "sandisk_128gb_microsd_card"},
                    {input: "iPhone 14PRO MAX - Մարտկոց", output: "apple_iphone_14_pro_max_battery"}
                ]
            },

            computers: {
                context: `COMPUTERS & LAPTOPS NORMALIZATION:
Focus on: brand, product type, model, specs (processor/RAM/storage)
Key product types:
- Laptops/notebooks: Full laptops with brand, processor, RAM, storage
- Monitors: Brand, size (inches), resolution (FHD/4K)
- Components: RAM (DDR3/4/5, size), batteries, processors, graphics cards
- Accessories: Adapters, cables, thermal paste, card readers
- Projectors: Brand and model
Armenian: համակարգիչ=computer, նոութբուք/նոթբուք=laptop, մոնիտոր=monitor, մարտկոց=battery
Russian: компьютер=computer, ноутбук=laptop, процессор=processor, видеокарта=graphics_card

Expected fingerprints: brand_[model]_[specs]_type
Examples: apple_macbook_pro_m2_16gb_512gb_laptop, philips_27inch_monitor, ddr4_8gb_ram, hp_battery_ki04`,

                examples: [
                    {input: "Apple MacBook Pro M2, 16 GB, 512 GB", output: "apple_macbook_pro_m2_16gb_512gb_laptop"},
                    {input: "IPS LED White Monitor 27 inch Philips", output: "philips_27inch_ips_monitor"},
                    {input: "Laptop Ram 32Gb DDR5 5600Mhz", output: "ddr5_32gb_5600mhz_laptop_ram"},
                    {input: "ORIGINAL Battery HP 15AB", output: "hp_15ab_battery_original"},
                    {input: "4k DisplayPort to HDMI Converter", output: "displayport_hdmi_4k_adapter"}
                ]
            },

            games: {
                context: `GAMES & CONSOLES NORMALIZATION:
Focus on: console brand/model, game titles, controllers, VR equipment
Key product types:
- Consoles: PlayStation (PS3/4/5), Xbox (360/One/Series), Nintendo
- Games: Game title + platform (PS4/PS5/Xbox)
- Controllers: Brand + type (DualSense, Xbox controller)
- VR: Samsung Gear VR, PlayStation VR
Armenian: խաղ=game, նոր=new, օգտագործված=used, դիսկ=disc
Russian: игра=game, джойстик=controller, новый=new

Expected fingerprints: brand_model_[storage]_type OR gametitle_platform
Examples: sony_playstation_4_slim_500gb, spiderman_2_ps5_disc, xbox_controller_cyberpunk`,

                examples: [
                    {input: "Sony PlayStation 4 slim 500gb", output: "sony_playstation_4_slim_500gb"},
                    {input: "Marvels Spider Man 2 Playstation 5", output: "spiderman_2_ps5_game"},
                    {input: "Microsoft Wireless Controller for Xbox", output: "microsoft_xbox_wireless_controller"},
                    {input: "Call of Duty Modern Warfare 2 PS3", output: "call_of_duty_mw2_ps3_game"},
                    {input: "Samsung Gear VR With Controller", output: "samsung_gear_vr_controller"}
                ]
            },

            kitchen_appliances: {
                context: `KITCHEN APPLIANCES NORMALIZATION:
Focus on: brand, appliance type, capacity/power
Key product types:
- Air fryers: աերոգրիլ/аэрогриль, capacity in liters
- Blenders/Mixers: բլենդեր/միքսեր/հարիչ, блендер/миксер
- Food processors: խոհանոցային կոմբայն, բանջարահատիչ
- Meat grinders: մսաղաց
- Steam cookers: շոգեփ/պառավարկա
Armenian: հարիչ=mixer, մսաղաց=meat_grinder, բանջարահատիչ=vegetable_cutter, ֆրի=fryer
Russian: миксер=mixer, мясорубка=meat_grinder, фритюрница=fryer

Expected fingerprints: brand_type_[capacity/power]
Examples: philips_steamer, sokany_air_fryer_12l, ufesa_mixer_mi1450`,

                examples: [
                    {input: "Շոգեփներ պառավարկա Philips", output: "philips_steamer"},
                    {input: "Air Fryer Sokany 12L", output: "sokany_air_fryer_12l"},
                    {input: "Միксер Ufesa MI1450", output: "ufesa_mixer_mi1450"},
                    {input: "Մսաղաց սովետական", output: "soviet_meat_grinder"},
                    {input: "Աերոգրիլ 12 լիտրանոց", output: "air_fryer_12l"}
                ]
            },

            microwaves: {
                context: `MICROWAVES NORMALIZATION:
Focus on: brand and model (most items are simple microwave ovens)
Common brands: Samsung, Panasonic, LG, Beko, Daewoo, Gorenje, Hausberg, Sokany
Armenian: միկրոալիքային վառարան=microwave oven
Russian: микроволновая печь=microwave oven

Expected fingerprints: brand_[model]_microwave
Examples: samsung_ms23k3513_microwave, beko_microwave, daewoo_microwave`,

                examples: [
                    {input: "Samsung MS23K3513 միկրոալիքային վառարան", output: "samsung_ms23k3513_microwave"},
                    {input: "Միկրոալիքային վառարան BEKO", output: "beko_microwave"},
                    {input: "Daewoo մակնիշի միկրոալիքային վառարան", output: "daewoo_microwave"},
                    {input: "GORENJE MO17E1W", output: "gorenje_mo17e1w_microwave"}
                ]
            },

            security: {
                context: `SECURITY SYSTEMS NORMALIZATION:
Focus on: brand, product type (camera/lock/dvr/alarm)
Key product types:
- IP cameras: Hikvision, TVT, Xiaomi, ZOSI (WiFi/wired, indoor/outdoor)
- Smart locks: ZKTeco, դռան փական
- Security systems: DVR, NVR, alarm systems
Armenian: տեսախցիկ=camera, դռան փական=door lock, անվտանգության համակարգ=security system
Russian: камера=camera, замок=lock

Expected fingerprints: brand_model_type
Examples: hikvision_ax_hybrid, zkteco_ml300_smartlock, xiaomi_cw400_outdoor_camera`,

                examples: [
                    {input: "Hikvision DS-PHA48-EP AX Hybrid", output: "hikvision_ds_pha48_ep_hybrid"},
                    {input: "ZKTeco ML300 Դռան Խելացի Փական", output: "zkteco_ml300_smart_lock"},
                    {input: "Xiaomi Outdoor Camera CW400", output: "xiaomi_cw400_outdoor_camera"},
                    {input: "TVT C12 Cube 2MP WiFi Camera", output: "tvt_c12_2mp_wifi_camera"},
                    {input: "2 աշկանի տեսախցիկ камера", output: "2_eye_camera"}
                ]
            },

            streaming: {
                context: `STREAMING & VIDEO DEVICES NORMALIZATION:
Focus on: brand, device type (DVD player/Android box/VCR)
Key product types:
- DVD players: Samsung, LG, Sony brands
- Android TV boxes: X88, various models with RAM/ROM specs
- Video recorders: VCR, video cassette players
Armenian: նվագարկիչ=player, վիդեոմագնիտաֆոն=VCR
Russian: проигрыватель=player

Expected fingerprints: brand_[model]_type
Examples: samsung_dvd_player, android_tv_box_x88_4gb_64gb, sony_vcr`,

                examples: [
                    {input: "Samsung DVD նվագարկիչ", output: "samsung_dvd_player"},
                    {input: "Android TV Box X88 Mini 4Gb 64Gb", output: "android_tv_box_x88_mini_4gb_64gb"},
                    {input: "Վիդեոմագնիտաֆոն SONY", output: "sony_vcr"},
                    {input: "LG DVD player", output: "lg_dvd_player"}
                ]
            },

            tv_accessories: {
                context: `TV ACCESSORIES NORMALIZATION:
Focus on: brand, accessory type (remote/tuner/mount/parts)
Key product types:
- Remote controls: LG, Samsung, Huayu universal remotes
- TV tuners: DVB-T2 tuners
- TV parts: LED backlights, boards, panels
- Mounts: TV wall mounts, brackets
Armenian: հեռակառավարման վահանակ=remote control, տյուներ=tuner, կախիչ=mount
Russian: пульт=remote, тюнер=tuner

Expected fingerprints: brand_[model]_type
Examples: lg_mr600_remote, dvb_t2_tuner, samsung_32inch_led_backlight`,

                examples: [
                    {input: "LG MR600 TV Remote Control", output: "lg_mr600_remote"},
                    {input: "DVB T2 tyuner", output: "dvb_t2_tuner"},
                    {input: "Samsung 32\" LED подсветка", output: "samsung_32inch_led_backlight"},
                    {input: "Diamond 4008 կրաշտեին", output: "diamond_4008_tv_mount"}
                ]
            },

            photo_accessories: {
                context: `PHOTO/VIDEO ACCESSORIES NORMALIZATION:
Focus on: brand, accessory type, compatibility
Key product types:
- Batteries: NP-F970, camera batteries for Canon/Nikon/Sony
- Memory cards: SD cards, CF cards with capacity
- Lens accessories: Lens caps, filters
- Lighting: LED lights, flash units
- Tripods and gimbals
Armenian: մարտկոց=battery, լիցքավորիչ=charger
Russian: батарея=battery, зарядка=charger

Expected fingerprints: brand_[model]_type
Examples: canon_bg_e22_battery_grip, lexar_256gb_sdxc, canon_82mm_lens_cap`,

                examples: [
                    {input: "Canon BG-E22 battery grip", output: "canon_bg_e22_battery_grip"},
                    {input: "Lexar 256GB Professional SDXC", output: "lexar_256gb_sdxc_card"},
                    {input: "Powerextra 8800mAh NP-F970", output: "powerextra_np_f970_battery"},
                    {input: "Canon 82mm Lens cap", output: "canon_82mm_lens_cap"}
                ]
            },

            headphones: {
                context: `HEADPHONES & EARBUDS NORMALIZATION:
Focus on: brand, model, type (wired/wireless/gaming)
Key product types:
- Gaming headsets: SteelSeries, Asus TUF, Logitech
- Wireless earbuds: AirPods, Beats, TWS models
- Wired headphones: Various brands
Armenian: ականջակալ=headphones, անլար=wireless, խաղային=gaming
Russian: наушники=headphones, игровые=gaming

Expected fingerprints: brand_[model]_[type]
Examples: beats_studio_pro_wireless, airpods_4, steelseries_arctis_3_gaming`,

                examples: [
                    {input: "Beats Studio Pro անլար ականջակալ", output: "beats_studio_pro_wireless"},
                    {input: "AirPods 4", output: "apple_airpods_4"},
                    {input: "SteelSeries Arctis 3 Gaming", output: "steelseries_arctis_3_gaming"},
                    {input: "Logitech H111", output: "logitech_h111_wired"}
                ]
            },

            audio_accessories: {
                context: `AUDIO ACCESSORIES NORMALIZATION:
Focus on: brand, product type (microphone/recorder/speaker/cassette)
Key product types:
- Microphones: Wireless mics, lavalier mics, dictaphones
- Voice recorders: Mini recorders, spy recorders
- Speakers: Bluetooth speakers
- Cassettes: Audio cassettes, tapes
Armenian: միկրոֆոն=microphone, ձայնագրիչ=recorder, բարձրախոս=speaker
Russian: микрофон=microphone, диктофон=recorder

Expected fingerprints: brand_[model]_type
Examples: wiwu_type_c_wireless_mic, mini_voice_recorder_8gb, marshall_mode_ii_speaker`,

                examples: [
                    {input: "Wiwu Type-C Wireless Microphone", output: "wiwu_type_c_wireless_microphone"},
                    {input: "Ձայնագրիչ մինի 8gb", output: "mini_voice_recorder_8gb"},
                    {input: "Marshall Mode ii", output: "marshall_mode_ii_speaker"},
                    {input: "Sony cassette FeCr 60", output: "sony_fecr_60_cassette"}
                ]
            },

            drone_parts: {
                context: `DRONE PARTS & ACCESSORIES NORMALIZATION:
Focus on: brand, component type, compatibility
Key product types:
- Batteries: DJI batteries, HRB graphene, LiPo batteries
- Chargers: IMAX B6, battery chargers
- Parts: Propellers, gimbals, ESCs, controllers
- DJI specific: Mavic, Air, Mini series parts
Armenian: դրոն=drone, մարտկոց=battery, լիցքավորիչ=charger
Russian: дрон=drone, батарея=battery, зарядник=charger

Expected fingerprints: brand_[model]_type
Examples: dji_mini_2_battery, imax_b6_charger, mavic_3_gimbal`,

                examples: [
                    {input: "DJI Intelligent Battery for mini 2", output: "dji_mini_2_battery"},
                    {input: "IMAX B6 Mini зарядник", output: "imax_b6_mini_charger"},
                    {input: "Mavic 3 pro gimbal", output: "dji_mavic_3_pro_gimbal"},
                    {input: "Master Airscrew 9x4 Propeller", output: "master_airscrew_9x4_propeller"}
                ]
            },

            coffee_makers: {
                context: `COFFEE MAKERS & MACHINES NORMALIZATION:
Focus on: brand, type (espresso/capsule/drip)
Key product types:
- Capsule machines: Nespresso, Dolce Gusto
- Espresso machines: DeLonghi, Electrolux
- Coffee makers: Braun, Krups, Philips
- Coffee grinders: սրճաղաց
Armenian: սրճեփ=coffee maker, սրճաղաց=coffee grinder
Russian: кофемашина=coffee machine, кофемолка=coffee grinder

Expected fingerprints: brand_[model]_type
Examples: nespresso_vertuonext_capsule, delonghi_espresso_machine, braun_puraroma_7`,

                examples: [
                    {input: "Dolce Gusto Infinissima Կապսուլային", output: "dolce_gusto_infinissima_capsule"},
                    {input: "Nespresso VertuoNext", output: "nespresso_vertuonext_capsule"},
                    {input: "DeLonghi Espresso Coffee Machine", output: "delonghi_espresso_machine"},
                    {input: "Սրճաղաց կոֆե աղաց", output: "coffee_grinder"}
                ]
            },

            tea_kettles: {
                context: `TEA KETTLES & SAMOVARS NORMALIZATION:
Focus on: brand, type (electric kettle/samovar), capacity
Key product types:
- Electric kettles: Xiaomi, Diamond, Sokany brands
- Samovars: Traditional samovars, electric samovars
Armenian: թեյնիկ=kettle, ինքնաեռ/սամովար=samovar, էլեկտրական=electric
Russian: чайник=kettle, самовар=samovar

Expected fingerprints: brand_[model]_type OR samovar_[capacity]
Examples: xiaomi_electric_kettle, diamond_dm1061_kettle, samovar_5l_traditional`,

                examples: [
                    {input: "Էլեկտրական թեյնիկ Xiaomi", output: "xiaomi_electric_kettle"},
                    {input: "Diamond DM-1061 թեյնիկ", output: "diamond_dm1061_kettle"},
                    {input: "Самовар на дровах 5 л", output: "samovar_5l_traditional"},
                    {input: "Էլեկտրական սամովար", output: "electric_samovar"}
                ]
            },

            irons: {
                context: `IRONS & IRONING EQUIPMENT NORMALIZATION:
Focus on: brand, type (steam iron/iron board/clothes dryer)
Key product types:
- Steam irons: Philips, Tefal, Diamond, Sonifer brands
- Ironing boards: ժանետ, ironing tables
- Clothes dryers: սուշիլկա, չորանոց
Armenian: արդուկ/հարթուկ=iron, գոլորշի=steam, սուշիլկա=clothes dryer
Russian: утюг=iron, паровой=steam, сушилка=clothes dryer

Expected fingerprints: brand_[model]_type
Examples: tefal_fv9450_steam_iron, philips_perfectcare_3000, clothes_dryer`,

                examples: [
                    {input: "Արդուկ Tefal FV9450", output: "tefal_fv9450_steam_iron"},
                    {input: "Philips PerfectCare 3000 утюг", output: "philips_perfectcare_3000_steam_iron"},
                    {input: "Սուշիլկա չորանոց", output: "clothes_dryer"},
                    {input: "Արդուկի սեղան ժանետ", output: "ironing_board_janette"}
                ]
            },

            cleaning_appliances: {
                context: `CLEANING APPLIANCES NORMALIZATION:
Focus on: brand, type (vacuum/steam cleaner), power
Key product types:
- Vacuum cleaners: Diamond, Vikass, Deerma brands
- Steam cleaners: պարոչիստիտել/пароочиститель
- Handheld vacuums: ձեռքի փոշեկուլ
Armenian: փոշեկուլ=vacuum cleaner, գոլորշով մաքրող=steam cleaner
Russian: пылесос=vacuum cleaner, пароочиститель=steam cleaner

Expected fingerprints: brand_[model]_type
Examples: diamond_dm3060_vacuum, deerma_dx115c_vacuum, steam_cleaner`,

                examples: [
                    {input: "Փոշեկուլ DM-3060 DIAMOND", output: "diamond_dm3060_vacuum"},
                    {input: "Deerma vacuum cleaner DX 115 C", output: "deerma_dx115c_vacuum"},
                    {input: "Пароочиститель steam cleaner", output: "steam_cleaner"},
                    {input: "Փոշեկուլ ձեռքի", output: "handheld_vacuum"}
                ]
            },

            pet_products: {
                context: `PET PRODUCTS NORMALIZATION:
Focus on: brand, animal type, product type
Key product types:
- Pet food: Josera, Royal Canin, Purina, Secret brands
- Accessories: collars, carriers, toys, clothes
- Cat specific: scratching posts, litter boxes
Armenian: կատու=cat, շուն=dog, կեր=food, վզկապ=collar
Russian: кот/кошка=cat, собака=dog, корм=food

Expected fingerprints: brand_animal_[product]_[variety]
Examples: josera_dog_food_lamb_rice, royal_canin_cat_food_adult, dog_collar`,

                examples: [
                    {input: "Josera Lamb & Rice շան կեր", output: "josera_dog_food_lamb_rice"},
                    {input: "Royal Canin կատվի կեր", output: "royal_canin_cat_food"},
                    {input: "Վզկապ շների համար", output: "dog_collar"},
                    {input: "Կատվի քերծող սյուն", output: "cat_scratching_post"}
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
                    const isConnectionError = error.code === 'ECONNREFUSED' ||
                                             error.code === 'ETIMEDOUT' ||
                                             error.code === 'ENOTFOUND' ||
                                             error.response?.status >= 500;

                    if (isConnectionError) {
                        console.error(`⚠️ DeepSeek API appears to be unavailable (attempt ${retryCount}/${maxRetries}): ${error.message}`);
                    } else {
                        console.error(`❌ Error processing batch ${i + 1} (attempt ${retryCount}/${maxRetries}):`, error.message);
                    }

                    if (retryCount < maxRetries) {
                        const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
                        console.log(`⏳ Retrying batch ${i + 1} in ${retryDelay/1000}s...`);
                        await this.sleep(retryDelay);
                    } else {
                        // All retries failed - check if it's a service availability issue
                        if (isConnectionError) {
                            console.error(`⚠️ DeepSeek API is down. Batch ${i + 1} will use fallback (no AI normalization)`);
                            // Return items without AI fingerprints but don't throw error
                            batch.forEach(item => {
                                results.push({
                                    ...item,
                                    fingerprint: '',
                                    fallback: true,
                                    error: 'DeepSeek API unavailable'
                                });
                            });

                            // Continue processing without throwing error
                            if (progressCallback) {
                                progressCallback(results.length, items.length);
                            }
                            continue; // Continue to next batch instead of throwing
                        } else {
                            // For non-connection errors, still add items with empty fingerprints
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