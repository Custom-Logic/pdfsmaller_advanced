/**
 * OCR Controls Component (Event-Driven Architecture)
 * Follows the same pattern as compression-controls and conversion-controls
 */

import { BaseComponent } from './base-component.js';

export class OCRControls extends BaseComponent {
    constructor() {
        super();
        this.fileIds = []; // Track available file IDs
        this.ocrOptions = {
            language: 'en',
            outputFormat: 'searchable_pdf',
            quality: 'high',
            extractTables: true,
            preserveLayout: true,
            detectColumns: false,
            enhanceImages: false
        };
        
        // Bind methods once in constructor
        this.handleFileUploaded = this.handleFileUploaded.bind(this);
        this.handleFilesCleared = this.handleFilesCleared.bind(this);
        this.handleFileRemoved = this.handleFileRemoved.bind(this);
    }

    getTemplate() {
        return `
            <div class="controls-container">
                <div class="controls-header">
                    <h3 class="controls-title">OCR Processing</h3>
                    <p class="controls-subtitle">Extract text from scanned documents and images</p>
                </div>

                <div class="file-status">
                    <span class="file-count">0</span> files ready
                </div>

                <div class="settings-grid">
                    <div class="setting-group">
                        <label class="setting-label" for="languageSelect">Language</label>
                        <select class="setting-select" id="languageSelect">
                            <option value="en">🇺🇸 English</option>
                            <option value="es">🇪🇸 Spanish</option>
                            <option value="fr">🇫🇷 French</option>
                            <option value="de">🇩🇪 German</option>
                            <option value="it">🇮🇹 Italian</option>
                            <option value="pt">🇵🇹 Portuguese</option>
                            <option value="ru">🇷🇺 Russian</option>
                            <option value="zh">🇨🇳 Chinese</option>
                            <option value="ja">🇯🇵 Japanese</option>
                            <option value="ko">🇰🇷 Korean</option>
                            <option value="ar">🇸🇦 Arabic</option>
                            <option value="hi">🇮🇳 Hindi</option>
                        </select>
                    </div>

                    <div class="setting-group">
                        <label class="setting-label" for="outputFormatSelect">Output Format</label>
                        <select class="setting-select" id="outputFormatSelect">
                            <option value="searchable_pdf">Searchable PDF</option>
                            <option value="plain_text">Plain Text</option>
                            <option value="word_doc">Word Document</option>
                            <option value="html">HTML</option>
                        </select>
                    </div>

                    <div class="setting-group">
                        <label class="setting-label" for="qualitySelect">Quality</label>
                        <select class="setting-select" id="qualitySelect">
                            <option value="high">High Accuracy</option>
                            <option value="medium">Balanced</option>
                            <option value="low">Fast Processing</option>
                        </select>
                    </div>
                </div>

                <div class="processing-options">
                    <label class="section-label">Processing Options</label>
                    <div class="options-grid">
                        <div class="option-item">
                            <div class="option-checkbox checked" data-option="extractTables"></div>
                            <label class="option-label">Extract Tables</label>
                        </div>
                        <div class="option-item">
                            <div class="option-checkbox checked" data-option="preserveLayout"></div>
                            <label class="option-label">Preserve Layout</label>
                        </div>
                        <div class="option-item">
                            <div class="option-checkbox" data-option="detectColumns"></div>
                            <label class="option-label">Detect Columns</label>
                        </div>
                        <div class="option-item">
                            <div class="option-checkbox" data-option="enhanceImages"></div>
                            <label class="option-label">Enhance Images</label>
                        </div>
                    </div>
                </div>

                <div class="action-group">
                    <div class="action-buttons">
                        <button class="ocr-button process-button" id="processButton" disabled>
                            <span class="button-icon">👁️</span>
                            <span>Process OCR</span>
                        </button>
                        <button class="ocr-button preview-button" id="previewButton" disabled>
                            <span class="button-icon">👀</span>
                            <span>Preview</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getStyles() {
        return `
            .controls-container {
                background: white;
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
            }
            .controls-header {
                margin-bottom: 24px;
                text-align: center;
            }
            .controls-title {
                font-size: 20px;
                font-weight: 600;
                color: #111827;
                margin: 0 0 8px 0;
            }
            .controls-subtitle {
                font-size: 14px;
                color: #4b5563;
                margin: 0;
            }
            .file-status {
                text-align: center;
                margin-bottom: 24px;
                padding: 8px 16px;
                background: #f3f4f6;
                border-radius: 6px;
                font-size: 14px;
                color: #374151;
            }
            .file-count {
                font-weight: 600;
                color: #059669;
            }
            .settings-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }
            .setting-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .setting-label {
                font-size: 14px;
                font-weight: 500;
                color: #374151;
            }
            .setting-select {
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                background: white;
                color: #374151;
            }
            .setting-select:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            .processing-options {
                margin-bottom: 24px;
            }
            .section-label {
                font-size: 16px;
                font-weight: 500;
                color: #1f2937;
                margin-bottom: 12px;
                display: block;
            }
            .options-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }
            .option-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                background: #f9fafb;
            }
            .option-checkbox {
                width: 18px;
                height: 18px;
                border: 2px solid #d1d5db;
                border-radius: 4px;
                position: relative;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .option-checkbox.checked {
                background: #3b82f6;
                border-color: #3b82f6;
            }
            .option-checkbox.checked::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 12px;
                font-weight: bold;
            }
            .option-label {
                font-size: 14px;
                color: #374151;
                cursor: pointer;
                flex: 1;
            }
            .action-buttons {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            .ocr-button {
                flex: 1;
                min-width: 140px;
                padding: 16px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            .process-button {
                background: #2563eb;
                color: white;
            }
            .process-button:hover:not(:disabled) {
                background: #1d4ed8;
                transform: translateY(-1px);
            }
            .preview-button {
                background: #16a34a;
                color: white;
            }
            .preview-button:hover:not(:disabled) {
                background: #15803d;
                transform: translateY(-1px);
            }
            .ocr-button:disabled {
                background: #9ca3af;
                cursor: not-allowed;
                transform: none;
            }
            .ocr-button.processing {
                background: #fbbf24;
                cursor: wait;
            }
            .button-icon {
                font-size: 18px;
            }
            .error-message {
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 14px;
                margin-top: 8px;
            }
            @media (max-width: 768px) {
                .settings-grid {
                    grid-template-columns: 1fr;
                }
                .options-grid {
                    grid-template-columns: 1fr;
                }
                .action-buttons {
                    flex-direction: column;
                }
                .ocr-button {
                    min-width: auto;
                }
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('OCRControls: Connected, setting up event listeners');
        
        // Add event listeners for file state changes
        document.addEventListener('fileUploaded', this.handleFileUploaded);
        document.addEventListener('filesCleared', this.handleFilesCleared);
        document.addEventListener('fileRemoved', this.handleFileRemoved);
    }

    disconnectedCallback() {
        console.log('OCRControls: Disconnected, removing event listeners');
        
        // Remove event listeners using the same bound references
        document.removeEventListener('fileUploaded', this.handleFileUploaded);
        document.removeEventListener('filesCleared', this.handleFilesCleared);
        document.removeEventListener('fileRemoved', this.handleFileRemoved);
    }

    handleFileUploaded(event) {
        console.log('OCRControls: Received fileUploaded event:', event.detail);
        
        const { files } = event.detail;
        
        // Extract file IDs
        this.fileIds = files.map(file => file.fileId || file.id);
        console.log('OCRControls: Updated fileIds:', this.fileIds);
        
        // Update UI
        this.updateFileStatus(this.fileIds.length);
        
        // Enable buttons if files are available
        const processBtn = this.shadowRoot?.getElementById('processButton');
        const previewBtn = this.shadowRoot?.getElementById('previewButton');
        if (processBtn && previewBtn && this.fileIds.length > 0) {
            processBtn.disabled = false;
            previewBtn.disabled = false;
            console.log('OCRControls: Enabled OCR buttons');
        }
    }

    handleFilesCleared(event) {
        console.log('OCRControls: Received filesCleared event');
        
        this.fileIds = [];
        this.updateFileStatus(0);
        
        // Disable buttons
        const processBtn = this.shadowRoot?.getElementById('processButton');
        const previewBtn = this.shadowRoot?.getElementById('previewButton');
        if (processBtn && previewBtn) {
            processBtn.disabled = true;
            previewBtn.disabled = true;
            console.log('OCRControls: Disabled OCR buttons');
        }
    }

    handleFileRemoved(event) {
        console.log('OCRControls: Received fileRemoved event:', event.detail);
        
        // Refresh file count from file uploader component
        const fileUploader = document.querySelector('file-uploader');
        if (fileUploader && fileUploader.getSelectedFiles) {
            const currentFiles = fileUploader.getSelectedFiles();
            this.fileIds = currentFiles.map(file => file.fileId || `file_${Date.now()}`);
            this.updateFileStatus(this.fileIds.length);
            
            const processBtn = this.shadowRoot?.getElementById('processButton');
            const previewBtn = this.shadowRoot?.getElementById('previewButton');
            if (processBtn && previewBtn) {
                const hasFiles = this.fileIds.length > 0;
                processBtn.disabled = !hasFiles;
                previewBtn.disabled = !hasFiles;
            }
        }
    }

    updateFileStatus(count) {
        const fileCountElement = this.shadowRoot?.querySelector('.file-count');
        if (fileCountElement) {
            fileCountElement.textContent = count;
            console.log(`OCRControls: Updated file count display to ${count}`);
        }
    }

    setupEventListeners() {
        // Language selection
        const languageSelect = this.shadowRoot.getElementById('languageSelect');
        languageSelect.addEventListener('change', (e) => {
            this.ocrOptions.language = e.target.value;
            this.dispatchEvent(new CustomEvent('options-changed', {
                detail: { options: this.ocrOptions },
                bubbles: true
            }));
        });

        // Output format selection
        const outputFormatSelect = this.shadowRoot.getElementById('outputFormatSelect');
        outputFormatSelect.addEventListener('change', (e) => {
            this.ocrOptions.outputFormat = e.target.value;
            this.dispatchEvent(new CustomEvent('options-changed', {
                detail: { options: this.ocrOptions },
                bubbles: true
            }));
        });

        // Quality selection
        const qualitySelect = this.shadowRoot.getElementById('qualitySelect');
        qualitySelect.addEventListener('change', (e) => {
            this.ocrOptions.quality = e.target.value;
            this.dispatchEvent(new CustomEvent('options-changed', {
                detail: { options: this.ocrOptions },
                bubbles: true
            }));
        });

        // Option checkboxes
        const checkboxes = this.shadowRoot.querySelectorAll('.option-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('click', () => {
                checkbox.classList.toggle('checked');
                const option = checkbox.dataset.option;
                this.ocrOptions[option] = checkbox.classList.contains('checked');
                
                this.dispatchEvent(new CustomEvent('options-changed', {
                    detail: { options: this.ocrOptions },
                    bubbles: true
                }));
            });
        });

        // Process button - emits serviceStartRequest
        const processButton = this.shadowRoot.getElementById('processButton');
        processButton.addEventListener('click', () => {
            console.log('OCRControls: Process button clicked, fileIds:', this.fileIds);
            
            if (this.fileIds.length === 0) {
                this.showError('No files available. Please upload files first.');
                return;
            }

            console.log('OCRControls: Emitting serviceStartRequest with options:', this.ocrOptions);

            // Emit serviceStartRequest event according to new architecture
            this.dispatchEvent(new CustomEvent('serviceStartRequest', {
                detail: {
                    serviceType: 'ocr',
                    options: this.ocrOptions,
                    fileIds: this.fileIds
                },
                bubbles: true,
                composed: true
            }));
        });

        // Preview button - emits preview request
        const previewButton = this.shadowRoot.getElementById('previewButton');
        previewButton.addEventListener('click', () => {
            console.log('OCRControls: Preview button clicked, fileIds:', this.fileIds);
            
            if (this.fileIds.length === 0) {
                this.showError('No files available. Please upload files first.');
                return;
            }

            this.dispatchEvent(new CustomEvent('ocr-preview-requested', {
                detail: { 
                    options: this.ocrOptions,
                    fileIds: this.fileIds
                },
                bubbles: true,
                composed: true
            }));
        });
    }

    showError(message) {
        // Remove any existing error messages
        const existingError = this.shadowRoot.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const actionGroup = this.shadowRoot.querySelector('.action-group');
        actionGroup.appendChild(errorDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }

    // Public API methods
    setFileIds(fileIds) {
        console.log('OCRControls: setFileIds called with:', fileIds);
        this.fileIds = fileIds;
        this.updateFileStatus(fileIds.length);
        
        const processBtn = this.shadowRoot?.getElementById('processButton');
        const previewBtn = this.shadowRoot?.getElementById('previewButton');
        if (processBtn && previewBtn) {
            const hasFiles = fileIds.length > 0;
            processBtn.disabled = !hasFiles;
            previewBtn.disabled = !hasFiles;
        }
    }

    getFileIds() {
        return this.fileIds;
    }

    setEnabled(enabled) {
        const processButton = this.shadowRoot.getElementById('processButton');
        const previewButton = this.shadowRoot.getElementById('previewButton');
        if (processButton && previewButton) {
            processButton.disabled = !enabled;
            previewButton.disabled = !enabled;
        }
    }

    setProcessing(processing) {
        const processButton = this.shadowRoot.getElementById('processButton');
        const previewButton = this.shadowRoot.getElementById('previewButton');
        const processIcon = processButton?.querySelector('.button-icon');
        const processText = processButton?.querySelector('span:last-child');
        
        if (processing) {
            processButton.disabled = true;
            previewButton.disabled = true;
            processButton.classList.add('processing');
            if (processIcon) processIcon.textContent = '⏳';
            if (processText) processText.textContent = 'Processing...';
        } else {
            const hasFiles = this.fileIds.length > 0;
            processButton.disabled = !hasFiles;
            previewButton.disabled = !hasFiles;
            processButton.classList.remove('processing');
            if (processIcon) processIcon.textContent = '👁️';
            if (processText) processText.textContent = 'Process OCR';
        }
    }

    getOCROptions() {
        return { ...this.ocrOptions };
    }

    getSettings() {
        return { ...this.ocrOptions };
    }

    setLanguage(language) {
        this.ocrOptions.language = language;
        const languageSelect = this.shadowRoot.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = language;
        }
    }

    setOutputFormat(format) {
        this.ocrOptions.outputFormat = format;
        const outputFormatSelect = this.shadowRoot.getElementById('outputFormatSelect');
        if (outputFormatSelect) {
            outputFormatSelect.value = format;
        }
    }
}

customElements.define('ocr-controls', OCRControls);