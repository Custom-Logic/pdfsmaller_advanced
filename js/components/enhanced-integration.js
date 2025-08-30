/**
 * Enhanced Integration Component
 * Provides seamless integration between main app and extended features
 */

import { BaseComponent } from './base-component.js';
import { ConversionPanel } from './conversion-panel.js';
import { OCRPanel } from './ocr-panel.js';
import { AIPanel } from './ai-panel.js';
import { ExtendedFeaturesPanel } from './extended-features-panel.js';

export class EnhancedIntegration extends BaseComponent {
    constructor() {
        super();
        this.components = {
            conversion: null,
            ocr: null,
            ai: null,
            extended: null
        };
        this.currentTab = 'compress';
        this.isInitialized = false;
    }

    async init() {
        try {
            // Initialize all extended feature components
            this.components.conversion = new ConversionPanel();
            this.components.ocr = new OCRPanel();
            this.components.ai = new AIPanel();
            this.components.extended = new ExtendedFeaturesPanel();

            await Promise.all([
                this.components.conversion.init(),
                this.components.ocr.init(),
                this.components.ai.init(),
                this.components.extended.init()
            ]);

            this.setupEventListeners();
            this.isInitialized = true;
            console.log('Enhanced Integration initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Enhanced Integration:', error);
        }
    }

    setupEventListeners() {
        // Listen for tab changes
        document.addEventListener('tabChanged', (event) => {
            this.handleTabChange(event.detail.tab);
        });

        // Listen for feature requests
        document.addEventListener('featureRequested', (event) => {
            this.handleFeatureRequest(event.detail);
        });

        // Setup bulk mode toggles
        this.setupBulkModeToggles();
    }

    setupBulkModeToggles() {
        const toggles = document.querySelectorAll('.mode-switch');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (event) => {
                const featureTab = event.target.dataset.featureTab;
                this.handleBulkModeToggle(featureTab, event.target.checked);
            });
        });
    }

    handleTabChange(tabName) {
        this.currentTab = tabName;
        
        // Update tab content based on current tab
        switch (tabName) {
            case 'convert':
                this.loadConversionPanel();
                break;
            case 'ocr':
                this.loadOCRPanel();
                break;
            case 'ai_tools':
                this.loadAIPanel();
                break;
            default:
                // Hide all extended panels
                this.hideAllExtendedPanels();
        }
    }

    handleFeatureRequest(feature) {
        switch (feature.type) {
            case 'conversion':
                this.showConversionPanel();
                break;
            case 'ocr':
                this.showOCRPanel();
                break;
            case 'ai':
                this.showAIPanel();
                break;
            case 'cloud':
                this.showCloudIntegration();
                break;
        }
    }

    handleBulkModeToggle(featureTab, isBulk) {
        if (isBulk) {
            // Check if user has Pro access
            if (!this.checkProAccess()) {
                this.showProUpgradeModal();
                return;
            }
            
            // Enable bulk features
            this.enableBulkFeatures(featureTab);
        } else {
            // Disable bulk features
            this.disableBulkFeatures(featureTab);
        }
    }

    checkProAccess() {
        // This would integrate with your authentication system
        const userPlan = localStorage.getItem('userPlan') || 'free';
        return userPlan !== 'free';
    }

    showProUpgradeModal() {
        // Create and show upgrade modal
        const modal = this.createUpgradeModal();
        document.body.appendChild(modal);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 5000);
    }

    createUpgradeModal() {
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';
        modal.innerHTML = `
            <div class="upgrade-modal-content">
                <div class="upgrade-header">
                    <h3>🚀 Upgrade to Pro</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="upgrade-body">
                    <p>Bulk processing is a Pro feature. Upgrade now to process multiple files at once!</p>
                    <div class="upgrade-features">
                        <div class="feature-item">✓ Bulk file processing</div>
                        <div class="feature-item">✓ Advanced compression</div>
                        <div class="feature-item">✓ Priority support</div>
                    </div>
                    <button class="btn btn-premium" onclick="window.tabNavigation?.switchTab('pricing') || switchTab('pricing')">Upgrade Now</button>
                </div>
            </div>
        `;
        return modal;
    }

    enableBulkFeatures(featureTab) {
        const container = document.getElementById(`${featureTab}Tab`);
        if (container) {
            // Show bulk uploader
            const bulkUploader = container.querySelector('.bulk-uploader');
            if (bulkUploader) {
                bulkUploader.classList.remove('hidden');
            }
            
            // Update file input to accept multiple files
            const fileInput = container.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.multiple = true;
            }
        }
    }

    disableBulkFeatures(featureTab) {
        const container = document.getElementById(`${featureTab}Tab`);
        if (container) {
            // Hide bulk uploader
            const bulkUploader = container.querySelector('.bulk-uploader');
            if (bulkUploader) {
                bulkUploader.classList.add('hidden');
            }
            
            // Update file input to single file
            const fileInput = container.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.multiple = false;
            }
        }
    }

    loadConversionPanel() {
        const container = document.getElementById('convertTab');
        if (container && this.components.conversion) {
            const content = container.querySelector('.conversion-content') || container;
            content.innerHTML = this.components.conversion.getTemplate();
            this.components.conversion.attachTo(content);
        }
    }

    loadOCRPanel() {
        const container = document.getElementById('ocrTab');
        if (container && this.components.ocr) {
            const content = container.querySelector('.ocr-content') || container;
            content.innerHTML = this.components.ocr.getTemplate();
            this.components.ocr.attachTo(content);
        }
    }

    loadAIPanel() {
        const container = document.getElementById('ai_toolsTab');
        if (container && this.components.ai) {
            const content = container.querySelector('.ai-content') || container;
            content.innerHTML = this.components.ai.getTemplate();
            this.components.ai.attachTo(content);
        }
    }

    hideAllExtendedPanels() {
        // Hide any extended feature panels that might be visible
        const extendedPanels = document.querySelectorAll('.extended-feature-panel');
        extendedPanels.forEach(panel => {
            panel.style.display = 'none';
        });
    }

    showConversionPanel() {
        this.switchToTab('convert');
    }

    showOCRPanel() {
        this.switchToTab('ocr');
    }

    showAIPanel() {
        this.switchToTab('ai_tools');
    }

    showCloudIntegration() {
        // This would show cloud integration features
        console.log('Cloud integration requested');
    }

    switchToTab(tabName) {
        // Trigger tab switch
        const event = new CustomEvent('tabChanged', { detail: { tab: tabName } });
        document.dispatchEvent(event);
        
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase().includes(tabName.replace('_', ' '))) {
                btn.classList.add('active');
            }
        });
        
        // Update tab panels
        const tabPanels = document.querySelectorAll('.tab-panel');
        tabPanels.forEach(panel => {
            panel.classList.remove('active');
            if (panel.id === `${tabName}Tab`) {
                panel.classList.add('active');
            }
        });
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
            .upgrade-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease-in-out;
            }
            
            .upgrade-modal-content {
                background: white;
                border-radius: 12px;
                padding: 24px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                animation: slideUp 0.3s ease-out;
            }
            
            .upgrade-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .upgrade-header h3 {
                margin: 0;
                color: #1f2937;
                font-size: 1.25rem;
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #6b7280;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .close-btn:hover {
                background-color: #f3f4f6;
            }
            
            .upgrade-body p {
                color: #6b7280;
                margin-bottom: 16px;
                line-height: 1.5;
            }
            
            .upgrade-features {
                margin-bottom: 20px;
            }
            
            .feature-item {
                color: #374151;
                margin-bottom: 8px;
                font-size: 0.875rem;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(20px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
    }
}
