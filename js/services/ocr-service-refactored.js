/**
 * OCR Service (Refactored)
 * Handles Optical Character Recognition for scanned PDFs and images
 * Follows the new event-driven, service-centric architecture
 */

import { StandardService } from './standard-service.js';
import { APIClient } from './api-client.js';
import { PDFAnalyzer } from './pdf-analyzer.js';

export class OCRService extends StandardService {
    constructor() {
        super();
        this.apiClient = new APIClient();
        this.pdfAnalyzer = new PDFAnalyzer();
        this.ocrHistory = new Map();
        this.supportedLanguages = [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
        ];
        this.ocrQualityLevels = ['fast', 'balanced', 'accurate'];
        this.outputFormats = ['searchable_pdf', 'text', 'json'];
    }

    async init() {
        try {
            await super.init();
            this.emitStatusChange('initialized');
        } catch (error) {
            this.emitError(error, { operation: 'initialization' });
            throw error;
        }
    }

    /**
     * Primary API: Extract text from file using OCR
     * @param {string} fileId - File ID from storage service
     * @param {Object} ocrOptions - OCR processing options
     * @returns {Promise<Object>} OCR result
     */
    async extractText(fileId, ocrOptions = {}) {
        try {
            this.isProcessing = true;
            this.emitStatusChange('processing', { fileId });
            this.emitProgress(0, 'Starting OCR processing...');

            // Validate options
            this.validateOCROptions(ocrOptions);

            // Get file from storage (via event to MainController)
            const file = await this.requestFile(fileId);
            
            // Perform OCR
            const result = await this.performOCR(file, ocrOptions);

            this.emitProgress(100, 'OCR processing completed');
            this.emitComplete(result, 'OCR extraction completed successfully');
            
            return result;
        } catch (error) {
            this.emitError(error, { fileId, operation: 'ocr' });
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Validate OCR processing options
     */
    validateOCROptions(options) {
        if (options.language && !this.supportedLanguages.includes(options.language)) {
            throw new Error(`Unsupported language: ${options.language}`);
        }

        if (options.quality && !this.ocrQualityLevels.includes(options.quality)) {
            throw new Error(`Unsupported quality level: ${options.quality}`);
        }

        if (options.outputFormat && !this.outputFormats.includes(options.outputFormat)) {
            throw new Error(`Unsupported output format: ${options.outputFormat}`);
        }
    }

    /**
     * Request file from storage service via events
     */
    async requestFile(fileId) {
        return new Promise((resolve, reject) => {
            // Emit request for file
            this.dispatchEvent(new CustomEvent('fileRequested', {
                detail: { fileId, requestId: Date.now() }
            }));

            // Listen for file response (this would be handled by MainController)
            const timeout = setTimeout(() => {
                reject(new Error('File request timeout'));
            }, 10000);

            const handleFileResponse = (event) => {
                if (event.detail.fileId === fileId) {
                    clearTimeout(timeout);
                    document.removeEventListener('fileResponse', handleFileResponse);
                    
                    if (event.detail.error) {
                        reject(new Error(event.detail.error));
                    } else {
                        resolve(event.detail.file);
                    }
                }
            };

            document.addEventListener('fileResponse', handleFileResponse);
        });
    }

    /**
     * Perform OCR on a PDF or image file
     */
    async performOCR(file, options = {}) {
        try {
            this.emitProgress(10, 'Validating file for OCR...');
            this.validateOCRRequest(file);
            
            this.emitProgress(20, 'Analyzing file for OCR optimization...');
            const analysis = await this.analyzeFileForOCR(file);
            
            this.emitProgress(30, 'Preparing OCR options...');
            const ocrOptions = this.prepareOCROptions(options, analysis);
            
            this.emitProgress(40, 'Starting OCR processing...');
            const result = await this.executeOCR(file, ocrOptions);
            
            this.emitProgress(90, 'Finalizing OCR results...');
            const historyEntry = this.addToHistory({
                fileName: file.name,
                originalSize: file.size,
                options: ocrOptions,
                result: result,
                analysis: analysis
            });
            
            return {
                ...result,
                historyId: historyEntry.id,
                analysis: analysis
            };
        } catch (error) {
            console.error('OCR processing failed:', error);
            throw new Error(`OCR processing failed: ${error.message}`);
        }
    }

    /**
     * Validate OCR request
     */
    validateOCRRequest(file) {
        if (!file) {
            throw new Error('No file provided');
        }
        
        const supportedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/tiff',
            'image/bmp'
        ];
        
        if (!supportedTypes.includes(file.type)) {
            throw new Error(`Unsupported file type: ${file.type}. Supported types: ${supportedTypes.join(', ')}`);
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB limit for OCR
            throw new Error('File too large for OCR processing (max 50MB)');
        }
    }

    /**
     * Analyze file for OCR optimization
     */
    async analyzeFileForOCR(file) {
        try {
            if (file.type === 'application/pdf') {
                return await this.pdfAnalyzer.analyze(file);
            } else {
                // For images, create a basic analysis
                return {
                    fileType: 'image',
                    fileSize: file.size,
                    pageCount: 1,
                    imageQuality: this.estimateImageQuality(file),
                    ocrPotential: this.estimateOCRPotential(file)
                };
            }
        } catch (error) {
            console.warn('File analysis failed, using default values:', error);
            return {
                fileType: file.type.startsWith('image/') ? 'image' : 'pdf',
                fileSize: file.size,
                pageCount: 1,
                imageQuality: 'medium',
                ocrPotential: 'medium'
            };
        }
    }

    /**
     * Estimate image quality for OCR
     */
    estimateImageQuality(file) {
        if (file.size > 5 * 1024 * 1024) return 'high';
        if (file.size > 1 * 1024 * 1024) return 'medium';
        return 'low';
    }

    /**
     * Estimate OCR potential
     */
    estimateOCRPotential(file) {
        if (file.type === 'image/tiff') return 'high';
        if (file.type === 'image/png') return 'high';
        if (file.type === 'image/jpeg') return 'medium';
        if (file.type === 'image/bmp') return 'low';
        return 'medium';
    }

    /**
     * Prepare OCR options based on analysis
     */
    prepareOCROptions(userOptions, analysis) {
        const defaultOptions = {
            language: 'en',
            quality: 'balanced',
            outputFormat: 'searchable_pdf',
            confidenceThreshold: 0.7,
            preserveLayout: true,
            extractTables: true,
            extractImages: false
        };

        const options = { ...defaultOptions, ...userOptions };

        // Auto-adjust quality based on file analysis
        if (analysis.imageQuality === 'low' && options.quality === 'fast') {
            options.quality = 'balanced';
        }

        // Auto-adjust language detection if not specified
        if (!userOptions.language || userOptions.language === 'auto') {
            options.language = this.detectLanguage(analysis);
        }

        return options;
    }

    /**
     * Detect language from file analysis
     */
    detectLanguage(analysis) {
        // Simplified language detection - in real app would be more sophisticated
        return 'en'; // Default to English
    }

    /**
     * Execute OCR processing
     */
    async executeOCR(file, options) {
        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('options', JSON.stringify(options));
            
            // Send OCR request with progress tracking
            const response = await this.apiClient.post('/ocr/process', formData, {
                responseType: 'blob',
                onProgress: (progress) => {
                    this.emitProgress(40 + (progress * 0.4), `Processing OCR... ${Math.round(progress)}%`);
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OCR processing failed: ${errorText}`);
            }
            
            // Process response based on output format
            const result = await this.processOCRResponse(response, file, options);
            
            return result;
        } catch (error) {
            console.error('OCR execution failed:', error);
            throw error;
        }
    }

    /**
     * Process OCR response based on output format
     */
    async processOCRResponse(response, originalFile, options) {
        const blob = await response.blob();
        
        switch (options.outputFormat) {
            case 'searchable_pdf':
                return this.processSearchablePDF(blob, originalFile);
            
            case 'text':
                return this.processTextOutput(blob, originalFile);
            
            case 'json':
                return this.processJSONOutput(blob, originalFile);
            
            default:
                return this.processSearchablePDF(blob, originalFile);
        }
    }

    /**
     * Process searchable PDF output
     */
    processSearchablePDF(blob, originalFile) {
        const fileName = originalFile.name.replace(/\.[^/.]+$/, '_ocr.pdf');
        const file = new File([blob], fileName, { type: 'application/pdf' });
        
        return {
            success: true,
            outputFile: file,
            outputFormat: 'searchable_pdf',
            originalSize: originalFile.size,
            outputSize: blob.size,
            downloadUrl: URL.createObjectURL(blob),
            textContent: null
        };
    }

    /**
     * Process text output
     */
    async processTextOutput(blob, originalFile) {
        const text = await blob.text();
        const fileName = originalFile.name.replace(/\.[^/.]+$/, '_ocr.txt');
        const file = new File([text], fileName, { type: 'text/plain' });
        
        return {
            success: true,
            outputFile: file,
            outputFormat: 'text',
            originalSize: originalFile.size,
            outputSize: text.length,
            downloadUrl: URL.createObjectURL(file),
            textContent: text
        };
    }

    /**
     * Process JSON output
     */
    async processJSONOutput(blob, originalFile) {
        const jsonText = await blob.text();
        const jsonData = JSON.parse(jsonText);
        const fileName = originalFile.name.replace(/\.[^/.]+$/, '_ocr.json');
        const file = new File([jsonText], fileName, { type: 'application/json' });
        
        return {
            success: true,
            outputFile: file,
            outputFormat: 'json',
            originalSize: originalFile.size,
            outputSize: jsonText.length,
            downloadUrl: URL.createObjectURL(file),
            textContent: jsonData.text || jsonText,
            structuredData: jsonData
        };
    }

    /**
     * Add OCR to history
     */
    addToHistory(ocrData) {
        const historyEntry = {
            id: Date.now(),
            timestamp: new Date(),
            fileName: ocrData.fileName,
            originalSize: ocrData.originalSize,
            options: ocrData.options,
            result: ocrData.result,
            analysis: ocrData.analysis
        };
        
        this.ocrHistory.set(historyEntry.id, historyEntry);
        
        // Keep only last 50 entries
        if (this.ocrHistory.size > 50) {
            const firstKey = this.ocrHistory.keys().next().value;
            this.ocrHistory.delete(firstKey);
        }
        
        return historyEntry;
    }

    /**
     * Get OCR history
     */
    getOCRHistory() {
        return Array.from(this.ocrHistory.values());
    }

    /**
     * Clear OCR history
     */
    clearHistory() {
        this.ocrHistory.clear();
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    /**
     * Get OCR quality levels
     */
    getOCRQualityLevels() {
        return [...this.ocrQualityLevels];
    }

    /**
     * Get output formats
     */
    getOutputFormats() {
        return [...this.outputFormats];
    }
}