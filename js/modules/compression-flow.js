/**
 * Compression Flow Module
 * Manages the PDF compression workflow and processing
 */

import { APIClient } from '../services/api-client.js';
import { SecurityService } from '../services/security-service.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class CompressionFlow {
    constructor() {
        this.apiClient = new APIClient();
        this.securityService = new SecurityService();
        this.activeJobs = new Map();
        this.processingQueue = [];
    }

    async init() {
        this.setupCompressionButtons();
        this.setupSettingsControls();
    }

    setupCompressionButtons() {
        // Single file compression
        const singleCompressBtn = document.getElementById('singleCompressBtn');
        if (singleCompressBtn) {
            singleCompressBtn.addEventListener('click', this.handleSingleCompression.bind(this));
        }

        // New file buttons
        const newFileButtons = document.querySelectorAll('[id$="NewFileBtn"]');
        newFileButtons.forEach(btn => {
            btn.addEventListener('click', this.handleNewFile.bind(this));
        });

        // Download buttons
        const downloadButtons = document.querySelectorAll('[id$="DownloadBtn"]');
        downloadButtons.forEach(btn => {
            btn.addEventListener('click', this.handleDownload.bind(this));
        });
    }

    setupSettingsControls() {
        // Compression level selector
        const compressionLevelSelect = document.getElementById('singleCompressionLevel');
        if (compressionLevelSelect) {
            compressionLevelSelect.addEventListener('change', this.handleCompressionLevelChange.bind(this));
        }

        // Image quality slider
        const imageQualitySlider = document.getElementById('singleImageQuality');
        const qualityValueDisplay = document.getElementById('singleQualityValue');
        
        if (imageQualitySlider && qualityValueDisplay) {
            imageQualitySlider.addEventListener('input', (e) => {
                qualityValueDisplay.textContent = `${e.target.value}%`;
            });
        }

        // Server processing toggle
        const serverProcessingToggle = document.getElementById('useServerProcessing');
        if (serverProcessingToggle) {
            serverProcessingToggle.addEventListener('change', this.handleServerProcessingToggle.bind(this));
        }
    }

    async handleSingleCompression() {
        /**
         * This method is just patched we could just create events local to the compression component to hook up to.
         */
        try {
            // Get current tab
            const currentTab = getTabNavigation().getCurrentTab();
   
            // Only proceed if the current tab is the compression tab
            if (currentTab !== 'compress') {
                console.log('File selected in another tab, skipping compression.');
                return;
            }
            
            // Get current file from upload manager
            const fileSelectedEvent = await this.waitForFileSelection();
            const { fileId, file } = fileSelectedEvent.detail;
   
            // Get compression settings
            const settings = this.getCompressionSettings();
   
            // Start compression
            await this.startCompression(fileId, file, settings);
   
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'Single file compression' });
        }
    }

    async startCompression(fileId, file, settings) {
        try {
            // Generate job ID
            const jobId = this.generateJobId();

            // Store job info
            this.activeJobs.set(jobId, {
                fileId,
                file,
                settings,
                startTime: Date.now(),
                status: 'starting'
            });

            // Dispatch compression started event
            document.dispatchEvent(new CustomEvent('compression-started', {
                detail: { jobId, fileId, settings }
            }));

            // Show progress UI
            this.showProgressUI();

            // Determine processing method
            if (settings.useServerProcessing) {
                await this.processOnServer(jobId, file, settings);
            } else {
                await this.processClientSide(jobId, file, settings);
            }

        } catch (error) {
            this.handleCompressionError(error, jobId);
        }
    }

    async processClientSide(jobId, file, settings) {
        try {
            // Update job status
            const job = this.activeJobs.get(jobId);
            job.status = 'processing';

            // Simulate progress updates
            this.simulateProgress(jobId, 0, 100, 3000);

            // Use PDF-lib for client-side compression
            const compressedFile = await this.compressWithPDFLib(file, settings);

            // Calculate results
            const result = {
                originalSize: file.size,
                compressedSize: compressedFile.size,
                reductionPercent: ((file.size - compressedFile.size) / file.size * 100).toFixed(1),
                processingTime: Date.now() - job.startTime
            };

            // Update job with result
            job.status = 'completed';
            job.result = result;
            job.compressedFile = compressedFile;

            // Show results
            this.showResults(result);

            // Dispatch completion event
            document.dispatchEvent(new CustomEvent('compression-completed', {
                detail: { jobId, result, processingTime: result.processingTime }
            }));

        } catch (error) {
            throw new Error(`Client-side processing failed: ${error.message}`);
        }
    }

    async processOnServer(jobId, file, settings) {
        try {
            // Update job status
            const job = this.activeJobs.get(jobId);
            job.status = 'encrypting';

            // Encrypt file for secure transmission
            const encryptedData = await this.securityService.encryptFile(file);

            job.status = 'uploading';

            // Upload encrypted file
            const uploadResponse = await this.apiClient.uploadEncryptedFile(encryptedData, {
                originalName: file.name,
                settings: settings
            });

            job.status = 'processing';
            job.serverJobId = uploadResponse.jobId;

            // Poll for completion
            await this.pollServerJob(jobId, uploadResponse.jobId, encryptedData.key);

        } catch (error) {
            throw new Error(`Server processing failed: ${error.message}`);
        }
    }

    async pollServerJob(jobId, serverJobId, decryptionKey) {
        const pollInterval = 1000; // 1 second
        const maxPolls = 300; // 5 minutes max
        let pollCount = 0;

        const poll = async () => {
            try {
                const status = await this.apiClient.getProcessingStatus(serverJobId);
                
                // Update progress
                if (status.progress !== undefined) {
                    this.updateProgress(jobId, status.progress);
                }

                if (status.status === 'completed') {
                    // Download and decrypt result
                    const compressedFile = await this.apiClient.downloadProcessedFile(serverJobId, decryptionKey);
                    
                    // Calculate results
                    const job = this.activeJobs.get(jobId);
                    const result = {
                        originalSize: job.file.size,
                        compressedSize: compressedFile.size,
                        reductionPercent: ((job.file.size - compressedFile.size) / job.file.size * 100).toFixed(1),
                        processingTime: Date.now() - job.startTime
                    };

                    // Update job
                    job.status = 'completed';
                    job.result = result;
                    job.compressedFile = compressedFile;

                    // Show results
                    this.showResults(result);

                    // Dispatch completion event
                    document.dispatchEvent(new CustomEvent('compression-completed', {
                        detail: { jobId, result, processingTime: result.processingTime }
                    }));

                } else if (status.status === 'failed') {
                    throw new Error(status.error || 'Server processing failed');
                } else if (pollCount < maxPolls) {
                    // Continue polling
                    pollCount++;
                    setTimeout(poll, pollInterval);
                } else {
                    throw new Error('Processing timeout');
                }

            } catch (error) {
                this.handleCompressionError(error, jobId);
            }
        };

        // Start polling
        setTimeout(poll, pollInterval);
    }

    async compressWithPDFLib(file, settings) {
        // This is a placeholder for PDF-lib compression
        // In a real implementation, this would use PDF-lib to compress the PDF
        
        // For now, simulate compression by creating a smaller file
        const compressionRatio = this.getCompressionRatio(settings.compressionLevel);
        const simulatedSize = Math.floor(file.size * compressionRatio);
        
        // Create a blob with simulated compressed size
        const compressedBlob = new Blob(['compressed'], { type: 'application/pdf' });
        
        // Override the size property for simulation
        Object.defineProperty(compressedBlob, 'size', {
            value: simulatedSize,
            writable: false
        });

        return compressedBlob;
    }

    getCompressionRatio(level) {
        const ratios = {
            'low': 0.8,
            'medium': 0.6,
            'high': 0.4,
            'maximum': 0.2
        };
        return ratios[level] || 0.6;
    }

    simulateProgress(jobId, start, end, duration) {
        const startTime = Date.now();
        const updateInterval = 100; // Update every 100ms

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(start + (end - start) * (elapsed / duration), end);
            
            this.updateProgress(jobId, progress);

            if (progress < end && elapsed < duration) {
                setTimeout(updateProgress, updateInterval);
            }
        };

        updateProgress();
    }

    updateProgress(jobId, progress) {
        // Update progress bars and percentages
        const progressBars = document.querySelectorAll('.progress-bar');
        const progressPercentages = document.querySelectorAll('[id$="ProgressPercentage"]');
        
        progressBars.forEach(bar => {
            bar.style.width = `${progress}%`;
        });
        
        progressPercentages.forEach(element => {
            element.textContent = `${Math.round(progress)}%`;
        });

        // Dispatch progress event
        document.dispatchEvent(new CustomEvent('compression-progress', {
            detail: { jobId, progress }
        }));
    }

    showProgressUI() {
        // Show progress container
        const progressContainer = document.getElementById('singleProgress');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }

        // Hide compress button
        const compressBtn = document.getElementById('singleCompressBtn');
        if (compressBtn) {
            compressBtn.style.display = 'none';
        }
    }

    showResults(result) {
        // Hide progress container
        const progressContainer = document.getElementById('singleProgress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }

        // Show results container
        const resultsContainer = document.getElementById('singleResults');
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
        }

        // Update result values
        this.updateResultValue('singleOriginalSize', this.formatFileSize(result.originalSize));
        this.updateResultValue('singleCompressedSize', this.formatFileSize(result.compressedSize));
        this.updateResultValue('singleReductionPercent', `${result.reductionPercent}%`);
        this.updateResultValue('singleProcessingTime', `${(result.processingTime / 1000).toFixed(1)}s`);
    }

    updateResultValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    getCompressionSettings() {
        const compressionLevel = document.getElementById('singleCompressionLevel')?.value || 'medium';
        const imageQuality = parseInt(document.getElementById('singleImageQuality')?.value || '70');
        const useServerProcessing = document.getElementById('useServerProcessing')?.checked || false;

        return {
            compressionLevel,
            imageQuality,
            useServerProcessing
        };
    }

    handleCompressionLevelChange(event) {
        const level = event.target.value;
        // Update UI based on compression level
        // Could show estimated compression ratio, etc.
    }

    handleServerProcessingToggle(event) {
        const useServer = event.target.checked;
        // Update UI to show server processing benefits/requirements
    }

    handleNewFile() {
        // Reset UI for new file
        this.resetUI();
        this.clearActiveJobs();
    }

    handleDownload(event) {
        // Find the active job with completed result
        for (const [jobId, job] of this.activeJobs) {
            if (job.status === 'completed' && job.compressedFile) {
                this.downloadFile(job.compressedFile, job.file.name);
                break;
            }
        }
    }

    downloadFile(blob, originalName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName.replace('.pdf', '_compressed.pdf');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    resetUI() {
        // Hide results and progress
        const resultsContainer = document.getElementById('singleResults');
        const progressContainer = document.getElementById('singleProgress');
        const fileInfo = document.getElementById('singleFileInfo');
        const uploadArea = document.getElementById('compressUploadArea');
        const compressBtn = document.getElementById('singleCompressBtn');

        if (resultsContainer) resultsContainer.style.display = 'none';
        if (progressContainer) progressContainer.style.display = 'none';
        if (fileInfo) fileInfo.style.display = 'none';
        if (uploadArea) uploadArea.style.display = 'flex';
        if (compressBtn) {
            compressBtn.style.display = 'block';
            compressBtn.disabled = true;
        }
    }

    clearActiveJobs() {
        this.activeJobs.clear();
    }

    handleCompressionError(error, jobId) {
        ErrorHandler.handleError(error, { context: 'Compression processing', jobId });
        
        // Update job status
        if (jobId && this.activeJobs.has(jobId)) {
            const job = this.activeJobs.get(jobId);
            job.status = 'failed';
            job.error = error.message;
        }

        // Reset UI
        this.resetUI();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generateJobId() {
        return 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    waitForFileSelection() {
        return new Promise((resolve) => {
            const handler = (event) => {
                document.removeEventListener('file-selected', handler);
                resolve(event);
            };
            document.addEventListener('file-selected', handler);
        });
    }
}