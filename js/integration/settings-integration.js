/**
 * Settings Integration Module
 * Connects the modern settings panel with application state and other components
 */

import { appState } from '../services/app-state.js';

export class SettingsIntegration {
  constructor() {
    this.settingsPanel = null;
    this.initialized = false;
  }

  /**
     * Initialize the settings integration
     */
  async init() {
    if (this.initialized) return;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Wait for the settings panel to be available
    await this.waitForSettingsPanel();
        
    this.setupSettingsPanel();
    this.setupStateListeners();
    this.setupEventListeners();
        
    this.initialized = true;
    console.log('Settings integration initialized');
  }

  /**
     * Wait for the settings panel component to be available
     */
  async waitForSettingsPanel() {
    return new Promise((resolve) => {
      const checkForPanel = () => {
        this.settingsPanel = document.getElementById('compressionSettings');
        if (this.settingsPanel && this.settingsPanel.shadowRoot) {
          resolve();
        } else {
          setTimeout(checkForPanel, 100);
        }
      };
      checkForPanel();
    });
  }

  /**
     * Setup the settings panel with current state
     */
  setupSettingsPanel() {
    if (!this.settingsPanel) return;

    // Set initial settings from app state
    const currentSettings = appState.getSettings();
    this.settingsPanel.setSettings(currentSettings);

    // Setup callbacks
    this.settingsPanel.onSettingsChange = (settings) => {
      this.handleSettingsChange(settings);
    };

    this.settingsPanel.onModeChange = (mode) => {
      this.handleModeChange(mode);
    };
  }

  /**
     * Setup listeners for app state changes
     */
  setupStateListeners() {
    // Listen for compression level changes
    appState.subscribe('compressionLevel', (value) => {
      if (this.settingsPanel) {
        this.settingsPanel.setSettings({ compressionLevel: value });
      }
    });

    // Listen for image quality changes
    appState.subscribe('imageQuality', (value) => {
      if (this.settingsPanel) {
        this.settingsPanel.setSettings({ imageQuality: value });
      }
    });

    // Listen for server processing changes
    appState.subscribe('useServerProcessing', (value) => {
      if (this.settingsPanel) {
        this.settingsPanel.setSettings({ useServerProcessing: value });
      }
    });

    // Listen for processing mode changes
    appState.subscribe('processingMode', (value) => {
      if (this.settingsPanel) {
        this.settingsPanel.setSettings({ processingMode: value });
      }
      this.updateUIForMode(value);
    });

    // Listen for user tier changes
    appState.subscribe('userTier', (value) => {
      this.updateProFeatures(value);
    });
  }

  /**
     * Setup event listeners for component events
     */
  setupEventListeners() {
    // Listen for settings changes from the panel
    document.addEventListener('settings-changed', (event) => {
      const settings = event.detail;
      this.syncSettingsToState(settings);
    });

    // Listen for mode changes from the panel
    document.addEventListener('mode-changed', (event) => {
      const { mode } = event.detail;
      const success = appState.setProcessingMode(mode);
            
      if (!success) {
        // Mode change was rejected (e.g., Pro required)
        // Reset the panel to the current state
        this.settingsPanel.setSettings({ 
          processingMode: appState.get('processingMode') 
        });
      }
    });

    // Listen for Pro upgrade requests
    document.addEventListener('show-pro-upgrade', (event) => {
      this.showProUpgradeModal(event.detail);
    });

    // Listen for app state Pro upgrade requirements
    document.addEventListener('app-state:pro-upgrade-required', (event) => {
      this.showProUpgradeModal(event.detail);
    });
  }

  /**
     * Handle settings changes from the panel
     * @param {Object} settings - New settings
     */
  handleSettingsChange(settings) {
    // Update app state with new settings
    appState.updateCompressionSettings(settings);
        
    // Notify other components of settings change
    this.notifySettingsChange(settings);
  }

  /**
     * Handle mode changes from the panel
     * @param {string} mode - New processing mode
     */
  handleModeChange(mode) {
    const success = appState.setProcessingMode(mode);
        
    if (success) {
      this.updateUIForMode(mode);
      this.notifyModeChange(mode);
    }
  }

  /**
     * Sync settings from panel to app state
     * @param {Object} settings - Settings to sync
     */
  syncSettingsToState(settings) {
    appState.updateCompressionSettings(settings);
  }

  /**
     * Update UI based on processing mode
     * @param {string} mode - Processing mode
     */
  updateUIForMode(mode) {
    // Update bulk uploader visibility
    const bulkUploader = document.getElementById('bulkUploader');
    if (bulkUploader) {
      if (mode === 'bulk') {
        bulkUploader.classList.remove('hidden');
      } else {
        bulkUploader.classList.add('hidden');
      }
    }

    // Update other UI elements based on mode
    this.updateModeSpecificUI(mode);
  }

  /**
     * Update mode-specific UI elements
     * @param {string} mode - Processing mode
     */
  updateModeSpecificUI(mode) {
    // Add mode-specific classes to body for CSS targeting
    document.body.classList.remove('mode-single', 'mode-bulk');
    document.body.classList.add(`mode-${mode}`);

    // Update any mode-specific instructions or UI
    const modeInstructions = document.querySelectorAll('[data-mode-instruction]');
    modeInstructions.forEach(element => {
      const targetMode = element.dataset.modeInstruction;
      element.style.display = targetMode === mode ? 'block' : 'none';
    });
  }

  /**
     * Update Pro features based on user tier
     * @param {string} tier - User tier
     */
  updateProFeatures(tier) {
    const hasProAccess = tier === 'pro' || tier === 'premium';
        
    // Update Pro feature availability in UI
    const proFeatures = document.querySelectorAll('[data-pro-feature]');
    proFeatures.forEach(element => {
      if (hasProAccess) {
        element.classList.remove('pro-disabled');
        element.removeAttribute('disabled');
      } else {
        element.classList.add('pro-disabled');
        element.setAttribute('disabled', 'true');
      }
    });
  }

  /**
     * Show Pro upgrade modal
     * @param {Object} detail - Upgrade detail
     */
  showProUpgradeModal(detail) {
    // Create and show Pro upgrade modal
    const modal = document.createElement('div');
    modal.className = 'pro-upgrade-modal';
    modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Upgrade to Pro</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>This feature requires a Pro subscription.</p>
                        <p><strong>${this.getFeatureDescription(detail.feature)}</strong></p>
                        <div class="pro-benefits">
                            <ul>
                                <li>Bulk file processing</li>
                                <li>Server-side compression</li>
                                <li>Priority processing</li>
                                <li>Advanced settings</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary modal-cancel">Cancel</button>
                        <button class="btn-primary modal-upgrade">Upgrade to Pro</button>
                    </div>
                </div>
            </div>
        `;

    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
            .pro-upgrade-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: var(--z-modal);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            .modal-content {
                position: relative;
                background: white;
                border-radius: var(--radius-2xl);
                box-shadow: var(--shadow-2xl);
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow: auto;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-6);
                border-bottom: 1px solid var(--gray-200);
            }
            
            .modal-header h3 {
                margin: 0;
                font-size: var(--text-xl);
                font-weight: var(--font-semibold);
                color: var(--gray-800);
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: var(--text-2xl);
                color: var(--gray-400);
                cursor: pointer;
                padding: var(--space-1);
                border-radius: var(--radius-md);
                transition: color var(--duration-200);
            }
            
            .modal-close:hover {
                color: var(--gray-600);
            }
            
            .modal-body {
                padding: var(--space-6);
            }
            
            .modal-body p {
                margin: 0 0 var(--space-4) 0;
                color: var(--gray-600);
            }
            
            .pro-benefits ul {
                list-style: none;
                padding: 0;
                margin: var(--space-4) 0 0 0;
            }
            
            .pro-benefits li {
                padding: var(--space-2) 0;
                color: var(--gray-700);
                position: relative;
                padding-left: var(--space-6);
            }
            
            .pro-benefits li::before {
                content: '✓';
                position: absolute;
                left: 0;
                color: var(--color-success);
                font-weight: bold;
            }
            
            .modal-footer {
                display: flex;
                gap: var(--space-3);
                padding: var(--space-6);
                border-top: 1px solid var(--gray-200);
                justify-content: flex-end;
            }
            
            .btn-primary, .btn-secondary {
                padding: var(--space-3) var(--space-6);
                border-radius: var(--radius-lg);
                font-size: var(--text-sm);
                font-weight: var(--font-medium);
                cursor: pointer;
                transition: all var(--duration-200);
                border: none;
            }
            
            .btn-primary {
                background: var(--color-primary);
                color: white;
            }
            
            .btn-primary:hover {
                background: var(--color-primary-hover);
            }
            
            .btn-secondary {
                background: var(--gray-100);
                color: var(--gray-700);
                border: 1px solid var(--gray-300);
            }
            
            .btn-secondary:hover {
                background: var(--gray-200);
            }
        `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // Setup modal event listeners
    const closeModal = () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    };

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        
    modal.querySelector('.modal-upgrade').addEventListener('click', () => {
      // Navigate to pricing page or trigger upgrade flow
      appState.setActiveTab('pricing');
      closeModal();
    });

    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
     * Get feature description for Pro upgrade modal
     * @param {string} feature - Feature name
     * @returns {string} Feature description
     */
  getFeatureDescription(feature) {
    const descriptions = {
      'bulk-processing': 'Process multiple files at once with bulk compression',
      'server-processing': 'Use our powerful servers for maximum compression',
      'advanced-settings': 'Access advanced compression settings and options'
    };
        
    return descriptions[feature] || 'Access this premium feature';
  }

  /**
     * Notify other components of settings changes
     * @param {Object} settings - New settings
     */
  notifySettingsChange(settings) {
    const event = new CustomEvent('compression-settings-changed', {
      detail: settings,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
     * Notify other components of mode changes
     * @param {string} mode - New processing mode
     */
  notifyModeChange(mode) {
    const event = new CustomEvent('processing-mode-changed', {
      detail: { mode },
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
     * Get current settings from the panel
     * @returns {Object} Current settings
     */
  getCurrentSettings() {
    return this.settingsPanel ? this.settingsPanel.getSettings() : appState.getSettings();
  }

  /**
     * Reset settings to defaults
     */
  resetSettings() {
    if (this.settingsPanel) {
      this.settingsPanel.resetToDefaults();
    }
    appState.updateCompressionSettings({
      compressionLevel: 'medium',
      imageQuality: 70,
      useServerProcessing: false
    });
    appState.setProcessingMode('single');
  }
}

// Create and export singleton instance
export const settingsIntegration = new SettingsIntegration();

// Auto-initialize when module is loaded
settingsIntegration.init().catch(console.error);