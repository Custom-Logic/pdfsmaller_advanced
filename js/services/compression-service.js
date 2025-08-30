/**
 * Intelligent Compression Service
 * Provides intelligent PDF compression with analysis and recommendations
 */

import { PDFAnalyzer } from './pdf-analyzer.js';
import { APIClient } from './api-client.js';

export class CompressionService {
    constructor() {
        this.pdfAnalyzer = new PDFAnalyzer();
        this.apiClient = new APIClient();
        this.compressionHistory = new Map();
    }

    async analyzeFile(file) {
        try {
            const analysis = await this.pdfAnalyzer.analyze(file);
            const recommendations = this.pdfAnalyzer.getRecommendedSettings(analysis);
            
            return {
                fileSize: file.size,
                pageCount: analysis.pageCount,
                compressionPotential: analysis.compressionPotential,
                recommendedSettings: recommendations,
                analysis: analysis
            };
        } catch (error) {
            console.error('File analysis failed:', error);
            throw new Error('Failed to analyze PDF file');
        }
    }

    async compressFile(file, settings = {}) {
        try {
            // First, analyze the file to get recommendations
            const analysis = await this.analyzeFile(file);
            
            // Merge user settings with recommendations
            const finalSettings = this.mergeSettings(analysis.recommendedSettings, settings);
            
            // Attempt client-side compression first
            const clientResult = await this.attemptClientCompression(file, finalSettings);
            
            // If client compression is sufficient, return result
            if (clientResult.compressionRatio < 0.8) {
                console.log('Client-side compression successful, ratio:', clientResult.compressionRatio);
                return {
                    ...clientResult,
                    compressionType: 'client',
                    analysis: analysis
                };
            }
            
            // Fall back to server-side compression for better results
            console.log('Client compression insufficient, falling back to server compression');
            const serverResult = await this.serverCompression(file, finalSettings);
            
            return {
                ...serverResult,
                compressionType: 'server',
                analysis: analysis
            };
        } catch (error) {
            console.error('Compression failed:', error);
            throw new Error('PDF compression failed');
        }
    }

    async attemptClientCompression(file, settings) {
        try {
            // Check if PDF-lib is available
            if (typeof window.PDFLib === 'undefined') {
                throw new Error('PDF-lib not available for client-side compression');
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await window.PDFLib.PDFDocument.load(arrayBuffer);
            
            // Apply compression settings based on compression level
            const saveOptions = this.getCompressionSaveOptions(settings);
            
            // Generate compressed PDF
            const compressedBytes = await pdfDoc.save(saveOptions);
            
            // Create compressed file
            const compressedFile = new File([compressedBytes], file.name.replace('.pdf', '_compressed.pdf'), {
                type: 'application/pdf'
            });
            
            const compressionRatio = compressedBytes.length / file.size;
            
            return {
                success: true,
                compressedFile: compressedFile,
                compressionRatio: compressionRatio,
                originalSize: file.size,
                compressedSize: compressedBytes.length,
                settings: settings,
                processingTime: Date.now() - Date.now() // Will be calculated by caller
            };
        } catch (error) {
            console.warn('Client-side compression failed:', error);
            throw new Error(`Client-side compression failed: ${error.message}`);
        }
    }

    getCompressionSaveOptions(settings) {
        const baseOptions = {
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50
        };

        // Adjust compression based on level
        switch (settings.compressionLevel) {
            case 'low':
                return {
                    ...baseOptions,
                    useObjectStreams: false,
                    objectsPerTick: 20
                };
            case 'medium':
                return {
                    ...baseOptions,
                    useObjectStreams: true,
                    objectsPerTick: 50
                };
            case 'high':
                return {
                    ...baseOptions,
                    useObjectStreams: true,
                    objectsPerTick: 100,
                    compress: true
                };
            case 'maximum':
                return {
                    ...baseOptions,
                    useObjectStreams: true,
                    objectsPerTick: 200,
                    compress: true,
                    linearize: true
                };
            default:
                return baseOptions;
        }
    }

    async serverCompression(file, settings) {
        try {
            // Create form data for server upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('compressionLevel', settings.compressionLevel);
            formData.append('imageQuality', settings.imageQuality);
            
            // Add additional settings if available
            if (settings.optimizationStrategy) {
                formData.append('optimizationStrategy', settings.optimizationStrategy);
            }
            if (settings.targetSize) {
                formData.append('targetSize', settings.targetSize);
            }
            
            // Send to server for compression using the API client
            const response = await this.apiClient.makeRequest('/compress', {
                method: 'POST',
                body: formData,
                responseType: 'blob'
            });
            
            // Create compressed file from response
            const compressedFile = new File([response], file.name.replace('.pdf', '_compressed.pdf'), {
                type: 'application/pdf'
            });
            
            const compressionRatio = response.size / file.size;
            
            return {
                success: true,
                compressedFile: compressedFile,
                compressionRatio: compressionRatio,
                originalSize: file.size,
                compressedSize: response.size,
                settings: settings,
                processingTime: Date.now() - Date.now() // Will be calculated by caller
            };
        } catch (error) {
            console.error('Server compression failed:', error);
            throw new Error(`Server compression failed: ${error.message}`);
        }
    }

    mergeSettings(recommendations, userSettings) {
        return {
            compressionLevel: userSettings.compressionLevel || recommendations.compressionLevel,
            imageQuality: userSettings.imageQuality || recommendations.imageQuality,
            targetSize: userSettings.targetSize || recommendations.targetSize,
            optimizationStrategy: userSettings.optimizationStrategy || recommendations.optimizationStrategy
        };
    }

    async getCompressionPreview(file, settings = {}) {
        try {
            // Analyze file for preview
            const analysis = await this.analyzeFile(file);
            const finalSettings = this.mergeSettings(analysis.recommendedSettings, settings);
            
            // Estimate compression results
            const estimatedRatio = this.estimateCompressionRatio(analysis, finalSettings);
            const estimatedSize = Math.round(file.size * estimatedRatio);
            
            return {
                originalSize: file.size,
                estimatedSize: estimatedSize,
                estimatedRatio: estimatedRatio,
                compressionPotential: analysis.compressionPotential,
                recommendedSettings: analysis.recommendedSettings,
                analysis: analysis
            };
        } catch (error) {
            console.error('Compression preview failed:', error);
            throw new Error('Failed to generate compression preview');
        }
    }

    estimateCompressionRatio(analysis, settings) {
        let baseRatio = 0.8; // Base compression ratio
        
        // Adjust based on compression level
        switch (settings.compressionLevel) {
            case 'low':
                baseRatio = 0.9;
                break;
            case 'medium':
                baseRatio = 0.8;
                break;
            case 'high':
                baseRatio = 0.6;
                break;
            case 'maximum':
                baseRatio = 0.4;
                break;
        }
        
        // Adjust based on image quality
        if (settings.imageQuality < 80) {
            baseRatio *= 0.9; // Better compression for lower image quality
        }
        
        // Adjust based on document type
        switch (analysis.documentType) {
            case 'image_heavy':
                baseRatio *= 0.8; // Images compress well
                break;
            case 'text_heavy':
                baseRatio *= 0.9; // Text compresses moderately
                break;
            case 'long_document':
                baseRatio *= 0.85; // Long documents have some redundancy
                break;
        }
        
        // Adjust based on compression potential
        baseRatio *= (0.8 + (analysis.compressionPotential * 0.2));
        
        return Math.max(0.3, Math.min(0.95, baseRatio)); // Keep between 30% and 95%
    }

    async batchCompress(files, settings = {}) {
        try {
            const batchResults = [];
            const batchId = this.generateBatchId();
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                try {
                    // Analyze file
                    const analysis = await this.analyzeFile(file);
                    const fileSettings = this.mergeSettings(analysis.recommendedSettings, settings);
                    
                    // Compress file
                    const result = await this.compressFile(file, fileSettings);
                    
                    batchResults.push({
                        fileIndex: i,
                        fileName: file.name,
                        success: true,
                        result: result,
                        analysis: analysis
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
            console.error('Batch compression failed:', error);
            throw new Error('Batch compression failed');
        }
    }

    generateBatchId() {
        return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getCompressionHistory() {
        return Array.from(this.compressionHistory.values());
    }

    addToHistory(result) {
        const historyEntry = {
            id: Date.now(),
            timestamp: new Date(),
            fileName: result.originalFile?.name || 'Unknown',
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            compressionRatio: result.compressionRatio,
            settings: result.settings,
            compressionType: result.compressionType
        };
        
        this.compressionHistory.set(historyEntry.id, historyEntry);
        
        // Keep only last 50 entries
        if (this.compressionHistory.size > 50) {
            const firstKey = this.compressionHistory.keys().next().value;
            this.compressionHistory.delete(firstKey);
        }
        
        return historyEntry;
    }

    clearHistory() {
        this.compressionHistory.clear();
    }
}
