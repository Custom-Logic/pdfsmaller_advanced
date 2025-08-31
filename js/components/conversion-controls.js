/**
 * Conversion Controls Component (Event-Driven Architecture)
 * Follows the same pattern as compression-controls
 */

import { BaseComponent } from './base-component.js';

export class ConversionControls extends BaseComponent {
    constructor() {
        super();
        this.fileIds = []; // Track available file IDs
        this.selectedFormat = 'docx';
        this.conversionOptions = {
            preserveLayout: true,
            extractTables: true,
            includeImages: true,
            quality: 'high'
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
                    <h3 class="controls-title">Convert PDF</h3>
                    <p class="controls-subtitle">Choose your target format and conversion options</p>
                </div>

                <div class="file-status">
                    <span class="file-count">0</span> files ready
                </div>

                <div class="format-selection">
                    <label class="section-label">Target Format</label>
                    <div class="format-grid">
                        <div class="format-option selected" data-format="docx">
                            <div class="format-icon">📄</div>
                            <div class="format-name">Word</div>
                            <div class="format-ext">.docx</div>
                        </div>
                        <div class="format-option" data-format="xlsx">
                            <div class="format-icon">📊</div>
                            <div class="format-name">Excel</div>
                            <div class="format-ext">.xlsx</div>
                        </div>
                        <div class="format-option" data-format="html">
                            <div class="format-icon">🌐</div>
                            <div class="format-name">HTML</div>
                            <div class="format-ext">.html</div>
                        </div>
                        <div class="format-option" data-format="txt">
                            <div class="format-icon">📝</div>
                            <div class="format-name">Text</div>
                            <div class="format-ext">.txt</div>
                        </div>
                    </div>
                </div>

                <div class="conversion-options">
                    <label class="section-label">Conversion Options</label>
                    <div class="options-grid">
                        <div class="option-item">
                            <div class="option-checkbox checked" data-option="preserveLayout"></div>
                            <label class="option-label">Preserve Layout</label>
                        </div>
                        <div class="option-item">
                            <div class="option-checkbox checked" data-option="extractTables"></div>
                            <label class="option-label">Extract Tables</label>
                        </div>
                        <div class="option-item">
                            <div class="option-checkbox checked" data-option="includeImages"></div>
                            <label class="option-label">Include Images</label>
                        </div>
                    </div>
                </div>

                <div class="quality-section">
                    <label class="section-label" for="qualitySelect">Quality</label>
                    <select class="quality-select" id="qualitySelect">
                        <option value="high">High Quality</option>
                        <option value="medium">Medium Quality</option>
                        <option value="low">Low Quality (Smaller files)</option>
                    </select>
                </div>

                <div class="action-group">
                    <button class="convert-button" id="convertButton" disabled>
                        <span class="convert-icon">🔄</span>
                        <span>Convert to Word</span>
                    </button>
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
            .format-selection, .conversion-options, .quality-section {
                margin-bottom: 24px;
            }
            .section-label {
                font-size: 16px;
                font-weight: 500;
                color: #1f2937;
                margin-bottom: 12px;
                display: block;
            }
            .format-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 12px;
            }
            .format-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                background: white;
                text-align: center;
            }
            .format-option:hover {
                border-color: #93c5fd;
                background: #eff6ff;
            }
            .format-option.selected {
                border-color: #3b82f6;
                background: #eff6ff;
                box-shadow: 0 0 0 1px #3b82f6;
            }
            .format-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }
            .format-name {
                font-size: 14px;
                font-weight: 500;
                color: #374151;
                margin-bottom: 4px;
            }
            .format-ext {
                font-size: 12px;
                color: #6b7280;
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
            .quality-select {
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                background: white;
                color: #374151;
            }
            .quality-select:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            .convert-button {
                width: 100%;
                padding: 16px;
                background: #2563eb;
                color: white;
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
            .convert-button:hover:not(:disabled) {
                background: #1d4ed8;
                transform: translateY(-1px);
            }
            .convert-button:disabled {
                background: #9ca3af;
                cursor: not-allowed;
                transform: none;
            }
            .convert-button.processing {
                background: #fbbf24;
                cursor: wait;
            }
            .convert-icon {
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
                .format-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                .options-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('ConversionControls: Connected, setting up event listeners');
        
        // Add event listeners for file state changes
        document.addEventListener('fileUploaded', this.handleFileUploaded);
        document.addEventListener('filesCleared', this.handleFilesCleared);
        document.addEventListener('fileRemoved', this.handleFileRemoved);
    }

    disconnectedCallback() {
        console.log('ConversionControls: Disconnected, removing event listeners');
        
        // Remove event listeners using the same bound references
        document.removeEventListener('fileUploaded', this.handleFileUploaded);
        document.removeEventListener('filesCleared', this.handleFilesCleared);
        document.removeEventListener('fileRemoved', this.handleFileRemoved);
    }

    handleFileUploaded(event) {
        console.log('ConversionControls: Received fileUploaded event:', event.detail);
        
        const { files } = event.detail;
        
        // Extract file IDs
        this.fileIds = files.map(file => file.fileId || file.id);
        console.log('ConversionControls: Updated fileIds:', this.fileIds);
        
        // Update UI
        this.updateFileStatus(this.fileIds.length);
        
        // Enable convert button if files are available
        const convertBtn = this.shadowRoot?.getElementById('convertButton');
        if (convertBtn && this.fileIds.length > 0) {
            convertBtn.disabled = false;
            console.log('ConversionControls: Enabled convert button');
        }
    }

    handleFilesCleared(event) {
        console.log('ConversionControls: Received filesCleared event');
        
        this.fileIds = [];
        this.updateFileStatus(0);
        
        // Disable convert button
        const convertBtn = this.shadowRoot?.getElementById('convertButton');
        if (convertBtn) {
            convertBtn.disabled = true;
            console.log('ConversionControls: Disabled convert button');
        }
    }

    handleFileRemoved(event) {
        console.log('ConversionControls: Received fileRemoved event:', event.detail);
        
        // Refresh file count from file uploader component
        const fileUploader = document.querySelector('file-uploader');
        if (fileUploader && fileUploader.getSelectedFiles) {
            const currentFiles = fileUploader.getSelectedFiles();
            this.fileIds = currentFiles.map(file => file.fileId || `file_${Date.now()}`);
            this.updateFileStatus(this.fileIds.length);
            
            const convertBtn = this.shadowRoot?.getElementById('convertButton');
            if (convertBtn) {
                convertBtn.disabled = this.fileIds.length === 0;
            }
        }
    }

    updateFileStatus(count) {
        const fileCountElement = this.shadowRoot?.querySelector('.file-count');
        if (fileCountElement) {
            fileCountElement.textContent = count;
            console.log(`ConversionControls: Updated file count display to ${count}`);
        }
    }

    setupEventListeners() {
        // Format selection
        const formatOptions = this.shadowRoot.querySelectorAll('.format-option');
        formatOptions.forEach(option => {
            option.addEventListener('click', () => {
                formatOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedFormat = option.dataset.format;
                this.updateConvertButton();
                
                this.dispatchEvent(new CustomEvent('format-changed', {
                    detail: { format: this.selectedFormat },
                    bubbles: true
                }));
            });
        });

        // Option checkboxes
        const checkboxes = this.shadowRoot.querySelectorAll('.option-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('click', () => {
                checkbox.classList.toggle('checked');
                const option = checkbox.dataset.option;
                this.conversionOptions[option] = checkbox.classList.contains('checked');
                
                this.dispatchEvent(new CustomEvent('options-changed', {
                    detail: { options: this.conversionOptions },
                    bubbles: true
                }));
            });
        });

        // Quality selection
        const qualitySelect = this.shadowRoot.getElementById('qualitySelect');
        qualitySelect.addEventListener('change', (e) => {
            this.conversionOptions.quality = e.target.value;
            
            this.dispatchEvent(new CustomEvent('options-changed', {
                detail: { options: this.conversionOptions },
                bubbles: true
            }));
        });

        // Convert button - now emits serviceStartRequest
        const convertButton = this.shadowRoot.getElementById('convertButton');
        convertButton.addEventListener('click', () => {
            console.log('ConversionControls: Convert button clicked, fileIds:', this.fileIds);
            
            if (this.fileIds.length === 0) {
                this.showError('No files available. Please upload files first.');
                return;
            }

            console.log('ConversionControls: Emitting serviceStartRequest with options:', {
                targetFormat: this.selectedFormat,
                conversionOptions: this.conversionOptions,
                fileIds: this.fileIds
            });

            // Emit serviceStartRequest event according to new architecture
            this.dispatchEvent(new CustomEvent('serviceStartRequest', {
                detail: {
                    serviceType: 'conversion',
                    options: {
                        targetFormat: this.selectedFormat,
                        ...this.conversionOptions
                    },
                    fileIds: this.fileIds
                },
                bubbles: true,
                composed: true
            }));
        });
    }

    updateConvertButton() {
        const button = this.shadowRoot.getElementById('convertButton');
        const formatNames = {
            docx: 'Word',
            xlsx: 'Excel', 
            html: 'HTML',
            txt: 'Text'
        };
        
        const textSpan = button.querySelector('span:last-child');
        if (textSpan) {
            textSpan.textContent = `Convert to ${formatNames[this.selectedFormat]}`;
        }
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
        console.log('ConversionControls: setFileIds called with:', fileIds);
        this.fileIds = fileIds;
        this.updateFileStatus(fileIds.length);
        
        const convertBtn = this.shadowRoot?.getElementById('convertButton');
        if (convertBtn) {
            convertBtn.disabled = fileIds.length === 0;
        }
    }

    getFileIds() {
        return this.fileIds;
    }

    setEnabled(enabled) {
        const button = this.shadowRoot.getElementById('convertButton');
        if (button) {
            button.disabled = !enabled;
        }
    }

    setProcessing(processing) {
        const button = this.shadowRoot.getElementById('convertButton');
        const icon = button?.querySelector('.convert-icon');
        const text = button?.querySelector('span:last-child');
        
        if (processing) {
            button.disabled = true;
            button.classList.add('processing');
            if (icon) icon.textContent = '⏳';
            if (text) text.textContent = 'Converting...';
        } else {
            button.disabled = this.fileIds.length === 0;
            button.classList.remove('processing');
            if (icon) icon.textContent = '🔄';
            this.updateConvertButton();
        }
    }

    getSelectedFormat() {
        return this.selectedFormat;
    }

    getConversionOptions() {
        return { ...this.conversionOptions };
    }

    getSettings() {
        return {
            targetFormat: this.selectedFormat,
            ...this.conversionOptions
        };
    }
}

customElements.define('conversion-controls', ConversionControls);