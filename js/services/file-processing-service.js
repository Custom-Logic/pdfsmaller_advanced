/**
 * File Processing Service
 * Centralized service for handling file upload, validation, and processing pipeline
 */

import { FileValidator } from '../utils/file-validator.js';
import { CompressionService } from './compression-service.js';
import { SecurityService } from './security-service.js';
import { appState } from './app-state.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { errorHandlingService } from './error-handling-service.js';

export class FileProcessingService {
    constructor() {
        this.fileValidator = new FileValidator();
        this.compressionService = new CompressionService();
        this.securityService = new SecurityService();
        
        // Processing state
        this.activeJobs = new Map();
        this.processingQueue = [];
        this.isProcessing = false;
        
        // Configuration
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedTypes = ['application/pdf'];
        this.allowedExtensions = ['.pdf'];
        
        // Event listeners
        this.listeners = new Map();
        
        this.init();
    }

    async init() {
        // Subscribe to app state changes
        appState.subscribe('processingMode', (mode) => {
            this.handleModeChange(mode);
        });

        appState.subscribe('compressionLevel', () => {
            this.updateProcessingSettings();
        });

        appState.subscribe('imageQuality', () => {
            this.updateProcessingSettings();
        });

        appState.subscribe('useServerProcessing', () => {
            this.updateProcessingSettings();
        });
    }

    /**
     * Process files through the complete pipeline
     * @param {File[]} files - Files to process
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} Processing results
     */
    async processFiles(files, options = {}) {
        try {
            // Validate input
            if (!files || files.length === 0) {
                throw new Error('No files provided for processing');
            }

            // Convert single file to array
            const fileArray = Array.isArray(files) ? files : [files];
            
            // Generate job ID
            const jobId = this.generateJobId();
            
            // Create job
            const job = {
                id: jobId,
                files: fileArray,
                options: { ...this.getDefaultOptions(), ...options },
                status: 'initializing',
                startTime: Date.now(),
                results: [],
                errors: [],
                progress: 0
            };

            this.activeJobs.set(jobId, job);
            this.emit('job-created', { jobId, job });

            // Start processing pipeline
            await this.runProcessingPipeline(jobId);

            return this.activeJobs.get(jobId);

        } catch (error) {
            errorHandlingService.handleError(error, { 
                context: 'File processing initialization',
                retryCallback: () => this.processFiles(files, options)
            });
            throw error;
        }
    }

    /**
     * Run the complete processing pipeline for a job
     * @param {string} jobId - Job ID
     */
    async runProcessingPipeline(jobId) {
        const job = this.activeJobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        try {
            // Step 1: Validate files
            job.status = 'validating';
            this.updateJobProgress(jobId, 10);
            await this.validateFiles(jobId);

            // Step 2: Analyze files
            job.status = 'analyzing';
            this.updateJobProgress(jobId, 20);
            await this.analyzeFiles(jobId);

            // Step 3: Apply compression settings
            job.status = 'preparing';
            this.updateJobProgress(jobId, 30);
            await this.prepareCompression(jobId);

            // Step 4: Process files
            job.status = 'processing';
            this.updateJobProgress(jobId, 40);
            await this.compressFiles(jobId);

            // Step 5: Finalize results
            job.status = 'finalizing';
            this.updateJobProgress(jobId, 90);
            await this.finalizeResults(jobId);

            // Complete
            job.status = 'completed';
            job.endTime = Date.now();
            job.processingTime = job.endTime - job.startTime;
            this.updateJobProgress(jobId, 100);

            this.emit('job-completed', { jobId, job });

        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            job.endTime = Date.now();
            
            this.emit('job-failed', { jobId, job, error });
            throw error;
        }
    }

    /**
     * Validate all files in a job
     * @param {string} jobId - Job ID
     */
    async validateFiles(jobId) {
        const job = this.activeJobs.get(jobId);
        const validationResults = [];

        for (let i = 0; i < job.files.length; i++) {
            const file = job.files[i];
            
            try {
                const validation = await this.fileValidator.validateFile(file, {
                    maxSize: this.maxFileSize,
                    acceptedTypes: this.allowedTypes,
                    acceptedExtensions: this.allowedExtensions
                });

                validationResults.push({
                    fileIndex: i,
                    fileName: file.name,
                    validation
                });

                if (!validation.isValid) {
                    job.errors.push({
                        fileIndex: i,
                        fileName: file.name,
                        type: 'validation',
                        errors: validation.errors
                    });
                    
                    // Show validation error for this file
                    errorHandlingService.handleError(
                        ErrorHandler.createValidationError(validation.errors.join(', '), null, file.name),
                        { fileName: file.name, field: 'file-upload' }
                    );
                }

                // Update progress
                const progress = 10 + (i / job.files.length) * 10;
                this.updateJobProgress(jobId, progress);

            } catch (error) {
                job.errors.push({
                    fileIndex: i,
                    fileName: file.name,
                    type: 'validation_error',
                    error: error.message
                });
            }
        }

        job.validationResults = validationResults;

        // Check if any files passed validation
        const validFiles = validationResults.filter(r => r.validation.isValid);
        if (validFiles.length === 0) {
            throw new Error('No valid files found for processing');
        }

        this.emit('files-validated', { jobId, validationResults });
    }

    /**
     * Analyze files for compression optimization
     * @param {string} jobId - Job ID
     */
    async analyzeFiles(jobId) {
        const job = this.activeJobs.get(jobId);
        const analysisResults = [];

        for (let i = 0; i < job.files.length; i++) {
            const file = job.files[i];
            
            // Skip invalid files
            const validation = job.validationResults[i];
            if (!validation.validation.isValid) {
                continue;
            }

            try {
                const analysis = await this.compressionService.analyzeFile(file);
                analysisResults.push({
                    fileIndex: i,
                    fileName: file.name,
                    analysis
                });

                // Update progress
                const progress = 20 + (i / job.files.length) * 10;
                this.updateJobProgress(jobId, progress);

            } catch (error) {
                job.errors.push({
                    fileIndex: i,
                    fileName: file.name,
                    type: 'analysis_error',
                    error: error.message
                });
            }
        }

        job.analysisResults = analysisResults;
        this.emit('files-analyzed', { jobId, analysisResults });
    }

    /**
     * Prepare compression settings for each file
     * @param {string} jobId - Job ID
     */
    async prepareCompression(jobId) {
        const job = this.activeJobs.get(jobId);
        const appSettings = appState.getSettings();
        
        job.compressionSettings = {
            compressionLevel: appSettings.compressionLevel,
            imageQuality: appSettings.imageQuality,
            useServerProcessing: appSettings.useServerProcessing,
            processingMode: appSettings.processingMode
        };

        // Apply per-file optimizations based on analysis
        job.fileSettings = job.analysisResults.map(result => {
            const baseSettings = { ...job.compressionSettings };
            
            // Optimize settings based on file analysis
            if (result.analysis.recommendedSettings) {
                return {
                    ...baseSettings,
                    ...result.analysis.recommendedSettings
                };
            }
            
            return baseSettings;
        });

        this.emit('compression-prepared', { jobId, settings: job.compressionSettings });
    }

    /**
     * Compress all valid files
     * @param {string} jobId - Job ID
     */
    async compressFiles(jobId) {
        const job = this.activeJobs.get(jobId);
        const compressionResults = [];

        let processedCount = 0;
        const validFiles = job.analysisResults.length;

        for (const analysisResult of job.analysisResults) {
            const fileIndex = analysisResult.fileIndex;
            const file = job.files[fileIndex];
            const settings = job.fileSettings[processedCount];

            try {
                this.emit('file-compression-start', { 
                    jobId, 
                    fileIndex, 
                    fileName: file.name 
                });

                const result = await this.compressionService.compressFile(file, settings);
                
                compressionResults.push({
                    fileIndex,
                    fileName: file.name,
                    success: true,
                    result,
                    settings
                });

                this.emit('file-compression-complete', { 
                    jobId, 
                    fileIndex, 
                    fileName: file.name,
                    result 
                });

            } catch (error) {
                compressionResults.push({
                    fileIndex,
                    fileName: file.name,
                    success: false,
                    error: error.message,
                    settings
                });

                job.errors.push({
                    fileIndex,
                    fileName: file.name,
                    type: 'compression_error',
                    error: error.message
                });

                this.emit('file-compression-error', { 
                    jobId, 
                    fileIndex, 
                    fileName: file.name,
                    error 
                });
            }

            processedCount++;
            
            // Update progress (40-90% range for compression)
            const progress = 40 + (processedCount / validFiles) * 50;
            this.updateJobProgress(jobId, progress);
        }

        job.compressionResults = compressionResults;
        this.emit('files-compressed', { jobId, compressionResults });
    }

    /**
     * Finalize processing results
     * @param {string} jobId - Job ID
     */
    async finalizeResults(jobId) {
        const job = this.activeJobs.get(jobId);
        
        // Calculate summary statistics
        const successful = job.compressionResults.filter(r => r.success);
        const failed = job.compressionResults.filter(r => !r.success);
        
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        
        successful.forEach(result => {
            if (result.result) {
                totalOriginalSize += result.result.originalSize || 0;
                totalCompressedSize += result.result.compressedSize || 0;
            }
        });

        const overallCompressionRatio = totalOriginalSize > 0 
            ? totalCompressedSize / totalOriginalSize 
            : 1;

        job.summary = {
            totalFiles: job.files.length,
            validFiles: job.validationResults.filter(r => r.validation.isValid).length,
            successfulFiles: successful.length,
            failedFiles: failed.length,
            totalOriginalSize,
            totalCompressedSize,
            overallCompressionRatio,
            spaceSaved: totalOriginalSize - totalCompressedSize,
            spaceSavedPercent: totalOriginalSize > 0 
                ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1)
                : 0
        };

        // Store results in app state
        appState.addResults(job.compressionResults);

        this.emit('results-finalized', { jobId, summary: job.summary });
    }

    /**
     * Get processing job by ID
     * @param {string} jobId - Job ID
     * @returns {Object|null} Job object
     */
    getJob(jobId) {
        return this.activeJobs.get(jobId);
    }

    /**
     * Get all active jobs
     * @returns {Array} Array of job objects
     */
    getActiveJobs() {
        return Array.from(this.activeJobs.values());
    }

    /**
     * Cancel a processing job
     * @param {string} jobId - Job ID
     */
    cancelJob(jobId) {
        const job = this.activeJobs.get(jobId);
        if (job && job.status !== 'completed' && job.status !== 'failed') {
            job.status = 'cancelled';
            job.endTime = Date.now();
            
            this.emit('job-cancelled', { jobId, job });
        }
    }

    /**
     * Clear completed jobs
     */
    clearCompletedJobs() {
        for (const [jobId, job] of this.activeJobs) {
            if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
                this.activeJobs.delete(jobId);
            }
        }
    }

    /**
     * Update job progress
     * @param {string} jobId - Job ID
     * @param {number} progress - Progress percentage (0-100)
     */
    updateJobProgress(jobId, progress) {
        const job = this.activeJobs.get(jobId);
        if (job) {
            job.progress = Math.min(100, Math.max(0, progress));
            this.emit('job-progress', { jobId, progress: job.progress });
        }
    }

    /**
     * Handle processing mode change
     * @param {string} mode - New processing mode
     */
    handleModeChange(mode) {
        this.emit('mode-changed', { mode });
    }

    /**
     * Update processing settings
     */
    updateProcessingSettings() {
        const settings = appState.getSettings();
        this.emit('settings-updated', { settings });
    }

    /**
     * Get default processing options
     * @returns {Object} Default options
     */
    getDefaultOptions() {
        return {
            validateFiles: true,
            analyzeFiles: true,
            optimizeSettings: true,
            generatePreview: false,
            secureProcessing: true
        };
    }

    /**
     * Generate unique job ID
     * @returns {string} Job ID
     */
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        return () => {
            const eventListeners = this.listeners.get(event);
            if (eventListeners) {
                eventListeners.delete(callback);
            }
        };
    }

    emit(event, data) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }

        // Also dispatch DOM event for component integration
        document.dispatchEvent(new CustomEvent(`file-processing:${event}`, {
            detail: data,
            bubbles: true
        }));
    }

    /**
     * Validate single file
     * @param {File} file - File to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateFile(file) {
        return await this.fileValidator.validateFile(file, {
            maxSize: this.maxFileSize,
            acceptedTypes: this.allowedTypes,
            acceptedExtensions: this.allowedExtensions
        });
    }

    /**
     * Get compression preview for file
     * @param {File} file - File to preview
     * @returns {Promise<Object>} Preview result
     */
    async getCompressionPreview(file) {
        const settings = appState.getSettings();
        return await this.compressionService.getCompressionPreview(file, settings);
    }

    /**
     * Download processed file
     * @param {Object} result - Compression result
     * @param {string} originalName - Original file name
     */
    downloadFile(result, originalName) {
        if (!result.compressedFile) {
            throw new Error('No compressed file available for download');
        }

        const url = URL.createObjectURL(result.compressedFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName.replace('.pdf', '_compressed.pdf');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get processing statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        const jobs = Array.from(this.activeJobs.values());
        const completed = jobs.filter(j => j.status === 'completed');
        
        let totalFiles = 0;
        let totalOriginalSize = 0;
        let totalCompressedSize = 0;
        
        completed.forEach(job => {
            if (job.summary) {
                totalFiles += job.summary.successfulFiles;
                totalOriginalSize += job.summary.totalOriginalSize;
                totalCompressedSize += job.summary.totalCompressedSize;
            }
        });

        return {
            totalJobs: jobs.length,
            completedJobs: completed.length,
            totalFiles,
            totalOriginalSize,
            totalCompressedSize,
            totalSpaceSaved: totalOriginalSize - totalCompressedSize,
            averageCompressionRatio: totalOriginalSize > 0 
                ? totalCompressedSize / totalOriginalSize 
                : 1
        };
    }
}

// Create singleton instance
export const fileProcessingService = new FileProcessingService();

// Export for global access
window.fileProcessingService = fileProcessingService;