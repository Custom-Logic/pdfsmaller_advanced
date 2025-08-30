/**
 * Enhanced Compression Integration
 * Connects the new enhanced compression components with the existing interface
 */

import { CompressionService } from '../services/compression-service.js';

class EnhancedCompressionIntegration {
    constructor() {
        this.compressionService = new CompressionService();
        this.settingsPanel = null;
        this.bulkUploader = null;
        this.currentFile = null;
        this.init();
    }

    init() {
        this.setupComponents();
        this.setupEventListeners();
        this.loadSavedSettings();
    }

    setupComponents() {
        // Get component references
        this.settingsPanel = document.getElementById('compressionSettingsPanel');
        this.bulkUploader = document.getElementById('bulkUploader');
        
        if (!this.settingsPanel || !this.bulkUploader) {
            console.warn('Enhanced compression components not found');
            return;
        }

        // Setup settings panel callbacks
        this.settingsPanel.onSettingsChange = (settings) => {
            this.handleSettingsChange(settings);
        };

        // Setup bulk uploader callbacks
        this.bulkUploader.onFilesChange = (files) => {
            this.handleBulkFilesChange(files);
        };

        this.bulkUploader.onBatchStart = (files) => {
            this.handleBulkCompression(files);
        };
    }

    setupEventListeners() {
        // Listen for file selection in the existing interface
        const fileInput = document.getElementById('singleFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files[0]);
            });
        }

        // Listen for processing mode toggle
        const modeSwitch = document.querySelector('.mode-switch[data-feature-tab="compress"]');
        if (modeSwitch) {
            modeSwitch.addEventListener('change', (e) => {
                this.handleModeToggle(e.target.checked);
            });
        }

        // Listen for existing compress button
        const compressBtn = document.getElementById('singleCompressBtn');
        if (compressBtn) {
            compressBtn.addEventListener('click', () => {
                this.handleCompression();
            });
        }
    }

    async handleFileSelection(file) {
        if (!file) return;

        this.currentFile = file;
        
        try {
            // Analyze the file for intelligent recommendations
            const analysis = await this.compressionService.analyzeFile(file);
            
            // Update settings panel with recommendations
            if (this.settingsPanel) {
                this.settingsPanel.setRecommendations(analysis);
            }

            // Show compression preview
            await this.showCompressionPreview(file, analysis);

        } catch (error) {
            console.error('File analysis failed:', error);
            this.showError('Failed to analyze PDF file');
        }
    }

    async showCompressionPreview(file, analysis) {
        try {
            // Get compression preview
            const preview = await this.compressionService.getCompressionPreview(file);
            
            // Update the existing interface with preview data
            this.updateInterfaceWithPreview(preview);
            
        } catch (error) {
            console.error('Compression preview failed:', error);
        }
    }

    updateInterfaceWithPreview(preview) {
        // Update file size display
        const originalSizeElement = document.getElementById('singleOriginalSize');
        if (originalSizeElement) {
            originalSizeElement.textContent = this.formatFileSize(preview.originalSize);
        }

        // Update estimated compressed size
        const compressedSizeElement = document.getElementById('singleCompressedSize');
        if (compressedSizeElement) {
            compressedSizeElement.textContent = this.formatFileSize(preview.estimatedSize);
        }

        // Update reduction percentage
        const reductionElement = document.getElementById('singleReductionPercent');
        if (reductionElement) {
            const reduction = ((preview.originalSize - preview.estimatedSize) / preview.originalSize * 100).toFixed(1);
            reductionElement.textContent = `${reduction}%`;
        }

        // Show compression potential indicator
        this.showCompressionPotential(preview.compressionPotential);
    }

    showCompressionPotential(potential) {
        // Create or update compression potential indicator
        let indicator = document.getElementById('compressionPotentialIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'compressionPotentialIndicator';
            indicator.className = 'compression-potential-indicator';
            
            const container = document.getElementById('enhancedCompressionContainer');
            if (container) {
                container.insertBefore(indicator, container.firstChild);
            }
        }

        const percentage = Math.round(potential * 100);
        const quality = percentage > 80 ? 'high' : percentage > 60 ? 'medium' : 'low';
        
        indicator.innerHTML = `
            <div class="potential-header">
                <svg class="potential-icon" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Compression Potential: ${percentage}%</span>
            </div>
            <div class="potential-bar">
                <div class="potential-fill potential-${quality}" style="width: ${percentage}%"></div>
            </div>
        `;
    }

    handleSettingsChange(settings) {
        // Update the existing interface with new settings
        const compressionLevelSelect = document.getElementById('singleCompressionLevel');
        if (compressionLevelSelect) {
            compressionLevelSelect.value = settings.compressionLevel;
        }

        const imageQualitySlider = document.getElementById('singleImageQuality');
        if (imageQualitySlider) {
            imageQualitySlider.value = settings.imageQuality;
            const qualityValue = document.getElementById('singleQualityValue');
            if (qualityValue) {
                qualityValue.textContent = `${settings.imageQuality}%`;
            }
        }

        // Update compression preview with new settings
        if (this.currentFile) {
            this.showCompressionPreview(this.currentFile, this.settingsPanel.recommendations);
        }
    }

    handleModeToggle(isBulkMode) {
        if (isBulkMode) {
            // Show bulk uploader
            this.bulkUploader.classList.remove('hidden');
            this.settingsPanel.classList.add('hidden');
            
            // Hide single file elements
            const singleElements = document.querySelectorAll('#singleFileInfo, .compression-options, #singleCompressBtn');
            singleElements.forEach(el => el.classList.add('hidden'));
            
        } else {
            // Show single file mode
            this.bulkUploader.classList.add('hidden');
            this.settingsPanel.classList.remove('hidden');
            
            // Show single file elements
            const singleElements = document.querySelectorAll('#singleFileInfo, .compression-options, #singleCompressBtn');
            singleElements.forEach(el => el.classList.remove('hidden'));
        }
    }

    async handleCompression() {
        if (!this.currentFile) return;

        try {
            // Get current settings
            const settings = this.settingsPanel ? this.settingsPanel.getSettings() : {};
            
            // Show progress
            this.showProgress();
            
            // Compress file
            const result = await this.compressionService.compressFile(this.currentFile, settings);
            
            // Hide progress
            this.hideProgress();
            
            // Show results
            this.showResults(result);
            
            // Enable download button
            this.enableDownload(result.compressedFile);
            
        } catch (error) {
            console.error('Compression failed:', error);
            this.hideProgress();
            this.showError('Compression failed: ' + error.message);
        }
    }

    async handleBulkCompression(files) {
        try {
            // Get current settings
            const settings = this.settingsPanel ? this.settingsPanel.getSettings() : {};
            
            // Show bulk progress
            this.showBulkProgress();
            
            // Process batch compression
            const result = await this.compressionService.batchCompress(files, settings);
            
            // Hide progress
            this.hideBulkProgress();
            
            // Show batch results
            this.showBatchResults(result);
            
        } catch (error) {
            console.error('Batch compression failed:', error);
            this.hideBulkProgress();
            this.showError('Batch compression failed: ' + error.message);
        }
    }

    showProgress() {
        const progress = document.getElementById('singleProgress');
        if (progress) {
            progress.classList.remove('hidden');
        }
    }

    hideProgress() {
        const progress = document.getElementById('singleProgress');
        if (progress) {
            progress.classList.add('hidden');
        }
    }

    showBulkProgress() {
        // Update bulk uploader progress
        if (this.bulkUploader) {
            this.bulkUploader.updateProgress(0, this.bulkUploader.getFiles().length);
        }
    }

    hideBulkProgress() {
        // Progress will be handled by bulk uploader component
    }

    showResults(result) {
        // Update the existing results display
        const results = document.getElementById('singleResults');
        if (results) {
            results.classList.remove('hidden');
        }

        // Update compressed size
        const compressedSizeElement = document.getElementById('singleCompressedSize');
        if (compressedSizeElement) {
            compressedSizeElement.textContent = this.formatFileSize(result.compressedSize);
        }

        // Update reduction percentage
        const reductionElement = document.getElementById('singleReductionPercent');
        if (reductionElement) {
            const reduction = ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1);
            reductionElement.textContent = `${reduction}%`;
        }
    }

    showBatchResults(result) {
        // Create batch results display
        const container = document.getElementById('enhancedCompressionContainer');
        if (!container) return;

        let resultsDiv = document.getElementById('batchResults');
        if (!resultsDiv) {
            resultsDiv = document.createElement('div');
            resultsDiv.id = 'batchResults';
            resultsDiv.className = 'batch-results';
            container.appendChild(resultsDiv);
        }

        resultsDiv.innerHTML = `
            <div class="batch-results-header">
                <h3>Batch Compression Results</h3>
                <button class="close-results" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="batch-results-summary">
                <div class="result-stat">
                    <span class="stat-value">${result.totalFiles}</span>
                    <span class="stat-label">Total Files</span>
                </div>
                <div class="result-stat">
                    <span class="stat-value success">${result.successfulFiles}</span>
                    <span class="stat-label">Successful</span>
                </div>
                <div class="result-stat">
                    <span class="stat-value error">${result.failedFiles}</span>
                    <span class="stat-label">Failed</span>
                </div>
            </div>
            <div class="batch-results-details">
                ${result.results.map(fileResult => `
                    <div class="file-result ${fileResult.success ? 'success' : 'error'}">
                        <span class="file-name">${fileResult.fileName}</span>
                        <span class="file-status">
                            ${fileResult.success ? '✓ Compressed' : '✗ Failed'}
                        </span>
                        ${fileResult.error ? `<span class="error-message">${fileResult.error}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    enableDownload(compressedFile) {
        const downloadBtn = document.getElementById('singleDownloadBtn');
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.onclick = () => {
                this.downloadFile(compressedFile);
            };
        }
    }

    downloadFile(file) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <span class="error-message">${message}</span>
            <button class="close-error" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    loadSavedSettings() {
        // Load settings from localStorage
        if (this.settingsPanel) {
            this.settingsPanel.loadSavedSettings();
        }
    }
}

// Initialize enhanced compression integration when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedCompressionIntegration();
});

// Export for potential external use
window.EnhancedCompressionIntegration = EnhancedCompressionIntegration;