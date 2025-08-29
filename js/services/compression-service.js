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
            // Load PDF-lib for client-side compression
            if (typeof PDFLib === 'undefined') {
                throw new Error('PDF-lib not available for client-side compression');
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            
            // Apply compression settings
            const compressedPdfDoc = await this.applyClientCompressionSettings(pdfDoc, settings);
            
            // Generate compressed PDF
            const compressedBytes = await compressedPdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectsPerTick: 20
            });
            
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
                settings: settings
            };
        } catch (error) {
            console.warn('Client-side compression failed:', error);
            throw new Error('Client-side compression not available');
        }
    }

    async applyClientCompressionSettings(pdfDoc, settings) {
        try {
            // Create a new PDF document for compression
            const compressedPdfDoc = await PDFLib.PDFDocument.create();
            
            // Copy pages with compression
            const pages = pdfDoc.getPages();
            for (let i = 0; i < pages.length; i++) {
                const [copiedPage] = await compressedPdfDoc.copyPages(pdfDoc, [i]);
                compressedPdfDoc.addPage(copiedPage);
            }
            
            // Apply font optimization if specified
            if (settings.optimizationStrategy === 'text_optimized') {
                // In a real implementation, you'd optimize fonts here
                console.log('Applying text optimization');
            }
            
            // Apply image optimization if specified
            if (settings.optimizationStrategy === 'image_optimized') {
                // In a real implementation, you'd optimize images here
                console.log('Applying image optimization');
            }
            
            return compressedPdfDoc;
        } catch (error) {
            console.error('Failed to apply client compression settings:', error);
            throw error;
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
            
            // Send to server for compression
            const response = await this.apiClient.post('/compress', formData, {
                responseType: 'blob'
            });
            
            if (!response.ok) {
                throw new Error(`Server compression failed: ${response.statusText}`);
            }
            
            // Create compressed file from response
            const compressedBlob = await response.blob();
            const compressedFile = new File([compressedBlob], file.name.replace('.pdf', '_compressed.pdf'), {
                type: 'application/pdf'
            });
            
            const compressionRatio = compressedBlob.size / file.size;
            
            return {
                success: true,
                compressedFile: compressedFile,
                compressionRatio: compressionRatio,
                originalSize: file.size,
                compressedSize: compressedBlob.size,
                settings: settings
            };
        } catch (error) {
            console.error('Server compression failed:', error);
            throw new Error('Server compression failed');
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
