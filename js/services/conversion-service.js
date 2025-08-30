/**
 * PDF Conversion Service (Refactored)
 * Handles conversion of PDFs to Word, Excel, and other formats
 */

import { StandardService } from './standard-service.js';
import { APIClient } from './api-client.js';
import { PDFAnalyzer } from './pdf-analyzer.js';

export class ConversionService extends StandardService {
    constructor() {
        super();
        this.apiClient = new APIClient();
        this.pdfAnalyzer = new PDFAnalyzer();
        this.conversionHistory = new Map();
        this.supportedFormats = ['docx', 'xlsx', 'txt', 'html'];
    }

    async init() {
        // Initialize dependencies
        await this.apiClient.init?.();
        await this.pdfAnalyzer.init?.();
        
        // Call parent init
        await super.init();
    }

    /**
     * Convert PDF to specified format
     * @param {File} file - PDF file to convert
     * @param {string} targetFormat - Target format (docx, xlsx, txt, html)
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} Conversion result
     */
    async convertPDF(file, targetFormat, options = {}) {
        try {
            this.isProcessing = true;
            this.emitProgress(0, 'Starting conversion...');
            
            // Validate input
            this.validateConversionRequest(file, targetFormat);
            
            // Analyze PDF for conversion optimization
            this.emitProgress(20, 'Analyzing PDF structure...');
            const analysis = await this.pdfAnalyzer.analyze(file);
            
            // Prepare conversion options
            const conversionOptions = this.prepareConversionOptions(targetFormat, options, analysis);
            
            // Start conversion
            this.emitProgress(50, 'Converting PDF...');
            const result = await this.performConversion(file, targetFormat, conversionOptions);
            
            this.emitProgress(100, 'Conversion complete');
            
            // Add to history
            const historyEntry = this.addToHistory({
                fileName: file.name,
                originalSize: file.size,
                targetFormat: targetFormat,
                options: conversionOptions,
                result: result,
                analysis: analysis
            });
            
            const finalResult = {
                ...result,
                historyId: historyEntry.id,
                analysis: analysis
            };
            
            // Emit completion event
            this.emitComplete(finalResult, `File converted to ${targetFormat} successfully`);
            
            return finalResult;
            
        } catch (error) {
            this.emitError(error, { operation: 'convertPDF', fileName: file.name, targetFormat });
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Validate conversion request
     */
    validateConversionRequest(file, targetFormat) {
        if (!file || file.type !== 'application/pdf') {
            throw new Error('Invalid file: must be a PDF');
        }
        
        if (!this.supportedFormats.includes(targetFormat)) {
            throw new Error(`Unsupported format: ${targetFormat}. Supported formats: ${this.supportedFormats.join(', ')}`);
        }
        
        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            throw new Error('File too large for conversion (max 100MB)');
        }
    }

    /**
     * Prepare conversion options based on format and analysis
     */
    prepareConversionOptions(targetFormat, userOptions, analysis) {
        const defaultOptions = {
            preserveLayout: true,
            extractTables: true,
            extractImages: true,
            language: 'en',
            quality: 'high'
        };

        // Format-specific options
        switch (targetFormat) {
            case 'docx':
                return {
                    ...defaultOptions,
                    preserveFormatting: userOptions.preserveFormatting ?? true,
                    includeHeaders: userOptions.includeHeaders ?? true,
                    includeFooters: userOptions.includeFooters ?? true,
                    tableDetection: userOptions.tableDetection ?? 'auto'
                };
            
            case 'xlsx':
                return {
                    ...defaultOptions,
                    sheetPerPage: userOptions.sheetPerPage ?? false,
                    mergeTables: userOptions.mergeTables ?? true,
                    preserveCellFormatting: userOptions.preserveCellFormatting ?? true
                };
            
            case 'txt':
                return {
                    ...defaultOptions,
                    preserveParagraphs: userOptions.preserveParagraphs ?? true,
                    removeExtraSpaces: userOptions.removeExtraSpaces ?? true,
                    encoding: userOptions.encoding ?? 'utf-8'
                };
            
            case 'html':
                return {
                    ...defaultOptions,
                    includeCSS: userOptions.includeCSS ?? true,
                    responsiveLayout: userOptions.responsiveLayout ?? true,
                    embedImages: userOptions.embedImages ?? false
                };
            
            default:
                return { ...defaultOptions, ...userOptions };
        }
    }

    /**
     * Perform the actual conversion
     */
    async performConversion(file, targetFormat, options) {
        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('target_format', targetFormat);
            formData.append('options', JSON.stringify(options));
            console.log("Will now attempt file conversion with this options: ", options);
            // Send conversion request
            const response = await this.apiClient.post(`/convert/pdf-to-${targetFormat}`, formData, {
                responseType: 'blob',
                onProgress: (progress) => {
                    // Emit progress event
                    this.emitProgress(progress);
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Conversion failed: ${errorText}`);
            }
            
            // Create converted file
            const convertedBlob = await response.blob();
            const convertedFile = new File([convertedBlob], 
                file.name.replace('.pdf', `.${targetFormat}`), 
                { type: this.getMimeType(targetFormat) }
            );
            
            return {
                success: true,
                convertedFile: convertedFile,
                originalSize: file.size,
                convertedSize: convertedBlob.size,
                targetFormat: targetFormat,
                options: options,
                downloadUrl: URL.createObjectURL(convertedBlob)
            };
        } catch (error) {
            console.error('Conversion request failed:', error);
            throw error;
        }
    }

    /**
     * Get MIME type for target format
     */
    getMimeType(format) {
        const mimeTypes = {
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'txt': 'text/plain',
            'html': 'text/html'
        };
        return mimeTypes[format] || 'application/octet-stream';
    }

    /**
     * Batch convert multiple PDFs
     */
    async batchConvert(files, targetFormat, options = {}) {
        try {
            const batchResults = [];
            const batchId = this.generateBatchId();
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                try {
                    const result = await this.convertPDF(file, targetFormat, options);
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
                targetFormat: targetFormat,
                totalFiles: files.length,
                successfulFiles: batchResults.filter(r => r.success).length,
                failedFiles: batchResults.filter(r => !r.success).length,
                results: batchResults
            };
        } catch (error) {
            console.error('Batch conversion failed:', error);
            throw new Error('Batch conversion failed');
        }
    }

    /**
     * Get conversion preview/estimate
     */
    async getConversionPreview(file, targetFormat, options = {}) {
        try {
            const analysis = await this.pdfAnalyzer.analyze(file);
            const conversionOptions = this.prepareConversionOptions(targetFormat, options, analysis);
            
            // Estimate conversion complexity and time
            const complexity = this.estimateConversionComplexity(analysis, targetFormat);
            const estimatedTime = this.estimateConversionTime(analysis, complexity);
            const estimatedSize = this.estimateConvertedSize(analysis, targetFormat);
            
            return {
                originalSize: file.size,
                estimatedSize: estimatedSize,
                estimatedTime: estimatedTime,
                complexity: complexity,
                targetFormat: targetFormat,
                options: conversionOptions,
                analysis: analysis,
                recommendations: this.getConversionRecommendations(analysis, targetFormat)
            };
        } catch (error) {
            console.error('Conversion preview failed:', error);
            throw new Error('Failed to generate conversion preview');
        }
    }

    /**
     * Estimate conversion complexity
     */
    estimateConversionComplexity(analysis, targetFormat) {
        let complexity = 1; // Base complexity
        
        // Adjust based on page count
        if (analysis.pageCount > 50) complexity += 2;
        else if (analysis.pageCount > 20) complexity += 1;
        
        // Adjust based on document type
        switch (analysis.documentType) {
            case 'image_heavy':
                complexity += 2;
                break;
            case 'table_heavy':
                if (targetFormat === 'xlsx') complexity += 1;
                else complexity += 2;
                break;
            case 'text_heavy':
                complexity += 0.5;
                break;
        }
        
        // Adjust based on target format
        switch (targetFormat) {
            case 'docx':
                complexity += 1;
                break;
            case 'xlsx':
                complexity += 1.5;
                break;
            case 'html':
                complexity += 0.5;
                break;
        }
        
        return Math.min(5, Math.max(1, Math.round(complexity)));
    }

    /**
     * Estimate conversion time
     */
    estimateConversionTime(analysis, complexity) {
        const baseTime = 5; // Base 5 seconds
        const timePerPage = 0.5; // 0.5 seconds per page
        const complexityMultiplier = [1, 1.2, 1.5, 2, 3]; // Time multipliers for complexity levels
        
        const estimatedTime = baseTime + (analysis.pageCount * timePerPage) * complexityMultiplier[complexity - 1];
        return Math.round(estimatedTime);
    }

    /**
     * Estimate converted file size
     */
    estimateConvertedSize(analysis, targetFormat) {
        let sizeRatio = 1;
        
        switch (targetFormat) {
            case 'docx':
                sizeRatio = 0.8; // Word files are typically smaller
                break;
            case 'xlsx':
                sizeRatio = 0.6; // Excel files are much smaller
                break;
            case 'txt':
                sizeRatio = 0.1; // Text files are very small
                break;
            case 'html':
                sizeRatio = 0.9; // HTML files are similar size
                break;
        }
        
        return Math.round(analysis.fileSize * sizeRatio);
    }

    /**
     * Get conversion recommendations
     */
    getConversionRecommendations(analysis, targetFormat) {
        const recommendations = [];
        
        if (analysis.pageCount > 100) {
            recommendations.push('Large document detected. Consider splitting into smaller files for better performance.');
        }
        
        if (analysis.documentType === 'image_heavy' && targetFormat === 'xlsx') {
            recommendations.push('Image-heavy document may not convert well to Excel. Consider Word format instead.');
        }
        
        if (analysis.documentType === 'table_heavy' && targetFormat === 'docx') {
            recommendations.push('Table-heavy document detected. Excel format may preserve table structure better.');
        }
        
        return recommendations;
    }

    /**
     * Emit progress event
     */
    emitProgress(progress) {
        const event = new CustomEvent('conversionProgress', {
            detail: { progress }
        });
        window.dispatchEvent(event);
    }

    /**
     * Generate batch ID
     */
    generateBatchId() {
        return `convert_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add conversion to history
     */
    addToHistory(conversionData) {
        const historyEntry = {
            id: Date.now(),
            timestamp: new Date(),
            fileName: conversionData.fileName,
            originalSize: conversionData.originalSize,
            targetFormat: conversionData.targetFormat,
            options: conversionData.options,
            result: conversionData.result,
            analysis: conversionData.analysis
        };
        
        this.conversionHistory.set(historyEntry.id, historyEntry);
        
        // Keep only last 50 entries
        if (this.conversionHistory.size > 50) {
            const firstKey = this.conversionHistory.keys().next().value;
            this.conversionHistory.delete(firstKey);
        }
        
        return historyEntry;
    }

    /**
     * Get conversion history
     */
    getConversionHistory() {
        return Array.from(this.conversionHistory.values());
    }

    /**
     * Clear conversion history
     */
    clearHistory() {
        this.conversionHistory.clear();
    }

    /**
     * Get supported formats
     */
    getSupportedFormats() {
        return [...this.supportedFormats];
    }
}
