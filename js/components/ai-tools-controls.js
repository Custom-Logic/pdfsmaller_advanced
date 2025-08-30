/**
 * AI Tools Controls Component
 * Provides controls for AI-powered features like summarization and analysis
 */

class AIToolsControls extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selectedTool = 'summarize';
    this.aiOptions = {
      summarize: {
        style: 'concise',
        length: 'medium',
        includeKeyPoints: true,
        includeMetadata: false
      },
      translate: {
        targetLanguage: 'es',
        quality: 'high',
        preserveFormatting: true
      },
      analyze: {
        analysisType: 'content',
        includeStatistics: true,
        generateInsights: true
      }
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

                .tool-selection {
                    margin-bottom: var(--space-6, 24px);
                }

                .section-label {
                    font-size: var(--text-base, 16px);
                    font-weight: var(--font-medium, 500);
                    color: var(--gray-800, #1f2937);
                    margin-bottom: var(--space-3, 12px);
                    display: block;
                }

                .tool-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: var(--space-3, 12px);
                }

                .tool-option {
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

                .tool-option:hover {
                    border-color: var(--purple-300, #c4b5fd);
                    background: var(--purple-50, #faf5ff);
                }

                .tool-option.selected {
                    border-color: var(--purple-500, #8b5cf6);
                    background: var(--purple-50, #faf5ff);
                    box-shadow: 0 0 0 1px var(--purple-500, #8b5cf6);
                }

                .tool-icon {
                    font-size: 28px;
                    margin-bottom: var(--space-2, 8px);
                }

                .tool-name {
                    font-size: var(--text-sm, 14px);
                    font-weight: var(--font-medium, 500);
                    color: var(--gray-700, #374151);
                    margin-bottom: var(--space-1, 4px);
                }

                .tool-description {
                    font-size: var(--text-xs, 12px);
                    color: var(--gray-500, #6b7280);
                    line-height: 1.3;
                }

                .tool-options {
                    margin-bottom: var(--space-6, 24px);
                }

                .options-content {
                    background: var(--gray-50, #f9fafb);
                    border: 1px solid var(--gray-200, #e5e7eb);
                    border-radius: var(--radius-lg, 8px);
                    padding: var(--space-4, 16px);
                }

                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--space-4, 16px);
                    margin-bottom: var(--space-4, 16px);
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
                    border-color: var(--purple-500, #8b5cf6);
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                }

                .checkbox-options {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--space-3, 12px);
                }

                .checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2, 8px);
                    padding: var(--space-2, 8px);
                    border-radius: var(--radius-md, 6px);
                }

                .checkbox {
                    width: 16px;
                    height: 16px;
                    border: 2px solid var(--gray-300, #d1d5db);
                    border-radius: var(--radius-sm, 4px);
                    position: relative;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .checkbox.checked {
                    background: var(--purple-500, #8b5cf6);
                    border-color: var(--purple-500, #8b5cf6);
                }

                .checkbox.checked::after {
                    content: '✓';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                }

                .checkbox-label {
                    font-size: var(--text-sm, 14px);
                    color: var(--gray-700, #374151);
                    cursor: pointer;
                    flex: 1;
                }

                .action-button {
                    width: 100%;
                    padding: var(--space-4, 16px);
                    background: var(--purple-600, #7c3aed);
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

                .action-button:hover:not(:disabled) {
                    background: var(--purple-700, #6d28d9);
                    transform: translateY(-1px);
                }

                .action-button:disabled {
                    background: var(--gray-400, #9ca3af);
                    cursor: not-allowed;
                    transform: none;
                }

                .button-icon {
                    font-size: 18px;
                }

                .hidden {
                    display: none;
                }

                @media (max-width: 768px) {
                    .tool-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .settings-grid {
                        grid-template-columns: 1fr;
                    }

                    .checkbox-options {
                        grid-template-columns: 1fr;
                    }
                }
            </style>

            <div class="controls-container">
                <div class="controls-header">
                    <h3 class="controls-title">AI Tools</h3>
                    <p class="controls-subtitle">Leverage AI to analyze and enhance your documents</p>
                </div>

                <div class="tool-selection">
                    <label class="section-label">Select AI Tool</label>
                    <div class="tool-grid">
                        <div class="tool-option selected" data-tool="summarize">
                            <div class="tool-icon">📝</div>
                            <div class="tool-name">Summarize</div>
                            <div class="tool-description">Create intelligent summaries</div>
                        </div>
                        <div class="tool-option" data-tool="translate">
                            <div class="tool-icon">🌐</div>
                            <div class="tool-name">Translate</div>
                            <div class="tool-description">Multi-language translation</div>
                        </div>
                        <div class="tool-option" data-tool="analyze">
                            <div class="tool-icon">🔍</div>
                            <div class="tool-name">Analyze</div>
                            <div class="tool-description">Content analysis & insights</div>
                        </div>
                    </div>
                </div>

                <div class="tool-options">
                    <label class="section-label">Tool Options</label>
                    
                    <!-- Summarize Options -->
                    <div class="options-content" id="summarizeOptions">
                        <div class="settings-grid">
                            <div class="setting-group">
                                <label class="setting-label" for="summaryStyle">Summary Style</label>
                                <select class="setting-select" id="summaryStyle">
                                    <option value="concise">Concise</option>
                                    <option value="detailed">Detailed</option>
                                    <option value="academic">Academic</option>
                                    <option value="casual">Casual</option>
                                    <option value="professional">Professional</option>
                                </select>
                            </div>
                            <div class="setting-group">
                                <label class="setting-label" for="summaryLength">Length</label>
                                <select class="setting-select" id="summaryLength">
                                    <option value="short">Short (100-200 words)</option>
                                    <option value="medium" selected>Medium (200-500 words)</option>
                                    <option value="long">Long (500-1000 words)</option>
                                </select>
                            </div>
                        </div>
                        <div class="checkbox-options">
                            <div class="checkbox-item">
                                <div class="checkbox checked" data-option="includeKeyPoints"></div>
                                <label class="checkbox-label">Include Key Points</label>
                            </div>
                            <div class="checkbox-item">
                                <div class="checkbox" data-option="includeMetadata"></div>
                                <label class="checkbox-label">Include Metadata</label>
                            </div>
                        </div>
                    </div>

                    <!-- Translate Options -->
                    <div class="options-content hidden" id="translateOptions">
                        <div class="settings-grid">
                            <div class="setting-group">
                                <label class="setting-label" for="targetLanguage">Target Language</label>
                                <select class="setting-select" id="targetLanguage">
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
                                </select>
                            </div>
                            <div class="setting-group">
                                <label class="setting-label" for="translationQuality">Quality</label>
                                <select class="setting-select" id="translationQuality">
                                    <option value="standard">Standard</option>
                                    <option value="high" selected>High Quality</option>
                                    <option value="premium">Premium</option>
                                </select>
                            </div>
                        </div>
                        <div class="checkbox-options">
                            <div class="checkbox-item">
                                <div class="checkbox checked" data-option="preserveFormatting"></div>
                                <label class="checkbox-label">Preserve Formatting</label>
                            </div>
                        </div>
                    </div>

                    <!-- Analyze Options -->
                    <div class="options-content hidden" id="analyzeOptions">
                        <div class="settings-grid">
                            <div class="setting-group">
                                <label class="setting-label" for="analysisType">Analysis Type</label>
                                <select class="setting-select" id="analysisType">
                                    <option value="content">Content Analysis</option>
                                    <option value="sentiment">Sentiment Analysis</option>
                                    <option value="structure">Document Structure</option>
                                    <option value="readability">Readability Analysis</option>
                                </select>
                            </div>
                        </div>
                        <div class="checkbox-options">
                            <div class="checkbox-item">
                                <div class="checkbox checked" data-option="includeStatistics"></div>
                                <label class="checkbox-label">Include Statistics</label>
                            </div>
                            <div class="checkbox-item">
                                <div class="checkbox checked" data-option="generateInsights"></div>
                                <label class="checkbox-label">Generate Insights</label>
                            </div>
                        </div>
                    </div>
                </div>

                <button class="action-button" id="actionButton" disabled>
                    <span class="button-icon">🚀</span>
                    <span>Generate Summary</span>
                </button>
            </div>
        `;
  }

  setupEventListeners() {
    // Tool selection
    const toolOptions = this.shadowRoot.querySelectorAll('.tool-option');
    toolOptions.forEach(option => {
      option.addEventListener('click', () => {
        toolOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedTool = option.dataset.tool;
        this.showToolOptions(this.selectedTool);
        this.updateActionButton();
        this.dispatchEvent(new CustomEvent('tool-changed', {
          detail: { tool: this.selectedTool }
        }));
      });
    });

    // Summarize options
    this.shadowRoot.getElementById('summaryStyle').addEventListener('change', (e) => {
      this.aiOptions.summarize.style = e.target.value;
      this.dispatchOptionsChanged();
    });

    this.shadowRoot.getElementById('summaryLength').addEventListener('change', (e) => {
      this.aiOptions.summarize.length = e.target.value;
      this.dispatchOptionsChanged();
    });

    // Translate options
    this.shadowRoot.getElementById('targetLanguage').addEventListener('change', (e) => {
      this.aiOptions.translate.targetLanguage = e.target.value;
      this.dispatchOptionsChanged();
    });

    this.shadowRoot.getElementById('translationQuality').addEventListener('change', (e) => {
      this.aiOptions.translate.quality = e.target.value;
      this.dispatchOptionsChanged();
    });

    // Analyze options
    this.shadowRoot.getElementById('analysisType').addEventListener('change', (e) => {
      this.aiOptions.analyze.analysisType = e.target.value;
      this.dispatchOptionsChanged();
    });

    // Checkboxes
    const checkboxes = this.shadowRoot.querySelectorAll('.checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('click', () => {
        checkbox.classList.toggle('checked');
        const option = checkbox.dataset.option;
        const isChecked = checkbox.classList.contains('checked');
                
        // Update the appropriate tool options
        if (this.selectedTool === 'summarize') {
          this.aiOptions.summarize[option] = isChecked;
        } else if (this.selectedTool === 'translate') {
          this.aiOptions.translate[option] = isChecked;
        } else if (this.selectedTool === 'analyze') {
          this.aiOptions.analyze[option] = isChecked;
        }
                
        this.dispatchOptionsChanged();
      });
    });

    // Action button
    const actionButton = this.shadowRoot.getElementById('actionButton');
    actionButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('ai-process-requested', {
        detail: {
          tool: this.selectedTool,
          options: this.aiOptions[this.selectedTool]
        }
      }));
    });
  }

  showToolOptions(tool) {
    // Hide all option panels
    const optionPanels = this.shadowRoot.querySelectorAll('.options-content');
    optionPanels.forEach(panel => panel.classList.add('hidden'));

    // Show the selected tool's options
    const selectedPanel = this.shadowRoot.getElementById(`${tool}Options`);
    if (selectedPanel) {
      selectedPanel.classList.remove('hidden');
    }
  }

  updateActionButton() {
    const button = this.shadowRoot.getElementById('actionButton');
    const buttonText = button.querySelector('span:last-child');
    const buttonIcon = button.querySelector('.button-icon');

    const buttonConfig = {
      summarize: { text: 'Generate Summary', icon: '📝' },
      translate: { text: 'Translate Document', icon: '🌐' },
      analyze: { text: 'Analyze Document', icon: '🔍' }
    };

    const config = buttonConfig[this.selectedTool];
    buttonText.textContent = config.text;
    buttonIcon.textContent = config.icon;
  }

  dispatchOptionsChanged() {
    this.dispatchEvent(new CustomEvent('options-changed', {
      detail: {
        tool: this.selectedTool,
        options: this.aiOptions[this.selectedTool]
      }
    }));
  }

  setEnabled(enabled) {
    const actionButton = this.shadowRoot.getElementById('actionButton');
    actionButton.disabled = !enabled;
  }

  setProcessing(processing) {
    const actionButton = this.shadowRoot.getElementById('actionButton');
    const buttonIcon = actionButton.querySelector('.button-icon');
    const buttonText = actionButton.querySelector('span:last-child');
        
    if (processing) {
      actionButton.disabled = true;
      buttonIcon.textContent = '⏳';
      buttonText.textContent = 'Processing...';
    } else {
      actionButton.disabled = false;
      this.updateActionButton();
    }
  }

  getSelectedTool() {
    return this.selectedTool;
  }

  getToolOptions(tool = this.selectedTool) {
    return { ...this.aiOptions[tool] };
  }

  getAllOptions() {
    return {
      selectedTool: this.selectedTool,
      options: { ...this.aiOptions }
    };
  }
}

customElements.define('ai-tools-controls', AIToolsControls);