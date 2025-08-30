/**
 * AI Service
 * Handles AI-powered features like summarization and translation
 */

import { StandardService } from './standard-service.js';
import { APIClient } from './api-client.js';
import { PDFAnalyzer } from './pdf-analyzer.js';

export class AIService extends StandardService {
    constructor() {
        super();
        this.apiClient = new APIClient();
        this.pdfAnalyzer = new PDFAnalyzer();
        this.aiHistory = new Map();
        this.supportedLanguages = [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'
        ];
        this.summaryStyles = ['concise', 'detailed', 'academic', 'casual', 'professional'];
        this.translationProviders = ['openai', 'deepl', 'google', 'azure'];
    }

    async init() {
        try {
            await super.init();
            this.emitStatusChange('initialized');
        } catch (error) {
        }}

    /**
     * Summarize PDF content using AI
     * @param {File} file - PDF file to summarize
     * @param {Object} options - Summarization options
     * @returns {Promise<Object>} Summary result
     */
    async summarizePDF(file, options = {}) {
        try {
            // Validate input
            this.validateSummarizationRequest(file);
            
            // Analyze PDF for summarization optimization
            const analysis = await this.pdfAnalyzer.analyze(file);
            
            // Prepare summarization options
            const summaryOptions = this.prepareSummaryOptions(options, analysis);
            
            // Extract text content
            const textContent = await this.extractTextContent(file);
            
            // Perform AI summarization
            const result = await this.performAISummarization(textContent, summaryOptions);
            
            // Add to history
            const historyEntry = this.addToHistory({
                type: 'summarization',
                fileName: file.name,
                originalSize: file.size,
                options: summaryOptions,
                result: result,
                analysis: analysis
            });
            
            return {
                ...result,
                historyId: historyEntry.id,
                analysis: analysis
            };
        } catch (error) {
            console.error('PDF summarization failed:', error);
            throw new Error(`PDF summarization failed: ${error.message}`);
        }
    }

    /**
     * Translate PDF content using AI
     * @param {File} file - PDF file to translate
     * @param {string} targetLanguage - Target language code
     * @param {Object} options - Translation options
     * @returns {Promise<Object>} Translation result
     */
    async translatePDF(file, targetLanguage, options = {}) {
        try {
            // Validate input
            this.validateTranslationRequest(file, targetLanguage);
            
            // Analyze PDF for translation optimization
            const analysis = await this.pdfAnalyzer.analyze(file);
            
            // Prepare translation options
            const translationOptions = this.prepareTranslationOptions(targetLanguage, options, analysis);
            
            // Extract text content
            const textContent = await this.extractTextContent(file);
            
            // Perform AI translation
            const result = await this.performAITranslation(textContent, translationOptions);
            
            // Add to history
            const historyEntry = this.addToHistory({
                type: 'translation',
                fileName: file.name,
                originalSize: file.size,
                targetLanguage: targetLanguage,
                options: translationOptions,
                result: result,
                analysis: analysis
            });
            
            return {
                ...result,
                historyId: historyEntry.id,
                analysis: analysis
            };
        } catch (error) {
            console.error('PDF translation failed:', error);
            throw new Error(`PDF translation failed: ${error.message}`);
        }
    }

    /**
     * Validate summarization request
     */
    validateSummarizationRequest(file) {
        if (!file || file.type !== 'application/pdf') {
            throw new Error('Invalid file: must be a PDF');
        }
        
        if (file.size > 25 * 1024 * 1024) { // 25MB limit for AI processing
            throw new Error('File too large for AI processing (max 25MB)');
        }
    }

    /**
     * Validate translation request
     */
    validateTranslationRequest(file, targetLanguage) {
        if (!file || file.type !== 'application/pdf') {
            throw new Error('Invalid file: must be a PDF');
        }
        
        if (!this.supportedLanguages.includes(targetLanguage)) {
            throw new Error(`Unsupported language: ${targetLanguage}. Supported languages: ${this.supportedLanguages.join(', ')}`);
        }
        
        if (file.size > 25 * 1024 * 1024) { // 25MB limit for AI processing
            throw new Error('File too large for AI processing (max 25MB)');
        }
    }

    /**
     * Extract text content from PDF
     */
    async extractTextContent(file) {
        try {
            // For now, we'll use a simple text extraction
            // In a real implementation, you'd use pdf.js or similar
            const formData = new FormData();
            formData.append('file', file);
            formData.append('extract_text', 'true');
            
            const response = await this.apiClient.post('/extract/text', formData);
            
            if (!response.ok) {
                throw new Error('Failed to extract text from PDF');
            }
            
            const result = await response.json();
            return result.text || '';
        } catch (error) {
            console.error('Text extraction failed:', error);
            throw new Error('Failed to extract text content from PDF');
        }
    }

    /**
     * Prepare summarization options
     */
    prepareSummaryOptions(userOptions, analysis) {
        const defaultOptions = {
            style: 'concise',
            maxLength: 'medium',
            includeKeyPoints: true,
            includeQuotes: false,
            focusAreas: [],
            language: 'en'
        };

        // Merge with user options
        const options = { ...defaultOptions, ...userOptions };

        // Auto-adjust based on document analysis
        if (analysis.pageCount > 20 && options.maxLength === 'short') {
            options.maxLength = 'medium'; // Longer documents need more detailed summaries
        }

        if (analysis.documentType === 'academic' && options.style === 'casual') {
            options.style = 'academic'; // Academic documents should use academic style
        }

        return options;
    }

    /**
     * Prepare translation options
     */
    prepareTranslationOptions(targetLanguage, userOptions, analysis) {
        const defaultOptions = {
            provider: 'openai',
            preserveFormatting: true,
            translateTables: true,
            translateImages: false,
            quality: 'high',
            preserveContext: true
        };

        // Merge with user options
        const options = { ...defaultOptions, ...userOptions };

        // Auto-adjust based on document analysis
        if (analysis.documentType === 'technical' && options.quality === 'fast') {
            options.quality = 'high'; // Technical documents need high-quality translation
        }

        return options;
    }

    /**
     * Perform AI summarization
     */
    async performAISummarization(textContent, options) {
        try {
            const requestData = {
                text: textContent,
                style: options.style,
                max_length: options.maxLength,
                include_key_points: options.includeKeyPoints,
                include_quotes: options.includeQuotes,
                focus_areas: options.focusAreas,
                language: options.language
            };

            const response = await this.apiClient.post('/ai/summarize', requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI summarization failed: ${errorText}`);
            }

            const result = await response.json();

            return {
                success: true,
                summary: result.summary,
                keyPoints: result.key_points || [],
                wordCount: result.word_count || 0,
                readingTime: result.reading_time || 0,
                style: options.style,
                options: options
            };
        } catch (error) {
            console.error('AI summarization request failed:', error);
            throw error;
        }
    }

    /**
     * Perform AI translation
     */
    async performAITranslation(textContent, options) {
        try {
            const requestData = {
                text: textContent,
                target_language: options.targetLanguage,
                provider: options.provider,
                preserve_formatting: options.preserveFormatting,
                translate_tables: options.translateTables,
                translate_images: options.translateImages,
                quality: options.quality,
                preserve_context: options.preserveContext
            };

            const response = await this.apiClient.post('/ai/translate', requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI translation failed: ${errorText}`);
            }

            const result = await response.json();

            return {
                success: true,
                translatedText: result.translated_text,
                originalLanguage: result.original_language || 'auto',
                targetLanguage: options.targetLanguage,
                wordCount: result.word_count || 0,
                confidence: result.confidence || 0,
                provider: options.provider,
                options: options
            };
        } catch (error) {
            console.error('AI translation request failed:', error);
            throw error;
        }
    }

    /**
     * Batch AI processing
     */
    async batchAIProcessing(files, operation, options = {}) {
        try {
            const batchResults = [];
            const batchId = this.generateBatchId();

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                try {
                    let result;
                    if (operation === 'summarize') {
                        result = await this.summarizePDF(file, options);
                    } else if (operation === 'translate') {
                        const targetLanguage = options.targetLanguage || 'en';
                        result = await this.translatePDF(file, targetLanguage, options);
                    } else {
                        throw new Error(`Unsupported operation: ${operation}`);
                    }

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
                operation: operation,
                totalFiles: files.length,
                successfulFiles: batchResults.filter(r => r.success).length,
                failedFiles: batchResults.filter(r => !r.success).length,
                results: batchResults
            };
        } catch (error) {
            console.error('Batch AI processing failed:', error);
            throw new Error('Batch AI processing failed');
        }
    }

    /**
     * Get AI processing preview/estimate
     */
    async getAIProcessingPreview(file, operation, options = {}) {
        try {
            const analysis = await this.pdfAnalyzer.analyze(file);
            
            let preview;
            if (operation === 'summarize') {
                preview = this.getSummarizationPreview(analysis, options);
            } else if (operation === 'translate') {
                preview = this.getTranslationPreview(analysis, options);
            } else {
                throw new Error(`Unsupported operation: ${operation}`);
            }

            return {
                operation: operation,
                originalSize: file.size,
                analysis: analysis,
                ...preview
            };
        } catch (error) {
            console.error('AI processing preview failed:', error);
            throw new Error('Failed to generate AI processing preview');
        }
    }

    /**
     * Get summarization preview
     */
    getSummarizationPreview(analysis, options) {
        const estimatedWords = Math.round(analysis.pageCount * 300); // Rough estimate: 300 words per page
        const estimatedSummaryWords = this.estimateSummaryLength(estimatedWords, options.maxLength);
        const estimatedTime = this.estimateProcessingTime(analysis, 'summarization');

        return {
            estimatedWords: estimatedWords,
            estimatedSummaryWords: estimatedSummaryWords,
            estimatedTime: estimatedTime,
            recommendations: this.getSummarizationRecommendations(analysis, options)
        };
    }

    /**
     * Get translation preview
     */
    getTranslationPreview(analysis, options) {
        const estimatedWords = Math.round(analysis.pageCount * 300);
        const estimatedTime = this.estimateProcessingTime(analysis, 'translation');
        const estimatedCost = this.estimateTranslationCost(estimatedWords, options);

        return {
            estimatedWords: estimatedWords,
            estimatedTime: estimatedTime,
            estimatedCost: estimatedCost,
            recommendations: this.getTranslationRecommendations(analysis, options)
        };
    }

    /**
     * Estimate summary length
     */
    estimateSummaryLength(originalWords, maxLength) {
        const lengthRatios = {
            'short': 0.1,
            'medium': 0.2,
            'long': 0.4
        };
        
        return Math.round(originalWords * (lengthRatios[maxLength] || 0.2));
    }

    /**
     * Estimate processing time
     */
    estimateProcessingTime(analysis, operation) {
        const baseTime = operation === 'summarization' ? 10 : 15; // Base seconds
        const timePerPage = operation === 'summarization' ? 2 : 3; // Seconds per page
        
        return Math.round(baseTime + (analysis.pageCount * timePerPage));
    }

    /**
     * Estimate translation cost
     */
    estimateTranslationCost(wordCount, options) {
        // Simplified cost estimation
        const baseCostPerWord = 0.0001; // $0.0001 per word
        let multiplier = 1;

        if (options.quality === 'high') multiplier = 1.5;
        if (options.provider === 'deepl') multiplier = 1.2;

        return Math.round((wordCount * baseCostPerWord * multiplier) * 100) / 100;
    }

    /**
     * Get summarization recommendations
     */
    getSummarizationRecommendations(analysis, options) {
        const recommendations = [];

        if (analysis.pageCount > 50) {
            recommendations.push('Large document detected. Consider using "detailed" style for comprehensive summary.');
        }

        if (analysis.documentType === 'technical') {
            recommendations.push('Technical document detected. "Academic" style may provide better technical accuracy.');
        }

        if (analysis.documentType === 'image_heavy') {
            recommendations.push('Image-heavy document detected. Summary will focus on text content only.');
        }

        return recommendations;
    }

    /**
     * Get translation recommendations
     */
    getTranslationRecommendations(analysis, options) {
        const recommendations = [];

        if (analysis.pageCount > 30) {
            recommendations.push('Large document detected. Consider using "high" quality setting for better accuracy.');
        }

        if (options.targetLanguage === 'ja' || options.targetLanguage === 'ko' || options.targetLanguage === 'zh') {
            recommendations.push('Asian language detected. Consider using specialized translation provider for better results.');
        }

        if (analysis.documentType === 'legal' || analysis.documentType === 'medical') {
            recommendations.push('Specialized document detected. Ensure translation provider supports domain-specific terminology.');
        }

        return recommendations;
    }

    /**
     * Generate batch ID
     */
    generateBatchId() {
        return `ai_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add AI processing to history
     */
    addToHistory(aiData) {
        const historyEntry = {
            id: Date.now(),
            timestamp: new Date(),
            type: aiData.type,
            fileName: aiData.fileName,
            originalSize: aiData.originalSize,
            targetLanguage: aiData.targetLanguage,
            options: aiData.options,
            result: aiData.result,
            analysis: aiData.analysis
        };

        this.aiHistory.set(historyEntry.id, historyEntry);

        // Keep only last 50 entries
        if (this.aiHistory.size > 50) {
            const firstKey = this.aiHistory.keys().next().value;
            this.aiHistory.delete(firstKey);
        }

        return historyEntry;
    }

    /**
     * Get AI processing history
     */
    getAIHistory() {
        return Array.from(this.aiHistory.values());
    }

    /**
     * Clear AI processing history
     */
    clearHistory() {
        this.aiHistory.clear();
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    /**
     * Get summary styles
     */
    getSummaryStyles() {
        return [...this.summaryStyles];
    }

    /**
     * Get translation providers
     */
    getTranslationProviders() {
        return [...this.translationProviders];
    }
}
