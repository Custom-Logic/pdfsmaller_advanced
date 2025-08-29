/**
 * PDF Conversion Panel Component
 * Allows users to convert PDFs to Word, Excel, Text, and HTML formats
 */

import { BaseComponent } from './base-component.js';
import { getService } from '../services/extended-features-index.js';

export class ConversionPanel extends BaseComponent {
    constructor() {
        super();
        this.conversionService = null;
        this.selectedFiles = [];
        this.targetFormat = 'docx';
        this.conversionOptions = {
            preserveLayout: true,
            extractTables: true,
            includeImages: true,
            quality: 'high'
        };
        this.isConverting = false;
        this.conversionHistory = [];
    }

    async init() {
        try {
            this.conversionService = getService('conversion');
            if (!this.conversionService) {
                console.warn('Conversion service not available');
            }
        } catch (error) {
            console.error('Failed to initialize conversion service:', error);
        }
    }

    getTemplate() {
        return `
            <div class="conversion-panel">
                <div class="panel-header">
                    <h2>PDF Conversion</h2>
                    <p>Convert your PDFs to editable formats while preserving layout and formatting</p>
                </div>
                
                <div class="conversion-content">
                    <div class="file-upload-section">
                        <h3>Select Files</h3>
                        <div class="file-drop-zone" id="fileDropZone">
                            <div class="drop-zone-content">
                                <span class="upload-icon">📁</span>
                                <p>Drag & drop PDF files here or click to browse</p>
                                <input type="file" id="fileInput" multiple accept=".pdf" style="display: none;">
                                <button class="browse-btn" id="browseBtn">Browse Files</button>
                            </div>
                        </div>
                        
                        <div class="selected-files" id="selectedFiles">
                            <!-- Selected files will be displayed here -->
                        </div>
                    </div>
                    
                    <div class="conversion-settings">
                        <h3>Conversion Settings</h3>
                        
                        <div class="setting-group">
                            <label for="targetFormat">Target Format:</label>
                            <select id="targetFormat" class="format-select">
                                <option value="docx">Word Document (.docx)</option>
                                <option value="xlsx">Excel Spreadsheet (.xlsx)</option>
                                <option value="txt">Plain Text (.txt)</option>
                                <option value="html">HTML Document (.html)</option>
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label>Options:</label>
                            <div class="options-grid">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="preserveLayout" checked>
                                    <span class="checkmark"></span>
                                    Preserve Layout
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="extractTables" checked>
                                    <span class="checkmark"></span>
                                    Extract Tables
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="includeImages" checked>
                                    <span class="checkmark"></span>
                                    Include Images
                                </label>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <label for="quality">Quality:</label>
                            <select id="quality" class="quality-select">
                                <option value="high">High Quality</option>
                                <option value="medium">Medium Quality</option>
                                <option value="low">Low Quality (Smaller files)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="conversion-actions">
                        <button class="convert-btn" id="convertBtn" disabled>
                            <span class="btn-text">Convert Files</span>
                            <span class="btn-loading" style="display: none;">Converting...</span>
                        </button>
                        <button class="preview-btn" id="previewBtn" disabled>
                            Preview Conversion
                        </button>
                    </div>
                    
                    <div class="conversion-progress" id="conversionProgress" style="display: none;">
                        <div class="progress-header">
                            <h4>Conversion Progress</h4>
                            <span class="progress-status">0%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-details">
                            <span class="current-file">Ready to start...</span>
                        </div>
                    </div>
                    
                    <div class="conversion-results" id="conversionResults">
                        <!-- Conversion results will be displayed here -->
                    </div>
                </div>
            </div>
        `;
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
            .conversion-panel {
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
                color: var(--primary-color, #4CAF50);
                margin: 0 0 0.5rem 0;
                font-weight: 600;
            }
            
            .panel-header p {
                color: var(--text-secondary, #666);
                margin: 0;
                line-height: 1.5;
            }
            
            .conversion-content {
                display: grid;
                gap: 2rem;
            }
            
            .file-upload-section,
            .conversion-settings {
                background: var(--card-bg, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
            }
            
            .file-upload-section h3,
            .conversion-settings h3 {
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
                border-color: var(--primary-color, #4CAF50);
                background: var(--primary-light, #f0f8f0);
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
            
            .browse-btn {
                background: var(--primary-color, #4CAF50);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            
            .browse-btn:hover {
                background: var(--primary-dark, #388E3C);
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
                color: var(--danger-color, #f44336);
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
            
            .setting-group {
                margin-bottom: 1.5rem;
            }
            
            .setting-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: var(--text-color, #333);
            }
            
            .format-select,
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
                background: var(--primary-color, #4CAF50);
                border-color: var(--primary-color, #4CAF50);
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
            
            .conversion-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }
            
            .convert-btn,
            .preview-btn {
                padding: 1rem 2rem;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 150px;
            }
            
            .convert-btn {
                background: var(--primary-color, #4CAF50);
                color: white;
            }
            
            .convert-btn:hover:not(:disabled) {
                background: var(--primary-dark, #388E3C);
                transform: translateY(-2px);
            }
            
            .convert-btn:disabled {
                background: var(--disabled-color, #ccc);
                cursor: not-allowed;
                transform: none;
            }
            
            .preview-btn {
                background: var(--secondary-color, #2196F3);
                color: white;
            }
            
            .preview-btn:hover:not(:disabled) {
                background: var(--secondary-dark, #1976D2);
            }
            
            .preview-btn:disabled {
                background: var(--disabled-color, #ccc);
                cursor: not-allowed;
            }
            
            .conversion-progress {
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
                color: var(--primary-color, #4CAF50);
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
                background: var(--primary-color, #4CAF50);
                width: 0%;
                transition: width 0.3s ease;
            }
            
            .progress-details {
                color: var(--text-secondary, #666);
                font-size: 0.9rem;
            }
            
            .conversion-results {
                background: var(--card-bg, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
                min-height: 200px;
            }
            
            .conversion-results:empty::before {
                content: 'Converted files will appear here';
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
            
            .download-btn {
                background: var(--primary-color, #4CAF50);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
            }
            
            .download-btn:hover {
                background: var(--primary-dark, #388E3C);
            }
            
            @media (max-width: 768px) {
                .conversion-actions {
                    flex-direction: column;
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
        
        browseBtn.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(Array.from(e.target.files));
        });
        
        // Drag and drop handling
        fileDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropZone.classList.add('drag-over');
        });
        
        fileDropZone.addEventListener('dragleave', () => {
            fileDropZone.classList.remove('drag-over');
        });
        
        fileDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDropZone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelection(files);
        });
        
        // Conversion settings
        const targetFormat = this.shadowRoot.getElementById('targetFormat');
        targetFormat.addEventListener('change', (e) => {
            this.targetFormat = e.target.value;
            this.updateConversionOptions();
        });
        
        // Checkbox options
        ['preserveLayout', 'extractTables', 'includeImages'].forEach(id => {
            const checkbox = this.shadowRoot.getElementById(id);
            checkbox.addEventListener('change', (e) => {
                this.conversionOptions[id] = e.target.checked;
            });
        });
        
        // Quality setting
        const quality = this.shadowRoot.getElementById('quality');
        quality.addEventListener('change', (e) => {
            this.conversionOptions.quality = e.target.value;
        });
        
        // Action buttons
        const convertBtn = this.shadowRoot.getElementById('convertBtn');
        const previewBtn = this.shadowRoot.getElementById('previewBtn');
        
        convertBtn.addEventListener('click', () => this.startConversion());
        previewBtn.addEventListener('click', () => this.previewConversion());
    }

    handleFileSelection(files) {
        const pdfFiles = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
        
        if (pdfFiles.length === 0) {
            this.showError('Please select valid PDF files');
            return;
        }
        
        this.selectedFiles = [...this.selectedFiles, ...pdfFiles];
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
                    <span class="file-icon">📄</span>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${this.formatFileSize(file.size)}</p>
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

    updateButtonStates() {
        const hasFiles = this.selectedFiles.length > 0;
        const convertBtn = this.shadowRoot.getElementById('convertBtn');
        const previewBtn = this.shadowRoot.getElementById('previewBtn');
        
        convertBtn.disabled = !hasFiles || this.isConverting;
        previewBtn.disabled = !hasFiles || this.isConverting;
    }

    updateConversionOptions() {
        // Update options based on target format
        const format = this.targetFormat;
        
        if (format === 'txt') {
            this.conversionOptions.preserveLayout = false;
            this.conversionOptions.extractTables = false;
            this.conversionOptions.includeImages = false;
        } else if (format === 'html') {
            this.conversionOptions.preserveLayout = true;
            this.conversionOptions.extractTables = true;
            this.conversionOptions.includeImages = true;
        }
        
        // Update UI to reflect changes
        this.shadowRoot.getElementById('preserveLayout').checked = this.conversionOptions.preserveLayout;
        this.shadowRoot.getElementById('extractTables').checked = this.conversionOptions.extractTables;
        this.shadowRoot.getElementById('includeImages').checked = this.conversionOptions.includeImages;
    }

    async startConversion() {
        if (this.selectedFiles.length === 0) {
            this.showError('Please select files to convert');
            return;
        }
        
        try {
            this.isConverting = true;
            this.updateButtonStates();
            this.showProgress();
            
            const options = {
                targetFormat: this.targetFormat,
                ...this.conversionOptions
            };
            
            let results;
            if (this.selectedFiles.length === 1) {
                results = await this.conversionService.convertPDF(this.selectedFiles[0], this.targetFormat, options);
            } else {
                results = await this.conversionService.batchConvert(this.selectedFiles, this.targetFormat, options);
            }
            
            this.hideProgress();
            this.showResults(results);
            this.conversionHistory.push({
                timestamp: new Date(),
                files: this.selectedFiles.map(f => f.name),
                format: this.targetFormat,
                results: results
            });
            
        } catch (error) {
            console.error('Conversion failed:', error);
            this.hideProgress();
            this.showError(`Conversion failed: ${error.message}`);
        } finally {
            this.isConverting = false;
            this.updateButtonStates();
        }
    }

    async previewConversion() {
        if (this.selectedFiles.length === 0) {
            this.showError('Please select files to preview');
            return;
        }
        
        try {
            const file = this.selectedFiles[0];
            const options = {
                targetFormat: this.targetFormat,
                ...this.conversionOptions
            };
            
            const preview = await this.conversionService.getConversionPreview(file, this.targetFormat, options);
            this.showPreview(preview);
            
        } catch (error) {
            console.error('Preview failed:', error);
            this.showError(`Preview failed: ${error.message}`);
        }
    }

    showProgress() {
        const progressContainer = this.shadowRoot.getElementById('conversionProgress');
        progressContainer.style.display = 'block';
        
        // Simulate progress updates
        let progress = 0;
        const progressFill = this.shadowRoot.getElementById('progressFill');
        const progressStatus = this.shadowRoot.querySelector('.progress-status');
        const currentFile = this.shadowRoot.querySelector('.current-file');
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            
            progressFill.style.width = `${progress}%`;
            progressStatus.textContent = `${Math.round(progress)}%`;
            
            if (progress < 100) {
                currentFile.textContent = `Converting ${this.selectedFiles[0]?.name || 'file'}...`;
            } else {
                currentFile.textContent = 'Conversion completed!';
            }
        }, 500);
        
        this.progressInterval = interval;
    }

    hideProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        const progressContainer = this.shadowRoot.getElementById('conversionProgress');
        progressContainer.style.display = 'none';
    }

    showResults(results) {
        const resultsContainer = this.shadowRoot.getElementById('conversionResults');
        
        if (Array.isArray(results)) {
            resultsContainer.innerHTML = results.map(result => `
                <div class="result-item">
                    <div class="result-info">
                        <span class="result-icon">✅</span>
                        <div class="result-details">
                            <h4>${result.originalName} → ${result.convertedName}</h4>
                            <p>Format: ${result.format} | Size: ${this.formatFileSize(result.size)}</p>
                        </div>
                    </div>
                    <div class="result-actions">
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
                            <h4>${results.originalName} → ${results.convertedName}</h4>
                            <p>Format: ${results.format} | Size: ${this.formatFileSize(results.size)}</p>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="download-btn" onclick="this.downloadFile('${results.downloadUrl}')">
                            Download
                        </button>
                    </div>
                </div>
            `;
        }
    }

    showPreview(preview) {
        // Implementation for showing conversion preview
        console.log('Conversion preview:', preview);
        // This would show a modal or overlay with the preview
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

    downloadFile(url) {
        // Implementation for downloading converted files
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Register the component
customElements.define('conversion-panel', ConversionPanel);
