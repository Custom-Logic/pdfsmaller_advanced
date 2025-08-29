/**
 * Enhanced Features Manager
 * Orchestrates all extended feature services and provides a unified interface
 */

import { ConversionService } from './conversion-service.js';
import { OCRService } from './ocr-service.js';
import { AIService } from './ai-service.js';
import { CloudIntegrationService } from './cloud-integration-service.js';
import { CompressionService } from './compression-service.js';

export class EnhancedFeaturesManager {
    constructor() {
        this.services = {
            conversion: new ConversionService(),
            ocr: new OCRService(),
            ai: new AIService(),
            cloud: new CloudIntegrationService(),
            compression: new CompressionService()
        };
        
        this.featureHistory = new Map();
        this.activeOperations = new Map();
        this.featureCapabilities = this.initializeFeatureCapabilities();
    }

    /**
     * Initialize feature capabilities
     */
    initializeFeatureCapabilities() {
        return {
            conversion: {
                name: 'PDF Conversion',
                description: 'Convert PDFs to Word, Excel, Text, and HTML formats',
                supportedFormats: ['docx', 'xlsx', 'txt', 'html'],
                maxFileSize: '100MB',
                features: ['format_conversion', 'layout_preservation', 'table_extraction', 'batch_processing']
            },
            ocr: {
                name: 'Optical Character Recognition',
                description: 'Extract text from scanned PDFs and images',
                supportedFormats: ['pdf', 'jpeg', 'png', 'tiff', 'bmp'],
                maxFileSize: '50MB',
                features: ['text_extraction', 'searchable_pdf', 'language_support', 'quality_options']
            },
            ai: {
                name: 'AI-Powered Features',
                description: 'Summarize and translate PDF content using AI',
                supportedFormats: ['pdf'],
                maxFileSize: '25MB',
                features: ['summarization', 'translation', 'multiple_languages', 'style_options']
            },
            cloud: {
                name: 'Cloud Integration',
                description: 'Save and load files from cloud storage providers',
                supportedProviders: ['google_drive', 'dropbox', 'onedrive'],
                features: ['file_upload', 'file_download', 'folder_management', 'oauth_authentication']
            },
            compression: {
                name: 'PDF Compression',
                description: 'Reduce PDF file sizes while maintaining quality',
                supportedFormats: ['pdf'],
                maxFileSize: '500MB',
                features: ['intelligent_compression', 'quality_preservation', 'batch_processing', 'progress_tracking']
            }
        };
    }

    /**
     * Initialize all services
     */
    async initialize() {
        try {
            console.log('Initializing Enhanced Features Manager...');
            
            // Initialize cloud integration service
            await this.services.cloud.initialize();
            
            // Set up event listeners for progress tracking
            this.setupProgressListeners();
            
            console.log('Enhanced Features Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Enhanced Features Manager:', error);
        }
    }

    /**
     * Setup progress event listeners
     */
    setupProgressListeners() {
        // Listen for progress events from all services
        window.addEventListener('conversionProgress', (event) => {
            this.handleServiceProgress('conversion', event.detail);
        });

        window.addEventListener('ocrProgress', (event) => {
            this.handleServiceProgress('ocr', event.detail);
        });

        window.addEventListener('cloudProgress', (event) => {
            this.handleServiceProgress('cloud', event.detail);
        });
    }

    /**
     * Handle service progress events
     */
    handleServiceProgress(serviceName, progressData) {
        const operationId = progressData.operationId || Date.now();
        const operation = this.activeOperations.get(operationId);
        
        if (operation) {
            operation.progress = progressData.progress;
            operation.lastUpdate = new Date();
            
            // Emit progress event
            this.emitProgress(operationId, progressData);
        }
    }

    /**
     * Get feature capabilities
     */
    getFeatureCapabilities() {
        return { ...this.featureCapabilities };
    }

    /**
     * Get service status
     */
    getServiceStatus(serviceName) {
        if (!this.services[serviceName]) {
            return { available: false, error: 'Service not found' };
        }

        try {
            const service = this.services[serviceName];
            
            if (serviceName === 'cloud') {
                return {
                    available: true,
                    authenticated: service.getAuthenticatedProviders(),
                    supported: service.getSupportedProviders()
                };
            }
            
            return { available: true };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    /**
     * Execute feature operation
     * @param {string} feature - Feature name
     * @param {string} operation - Operation name
     * @param {Array} files - Files to process
     * @param {Object} options - Operation options
     * @returns {Promise<Object>} Operation result
     */
    async executeFeature(feature, operation, files, options = {}) {
        try {
            if (!this.services[feature]) {
                throw new Error(`Feature not supported: ${feature}`);
            }

            const operationId = this.generateOperationId(feature, operation);
            
            // Create operation tracking
            const operationTracker = {
                id: operationId,
                feature: feature,
                operation: operation,
                files: files,
                options: options,
                startTime: new Date(),
                status: 'running',
                progress: 0
            };
            
            this.activeOperations.set(operationId, operationTracker);

            let result;
            
            try {
                switch (feature) {
                    case 'conversion':
                        if (operation === 'convert') {
                            const targetFormat = options.targetFormat || 'docx';
                            if (files.length === 1) {
                                result = await this.services.conversion.convertPDF(files[0], targetFormat, options);
                            } else {
                                result = await this.services.conversion.batchConvert(files, targetFormat, options);
                            }
                        }
                        break;
                        
                    case 'ocr':
                        if (operation === 'process') {
                            if (files.length === 1) {
                                result = await this.services.ocr.performOCR(files[0], options);
                            } else {
                                result = await this.services.ocr.batchOCR(files, options);
                            }
                        }
                        break;
                        
                    case 'ai':
                        if (operation === 'summarize') {
                            if (files.length === 1) {
                                result = await this.services.ai.summarizePDF(files[0], options);
                            } else {
                                result = await this.services.ai.batchAIProcessing(files, 'summarize', options);
                            }
                        } else if (operation === 'translate') {
                            const targetLanguage = options.targetLanguage || 'en';
                            if (files.length === 1) {
                                result = await this.services.ai.translatePDF(files[0], targetLanguage, options);
                            } else {
                                result = await this.services.ai.batchAIProcessing(files, 'translate', options);
                            }
                        }
                        break;
                        
                    case 'cloud':
                        if (operation === 'upload') {
                            const provider = options.provider || 'google_drive';
                            const destinationPath = options.destinationPath || '/';
                            result = await this.services.cloud.uploadToCloud(files[0], provider, destinationPath, options);
                        } else if (operation === 'download') {
                            const provider = options.provider || 'google_drive';
                            const filePath = options.filePath;
                            result = await this.services.cloud.downloadFromCloud(provider, filePath, options);
                        } else if (operation === 'list') {
                            const provider = options.provider || 'google_drive';
                            const folderPath = options.folderPath || '/';
                            result = await this.services.cloud.listCloudFiles(provider, folderPath, options);
                        }
                        break;
                        
                    case 'compression':
                        if (operation === 'compress') {
                            if (files.length === 1) {
                                result = await this.services.compression.compressFile(files[0], options);
                            } else {
                                result = await this.services.compression.batchCompress(files, options);
                            }
                        }
                        break;
                        
                    default:
                        throw new Error(`Unknown feature: ${feature}`);
                }

                // Update operation status
                operationTracker.status = 'completed';
                operationTracker.endTime = new Date();
                operationTracker.result = result;
                operationTracker.progress = 100;

                // Add to history
                this.addToHistory({
                    feature: feature,
                    operation: operation,
                    files: files.map(f => ({ name: f.name, size: f.size })),
                    options: options,
                    result: result,
                    operationId: operationId,
                    success: true
                });

                return result;
            } catch (error) {
                // Update operation status
                operationTracker.status = 'failed';
                operationTracker.endTime = new Date();
                operationTracker.error = error.message;
                operationTracker.progress = 0;

                // Add to history
                this.addToHistory({
                    feature: feature,
                    operation: operation,
                    files: files.map(f => ({ name: f.name, size: f.size })),
                    options: options,
                    error: error.message,
                    operationId: operationId,
                    success: false
                });

                throw error;
            } finally {
                // Clean up operation tracking after a delay
                setTimeout(() => {
                    this.activeOperations.delete(operationId);
                }, 300000); // 5 minutes
            }
        } catch (error) {
            console.error(`Feature execution failed: ${feature}.${operation}`, error);
            throw error;
        }
    }

    /**
     * Get operation preview/estimate
     * @param {string} feature - Feature name
     * @param {string} operation - Operation name
     * @param {File} file - File to analyze
     * @param {Object} options - Operation options
     * @returns {Promise<Object>} Preview result
     */
    async getOperationPreview(feature, operation, file, options = {}) {
        try {
            if (!this.services[feature]) {
                throw new Error(`Feature not supported: ${feature}`);
            }

            switch (feature) {
                case 'conversion':
                    if (operation === 'convert') {
                        const targetFormat = options.targetFormat || 'docx';
                        return await this.services.conversion.getConversionPreview(file, targetFormat, options);
                    }
                    break;
                    
                case 'ocr':
                    if (operation === 'process') {
                        return await this.services.ocr.getOCRPreview(file, options);
                    }
                    break;
                    
                case 'ai':
                    if (operation === 'summarize') {
                        return await this.services.ai.getAIProcessingPreview(file, 'summarize', options);
                    } else if (operation === 'translate') {
                        return await this.services.ai.getAIProcessingPreview(file, 'translate', options);
                    }
                    break;
                    
                case 'compression':
                    if (operation === 'compress') {
                        return await this.services.compression.getCompressionPreview(file, options);
                    }
                    break;
                    
                default:
                    throw new Error(`Unknown feature: ${feature}`);
            }

            throw new Error(`Operation not supported: ${operation}`);
        } catch (error) {
            console.error(`Preview generation failed: ${feature}.${operation}`, error);
            throw error;
        }
    }

    /**
     * Get active operations
     */
    getActiveOperations() {
        return Array.from(this.activeOperations.values());
    }

    /**
     * Cancel operation
     * @param {string} operationId - Operation ID to cancel
     * @returns {boolean} Cancellation success
     */
    cancelOperation(operationId) {
        const operation = this.activeOperations.get(operationId);
        if (operation && operation.status === 'running') {
            operation.status = 'cancelled';
            operation.endTime = new Date();
            operation.progress = 0;
            
            // Add to history
            this.addToHistory({
                feature: operation.feature,
                operation: operation.operation,
                files: operation.files.map(f => ({ name: f.name, size: f.size })),
                options: operation.options,
                operationId: operationId,
                success: false,
                cancelled: true
            });
            
            return true;
        }
        return false;
    }

    /**
     * Get operation status
     * @param {string} operationId - Operation ID
     * @returns {Object|null} Operation status
     */
    getOperationStatus(operationId) {
        return this.activeOperations.get(operationId) || null;
    }

    /**
     * Emit progress event
     */
    emitProgress(operationId, progressData) {
        const event = new CustomEvent('enhancedFeatureProgress', {
            detail: { operationId, progressData }
        });
        window.dispatchEvent(event);
    }

    /**
     * Generate operation ID
     */
    generateOperationId(feature, operation) {
        return `${feature}_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add operation to history
     */
    addToHistory(operationData) {
        const historyEntry = {
            id: Date.now(),
            timestamp: new Date(),
            ...operationData
        };

        this.featureHistory.set(historyEntry.id, historyEntry);

        // Keep only last 200 entries
        if (this.featureHistory.size > 200) {
            const firstKey = this.featureHistory.keys().next().value;
            this.featureHistory.delete(firstKey);
        }

        return historyEntry;
    }

    /**
     * Get feature history
     */
    getFeatureHistory() {
        return Array.from(this.featureHistory.values());
    }

    /**
     * Clear feature history
     */
    clearHistory() {
        this.featureHistory.clear();
    }

    /**
     * Get service instance
     * @param {string} serviceName - Service name
     * @returns {Object|null} Service instance
     */
    getService(serviceName) {
        return this.services[serviceName] || null;
    }

    /**
     * Check if feature is available
     * @param {string} feature - Feature name
     * @returns {boolean} Feature availability
     */
    isFeatureAvailable(feature) {
        return this.services.hasOwnProperty(feature);
    }

    /**
     * Get all available features
     * @returns {Array<string>} List of available features
     */
    getAvailableFeatures() {
        return Object.keys(this.services);
    }

    /**
     * Validate file for feature
     * @param {string} feature - Feature name
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFileForFeature(feature, file) {
        if (!this.isFeatureAvailable(feature)) {
            return { valid: false, error: `Feature not available: ${feature}` };
        }

        const capabilities = this.featureCapabilities[feature];
        if (!capabilities) {
            return { valid: false, error: `Feature capabilities not found: ${feature}` };
        }

        // Check file size
        const maxSize = this.parseFileSize(capabilities.maxFileSize);
        if (file.size > maxSize) {
            return { 
                valid: false, 
                error: `File too large. Maximum size: ${capabilities.maxFileSize}` 
            };
        }

        // Check file format
        if (capabilities.supportedFormats) {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            if (!capabilities.supportedFormats.includes(fileExtension)) {
                return { 
                    valid: false, 
                    error: `Unsupported format. Supported formats: ${capabilities.supportedFormats.join(', ')}` 
                };
            }
        }

        return { valid: true };
    }

    /**
     * Parse file size string to bytes
     * @param {string} sizeString - Size string (e.g., "100MB", "50KB")
     * @returns {number} Size in bytes
     */
    parseFileSize(sizeString) {
        const units = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024
        };

        const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            return value * units[unit];
        }

        return 0; // Invalid format
    }
}
