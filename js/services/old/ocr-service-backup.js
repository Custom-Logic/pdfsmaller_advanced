/**
 * OCR Service
 * Handles Optical Character Recognition for scanned PDFs and images
 */

import { APIClient } from './api-client.js';
import { PDFAnalyzer } from './pdf-analyzer.js';

export class OCRService {
    constructor() {
        this.apiClient = new APIClient();
        this.pdfAnalyzer = new PDFAnalyzer();
        this.ocrHistory = new Map();
        this.supportedLanguages = [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
        ];
        this.ocrQualityLevels = ['fast', 'balanced', 'accurate'];
    }

    /**
     * Perform OCR on a PDF or image file
     * @param {File} file - PDF or image file to process
     * @param {Object} options - OCR options
     * @returns {Promise<Object>} OCR result
     */
    async performOCR(file, options = {}) {
        try {
            // Validate input
            this.validateOCRRequest(file);
            
            // Analyze file for OCR optimization
            const analysis = await this.analyzeFileForOCR(file);
            
            // Prepare OCR options
            const ocrOptions = this.prepareOCROptions(options, analysis);
            
            // Perform OCR
            const result = await this.executeOCR(file, ocrOptions);
            
            // Add to history
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
        // This is a simplified estimation - in a real app, you'd analyze the actual image
        if (file.size > 5 * 1024 * 1024) return 'high';
        if (file.size > 1 * 1024 * 1024) return 'medium';
        return 'low';
    }

    /**
     * Estimate OCR potential
     */
    estimateOCRPotential(file) {
        // Simplified estimation based on file size and type
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

        // Merge with user options
        const options = { ...defaultOptions, ...userOptions };

        // Auto-adjust quality based on file analysis
        if (analysis.imageQuality === 'low' && options.quality === 'fast') {
            options.quality = 'balanced'; // Better quality for low-quality images
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
        // This is a simplified language detection
        // In a real app, you'd use more sophisticated language detection
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
            
            // Send OCR request
            const response = await this.apiClient.post('/ocr/process', formData, {
                responseType: 'blob',
                onProgress: (progress) => {
                    this.emitProgress(progress);
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
            textContent: null // Text content not extracted for PDF output
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
     * Batch OCR processing
     */
    async batchOCR(files, options = {}) {
        try {
            const batchResults = [];
            const batchId = this.generateBatchId();
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                try {
                    const result = await this.performOCR(file, options);
                    batchResults.push({
                        fileIndex: i,
                        fileName: file.name,
                        success: true,
                        result: result
                    });
                } catch (error) {
                    batchResults.push({
                        fileIndex: i,
                        fileName: file.name,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            return {
                batchId: batchId,
                totalFiles: files.length,
                successfulFiles: batchResults.filter(r => r.success).length,
                failedFiles: batchResults.filter(r => !r.success).length,
                results: batchResults
            };
        } catch (error) {
            console.error('Batch OCR failed:', error);
            throw new Error('Batch OCR processing failed');
        }
    }

    /**
     * Get OCR preview/estimate
     */
    async getOCRPreview(file, options = {}) {
        try {
            const analysis = await this.analyzeFileForOCR(file);
            const ocrOptions = this.prepareOCROptions(options, analysis);
            
            // Estimate OCR complexity and time
            const complexity = this.estimateOCRComplexity(analysis, ocrOptions);
            const estimatedTime = this.estimateOCRTime(analysis, complexity);
            const estimatedAccuracy = this.estimateOCRAccuracy(analysis, ocrOptions);
            
            return {
                originalSize: file.size,
                estimatedTime: estimatedTime,
                complexity: complexity,
                estimatedAccuracy: estimatedAccuracy,
                options: ocrOptions,
                analysis: analysis,
                recommendations: this.getOCRRecommendations(analysis, ocrOptions)
            };
        } catch (error) {
            console.error('OCR preview failed:', error);
            throw new Error('Failed to generate OCR preview');
        }
    }

    /**
     * Estimate OCR complexity
     */
    estimateOCRComplexity(analysis, options) {
        let complexity = 1; // Base complexity
        
        // Adjust based on file type
        if (analysis.fileType === 'image') {
            if (analysis.imageQuality === 'low') complexity += 2;
            else if (analysis.imageQuality === 'medium') complexity += 1;
        } else {
            // PDF complexity
            if (analysis.pageCount > 20) complexity += 2;
            else if (analysis.pageCount > 10) complexity += 1;
        }
        
        // Adjust based on quality setting
        switch (options.quality) {
            case 'fast':
                complexity -= 0.5;
                break;
            case 'accurate':
                complexity += 1;
                break;
        }
        
        // Adjust based on language
        if (options.language !== 'en') complexity += 0.5;
        
        return Math.min(5, Math.max(1, Math.round(complexity)));
    }

    /**
     * Estimate OCR processing time
     */
    estimateOCRTime(analysis, complexity) {
        const baseTime = 3; // Base 3 seconds
        const timePerPage = 2; // 2 seconds per page
        const complexityMultiplier = [1, 1.3, 1.6, 2, 3]; // Time multipliers for complexity levels
        
        let estimatedTime;
        if (analysis.fileType === 'image') {
            estimatedTime = baseTime * complexityMultiplier[complexity - 1];
        } else {
            estimatedTime = baseTime + (analysis.pageCount * timePerPage) * complexityMultiplier[complexity - 1];
        }
        
        return Math.round(estimatedTime);
    }

    /**
     * Estimate OCR accuracy
     */
    estimateOCRAccuracy(analysis, options) {
        let accuracy = 0.8; // Base accuracy
        
        // Adjust based on image quality
        if (analysis.imageQuality === 'high') accuracy += 0.1;
        else if (analysis.imageQuality === 'low') accuracy -= 0.2;
        
        // Adjust based on quality setting
        switch (options.quality) {
            case 'fast':
                accuracy -= 0.1;
                break;
            case 'accurate':
                accuracy += 0.1;
                break;
        }
        
        // Adjust based on file type
        if (analysis.fileType === 'image') {
            if (analysis.ocrPotential === 'high') accuracy += 0.05;
            else if (analysis.ocrPotential === 'low') accuracy -= 0.1;
        }
        
        return Math.min(0.95, Math.max(0.5, accuracy));
    }

    /**
     * Get OCR recommendations
     */
    getOCRRecommendations(analysis, options) {
        const recommendations = [];
        
        if (analysis.imageQuality === 'low') {
            recommendations.push('Low image quality detected. Consider using "accurate" quality setting for better results.');
        }
        
        if (analysis.fileType === 'image' && analysis.ocrPotential === 'low') {
            recommendations.push('Image format may not be optimal for OCR. Consider converting to PNG or TIFF for better results.');
        }
        
        if (options.quality === 'fast' && analysis.fileType === 'pdf' && analysis.pageCount > 10) {
            recommendations.push('Large PDF detected. Consider using "balanced" quality for better accuracy.');
        }
        
        return recommendations;
    }

    /**
     * Emit progress event
     */
    emitProgress(progress) {
        const event = new CustomEvent('ocrProgress', {
            detail: { progress }
        });
        window.dispatchEvent(event);
    }

    /**
     * Generate batch ID
     */
    generateBatchId() {
        return `ocr_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        return ['searchable_pdf', 'text', 'json'];
    }
}