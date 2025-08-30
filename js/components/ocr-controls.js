/**
 * OCR Controls Component
 * Provides controls for OCR processing options
 */

class OCRControls extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.ocrOptions = {
            language: 'en',
            outputFormat: 'searchable_pdf',
            quality: 'high',
            extractTables: true,
            preserveLayout: true,
            detectColumns: false,
            enhanceImages: false
        };
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .controls-container {
                    background: white;
                    border-radius: var(--radius-xl, 12px);
                    padding: var(--space-6, 24px);
                    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
                    border: 1px solid var(--gray-200, #e5e7eb);
                }

                .controls-header {
                    margin-bottom: var(--space-6, 24px);
                    text-align: center;
                }

                .controls-title {
                    font-size: var(--text-xl, 20px);
                    font-weight: var(--font-semibold, 600);
                    color: var(--gray-900, #111827);
                    margin: 0 0 var(--space-2, 8px) 0;
                }

                .controls-subtitle {
                    font-size: var(--text-sm, 14px);
                    color: var(--gray-600, #4b5563);
                    margin: 0;
                }

                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--space-4, 16px);
                    margin-bottom: var(--space-6, 24px);
                }

                .setting-group {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-2, 8px);
                }

                .setting-label {
                    font-size: var(--text-sm, 14px);
                    font-weight: var(--font-medium, 500);
                    color: var(--gray-700, #374151);
                }

                .setting-select {
                    padding: var(--space-3, 12px);
                    border: 1px solid var(--gray-300, #d1d5db);
                    border-radius: var(--radius-md, 6px);
                    font-size: var(--text-sm, 14px);
                    background: white;
                    color: var(--gray-700, #374151);
                }

                .setting-select:focus {
                    outline: none;
                    border-color: var(--blue-500, #3b82f6);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .language-option {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2, 8px);
                }

                .language-flag {
                    font-size: 16px;
                }

                .processing-options {
                    margin-bottom: var(--space-6, 24px);
                }

                .section-label {
                    font-size: var(--text-base, 16px);
                    font-weight: var(--font-medium, 500);
                    color: var(--gray-800, #1f2937);
                    margin-bottom: var(--space-3, 12px);
                    display: block;
                }

                .options-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--space-4, 16px);
                }

                .option-item {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3, 12px);
                    padding: var(--space-3, 12px);
                    border: 1px solid var(--gray-200, #e5e7eb);
                    border-radius: var(--radius-md, 6px);
                    background: var(--gray-50, #f9fafb);
                }

                .option-checkbox {
                    width: 18px;
                    height: 18px;
                    border: 2px solid var(--gray-300, #d1d5db);
                    border-radius: var(--radius-sm, 4px);
                    position: relative;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .option-checkbox.checked {
                    background: var(--blue-500, #3b82f6);
                    border-color: var(--blue-500, #3b82f6);
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
                    font-size: var(--text-sm, 14px);
                    color: var(--gray-700, #374151);
                    cursor: pointer;
                    flex: 1;
                }

                .action-buttons {
                    display: flex;
                    gap: var(--space-3, 12px);
                    flex-wrap: wrap;
                }

                .ocr-button {
                    flex: 1;
                    min-width: 140px;
                    padding: var(--space-4, 16px);
                    border: none;
                    border-radius: var(--radius-lg, 8px);
                    font-size: var(--text-base, 16px);
                    font-weight: var(--font-semibold, 600);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--space-2, 8px);
                }

                .process-button {
                    background: var(--blue-600, #2563eb);
                    color: white;
                }

                .process-button:hover:not(:disabled) {
                    background: var(--blue-700, #1d4ed8);
                    transform: translateY(-1px);
                }

                .preview-button {
                    background: var(--green-600, #16a34a);
                    color: white;
                }

                .preview-button:hover:not(:disabled) {
                    background: var(--green-700, #15803d);
                    transform: translateY(-1px);
                }

                .ocr-button:disabled {
                    background: var(--gray-400, #9ca3af);
                    cursor: not-allowed;
                    transform: none;
                }

                .button-icon {
                    font-size: 18px;
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
            </style>

            <div class="controls-container">
                <div class="controls-header">
                    <h3 class="controls-title">OCR Processing</h3>
                    <p class="controls-subtitle">Extract text from scanned documents and images</p>
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
        `;
    }

    setupEventListeners() {
        // Language selection
        const languageSelect = this.shadowRoot.getElementById('languageSelect');
        languageSelect.addEventListener('change', (e) => {
            this.ocrOptions.language = e.target.value;
            this.dispatchEvent(new CustomEvent('options-changed', {
                detail: { options: this.ocrOptions }
            }));
        });

        // Output format selection
        const outputFormatSelect = this.shadowRoot.getElementById('outputFormatSelect');
        outputFormatSelect.addEventListener('change', (e) => {
            this.ocrOptions.outputFormat = e.target.value;
            this.dispatchEvent(new CustomEvent('options-changed', {
                detail: { options: this.ocrOptions }
            }));
        });

        // Quality selection
        const qualitySelect = this.shadowRoot.getElementById('qualitySelect');
        qualitySelect.addEventListener('change', (e) => {
            this.ocrOptions.quality = e.target.value;
            this.dispatchEvent(new CustomEvent('options-changed', {
                detail: { options: this.ocrOptions }
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
                    detail: { options: this.ocrOptions }
                }));
            });
        });

        // Action buttons
        const processButton = this.shadowRoot.getElementById('processButton');
        const previewButton = this.shadowRoot.getElementById('previewButton');

        processButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('ocr-process-requested', {
                detail: { options: this.ocrOptions }
            }));
        });

        previewButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('ocr-preview-requested', {
                detail: { options: this.ocrOptions }
            }));
        });
    }

    setEnabled(enabled) {
        const processButton = this.shadowRoot.getElementById('processButton');
        const previewButton = this.shadowRoot.getElementById('previewButton');
        processButton.disabled = !enabled;
        previewButton.disabled = !enabled;
    }

    setProcessing(processing) {
        const processButton = this.shadowRoot.getElementById('processButton');
        const previewButton = this.shadowRoot.getElementById('previewButton');
        const processIcon = processButton.querySelector('.button-icon');
        const processText = processButton.querySelector('span:last-child');
        
        if (processing) {
            processButton.disabled = true;
            previewButton.disabled = true;
            processIcon.textContent = '⏳';
            processText.textContent = 'Processing...';
        } else {
            processButton.disabled = false;
            previewButton.disabled = false;
            processIcon.textContent = '👁️';
            processText.textContent = 'Process OCR';
        }
    }

    getOCROptions() {
        return { ...this.ocrOptions };
    }

    setLanguage(language) {
        this.ocrOptions.language = language;
        const languageSelect = this.shadowRoot.getElementById('languageSelect');
        languageSelect.value = language;
    }

    setOutputFormat(format) {
        this.ocrOptions.outputFormat = format;
        const outputFormatSelect = this.shadowRoot.getElementById('outputFormatSelect');
        outputFormatSelect.value = format;
    }
}

customElements.define('ocr-controls', OCRControls);