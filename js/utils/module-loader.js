/**
 * Module Loader Utility
 * Handles dynamic imports, code splitting, and module caching
 */

export class ModuleLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.loadTimes = new Map();
        this.errorCount = new Map();
        this.maxRetries = 3;
    }

    /**
     * Load a module with caching and error handling
     * @param {string} modulePath - Path to the module
     * @param {Object} options - Loading options
     * @returns {Promise<Object>} - Loaded module
     */
    async loadModule(modulePath, options = {}) {
        const {
            cache = true,
            timeout = 10000,
            retry = true
        } = options;

        // Return cached module if available and caching is enabled
        if (cache && this.cache.has(modulePath)) {
            return this.cache.get(modulePath);
        }

        // Return existing loading promise if module is being loaded
        if (this.loadingPromises.has(modulePath)) {
            return this.loadingPromises.get(modulePath);
        }

        // Create loading promise
        const loadingPromise = this.performLoad(modulePath, { timeout, retry });
        this.loadingPromises.set(modulePath, loadingPromise);

        try {
            const startTime = performance.now();
            const module = await loadingPromise;
            const loadTime = performance.now() - startTime;

            // Cache the module and record load time
            if (cache) {
                this.cache.set(modulePath, module);
            }
            this.loadTimes.set(modulePath, loadTime);
            this.loadingPromises.delete(modulePath);

            if (__DEV__) {
                console.log(`Module loaded: ${modulePath} (${loadTime.toFixed(2)}ms)`);
            }

            return module;
        } catch (error) {
            this.loadingPromises.delete(modulePath);
            this.recordError(modulePath);
            throw new Error(`Failed to load module ${modulePath}: ${error.message}`);
        }
    }

    /**
     * Perform the actual module loading with timeout and retry logic
     * @param {string} modulePath - Path to the module
     * @param {Object} options - Loading options
     * @returns {Promise<Object>} - Loaded module
     */
    async performLoad(modulePath, { timeout, retry }) {
        const loadWithTimeout = (path, timeoutMs) => {
            return Promise.race([
                import(path),
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Module load timeout')), timeoutMs);
                })
            ]);
        };

        let lastError;
        const maxAttempts = retry ? this.maxRetries : 1;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await loadWithTimeout(modulePath, timeout);
            } catch (error) {
                lastError = error;
                
                if (attempt < maxAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    if (__DEV__) {
                        console.warn(`Module load attempt ${attempt} failed for ${modulePath}, retrying in ${delay}ms...`);
                    }
                    await this.delay(delay);
                } else {
                    if (__DEV__) {
                        console.error(`All ${maxAttempts} attempts failed for ${modulePath}`);
                    }
                }
            }
        }

        throw lastError;
    }

    /**
     * Preload multiple modules in parallel
     * @param {string[]} modulePaths - Array of module paths
     * @param {Object} options - Loading options
     * @returns {Promise<Object[]>} - Array of loaded modules
     */
    async preloadModules(modulePaths, options = {}) {
        const { 
            concurrency = 5,
            failFast = false 
        } = options;

        const chunks = this.chunkArray(modulePaths, concurrency);
        const results = [];

        for (const chunk of chunks) {
            const chunkPromises = chunk.map(path => 
                this.loadModule(path, options).catch(error => {
                    if (failFast) {
                        throw error;
                    }
                    console.warn(`Failed to preload module ${path}:`, error);
                    return null;
                })
            );

            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults);
        }

        return results.filter(result => result !== null);
    }

    /**
     * Load modules based on route or feature
     * @param {string} route - Current route or feature name
     * @returns {Promise<Object[]>} - Loaded modules for the route
     */
    async loadRouteModules(route) {
        const routeModuleMap = {
            'compress': [
                './modules/compression-flow.js',
                './components/file-uploader.js',
                './components/progress-tracker.js',
                './components/results-display.js'
            ],
            'convert': [
                './modules/conversion-flow.js',
                './components/file-uploader.js',
                './components/progress-tracker.js'
            ],
            'ocr': [
                './modules/ocr-flow.js',
                './components/file-uploader.js',
                './services/ocr-service.js'
            ],
            'ai_tools': [
                './modules/ai-tools.js',
                './services/ai-service.js'
            ]
        };

        const modules = routeModuleMap[route] || [];
        return this.preloadModules(modules);
    }

    /**
     * Clear module cache
     * @param {string} [modulePath] - Specific module to clear, or all if not provided
     */
    clearCache(modulePath) {
        if (modulePath) {
            this.cache.delete(modulePath);
            this.loadTimes.delete(modulePath);
            this.errorCount.delete(modulePath);
        } else {
            this.cache.clear();
            this.loadTimes.clear();
            this.errorCount.clear();
        }
    }

    /**
     * Get loading statistics
     * @returns {Object} - Loading statistics
     */
    getStats() {
        const totalModules = this.cache.size;
        const totalLoadTime = Array.from(this.loadTimes.values()).reduce((sum, time) => sum + time, 0);
        const averageLoadTime = totalModules > 0 ? totalLoadTime / totalModules : 0;
        const totalErrors = Array.from(this.errorCount.values()).reduce((sum, count) => sum + count, 0);

        return {
            totalModules,
            totalLoadTime: Math.round(totalLoadTime),
            averageLoadTime: Math.round(averageLoadTime),
            totalErrors,
            cacheHitRate: this.calculateCacheHitRate(),
            loadedModules: Array.from(this.cache.keys())
        };
    }

    /**
     * Check if a module is loaded
     * @param {string} modulePath - Path to the module
     * @returns {boolean} - Whether the module is loaded
     */
    isLoaded(modulePath) {
        return this.cache.has(modulePath);
    }

    /**
     * Check if a module is currently loading
     * @param {string} modulePath - Path to the module
     * @returns {boolean} - Whether the module is loading
     */
    isLoading(modulePath) {
        return this.loadingPromises.has(modulePath);
    }

    /**
     * Get module load time
     * @param {string} modulePath - Path to the module
     * @returns {number|null} - Load time in milliseconds
     */
    getLoadTime(modulePath) {
        return this.loadTimes.get(modulePath) || null;
    }

    // Private helper methods

    recordError(modulePath) {
        const currentCount = this.errorCount.get(modulePath) || 0;
        this.errorCount.set(modulePath, currentCount + 1);
    }

    calculateCacheHitRate() {
        // This would need to be implemented with actual hit/miss tracking
        return 0;
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create singleton instance
export const moduleLoader = new ModuleLoader();