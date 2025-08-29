/**
 * Extended Features Services Index
 * Exports all extended feature services for easy importing
 */

// Core extended feature services
export { ConversionService } from './conversion-service.js';
export { OCRService } from './ocr-service.js';
export { AIService } from './ai-service.js';
export { CloudIntegrationService } from './cloud-integration-service.js';

// Enhanced features manager
export { EnhancedFeaturesManager } from './enhanced-features-manager.js';

// Re-export existing services for convenience
export { CompressionService } from './compression-service.js';
export { PDFAnalyzer } from './pdf-analyzer.js';
export { APIClient } from './api-client.js';
export { SecurityService } from './security-service.js';
export { StorageService } from './storage-service.js';
export { AnalyticsService } from './analytics-service.js';

/**
 * Service Registry
 * Provides easy access to all available services
 */
export class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.initialized = false;
    }

    /**
     * Register a service
     * @param {string} name - Service name
     * @param {Object} service - Service instance
     */
    register(name, service) {
        this.services.set(name, service);
    }

    /**
     * Get a service by name
     * @param {string} name - Service name
     * @returns {Object|null} Service instance
     */
    get(name) {
        return this.services.get(name) || null;
    }

    /**
     * Check if service exists
     * @param {string} name - Service name
     * @returns {boolean} Service existence
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Get all registered service names
     * @returns {Array<string>} Service names
     */
    getServiceNames() {
        return Array.from(this.services.keys());
    }

    /**
     * Get all registered services
     * @returns {Map} Services map
     */
    getAllServices() {
        return new Map(this.services);
    }

    /**
     * Initialize all services
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            // Initialize enhanced features manager first
            const enhancedManager = this.get('enhancedFeatures');
            if (enhancedManager) {
                await enhancedManager.initialize();
            }

            this.initialized = true;
            console.log('Service registry initialized successfully');
        } catch (error) {
            console.error('Failed to initialize service registry:', error);
            throw error;
        }
    }

    /**
     * Check if registry is initialized
     * @returns {boolean} Initialization status
     */
    isInitialized() {
        return this.initialized;
    }
}

/**
 * Default service registry instance
 */
export const defaultServiceRegistry = new ServiceRegistry();

/**
 * Initialize default service registry with all services
 */
export async function initializeDefaultRegistry() {
    try {
        // Import and register all services
        const { ConversionService } = await import('./conversion-service.js');
        const { OCRService } = await import('./ocr-service.js');
        const { AIService } = await import('./ai-service.js');
        const { CloudIntegrationService } = await import('./cloud-integration-service.js');
        const { EnhancedFeaturesManager } = await import('./enhanced-features-manager.js');
        const { CompressionService } = await import('./compression-service.js');
        const { PDFAnalyzer } = await import('./pdf-analyzer.js');
        const { APIClient } = await import('./api-client.js');
        const { SecurityService } = await import('./security-service.js');
        const { StorageService } = await import('./storage-service.js');
        const { AnalyticsService } = await import('./analytics-service.js');

        // Register services
        defaultServiceRegistry.register('conversion', new ConversionService());
        defaultServiceRegistry.register('ocr', new OCRService());
        defaultServiceRegistry.register('ai', new AIService());
        defaultServiceRegistry.register('cloud', new CloudIntegrationService());
        defaultServiceRegistry.register('enhancedFeatures', new EnhancedFeaturesManager());
        defaultServiceRegistry.register('compression', new CompressionService());
        defaultServiceRegistry.register('pdfAnalyzer', new PDFAnalyzer());
        defaultServiceRegistry.register('apiClient', new APIClient());
        defaultServiceRegistry.register('security', new SecurityService());
        defaultServiceRegistry.register('storage', new StorageService());
        defaultServiceRegistry.register('analytics', new AnalyticsService());

        // Initialize registry
        await defaultServiceRegistry.initialize();

        return defaultServiceRegistry;
    } catch (error) {
        console.error('Failed to initialize default service registry:', error);
        throw error;
    }
}

/**
 * Utility function to get service by name
 * @param {string} name - Service name
 * @returns {Object|null} Service instance
 */
export function getService(name) {
    return defaultServiceRegistry.get(name);
}

/**
 * Utility function to check if service exists
 * @param {string} name - Service name
 * @returns {boolean} Service existence
 */
export function hasService(name) {
    return defaultServiceRegistry.has(name);
}

/**
 * Utility function to get all available service names
 * @returns {Array<string>} Service names
 */
export function getAvailableServices() {
    return defaultServiceRegistry.getServiceNames();
}
