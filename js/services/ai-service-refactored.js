/**
 * AI Service (Refactored)
 * Handles AI-powered features like summarization and translation
 * Follows the new event-driven, service-centric architecture
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
            this.emitError(error, { operation: 'initialization' });
            throw error;
        }
    }

    /**
     * Primary API: Process file with AI (summarization or translation)
     * @param {string} fileId - File ID from storage service
     * @param {Object} aiOptions - AI processing options
     * @returns {Promise<Object>} Processing result
     */
    async processWithAI(fileId, aiOptions = {}) {
        try {
            this.isProcessing = true;
            this.emitStatusChange('processing', { fileId, operation: aiOptions.operation });
            this.emitProgress(0, 'Starting AI processing...');

            // Validate options
            this.validateAIOptions(aiOptions);

            // Get file from storage (via event to MainController)
            const file = await this.requestFile(fileId);
            
            let result;
            switch (aiOptions.operation) {
                case 'summarize':
                    result = await this.summarizePDF(file, aiOptions);
                    break;
                case 'translate':
                    result = await this.translatePDF(file, aiOptions.targetLanguage, aiOptions);
                    break;
                default:
                    throw new Error(`Unsupported AI operation: ${aiOptions.operation}`);
            }

            this.emitProgress(100, 'AI processing completed');
            this.emitComplete(result, `${aiOptions.operation} completed successfully`);
            
            return result;
        } catch (error) {
            this.emitError(error, { fileId, operation: aiOptions.operation });
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Validate AI processing options
     */
    validateAIOptions(options) {
        if (!options.operation) {
            throw new Error('AI operation is required (summarize or translate)');
        }

        if (!['summarize', 'translate'].includes(options.operation)) {
            throw new Error(`Unsupported operation: ${options.operation}`);
        }

        if (options.operation === 'translate' && !options.targetLanguage) {
            throw new Error('Target language is required for translation');
        }

        if (options.targetLanguage && !this.supportedLanguages.includes(options.targetLanguage)) {
            throw new Error(`Unsupported language: ${options.targetLanguage}`);
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
     * Summarize PDF content using AI
     */
    async summarizePDF(file, options = {}) {
        try {
            this.emitProgress(10, 'Validating file for summarization...');
            this.validateSummarizationRequest(file);
            
            this.emitProgress(20, 'Analyzing PDF structure...');
            const analysis = await this.pdfAnalyzer.analyze(file);
            
            this.emitProgress(30, 'Preparing summarization options...');
            const summaryOptions = this.prepareSummaryOptions(options, analysis);
            
            this.emitProgress(40, 'Extracting text content...');
            const textContent = await this.extractTextContent(file);
            
            this.emitProgress(60, 'Performing AI summarization...');
            const result = await this.performAISummarization(textContent, summaryOptions);
            
            this.emitProgress(90, 'Finalizing summary...');
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
     */
    async translatePDF(file, targetLanguage, options = {}) {
        try {
            this.emitProgress(10, 'Validating file for translation...');
            this.validateTranslationRequest(file, targetLanguage);
            
            this.emitProgress(20, 'Analyzing PDF structure...');
            const analysis = await this.pdfAnalyzer.analyze(file);
            
            this.emitProgress(30, 'Preparing translation options...');
            const translationOptions = this.prepareTranslationOptions(targetLanguage, options, analysis);
            
            this.emitProgress(40, 'Extracting text content...');
            const textContent = await this.extractTextContent(file);
            
            this.emitProgress(60, 'Performing AI translation...');
            const result = await this.performAITranslation(textContent, translationOptions);
            
            this.emitProgress(90, 'Finalizing translation...');
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

        const options = { ...defaultOptions, ...userOptions };

        // Auto-adjust based on document analysis
        if (analysis.pageCount > 20 && options.maxLength === 'short') {
            options.maxLength = 'medium';
        }

        if (analysis.documentType === 'academic' && options.style === 'casual') {
            options.style = 'academic';
        }

        return options;
    }

    /**
     * Prepare translation options
     */
    prepareTranslationOptions(targetLanguage, userOptions, analysis) {
        const defaultOptions = {
            targetLanguage,
            provider: 'openai',
            preserveFormatting: true,
            translateTables: true,
            translateImages: false,
            quality: 'high',
            preserveContext: true
        };

        const options = { ...defaultOptions, ...userOptions };

        // Auto-adjust based on document analysis
        if (analysis.documentType === 'technical' && options.quality === 'fast') {
            options.quality = 'high';
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