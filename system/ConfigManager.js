// ConfigManager.js - Application Configuration
// Manages app settings, preferences, and configuration

class ConfigManager {
    constructor() {
        this.config = this.getDefaultConfig();
        this.storageKey = 'highPointRadio_config';
        this.loadConfig();
    }

    getDefaultConfig() {
        return {
            // Audio settings
            audio: {
                defaultVolume: 1.0,
                fadeEffectDuration: 1000,
                skipInterval: 30, // seconds
                autoPlay: false,
                repeatMode: false
            },

            // UI settings
            ui: {
                theme: 'default',
                showPlaylistByDefault: false,
                enableKeyboardShortcuts: true,
                animationDuration: 300,
                updateInterval: 250 // ms for UI updates
            },

            // Performance settings
            performance: {
                enableMemoryMonitoring: true,
                cleanupInterval: 300000, // 5 minutes
                maxCacheSize: 100,
                throttleInterval: 250
            },

            // API settings
            api: {
                requestTimeout: 30000, // 30 seconds
                retryAttempts: 3,
                retryDelay: 1000,
                enableCaching: true
            },

            // Playlist settings
            playlist: {
                shuffleMode: false,
                autoAdvance: true,
                rememberPosition: true,
                preloadNext: false
            },

            // Debug settings
            debug: {
                enableLogging: true,
                enablePerformanceTracking: true,
                logLevel: 'info' // 'debug', 'info', 'warn', 'error'
            },

            // Feature flags
            features: {
                enableEffects: true,
                enableVisualization: false,
                enableEqualizer: false,
                enableCrossfade: false
            }
        };
    }

    // Load configuration from localStorage
    loadConfig() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsedConfig = JSON.parse(stored);
                this.config = this.mergeConfig(this.config, parsedConfig);
                console.log('Configuration loaded from storage');
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
            // Use default config on error
        }
    }

    // Save configuration to localStorage
    saveConfig() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.config));
            console.log('Configuration saved to storage');
        } catch (error) {
            console.error('Error saving configuration:', error);
        }
    }

    // Merge configurations (deep merge)
    mergeConfig(defaultConfig, userConfig) {
        const merged = { ...defaultConfig };
        
        for (const key in userConfig) {
            if (userConfig.hasOwnProperty(key)) {
                if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
                    merged[key] = this.mergeConfig(defaultConfig[key] || {}, userConfig[key]);
                } else {
                    merged[key] = userConfig[key];
                }
            }
        }
        
        return merged;
    }

    // Get configuration value
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let current = this.config;
        
        for (const key of keys) {
            if (current && current.hasOwnProperty(key)) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }

    // Set configuration value
    set(path, value, save = true) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = this.config;
        
        // Navigate to the parent object
        for (const key of keys) {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        // Set the value
        current[lastKey] = value;
        
        if (save) {
            this.saveConfig();
        }
        
        console.log(`Configuration updated: ${path} = ${value}`);
    }

    // Reset to defaults
    resetToDefaults() {
        this.config = this.getDefaultConfig();
        this.saveConfig();
        console.log('Configuration reset to defaults');
    }

    // Reset specific section
    resetSection(section) {
        const defaultConfig = this.getDefaultConfig();
        if (defaultConfig[section]) {
            this.config[section] = { ...defaultConfig[section] };
            this.saveConfig();
            console.log(`Configuration section '${section}' reset to defaults`);
        }
    }

    // Validate configuration
    validateConfig() {
        const errors = [];
        
        // Validate audio settings
        if (this.config.audio.defaultVolume < 0 || this.config.audio.defaultVolume > 1) {
            errors.push('audio.defaultVolume must be between 0 and 1');
        }
        
        if (this.config.audio.fadeEffectDuration < 0) {
            errors.push('audio.fadeEffectDuration must be positive');
        }
        
        // Validate performance settings
        if (this.config.performance.updateInterval < 50) {
            errors.push('performance.updateInterval should be at least 50ms');
        }
        
        // Validate API settings
        if (this.config.api.requestTimeout < 1000) {
            errors.push('api.requestTimeout should be at least 1000ms');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Get configuration summary
    getSummary() {
        return {
            audio: {
                volume: this.get('audio.defaultVolume'),
                repeat: this.get('audio.repeatMode'),
                autoPlay: this.get('audio.autoPlay')
            },
            ui: {
                theme: this.get('ui.theme'),
                shortcuts: this.get('ui.enableKeyboardShortcuts')
            },
            performance: {
                monitoring: this.get('performance.enableMemoryMonitoring'),
                updateInterval: this.get('performance.updateInterval')
            },
            features: this.get('features')
        };
    }

    // Export configuration
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }

    // Import configuration
    importConfig(configString) {
        try {
            const importedConfig = JSON.parse(configString);
            this.config = this.mergeConfig(this.getDefaultConfig(), importedConfig);
            this.saveConfig();
            console.log('Configuration imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing configuration:', error);
            return false;
        }
    }

    // Get environment-specific settings
    getEnvironmentConfig() {
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
        
        if (isDevelopment) {
            return {
                debug: {
                    enableLogging: true,
                    logLevel: 'debug'
                },
                performance: {
                    enableMemoryMonitoring: true
                }
            };
        } else {
            return {
                debug: {
                    enableLogging: false,
                    logLevel: 'error'
                },
                performance: {
                    enableMemoryMonitoring: false
                }
            };
        }
    }

    // Apply environment overrides
    applyEnvironmentOverrides() {
        const envConfig = this.getEnvironmentConfig();
        this.config = this.mergeConfig(this.config, envConfig);
    }

    // Configuration presets
    getPresets() {
        return {
            performance: {
                audio: { fadeEffectDuration: 500 },
                ui: { animationDuration: 200, updateInterval: 100 },
                performance: { throttleInterval: 100 },
                features: { enableEffects: false }
            },
            quality: {
                audio: { fadeEffectDuration: 2000 },
                ui: { animationDuration: 500, updateInterval: 250 },
                performance: { throttleInterval: 250 },
                features: { enableEffects: true, enableVisualization: true }
            },
            minimal: {
                ui: { showPlaylistByDefault: false, enableKeyboardShortcuts: false },
                features: { enableEffects: false, enableVisualization: false },
                debug: { enableLogging: false }
            }
        };
    }

    // Apply preset
    applyPreset(presetName) {
        const presets = this.getPresets();
        if (presets[presetName]) {
            this.config = this.mergeConfig(this.config, presets[presetName]);
            this.saveConfig();
            console.log(`Applied preset: ${presetName}`);
        } else {
            console.error(`Preset not found: ${presetName}`);
        }
    }

    // Cleanup method
    destroy() {
        // Save current config before destroying
        this.saveConfig();
        this.config = null;
        
        console.log('ConfigManager destroyed');
    }
}

export default ConfigManager;