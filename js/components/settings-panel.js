/**
 * Settings Panel Component
 * Provides compression settings configuration and intelligent recommendations
 */

import { BaseComponent } from './base-component.js';

export class SettingsPanel extends BaseComponent {
    constructor() {
        super();
        this.settings = {
            compressionLevel: 'medium',
            imageQuality: 80,
            targetSize: 'auto',
            optimizationStrategy: 'balanced'
        };
        this.recommendations = null;
        this.onSettingsChange = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    margin: 20px 0;
                }

                .settings-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #e5e7eb;
                }

                .settings-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0;
                }

                .reset-button {
                    background: #f3f4f6;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    padding: 6px 12px;
                    font-size: 14px;
                    color: #6b7280;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .reset-button:hover {
                    background: #e5e7eb;
                    color: #374151;
                }

                .settings-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .setting-group {
                    display: flex;
                    flex-direction: column;
                }

                .setting-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 8px;
                }

                .setting-control {
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    background: #ffffff;
                    transition: border-color 0.2s;
                }

                .setting-control:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .setting-control select {
                    width: 100%;
                }

                .setting-control input[type="range"] {
                    width: 100%;
                }

                .quality-display {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 4px;
                }

                .recommendations-section {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 15px;
                    margin-top: 20px;
                }

                .recommendations-header {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .recommendations-icon {
                    width: 16px;
                    height: 16px;
                    fill: #3b82f6;
                }

                .recommendation-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #e2e8f0;
                }

                .recommendation-item:last-child {
                    border-bottom: none;
                }

                .recommendation-label {
                    font-size: 14px;
                    color: #374151;
                }

                .recommendation-value {
                    font-size: 14px;
                    font-weight: 500;
                    color: #059669;
                }

                .apply-recommendations {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    margin-top: 15px;
                    width: 100%;
                }

                .apply-recommendations:hover {
                    background: #2563eb;
                }

                .apply-recommendations:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                }

                .hidden {
                    display: none;
                }

                @media (max-width: 768px) {
                    .settings-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }
                }
            </style>

            <div class="settings-header">
                <h3 class="settings-title">Compression Settings</h3>
                <button class="reset-button" id="resetSettings">Reset</button>
            </div>

            <div class="settings-grid">
                <div class="setting-group">
                    <label class="setting-label" for="compressionLevel">Compression Level</label>
                    <select class="setting-control" id="compressionLevel">
                        <option value="low">Low (Best Quality)</option>
                        <option value="medium" selected>Medium (Balanced)</option>
                        <option value="high">High (Smaller Size)</option>
                        <option value="maximum">Maximum (Smallest Size)</option>
                    </select>
                </div>

                <div class="setting-group">
                    <label class="setting-label" for="imageQuality">Image Quality</label>
                    <input type="range" class="setting-control" id="imageQuality" 
                           min="10" max="100" value="80" step="5">
                    <div class="quality-display">
                        <span>10%</span>
                        <span id="qualityValue">80%</span>
                        <span>100%</span>
                    </div>
                </div>

                <div class="setting-group">
                    <label class="setting-label" for="targetSize">Target Size</label>
                    <select class="setting-control" id="targetSize">
                        <option value="auto" selected>Auto (Recommended)</option>
                        <option value="90">90% of original</option>
                        <option value="75">75% of original</option>
                        <option value="50">50% of original</option>
                        <option value="25">25% of original</option>
                    </select>
                </div>

                <div class="setting-group">
                    <label class="setting-label" for="optimizationStrategy">Optimization Strategy</label>
                    <select class="setting-control" id="optimizationStrategy">
                        <option value="balanced" selected>Balanced</option>
                        <option value="image_optimized">Image Optimized</option>
                        <option value="text_optimized">Text Optimized</option>
                        <option value="batch_optimized">Batch Optimized</option>
                    </select>
                </div>
            </div>

            <div class="recommendations-section hidden" id="recommendationsSection">
                <div class="recommendations-header">
                    <svg class="recommendations-icon" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    AI Recommendations
                </div>
                
                <div id="recommendationsList"></div>
                
                <button class="apply-recommendations" id="applyRecommendations">
                    Apply Recommendations
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        const shadow = this.shadowRoot;
        
        // Compression level change
        this.addEventListener(shadow.getElementById('compressionLevel'), 'change', (e) => {
            this.settings.compressionLevel = e.target.value;
            this.updateSettings();
        });

        // Image quality change
        const imageQualitySlider = shadow.getElementById('imageQuality');
        const qualityValue = shadow.getElementById('qualityValue');
        
        this.addEventListener(imageQualitySlider, 'input', (e) => {
            const value = e.target.value;
            qualityValue.textContent = `${value}%`;
            this.settings.imageQuality = parseInt(value);
            this.updateSettings();
        });

        // Target size change
        this.addEventListener(shadow.getElementById('targetSize'), 'change', (e) => {
            this.settings.targetSize = e.target.value;
            this.updateSettings();
        });

        // Optimization strategy change
        this.addEventListener(shadow.getElementById('optimizationStrategy'), 'change', (e) => {
            this.settings.optimizationStrategy = e.target.value;
            this.updateSettings();
        });

        // Reset settings
        this.addEventListener(shadow.getElementById('resetSettings'), 'click', () => {
            this.resetToDefaults();
        });

        // Apply recommendations
        this.addEventListener(shadow.getElementById('applyRecommendations'), 'click', () => {
            this.applyRecommendations();
        });
    }

    updateSettings() {
        if (this.onSettingsChange) {
            this.onSettingsChange(this.settings);
        }
        
        // Store settings in localStorage
        localStorage.setItem('pdfsmaller_settings', JSON.stringify(this.settings));
    }

    resetToDefaults() {
        this.settings = {
            compressionLevel: 'medium',
            imageQuality: 80,
            targetSize: 'auto',
            optimizationStrategy: 'balanced'
        };

        // Update UI
        const shadow = this.shadowRoot;
        shadow.getElementById('compressionLevel').value = this.settings.compressionLevel;
        shadow.getElementById('imageQuality').value = this.settings.imageQuality;
        shadow.getElementById('targetSize').value = this.settings.targetSize;
        shadow.getElementById('optimizationStrategy').value = this.settings.optimizationStrategy;
        shadow.getElementById('qualityValue').textContent = `${this.settings.imageQuality}%`;

        this.updateSettings();
    }

    setRecommendations(recommendations) {
        this.recommendations = recommendations;
        this.displayRecommendations();
    }

    displayRecommendations() {
        if (!this.recommendations) return;

        const shadow = this.shadowRoot;
        const recommendationsSection = shadow.getElementById('recommendationsSection');
        const recommendationsList = shadow.getElementById('recommendationsList');

        if (!this.recommendations.recommendedSettings) {
            recommendationsSection.classList.add('hidden');
            return;
        }

        const rec = this.recommendations.recommendedSettings;
        const analysis = this.recommendations.analysis;

        recommendationsList.innerHTML = `
            <div class="recommendation-item">
                <span class="recommendation-label">Compression Level</span>
                <span class="recommendation-value">${this.formatCompressionLevel(rec.compressionLevel)}</span>
            </div>
            <div class="recommendation-item">
                <span class="recommendation-label">Image Quality</span>
                <span class="recommendation-value">${rec.imageQuality}%</span>
            </div>
            <div class="recommendation-item">
                <span class="recommendation-label">Strategy</span>
                <span class="recommendation-value">${this.formatStrategy(rec.optimizationStrategy)}</span>
            </div>
            <div class="recommendation-item">
                <span class="recommendation-label">Compression Potential</span>
                <span class="recommendation-value">${Math.round(analysis.compressionPotential * 100)}%</span>
            </div>
            <div class="recommendation-item">
                <span class="recommendation-label">Document Type</span>
                <span class="recommendation-value">${this.formatDocumentType(analysis.documentType)}</span>
            </div>
        `;

        recommendationsSection.classList.remove('hidden');
    }

    formatCompressionLevel(level) {
        const levels = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'maximum': 'Maximum'
        };
        return levels[level] || level;
    }

    formatStrategy(strategy) {
        const strategies = {
            'balanced': 'Balanced',
            'image_optimized': 'Image Optimized',
            'text_optimized': 'Text Optimized',
            'batch_optimized': 'Batch Optimized'
        };
        return strategies[strategy] || strategy;
    }

    formatDocumentType(type) {
        const types = {
            'single_image': 'Single Image',
            'single_page_document': 'Single Page',
            'long_document': 'Long Document',
            'form_document': 'Form Document',
            'mixed_content': 'Mixed Content',
            'image_heavy': 'Image Heavy',
            'text_heavy': 'Text Heavy',
            'general_document': 'General Document'
        };
        return types[type] || type;
    }

    applyRecommendations() {
        if (!this.recommendations?.recommendedSettings) return;

        const rec = this.recommendations.recommendedSettings;
        
        // Update settings
        this.settings = {
            ...this.settings,
            ...rec
        };

        // Update UI
        const shadow = this.shadowRoot;
        shadow.getElementById('compressionLevel').value = this.settings.compressionLevel;
        shadow.getElementById('imageQuality').value = this.settings.imageQuality;
        shadow.getElementById('targetSize').value = this.settings.targetSize;
        shadow.getElementById('optimizationStrategy').value = this.settings.optimizationStrategy;
        shadow.getElementById('qualityValue').textContent = `${this.settings.imageQuality}%`;

        // Notify change
        this.updateSettings();

        // Show success feedback
        this.showSuccessMessage('Recommendations applied successfully!');
    }

    showSuccessMessage(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #059669;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        successDiv.textContent = message;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
            style.remove();
        }, 3000);
    }

    getSettings() {
        return { ...this.settings };
    }

    setSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        
        // Update UI if component is connected
        if (this.isConnected) {
            const shadow = this.shadowRoot;
            if (shadow.getElementById('compressionLevel')) {
                shadow.getElementById('compressionLevel').value = this.settings.compressionLevel;
                shadow.getElementById('imageQuality').value = this.settings.imageQuality;
                shadow.getElementById('targetSize').value = this.settings.targetSize;
                shadow.getElementById('optimizationStrategy').value = this.settings.optimizationStrategy;
                shadow.getElementById('qualityValue').textContent = `${this.settings.imageQuality}%`;
            }
        }
    }

    // Load settings from localStorage
    loadSavedSettings() {
        try {
            const saved = localStorage.getItem('pdfsmaller_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.setSettings(parsed);
            }
        } catch (error) {
            console.warn('Failed to load saved settings:', error);
        }
    }
}

// Register the custom element
customElements.define('settings-panel', SettingsPanel);
