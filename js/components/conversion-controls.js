/**
 * Conversion Controls Component
 * Provides controls for PDF conversion options
 */

class ConversionControls extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.selectedFormat = 'docx';
        this.conversionOptions = {
            preserveLayout: true,
            extractTables: true,
            includeImages: true,
            quality: 'high'
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

                .format-selection {
                    margin-bottom: var(--space-6, 24px);
                }

                .section-label {
                    font-size: var(--text-base, 16px);
                    font-weight: var(--font-medium, 500);
                    color: var(--gray-800, #1f2937);
                    margin-bottom: var(--space-3, 12px);
                    display: block;
                }

                .format-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: var(--space-3, 12px);
                }

                .format-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: var(--space-4, 16px);
                    border: 2px solid var(--gray-200, #e5e7eb);
                    border-radius: var(--radius-lg, 8px);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: white;
                    text-align: center;
                }

                .format-option:hover {
                    border-color: var(--blue-300, #93c5fd);
                    background: var(--blue-50, #eff6ff);
                }

                .format-option.selected {
                    border-color: var(--blue-500, #3b82f6);
                    background: var(--blue-50, #eff6ff);
                    box-shadow: 0 0 0 1px var(--blue-500, #3b82f6);
                }

                .format-icon {
                    font-size: 24px;
                    margin-bottom: var(--space-2, 8px);
                }

                .format-name {
                    font-size: var(--text-sm, 14px);
                    font-weight: var(--font-medium, 500);
                    color: var(--gray-700, #374151);
                    margin-bottom: var(--space-1, 4px);
                }

                .format-ext {
                    font-size: var(--text-xs, 12px);
                    color: var(--gray-500, #6b7280);
                }

                .conversion-options {
                    margin-bottom: var(--space-6, 24px);
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

                .quality-section {
                    margin-bottom: var(--space-6, 24px);
                }

                .quality-select {
                    width: 100%;
                    padding: var(--space-3, 12px);
                    border: 1px solid var(--gray-300, #d1d5db);
                    border-radius: var(--radius-md, 6px);
                    font-size: var(--text-sm, 14px);
                    background: white;
                    color: var(--gray-700, #374151);
                }

                .quality-select:focus {
                    outline: none;
                    border-color: var(--blue-500, #3b82f6);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .convert-button {
                    width: 100%;
                    padding: var(--space-4, 16px);
                    background: var(--blue-600, #2563eb);
                    color: white;
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

                .convert-button:hover:not(:disabled) {
                    background: var(--blue-700, #1d4ed8);
                    transform: translateY(-1px);
                }

                .convert-button:disabled {
                    background: var(--gray-400, #9ca3af);
                    cursor: not-allowed;
                    transform: none;
                }

                .convert-icon {
                    font-size: 18px;
                }

                @media (max-width: 768px) {
                    .format-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .options-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>

            <div class="controls-container">
                <div class="controls-header">
                    <h3 class="controls-title">Convert PDF</h3>
                    <p class="controls-subtitle">Choose your target format and conversion options</p>
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

                <button class="convert-button" id="convertButton" disabled>
                    <span class="convert-icon">🔄</span>
                    <span>Convert to Word</span>
                </button>
            </div>
        `;
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
                    detail: { format: this.selectedFormat }
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
                    detail: { options: this.conversionOptions }
                }));
            });
        });

        // Quality selection
        const qualitySelect = this.shadowRoot.getElementById('qualitySelect');
        qualitySelect.addEventListener('change', (e) => {
            this.conversionOptions.quality = e.target.value;
            this.dispatchEvent(new CustomEvent('options-changed', {
                detail: { options: this.conversionOptions }
            }));
        });

        // Convert button
        const convertButton = this.shadowRoot.getElementById('convertButton');
        convertButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('convert-requested', {
                detail: {
                    format: this.selectedFormat,
                    options: this.conversionOptions
                }
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
        
        button.querySelector('span:last-child').textContent = `Convert to ${formatNames[this.selectedFormat]}`;
    }

    setEnabled(enabled) {
        const button = this.shadowRoot.getElementById('convertButton');
        button.disabled = !enabled;
    }

    setProcessing(processing) {
        const button = this.shadowRoot.getElementById('convertButton');
        const icon = button.querySelector('.convert-icon');
        const text = button.querySelector('span:last-child');
        
        if (processing) {
            button.disabled = true;
            icon.textContent = '⏳';
            text.textContent = 'Converting...';
        } else {
            button.disabled = false;
            icon.textContent = '🔄';
            this.updateConvertButton();
        }
    }

    getSelectedFormat() {
        return this.selectedFormat;
    }

    getConversionOptions() {
        return { ...this.conversionOptions };
    }
}

customElements.define('conversion-controls', ConversionControls);