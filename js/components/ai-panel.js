/**
 * AI Panel Component
 * Provides AI-powered features: PDF summarization and translation
 */

import { BaseComponent } from './base-component.js';
import { getService } from '../services/extended-features-index.js';

export class AIPanel extends BaseComponent {
    constructor() {
        super();
        this.aiService = null;
        this.currentFile = null;
        this.processing = false;
        this.history = [];
        
        this.summaryStyles = [
            { id: 'concise', name: 'Concise', description: 'Brief summary with key points' },
            { id: 'detailed', name: 'Detailed', description: 'Comprehensive summary with examples' },
            { id: 'academic', name: 'Academic', description: 'Formal summary suitable for research' },
            { id: 'casual', name: 'Casual', description: 'Informal summary for general reading' },
            { id: 'professional', name: 'Professional', description: 'Business-focused summary' }
        ];
        
        this.supportedLanguages = [
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'es', name: 'Spanish', flag: '🇪🇸' },
            { code: 'fr', name: 'French', flag: '🇫🇷' },
            { code: 'de', name: 'German', flag: '🇩🇪' },
            { code: 'it', name: 'Italian', flag: '🇮🇹' },
            { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
            { code: 'ru', name: 'Russian', flag: '🇷🇺' },
            { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
            { code: 'ko', name: 'Korean', flag: '🇰🇷' },
            { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
            { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
            { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
        ];
    }

    async init() {
        try {
            this.aiService = getService('ai');
            if (!this.aiService) {
                console.warn('AI Service not available');
            }
            await this.loadHistory();
        } catch (error) {
            console.error('Failed to initialize AI Panel:', error);
        }
    }

    getTemplate() {
        return `
            <div class="ai-panel">
                <div class="panel-header">
                    <h2>🤖 AI Features</h2>
                    <p>Leverage artificial intelligence to analyze and process your PDFs</p>
                </div>
                
                <div class="ai-features">
                    <div class="feature-section">
                        <h3>📄 PDF Summarization</h3>
                        <p>Extract key insights and create intelligent summaries</p>
                        
                        <div class="file-upload-area" id="summaryUpload">
                            <div class="upload-placeholder">
                                <span class="upload-icon">📁</span>
                                <p>Drop PDF here or click to browse</p>
                                <small>Supports PDF files up to 50MB</small>
                            </div>
                            <input type="file" id="summaryFileInput" accept=".pdf" hidden>
                        </div>
                        
                        <div class="summary-options" id="summaryOptions" style="display: none;">
                            <h4>Summary Options</h4>
                            <div class="options-grid">
                                <div class="option-group">
                                    <label>Summary Style:</label>
                                    <select id="summaryStyle">
                                        ${this.summaryStyles.map(style => 
                                            `<option value="${style.id}">${style.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="option-group">
                                    <label>Max Length:</label>
                                    <select id="summaryLength">
                                        <option value="short">Short (100-200 words)</option>
                                        <option value="medium" selected>Medium (200-500 words)</option>
                                        <option value="long">Long (500-1000 words)</option>
                                    </select>
                                </div>
                            </div>
                            <button class="ai-action-btn" id="generateSummary" disabled>
                                🚀 Generate Summary
                            </button>
                        </div>
                    </div>
                    
                    <div class="feature-section">
                        <h3>🌐 PDF Translation</h3>
                        <p>Translate PDF content into multiple languages</p>
                        
                        <div class="file-upload-area" id="translationUpload">
                            <div class="upload-placeholder">
                                <span class="upload-icon">📁</span>
                                <p>Drop PDF here or click to browse</p>
                                <small>Supports PDF files up to 50MB</small>
                            </div>
                            <input type="file" id="translationFileInput" accept=".pdf" hidden>
                        </div>
                        
                        <div class="translation-options" id="translationOptions" style="display: none;">
                            <h4>Translation Options</h4>
                            <div class="options-grid">
                                <div class="option-group">
                                    <label>Target Language:</label>
                                    <select id="targetLanguage">
                                        ${this.supportedLanguages.map(lang => 
                                            `<option value="${lang.code}">${lang.flag} ${lang.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="option-group">
                                    <label>Translation Quality:</label>
                                    <select id="translationQuality">
                                        <option value="standard">Standard (Fast)</option>
                                        <option value="high" selected>High Quality</option>
                                        <option value="premium">Premium (Best)</option>
                                    </select>
                                </div>
                            </div>
                            <button class="ai-action-btn" id="translatePDF" disabled>
                                🌐 Translate PDF
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="ai-results" id="aiResults" style="display: none;">
                    <h3>Results</h3>
                    <div class="results-content" id="resultsContent"></div>
                </div>
                
                <div class="ai-history" id="aiHistory" style="display: none;">
                    <h3>Recent AI Operations</h3>
                    <div class="history-list" id="historyList"></div>
                </div>
            </div>
        `;
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
            .ai-panel {
                padding: 2rem;
                background: var(--bg-color, #ffffff);
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            
            .panel-header {
                text-align: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid var(--border-color, #e0e0e0);
            }
            
            .panel-header h2 {
                font-size: 2rem;
                color: var(--primary-color, #2196F3);
                margin: 0 0 0.5rem 0;
                font-weight: 600;
            }
            
            .panel-header p {
                color: var(--text-secondary, #666);
                font-size: 1.1rem;
                margin: 0;
            }
            
            .ai-features {
                display: grid;
                grid-template-columns: 1fr;
                gap: 2rem;
                margin-bottom: 2rem;
            }
            
            .feature-section {
                background: var(--card-bg, #f8f9fa);
                border: 2px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
                transition: all 0.3s ease;
            }
            
            .feature-section:hover {
                border-color: var(--primary-color, #2196F3);
                box-shadow: 0 4px 15px rgba(33, 150, 243, 0.1);
            }
            
            .feature-section h3 {
                font-size: 1.4rem;
                color: var(--text-color, #333);
                margin: 0 0 0.5rem 0;
                font-weight: 600;
            }
            
            .feature-section p {
                color: var(--text-secondary, #666);
                margin: 0 0 1rem 0;
                line-height: 1.5;
            }
            
            .file-upload-area {
                border: 2px dashed var(--border-color, #e0e0e0);
                border-radius: 8px;
                padding: 2rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-bottom: 1rem;
            }
            
            .file-upload-area:hover {
                border-color: var(--primary-color, #2196F3);
                background: var(--primary-light, #f0f8ff);
            }
            
            .upload-placeholder {
                pointer-events: none;
            }
            
            .upload-icon {
                font-size: 3rem;
                display: block;
                margin-bottom: 1rem;
                opacity: 0.7;
            }
            
            .upload-placeholder p {
                font-size: 1.1rem;
                color: var(--text-color, #333);
                margin: 0 0 0.5rem 0;
                font-weight: 500;
            }
            
            .upload-placeholder small {
                color: var(--text-secondary, #666);
                font-size: 0.9rem;
            }
            
            .summary-options,
            .translation-options {
                background: var(--content-bg, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 8px;
                padding: 1.5rem;
                margin-top: 1rem;
            }
            
            .options-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            
            .option-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .option-group label {
                font-weight: 500;
                color: var(--text-color, #333);
                font-size: 0.9rem;
            }
            
            .option-group select {
                padding: 0.5rem;
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 6px;
                background: var(--input-bg, #ffffff);
                color: var(--text-color, #333);
                font-size: 0.9rem;
            }
            
            .ai-action-btn {
                background: var(--primary-color, #2196F3);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                font-size: 1rem;
            }
            
            .ai-action-btn:hover:not(:disabled) {
                background: var(--primary-dark, #1976D2);
                transform: translateY(-2px);
            }
            
            .ai-action-btn:disabled {
                background: var(--disabled-color, #ccc);
                cursor: not-allowed;
                transform: none;
            }
            
            .ai-results,
            .ai-history {
                background: var(--card-bg, #f8f9fa);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
                margin-top: 2rem;
            }
            
            .ai-results h3,
            .ai-history h3 {
                font-size: 1.3rem;
                color: var(--text-color, #333);
                margin: 0 0 1rem 0;
                font-weight: 600;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
                padding-bottom: 0.5rem;
            }
            
            .results-content {
                min-height: 200px;
            }
            
            .history-list {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .history-item {
                background: var(--content-bg, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 0.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .history-info h4 {
                margin: 0 0 0.25rem 0;
                font-size: 1rem;
                color: var(--text-color, #333);
            }
            
            .history-info p {
                margin: 0;
                font-size: 0.9rem;
                color: var(--text-secondary, #666);
            }
            
            .history-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .history-btn {
                padding: 0.25rem 0.5rem;
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 4px;
                background: var(--content-bg, #ffffff);
                color: var(--text-color, #333);
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.2s ease;
            }
            
            .history-btn:hover {
                background: var(--primary-color, #2196F3);
                color: white;
                border-color: var(--primary-color, #2196F3);
            }
            
            .success {
                background: var(--success-bg, #e8f5e8);
                border: 1px solid var(--success-color, #4caf50);
                border-radius: 8px;
                padding: 1rem;
                color: var(--success-color, #4caf50);
                text-align: center;
                margin-bottom: 1rem;
            }
            
            .error {
                background: var(--error-bg, #ffebee);
                border: 1px solid var(--error-color, #f44336);
                border-radius: 8px;
                padding: 1rem;
                color: var(--error-color, #f44336);
                text-align: center;
            }
            
            @media (max-width: 768px) {
                .ai-panel {
                    padding: 1rem;
                }
                
                .options-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    setupEventListeners() {
        this.setupFileUpload('summaryUpload', 'summaryFileInput', 'summaryOptions', 'generateSummary');
        this.setupFileUpload('translationUpload', 'translationFileInput', 'translationOptions', 'translatePDF');
        
        this.addEventListener(this.shadowRoot.getElementById('generateSummary'), 'click', () => {
            this.generateSummary();
        });
        
        this.addEventListener(this.shadowRoot.getElementById('translatePDF'), 'click', () => {
            this.translatePDF();
        });
    }

    setupFileUpload(uploadAreaId, fileInputId, optionsId, actionBtnId) {
        const uploadArea = this.shadowRoot.getElementById(uploadAreaId);
        const fileInput = this.shadowRoot.getElementById(fileInputId);
        const options = this.shadowRoot.getElementById(optionsId);
        const actionBtn = this.shadowRoot.getElementById(actionBtnId);
        
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelection(file, uploadArea, options, actionBtn);
            }
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                this.handleFileSelection(file, uploadArea, options, actionBtn);
            }
        });
    }

    handleFileSelection(file, uploadArea, options, actionBtn) {
        if (file.type !== 'application/pdf') {
            this.showError('Please select a valid PDF file');
            return;
        }
        
        if (file.size > 50 * 1024 * 1024) {
            this.showError('File size must be less than 50MB');
            return;
        }
        
        this.currentFile = file;
        
        uploadArea.innerHTML = `
            <div class="upload-placeholder">
                <span class="upload-icon">✅</span>
                <p>${file.name}</p>
                <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
            </div>
        `;
        
        options.style.display = 'block';
        actionBtn.disabled = false;
    }

    async generateSummary() {
        if (!this.currentFile || this.processing) return;
        
        try {
            this.processing = true;
            this.updateButtonState('generateSummary', true);
            
            const options = this.getSummaryOptions();
            
            // Emit event for MainController to handle
            document.dispatchEvent(new CustomEvent('aiProcessingRequested', {
                detail: {
                    fileId: this.currentFile.fileId || `temp_${Date.now()}`,
                    operation: 'summarize',
                    options: options
                }
            }));
            
            // Listen for completion
            const handleComplete = (event) => {
                if (event.detail.operation === 'ai') {
                    document.removeEventListener('processingComplete', handleComplete);
                    this.displayResults('summary', event.detail.result);
                    this.processing = false;
                    this.updateButtonState('generateSummary', false);
                }
            };
            
            const handleError = (event) => {
                if (event.detail.service === 'ai') {
                    document.removeEventListener('processingError', handleError);
                    this.showError(`Summary generation failed: ${event.detail.error}`);
                    this.processing = false;
                    this.updateButtonState('generateSummary', false);
                }
            };
            
            document.addEventListener('processingComplete', handleComplete);
            document.addEventListener('processingError', handleError);
            
        } catch (error) {
            console.error('Summary generation failed:', error);
            this.showError(`Summary generation failed: ${error.message}`);
            this.processing = false;
            this.updateButtonState('generateSummary', false);
        }
    }

    async translatePDF() {
        if (!this.currentFile || this.processing) return;
        
        try {
            this.processing = true;
            this.updateButtonState('translatePDF', true);
            
            const options = this.getTranslationOptions();
            const targetLanguage = this.shadowRoot.getElementById('targetLanguage').value;
            
            // Emit event for MainController to handle
            document.dispatchEvent(new CustomEvent('aiProcessingRequested', {
                detail: {
                    fileId: this.currentFile.fileId || `temp_${Date.now()}`,
                    operation: 'translate',
                    targetLanguage: targetLanguage,
                    options: options
                }
            }));
            
            // Listen for completion
            const handleComplete = (event) => {
                if (event.detail.operation === 'ai') {
                    document.removeEventListener('processingComplete', handleComplete);
                    this.displayResults('translation', event.detail.result);
                    this.processing = false;
                    this.updateButtonState('translatePDF', false);
                }
            };
            
            const handleError = (event) => {
                if (event.detail.service === 'ai') {
                    document.removeEventListener('processingError', handleError);
                    this.showError(`PDF translation failed: ${event.detail.error}`);
                    this.processing = false;
                    this.updateButtonState('translatePDF', false);
                }
            };
            
            document.addEventListener('processingComplete', handleComplete);
            document.addEventListener('processingError', handleError);
            
        } catch (error) {
            console.error('PDF translation failed:', error);
            this.showError(`PDF translation failed: ${error.message}`);
            this.processing = false;
            this.updateButtonState('translatePDF', false);
        }
    }

    getSummaryOptions() {
        const style = this.shadowRoot.getElementById('summaryStyle').value;
        const length = this.shadowRoot.getElementById('summaryLength').value;
        
        return {
            style,
            length,
            includeMetadata: true
        };
    }

    getTranslationOptions() {
        const quality = this.shadowRoot.getElementById('translationQuality').value;
        
        return {
            quality,
            preserveFormatting: ['layout', 'images', 'tables'],
            includeOriginal: true
        };
    }

    displayResults(type, result) {
        const resultsContainer = this.shadowRoot.getElementById('aiResults');
        const resultsContent = this.shadowRoot.getElementById('resultsContent');
        
        let content = '';
        
        if (type === 'summary') {
            content = `
                <div class="success">
                    <h4>✅ Summary Generated Successfully</h4>
                    <p>Generated a ${result.options.style} summary</p>
                </div>
                <div class="summary-content">
                    <h4>Summary</h4>
                    <div class="summary-text">${result.summary}</div>
                </div>
            `;
        } else if (type === 'translation') {
            content = `
                <div class="success">
                    <h4>✅ Translation Completed Successfully</h4>
                    <p>Translated to ${this.getLanguageName(result.targetLanguage)}</p>
                </div>
                <div class="translation-content">
                    <h4>Translated Content</h4>
                    <div class="translation-text">${result.translatedContent}</div>
                </div>
            `;
        }
        
        resultsContent.innerHTML = content;
        resultsContainer.style.display = 'block';
    }

    getLanguageName(code) {
        const language = this.supportedLanguages.find(lang => lang.code === code);
        return language ? language.name : code;
    }

    async loadHistory() {
        if (!this.aiService) return;
        
        try {
            // TODO: Implement history loading via events
            this.history = [];
            this.displayHistory();
        } catch (error) {
            console.error('Failed to load AI history:', error);
        }
    }

    displayHistory() {
        if (this.history.length === 0) return;
        
        const historyContainer = this.shadowRoot.getElementById('aiHistory');
        const historyList = this.shadowRoot.getElementById('historyList');
        
        const historyHTML = this.history.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <h4>${item.type === 'summarization' ? '📄 Summary' : '🌐 Translation'}</h4>
                    <p>${item.fileName} - ${new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <div class="history-actions">
                    <button class="history-btn" onclick="this.parentElement.parentElement.parentElement.viewHistoryItem('${item.id}')">
                        View
                    </button>
                </div>
            </div>
        `).join('');
        
        historyList.innerHTML = historyHTML;
        historyContainer.style.display = 'block';
    }

    updateButtonState(buttonId, loading) {
        const button = this.shadowRoot.getElementById(buttonId);
        if (loading) {
            button.disabled = true;
            button.textContent = '⏳ Processing...';
        } else {
            button.disabled = false;
            if (buttonId === 'generateSummary') {
                button.textContent = '🚀 Generate Summary';
            } else {
                button.textContent = '🌐 Translate PDF';
            }
        }
    }

    showError(message) {
        const resultsContainer = this.shadowRoot.getElementById('aiResults');
        const resultsContent = this.shadowRoot.getElementById('resultsContent');
        
        resultsContent.innerHTML = `
            <div class="error">
                <h4>❌ Error</h4>
                <p>${message}</p>
            </div>
        `;
        
        resultsContainer.style.display = 'block';
    }

    async viewHistoryItem(id) {
        try {
            // Find the item in history by id
            const item = this.history.find(historyItem => historyItem.id === id);
            
            if (!item) {
                this.showError('History item not found');
                return;
            }
            
            // TODO: Implement history item loading via events
            this.showError('History item loading not yet implemented via events');
            this.displayResults(item.type, item.result);
        } catch (error) {
            console.error('Failed to view history item:', error);
            this.showError('Failed to load history item');
        }
    }
}

customElements.define('ai-panel', AIPanel);
