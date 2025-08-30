/**
 * Modern Settings Panel Component
 * Provides modern compression settings with proper controls and state management
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { BaseComponent } from './base-component.js';

export class ModernSettingsPanel extends BaseComponent {
    constructor() {
        super();
        
        // Application state for settings
        this.state = {
            compressionLevel: 'medium',
            imageQuality: 70,
            useServerProcessing: false,
            processingMode: 'single' // 'single' | 'bulk'
        };
        
        // Callbacks
        this.onSettingsChange = null;
        this.onModeChange = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadSavedSettings();
        this.setupEventListeners();
        this.updateUI();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: var(--font-sans);
                }

                .settings-container {
                    background: var(--bg-primary);
                    border-radius: var(--radius-2xl);
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--gray-200);
                    overflow: hidden;
                }

                .settings-header {
                    padding: var(--space-6);
                    border-bottom: 1px solid var(--gray-200);
                    background: var(--gray-50);
                }

                .settings-title {
                    font-size: var(--text-lg);
                    font-weight: var(--font-semibold);
                    color: var(--gray-800);
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                }

                .settings-icon {
                    width: 20px;
                    height: 20px;
                    fill: var(--color-primary);
                }

                .settings-content {
                    padding: var(--space-6);
                }

                /* Mode Toggle Section */
                .mode-section {
                    margin-bottom: var(--space-6);
                }

                .mode-label {
                    font-size: var(--text-sm);
                    font-weight: var(--font-medium);
                    color: var(--gray-700);
                    margin-bottom: var(--space-3);
                    display: block;
                }

                .mode-toggle {
                    display: flex;
                    background: var(--gray-100);
                    border-radius: var(--radius-lg);
                    padding: var(--space-1);
                    gap: var(--space-1);
                }

                .mode-option {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--space-2);
                    padding: var(--space-3) var(--space-4);
                    border: none;
                    background: transparent;
                    color: var(--gray-600);
                    font-size: var(--text-sm);
                    font-weight: var(--font-medium);
                    cursor: pointer;
                    border-radius: var(--radius-md);
                    transition: all var(--duration-200) var(--ease-in-out);
                    position: relative;
                }

                .mode-option.active {
                    background: var(--bg-primary);
                    color: var(--color-primary);
                    font-weight: var(--font-semibold);
                    box-shadow: var(--shadow-sm);
                }

                .mode-option:hover:not(.active) {
                    color: var(--gray-700);
                    background: rgba(255, 255, 255, 0.5);
                }

                .mode-option:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .pro-badge {
                    background: var(--gradient-premium);
                    color: white;
                    font-size: 10px;
                    font-weight: var(--font-bold);
                    padding: 2px 6px;
                    border-radius: var(--radius-full);
                    text-transform: uppercase;
                    letter-spacing: var(--tracking-wide);
                    margin-left: var(--space-1);
                }

                /* Settings Groups */
                .setting-group {
                    margin-bottom: var(--space-5);
                }

                .setting-group:last-child {
                    margin-bottom: 0;
                }

                .setting-label {
                    font-size: var(--text-sm);
                    font-weight: var(--font-medium);
                    color: var(--gray-700);
                    margin-bottom: var(--space-2);
                    display: block;
                }

                /* Dropdown Styling */
                .setting-select {
                    width: 100%;
                    padding: var(--space-3) var(--space-4);
                    border: 1px solid var(--gray-300);
                    border-radius: var(--radius-lg);
                    font-size: var(--text-sm);
                    color: var(--gray-700);
                    background: var(--bg-primary);
                    cursor: pointer;
                    transition: all var(--duration-200) var(--ease-in-out);
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
                    background-position: right var(--space-3) center;
                    background-repeat: no-repeat;
                    background-size: 16px;
                    padding-right: var(--space-10);
                }

                .setting-select:hover {
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .setting-select:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                /* Slider Styling */
                .slider-container {
                    position: relative;
                }

                .setting-slider {
                    width: 100%;
                    height: 6px;
                    border-radius: var(--radius-full);
                    background: var(--gray-200);
                    outline: none;
                    appearance: none;
                    cursor: pointer;
                    transition: background var(--duration-200) var(--ease-in-out);
                }

                .setting-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--color-primary);
                    cursor: pointer;
                    border: 2px solid var(--bg-primary);
                    box-shadow: var(--shadow-md);
                    transition: all var(--duration-200) var(--ease-in-out);
                }

                .setting-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: var(--shadow-lg);
                }

                .setting-slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--color-primary);
                    cursor: pointer;
                    border: 2px solid var(--bg-primary);
                    box-shadow: var(--shadow-md);
                    transition: all var(--duration-200) var(--ease-in-out);
                }

                .setting-slider::-moz-range-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: var(--shadow-lg);
                }

                .slider-labels {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: var(--space-2);
                    font-size: var(--text-xs);
                    color: var(--gray-500);
                }

                .slider-value {
                    font-weight: var(--font-semibold);
                    color: var(--color-primary);
                    font-size: var(--text-sm);
                }

                /* Checkbox Toggle Styling */
                .setting-checkbox {
                    display: flex;
                    align-items: center;
                    gap: var(--space-3);
                    cursor: pointer;
                    padding: var(--space-3);
                    border-radius: var(--radius-lg);
                    transition: background-color var(--duration-200) var(--ease-in-out);
                }

                .setting-checkbox:hover {
                    background: var(--gray-50);
                }

                .checkbox-input {
                    display: none;
                }

                .checkbox-custom {
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--gray-300);
                    border-radius: var(--radius-md);
                    position: relative;
                    transition: all var(--duration-200) var(--ease-in-out);
                    flex-shrink: 0;
                }

                .checkbox-input:checked + .checkbox-custom {
                    background: var(--color-primary);
                    border-color: var(--color-primary);
                }

                .checkbox-input:checked + .checkbox-custom::after {
                    content: '';
                    position: absolute;
                    left: 6px;
                    top: 2px;
                    width: 6px;
                    height: 10px;
                    border: solid white;
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                }

                .checkbox-label {
                    font-size: var(--text-sm);
                    color: var(--gray-700);
                    font-weight: var(--font-medium);
                    flex: 1;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .settings-content {
                        padding: var(--space-4);
                    }

                    .settings-header {
                        padding: var(--space-4);
                    }

                    .mode-toggle {
                        flex-direction: column;
                    }

                    .mode-option {
                        justify-content: center;
                        padding: var(--space-4);
                    }
                }

                /* Focus styles for accessibility */
                .mode-option:focus-visible,
                .setting-select:focus-visible,
                .setting-slider:focus-visible,
                .setting-checkbox:focus-visible {
                    outline: 2px solid var(--color-primary);
                    outline-offset: 2px;
                }

                /* High contrast mode support */
                @media (prefers-contrast: high) {
                    .settings-container {
                        border: 2px solid var(--gray-400);
                    }

                    .setting-select,
                    .checkbox-custom {
                        border-width: 2px;
                    }
                }

                /* Reduced motion support */
                @media (prefers-reduced-motion: reduce) {
                    .mode-option,
                    .setting-select,
                    .setting-slider,
                    .checkbox-custom {
                        transition: none;
                    }
                }
            </style>

            <div class="settings-container">
                <div class="settings-header">
                    <h3 class="settings-title">
                        <svg class="settings-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                        </svg>
                        Compression Settings
                    </h3>
                </div>

                <div class="settings-content">
                    <!-- Processing Mode Toggle -->
                    <div class="mode-section">
                        <label class="mode-label">Processing Mode</label>
                        <div class="mode-toggle">
                            <button class="mode-option active" data-mode="single" id="singleMode">
                                <span>Single File</span>
                            </button>
                            <button class="mode-option" data-mode="bulk" id="bulkMode">
                                <span>Bulk</span>
                                <span class="pro-badge">PRO</span>
                            </button>
                        </div>
                    </div>

                    <!-- Compression Level -->
                    <div class="setting-group">
                        <label class="setting-label" for="compressionLevel">Compression Level</label>
                        <select class="setting-select" id="compressionLevel">
                            <option value="low">Low (Best Quality)</option>
                            <option value="medium" selected>Medium (Balanced)</option>
                            <option value="high">High (Smaller Size)</option>
                            <option value="maximum">Maximum (Smallest Size)</option>
                        </select>
                    </div>

                    <!-- Image Quality Slider -->
                    <div class="setting-group">
                        <label class="setting-label" for="imageQuality">Image Quality</label>
                        <div class="slider-container">
                            <input type="range" class="setting-slider" id="imageQuality" 
                                   min="10" max="100" value="70" step="5">
                            <div class="slider-labels">
                                <span>10%</span>
                                <span class="slider-value" id="qualityValue">70%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Server Processing Toggle -->
                    <div class="setting-group">
                        <label class="setting-checkbox" for="serverProcessing">
                            <input type="checkbox" class="checkbox-input" id="serverProcessing">
                            <span class="checkbox-custom"></span>
                            <span class="checkbox-label">Use Server Processing</span>
                            <span class="pro-badge">PRO</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const shadow = this.shadowRoot;

        // Mode toggle listeners
        const singleMode = shadow.getElementById('singleMode');
        const bulkMode = shadow.getElementById('bulkMode');

        singleMode.addEventListener('click', () => this.setProcessingMode('single'));
        bulkMode.addEventListener('click', () => this.setProcessingMode('bulk'));

        // Compression level change
        shadow.getElementById('compressionLevel').addEventListener('change', (e) => {
            this.state.compressionLevel = e.target.value;
            this.notifySettingsChange();
        });

        // Image quality slider
        const imageQualitySlider = shadow.getElementById('imageQuality');
        const qualityValue = shadow.getElementById('qualityValue');

        imageQualitySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.state.imageQuality = value;
            qualityValue.textContent = `${value}%`;
            this.notifySettingsChange();
        });

        // Server processing toggle
        shadow.getElementById('serverProcessing').addEventListener('change', (e) => {
            this.state.useServerProcessing = e.target.checked;
            this.notifySettingsChange();
        });
    }

    setProcessingMode(mode) {
        if (mode === 'bulk') {
            // Check if user has Pro access (placeholder for now)
            const hasProAccess = this.checkProAccess();
            if (!hasProAccess) {
                this.showProUpgradeModal();
                return;
            }
        }

        this.state.processingMode = mode;
        this.updateModeToggle();
        this.notifyModeChange();
        this.saveSettings();
    }

    updateModeToggle() {
        const shadow = this.shadowRoot;
        const singleMode = shadow.getElementById('singleMode');
        const bulkMode = shadow.getElementById('bulkMode');

        // Update active states
        singleMode.classList.toggle('active', this.state.processingMode === 'single');
        bulkMode.classList.toggle('active', this.state.processingMode === 'bulk');
    }

    updateUI() {
        const shadow = this.shadowRoot;

        // Update compression level
        shadow.getElementById('compressionLevel').value = this.state.compressionLevel;

        // Update image quality
        const imageQualitySlider = shadow.getElementById('imageQuality');
        const qualityValue = shadow.getElementById('qualityValue');
        imageQualitySlider.value = this.state.imageQuality;
        qualityValue.textContent = `${this.state.imageQuality}%`;

        // Update server processing
        shadow.getElementById('serverProcessing').checked = this.state.useServerProcessing;

        // Update mode toggle
        this.updateModeToggle();
    }

    notifySettingsChange() {
        if (this.onSettingsChange) {
            this.onSettingsChange(this.getSettings());
        }
        this.saveSettings();
        this.dispatchEvent(new CustomEvent('settings-changed', {
            detail: this.getSettings(),
            bubbles: true
        }));
    }

    notifyModeChange() {
        if (this.onModeChange) {
            this.onModeChange(this.state.processingMode);
        }
        this.dispatchEvent(new CustomEvent('mode-changed', {
            detail: { mode: this.state.processingMode },
            bubbles: true
        }));
    }

    getSettings() {
        return { ...this.state };
    }

    setSettings(settings) {
        this.state = { ...this.state, ...settings };
        if (this.isConnected) {
            this.updateUI();
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('pdfsmaller_modern_settings', JSON.stringify(this.state));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    loadSavedSettings() {
        try {
            const saved = localStorage.getItem('pdfsmaller_modern_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load saved settings:', error);
        }
    }

    checkProAccess() {
        // Placeholder for Pro access check
        // In a real implementation, this would check user subscription status
        return false;
    }

    showProUpgradeModal() {
        // Dispatch event to show Pro upgrade modal
        this.dispatchEvent(new CustomEvent('show-pro-upgrade', {
            detail: { feature: 'bulk-processing' },
            bubbles: true
        }));
    }

    // Public API methods
    resetToDefaults() {
        this.state = {
            compressionLevel: 'medium',
            imageQuality: 70,
            useServerProcessing: false,
            processingMode: 'single'
        };
        this.updateUI();
        this.notifySettingsChange();
    }

    // Accessibility methods
    focus() {
        const shadow = this.shadowRoot;
        const firstFocusable = shadow.querySelector('.mode-option');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
}

// Register the custom element
customElements.define('modern-settings-panel', ModernSettingsPanel);