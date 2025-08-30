/**
 * OCR Panel Component
 * Allows users to extract text from scanned PDFs and images using optical character recognition
 */

import { BaseComponent } from './base-component.js';
import { getService } from '../services/extended-features-index.js';

export class OCRPanel extends BaseComponent {
    constructor() {
        super();
        this.ocrService = null;
        this.selectedFiles = [];
        this.ocrOptions = {
            language: 'en',
            quality: 'high',
            outputFormat: 'searchable_pdf',
            extractTables: true,
            preserveLayout: true
        };
        this.isProcessing = false;
        this.processingHistory = [];
    }

    async init() {
        try {
            this.ocrService = getService('ocr');
            if (!this.ocrService) {
                console.warn('OCR service not available');
            }
        } catch (error) {
            console.error('Failed to initialize OCR service:', error);
        }
    }

    getTemplate() {
        return `
            <div class="ocr-panel">
                <div class="panel-header">
                    <h2>OCR Processing</h2>
                    <p>Extract text from scanned PDFs and images to make them searchable and editable</p>
                </div>
                
                <div class="ocr-content">
                    <div class="file-upload-section">
                        <h3>Select Files</h3>
                        <div class="file-drop-zone" id="fileDropZone">
                            <div class="drop-zone-content">
                                <span class="upload-icon">👁️</span>
                                <p>Drag & drop PDF, image, or scanned document files here</p>
                                <p class="supported-formats">Supported: PDF, JPEG, PNG, TIFF, BMP</p>
                                <input type="file" id="fileInput" multiple accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp" style="display: none;">
                                <button class="browse-btn" id="browseBtn">Browse Files</button>
                            </div>
                        </div>
                        
                        <div class="selected-files" id="selectedFiles">
                            <!-- Selected files will be displayed here -->
                        </div>
                    </div>
                    
                    <div class="ocr-settings">
                        <h3>OCR Settings</h3>
                        
                        <div class="settings-grid">
                            <div class="setting-group">
                                <label for="language">Language:</label>
                                <select id="language" class="language-select">
                                    <option value="en">English</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                    <option value="de">German</option>
                                    <option value="it">Italian</option>
                                    <option value="pt">Portuguese</option>
                                    <option value="ru">Russian</option>
                                    <option value="zh">Chinese</option>
                                    <option value="ja">Japanese</option>
                                    <option value="ko">Korean</option>
                                    <option value="ar">Arabic</option>
                                    <option value="hi">Hindi</option>
                                </select>
                            </div>
                            
                            <div class="setting-group">
                                <label for="outputFormat">Output Format:</label>
                                <select id="outputFormat" class="output-select">
                                    <option value="searchable_pdf">Searchable PDF</option>
                                    <option value="plain_text">Plain Text</option>
                                    <option value="word_doc">Word Document</option>
                                    <option value="html">HTML</option>
                                </select>
                            </div>
                            
                            <div class="setting-group">
                                <label for="quality">Quality:</label>
                                <select id="quality" class="quality-select">
                                    <option value="high">High Accuracy</option>
                                    <option value="medium">Balanced</option>
                                    <option value="low">Fast Processing</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <label>Processing Options:</label>
                            <div class="options-grid">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="extractTables" checked>
                                    <span class="checkmark"></span>
                                    Extract Tables
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="preserveLayout" checked>
                                    <span class="checkmark"></span>
                                    Preserve Layout
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="detectColumns">
                                    <span class="checkmark"></span>
                                    Detect Columns
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="enhanceImages">
                                    <span class="checkmark"></span>
                                    Enhance Images
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ocr-actions">
                        <button class="process-btn" id="processBtn" disabled>
                            <span class="btn-text">Process Files</span>
                            <span class="btn-loading" style="display: none;">Processing...</span>
                        </button>
                        <button class="preview-btn" id="previewBtn" disabled>
                            Preview OCR
                        </button>
                        <button class="batch-btn" id="batchBtn" disabled>
                            Batch Process
                        </button>
                    </div>
                    
                    <div class="ocr-progress" id="ocrProgress" style="display: none;">
                        <div class="progress-header">
                            <h4>OCR Processing Progress</h4>
                            <span class="progress-status">0%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-details">
                            <span class="current-file">Ready to start...</span>
                            <span class="processing-stage">Initializing...</span>
                        </div>
                    </div>
                    
                    <div class="ocr-results" id="ocrResults">
                        <!-- OCR results will be displayed here -->
                    </div>
                    
                    <div class="ocr-history" id="ocrHistory" style="display: none;">
                        <h3>Processing History</h3>
                        <div class="history-list">
                            <!-- Processing history will be displayed here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
            .ocr-panel {
                padding: 0;
                background: transparent;
                box-shadow: none;
            }
            
            .panel-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .panel-header h2 {
                font-size: 1.8rem;
                color: var(--primary-color, #2196F3);
                margin: 0 0 0.5rem 0;
                font-weight: 600;
            }
            
            .panel-header p {
                color: var(--text-secondary, #666);
                margin: 0;
                line-height: 1.5;
            }
            
            .ocr-content {
                display: grid;
                gap: 2rem;
            }
            
            .file-upload-section,
            .ocr-settings {
                background: var(--card-bg, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
            }
            
            .file-upload-section h3,
            .ocr-settings h3 {
                margin: 0 0 1rem 0;
                color: var(--text-color, #333);
                font-size: 1.2rem;
                font-weight: 600;
            }
            
            .file-drop-zone {
                border: 2px dashed var(--border-color, #e0e0e0);
                border-radius: 8px;
                padding: 2rem;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .file-drop-zone:hover,
            .file-drop-zone.drag-over {
                border-color: var(--primary-color, #2196F3);
                background: var(--primary-light, #f0f8ff);
            }
            
            .drop-zone-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
            }
            
            .upload-icon {
                font-size: 3rem;
                color: var(--text-secondary, #666);
            }
            
            .supported-formats {
                font-size: 0.9rem;
                color: var(--text-secondary, #666);
                margin: 0;
            }
            
            .browse-btn {
                background: var(--primary-color, #2196F3);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            
            .browse-btn:hover {
                background: var(--primary-dark, #1976D2);
            }
            
            .selected-files {
                margin-top: 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .file-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem;
                background: var(--bg-light, #f8f9fa);
                border-radius: 6px;
                border: 1px solid var(--border-color, #e0e0e0);
            }
            
            .file-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .file-icon {
                font-size: 1.5rem;
                color: var(--primary-color, #2196F3);
            }
            
            .file-details h4 {
                margin: 0;
                font-size: 0.9rem;
                color: var(--text-color, #333);
            }
            
            .file-details p {
                margin: 0;
                font-size: 0.8rem;
                color: var(--text-secondary, #666);
            }
            
            .remove-file {
                background: var(--danger-color, #f44336);
                color: white;
                border: none;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.8rem;
            }
            
            .settings-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1.5rem;
                margin-bottom: 1.5rem;
            }
            
            .setting-group {
                margin-bottom: 1.5rem;
            }
            
            .setting-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: var(--text-color, #333);
            }
            
            .language-select,
            .output-select,
            .quality-select {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 6px;
                font-size: 1rem;
                background: white;
            }
            
            .options-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }
            
            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                font-weight: normal;
            }
            
            .checkbox-label input[type="checkbox"] {
                display: none;
            }
            
            .checkmark {
                width: 18px;
                height: 18px;
                border: 2px solid var(--border-color, #e0e0e0);
                border-radius: 4px;
                position: relative;
                transition: all 0.3s ease;
            }
            
            .checkbox-label input[type="checkbox"]:checked + .checkmark {
                background: var(--primary-color, #2196F3);
                border-color: var(--primary-color, #2196F3);
            }
            
            .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 12px;
                font-weight: bold;
            }
            
            .ocr-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .process-btn,
            .preview-btn,
            .batch-btn {
                padding: 1rem 2rem;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 140px;
            }
            
            .process-btn {
                background: var(--primary-color, #2196F3);
                color: white;
            }
            
            .process-btn:hover:not(:disabled) {
                background: var(--primary-dark, #1976D2);
                transform: translateY(-2px);
            }
            
            .process-btn:disabled {
                background: var(--disabled-color, #ccc);
                cursor: not-allowed;
                transform: none;
            }
            
            .preview-btn {
                background: var(--secondary-color, #4CAF50);
                color: white;
            }
            
            .preview-btn:hover:not(:disabled) {
                background: var(--secondary-dark, #388E3C);
            }
            
            .preview-btn:disabled {
                background: var(--disabled-color, #ccc);
                cursor: not-allowed;
            }
            
            .batch-btn {
                background: var(--accent-color, #FF9800);
                color: white;
            }
            
            .batch-btn:hover:not(:disabled) {
                background: var(--accent-dark, #F57C00);
            }
            
            .batch-btn:disabled {
                background: var(--disabled-color, #ccc);
                cursor: not-allowed;
            }
            
            .ocr-progress {
                background: var(--card-bg, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
            }
            
            .progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .progress-header h4 {
                margin: 0;
                color: var(--text-color, #333);
            }
            
            .progress-status {
                font-weight: 600;
                color: var(--primary-color, #2196F3);
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: var(--bg-light, #f0f0f0);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 1rem;
            }
            
            .progress-fill {
                height: 100%;
                background: var(--primary-color, #2196F3);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .progress-details {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                color: var(--text-secondary, #666);
                font-size: 0.9rem;
            }
            
            .ocr-results {
                background: var(--card-bg, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
                min-height: 200px;
            }
            
            .ocr-results:empty::before {
                content: 'Processed files will appear here';
                display: block;
                text-align: center;
                color: var(--text-secondary, #666);
                font-style: italic;
                padding: 2rem;
            }
            
            .result-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
                background: var(--bg-light, #f8f9fa);
                border-radius: 8px;
                margin-bottom: 1rem;
                border: 1px solid var(--border-color, #e0e0e0);
            }
            
            .result-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .result-icon {
                font-size: 2rem;
                color: var(--success-color, #4CAF50);
            }
            
            .result-details h4 {
                margin: 0 0 0.25rem 0;
                color: var(--text-color, #333);
            }
            
            .result-details p {
                margin: 0;
                color: var(--text-secondary, #666);
                font-size: 0.9rem;
            }
            
            .result-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .download-btn,
            .view-btn {
                background: var(--primary-color, #2196F3);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
            }
            
            .download-btn:hover,
            .view-btn:hover {
                background: var(--primary-dark, #1976D2);
            }
            
            .view-btn {
                background: var(--secondary-color, #4CAF50);
            }
            
            .view-btn:hover {
                background: var(--secondary-dark, #388E3C);
            }
            
            .ocr-history {
                background: var(--card-bg, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
            }
            
            .ocr-history h3 {
                margin: 0 0 1rem 0;
                color: var(--text-color, #333);
                font-size: 1.2rem;
                font-weight: 600;
            }
            
            .history-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .history-item {
                padding: 1rem;
                background: var(--bg-light, #f8f9fa);
                border-radius: 6px;
                border: 1px solid var(--border-color, #e0e0e0);
            }
            
            .history-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .history-timestamp {
                font-size: 0.8rem;
                color: var(--text-secondary, #666);
            }
            
            .history-details {
                font-size: 0.9rem;
                color: var(--text-color, #333);
            }
            
            @media (max-width: 768px) {
                .ocr-actions {
                    flex-direction: column;
                }
                
                .settings-grid {
                    grid-template-columns: 1fr;
                }
                
                .options-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    setupEventListeners() {
        // File input handling
        const fileInput = this.shadowRoot.getElementById('fileInput');
        const browseBtn = this.shadowRoot.getElementById('browseBtn');
        const fileDropZone = this.shadowRoot.getElementById('fileDropZone');

        this.addEventListener(browseBtn, 'click', () => fileInput.click());

        this.addEventListener(fileInput, 'change', (e) => {
            this.handleFileSelection(Array.from(e.target.files));
        });

        // Drag and drop handling
        this.addEventListener(fileDropZone, 'dragover', (e) => {
            e.preventDefault();
            fileDropZone.classList.add('drag-over');
        });

        this.addEventListener(fileDropZone, 'dragleave', () => {
            fileDropZone.classList.remove('drag-over');
        });

        this.addEventListener(fileDropZone, 'drop', (e) => {
            e.preventDefault();
            fileDropZone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelection(files);
        });

        // OCR settings
        const language = this.shadowRoot.getElementById('language');
        const outputFormat = this.shadowRoot.getElementById('outputFormat');
        const quality = this.shadowRoot.getElementById('quality');

        this.addEventListener(language, 'change', (e) => {
            this.ocrOptions.language = e.target.value;
        });

        this.addEventListener(outputFormat, 'change', (e) => {
            this.ocrOptions.outputFormat = e.target.value;
        });

        this.addEventListener(quality, 'change', (e) => {
            this.ocrOptions.quality = e.target.value;
        });

        // Checkbox options
        ['extractTables', 'preserveLayout', 'detectColumns', 'enhanceImages'].forEach(id => {
            const checkbox = this.shadowRoot.getElementById(id);
            if (checkbox) {
                this.addEventListener(checkbox, 'change', (e) => {
                    this.ocrOptions[id] = e.target.checked;
                });
            }
        });

        // Action buttons
        const processBtn = this.shadowRoot.getElementById('processBtn');
        const previewBtn = this.shadowRoot.getElementById('previewBtn');
        const batchBtn = this.shadowRoot.getElementById('batchBtn');

        this.addEventListener(processBtn, 'click', () => this.startOCRProcessing());
        this.addEventListener(previewBtn, 'click', () => this.previewOCR());
        this.addEventListener(batchBtn, 'click', () => this.startBatchProcessing());
    }

    handleFileSelection(files) {
        const supportedFiles = files.filter(file => {
            const extension = file.name.toLowerCase().split('.').pop();
            const supportedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'tiff', 'bmp'];
            return supportedTypes.includes(extension) || 
                   file.type.startsWith('image/') || 
                   file.type === 'application/pdf';
        });
        
        if (supportedFiles.length === 0) {
            this.showError('Please select valid files (PDF, JPEG, PNG, TIFF, BMP)');
            return;
        }
        
        this.selectedFiles = [...this.selectedFiles, ...supportedFiles];
        this.updateFileDisplay();
        this.updateButtonStates();
    }

    updateFileDisplay() {
        const filesContainer = this.shadowRoot.getElementById('selectedFiles');
        
        if (this.selectedFiles.length === 0) {
            filesContainer.innerHTML = '';
            return;
        }
        
        filesContainer.innerHTML = this.selectedFiles.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <span class="file-icon">${this.getFileIcon(file)}</span>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${this.formatFileSize(file.size)} | ${this.getFileType(file)}</p>
                    </div>
                </div>
                <button class="remove-file" data-index="${index}">Remove</button>
            </div>
        `).join('');
        
        // Add remove event listeners
        filesContainer.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.selectedFiles.splice(index, 1);
                this.updateFileDisplay();
                this.updateButtonStates();
            });
        });
    }

    getFileIcon(file) {
        if (file.type === 'application/pdf') return '📄';
        if (file.type.startsWith('image/')) return '🖼️';
        return '📁';
    }

    getFileType(file) {
        if (file.type === 'application/pdf') return 'PDF';
        if (file.type.startsWith('image/')) return 'Image';
        return 'Unknown';
    }

    updateButtonStates() {
        const hasFiles = this.selectedFiles.length > 0;
        const processBtn = this.shadowRoot.getElementById('processBtn');
        const previewBtn = this.shadowRoot.getElementById('previewBtn');
        const batchBtn = this.shadowRoot.getElementById('batchBtn');
        
        processBtn.disabled = !hasFiles || this.isProcessing;
        previewBtn.disabled = !hasFiles || this.isProcessing;
        batchBtn.disabled = !hasFiles || this.isProcessing || this.selectedFiles.length < 2;
    }

    async startOCRProcessing() {
        if (this.selectedFiles.length === 0) {
            this.showError('Please select files to process');
            return;
        }
        
        try {
            this.isProcessing = true;
            this.updateButtonStates();
            this.showProgress();
            
            // For single file processing, emit event for MainController
            if (this.selectedFiles.length === 1) {
                const file = this.selectedFiles[0];
                
                // Emit event for MainController to handle
                document.dispatchEvent(new CustomEvent('ocrProcessingRequested', {
                    detail: {
                        fileId: file.fileId || `temp_${Date.now()}`,
                        options: this.ocrOptions
                    }
                }));
                
                // Listen for completion
                const handleComplete = (event) => {
                    if (event.detail.operation === 'ocr') {
                        document.removeEventListener('processingComplete', handleComplete);
                        this.hideProgress();
                        this.showResults(event.detail.result);
                        this.addToHistory({
                            timestamp: new Date(),
                            files: [file.name],
                            options: this.ocrOptions,
                            results: event.detail.result
                        });
                        this.isProcessing = false;
                        this.updateButtonStates();
                    }
                };
                
                const handleError = (event) => {
                    if (event.detail.service === 'ocr') {
                        document.removeEventListener('processingError', handleError);
                        this.hideProgress();
                        this.showError(`OCR processing failed: ${event.detail.error}`);
                        this.isProcessing = false;
                        this.updateButtonStates();
                    }
                };
                
                document.addEventListener('processingComplete', handleComplete);
                document.addEventListener('processingError', handleError);
                
            } else {
                // For batch processing, emit multiple single file events for now
                // TODO: Implement proper batch processing via events
                logEvent('⚠️ Batch OCR processing not yet implemented via events');
                this.showError('Batch OCR processing not yet implemented. Please process files individually.');
                
                this.hideProgress();
                this.showResults(results);
                this.addToHistory({
                    timestamp: new Date(),
                    files: this.selectedFiles.map(f => f.name),
                    options: this.ocrOptions,
                    results: results
                });
                this.isProcessing = false;
                this.updateButtonStates();
            }
            
        } catch (error) {
            console.error('OCR processing failed:', error);
            this.hideProgress();
            this.showError(`OCR processing failed: ${error.message}`);
            this.isProcessing = false;
            this.updateButtonStates();
        }
    }

    async previewOCR() {
        if (this.selectedFiles.length === 0) {
            this.showError('Please select files to preview');
            return;
        }
        
        try {
            const file = this.selectedFiles[0];
            // TODO: Implement OCR preview via events
            this.showError('OCR preview not yet implemented via events');
            this.showPreview(preview);
            
        } catch (error) {
            console.error('OCR preview failed:', error);
            this.showError(`OCR preview failed: ${error.message}`);
        }
    }

    async startBatchProcessing() {
        if (this.selectedFiles.length < 2) {
            this.showError('Please select multiple files for batch processing');
            return;
        }
        
        // Start batch processing
        await this.startOCRProcessing();
    }

    showProgress() {
        const progressContainer = this.shadowRoot.getElementById('ocrProgress');
        progressContainer.style.display = 'block';
        
        // Simulate progress updates
        let progress = 0;
        const progressFill = this.shadowRoot.getElementById('progressFill');
        const progressStatus = this.shadowRoot.querySelector('.progress-status');
        const currentFile = this.shadowRoot.querySelector('.current-file');
        const processingStage = this.shadowRoot.querySelector('.processing-stage');
        
        const stages = ['Analyzing document...', 'Preprocessing image...', 'Running OCR...', 'Post-processing...', 'Generating output...'];
        let stageIndex = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 12;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            
            progressFill.style.width = `${progress}%`;
            progressStatus.textContent = `${Math.round(progress)}%`;
            
            if (progress < 100) {
                currentFile.textContent = `Processing ${this.selectedFiles[0]?.name || 'file'}...`;
                
                // Update processing stage
                if (progress > (stageIndex + 1) * 20 && stageIndex < stages.length - 1) {
                    stageIndex++;
                    processingStage.textContent = stages[stageIndex];
                }
            } else {
                currentFile.textContent = 'OCR processing completed!';
                processingStage.textContent = 'Ready for download';
            }
        }, 400);
        
        this.progressInterval = interval;
    }

    hideProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        const progressContainer = this.shadowRoot.getElementById('ocrProgress');
        progressContainer.style.display = 'none';
    }

    showResults(results) {
        const resultsContainer = this.shadowRoot.getElementById('ocrResults');
        
        if (Array.isArray(results)) {
            resultsContainer.innerHTML = results.map(result => `
                <div class="result-item">
                    <div class="result-info">
                        <span class="result-icon">✅</span>
                        <div class="result-details">
                            <h4>${result.originalName} → ${result.processedName}</h4>
                            <p>Format: ${result.format} | Size: ${this.formatFileSize(result.size)} | Confidence: ${result.confidence}%</p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="view-btn" onclick="this.viewResult('${result.id}')">
                            View
                        </button>
                        <button class="download-btn" onclick="this.downloadFile('${result.downloadUrl}')">
                            Download
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            resultsContainer.innerHTML = `
                <div class="result-item">
                    <div class="result-info">
                        <span class="result-icon">✅</span>
                        <div class="result-details">
                            <h4>${results.originalName} → ${results.processedName}</h4>
                            <p>Format: ${results.format} | Size: ${this.formatFileSize(results.size)} | Confidence: ${results.confidence}%</p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="view-btn" onclick="this.viewResult('${results.id}')">
                            View
                        </button>
                        <button class="download-btn" onclick="this.downloadFile('${results.downloadUrl}')">
                            Download
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showPreview(preview) {
        // Implementation for showing OCR preview
        console.log('OCR preview:', preview);
        // This would show a modal or overlay with the preview
    }

    addToHistory(entry) {
        this.processingHistory.unshift(entry);
        
        // Keep only last 50 entries
        if (this.processingHistory.length > 50) {
            this.processingHistory = this.processingHistory.slice(0, 50);
        }
        
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyContainer = this.shadowRoot.getElementById('ocrHistory');
        const historyList = historyContainer.querySelector('.history-list');
        
        if (this.processingHistory.length === 0) {
            historyContainer.style.display = 'none';
            return;
        }
        
        historyContainer.style.display = 'block';
        historyList.innerHTML = this.processingHistory.map(entry => `
            <div class="history-item">
                <div class="history-header">
                    <span class="history-timestamp">${entry.timestamp.toLocaleString()}</span>
                </div>
                <div class="history-details">
                    Processed ${entry.files.length} file(s) with ${entry.options.language} language
                </div>
            </div>
        `).join('');
    }

    showError(message) {
        // Implementation for showing error messages
        console.error(message);
        // This would show a toast notification or error modal
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    viewResult(resultId) {
        // Implementation for viewing OCR results
        console.log('Viewing result:', resultId);
        // This would open a modal or new tab to view the result
    }

    downloadFile(url) {
        // Implementation for downloading processed files
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Register the component
customElements.define('ocr-panel', OCRPanel);
