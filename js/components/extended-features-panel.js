/**
 * Extended Features Panel Component
 * Provides access to all extended features: conversion, OCR, AI, and cloud integration
 */

import { BaseComponent } from './base-component.js';
import { getService } from '../services/extended-features-index.js';

export class ExtendedFeaturesPanel extends BaseComponent {
    constructor() {
        super();
        this.features = [
            {
                id: 'conversion',
                name: 'PDF Conversion',
                description: 'Convert PDFs to Word, Excel, Text, and HTML',
                icon: '🔄',
                color: '#4CAF50',
                route: '/conversion'
            },
            {
                id: 'ocr',
                name: 'OCR Processing',
                description: 'Extract text from scanned PDFs and images',
                icon: '👁️',
                color: '#2196F3',
                route: '/ocr'
            },
            {
                id: 'ai',
                name: 'AI Features',
                description: 'Summarize and translate PDF content',
                icon: '🤖',
                color: '#9C27B0',
                route: '/ai'
            },
            {
                id: 'cloud',
                name: 'Cloud Integration',
                description: 'Save and load files from cloud storage',
                icon: '☁️',
                color: '#FF9800',
                route: '/cloud'
            }
        ];
        
        this.activeFeature = null;
        this.featureManager = null;
    }

    async init() {
        try {
            this.featureManager = getService('enhancedFeatures');
            if (!this.featureManager) {
                console.warn('Enhanced Features Manager not available');
            }
        } catch (error) {
            console.error('Failed to initialize feature manager:', error);
        }
    }

    getTemplate() {
        return `
            <div class="extended-features-panel">
                <div class="panel-header">
                    <h2>Extended Features</h2>
                    <p>Access advanced PDF processing capabilities</p>
                </div>
                
                <div class="features-grid">
                    ${this.features.map(feature => this.renderFeatureCard(feature)).join('')}
                </div>
                
                <div class="feature-content" id="featureContent">
                    <!-- Dynamic feature content will be loaded here -->
                </div>
            </div>
        `;
    }

    renderFeatureCard(feature) {
        return `
            <div class="feature-card" data-feature="${feature.id}">
                <div class="feature-icon" style="background-color: ${feature.color}">
                    <span class="icon">${feature.icon}</span>
                </div>
                <div class="feature-info">
                    <h3>${feature.name}</h3>
                    <p>${feature.description}</p>
                </div>
                <button class="feature-action" data-feature="${feature.id}">
                    Open
                </button>
            </div>
        `;
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
            .extended-features-panel {
                padding: 2rem;
                background: var(--bg-color, #ffffff);
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            
            .panel-header {
                text-align: center;
                margin-bottom: 2rem;
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
            
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .feature-card {
                background: var(--card-bg, #ffffff);
                border: 2px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }
            
            .feature-card:hover {
                border-color: var(--primary-color, #2196F3);
                transform: translateY(-4px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
            
            .feature-card.active {
                border-color: var(--primary-color, #2196F3);
                background: var(--primary-light, #f0f8ff);
            }
            
            .feature-icon {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 1rem;
            }
            
            .feature-icon .icon {
                font-size: 2rem;
                color: white;
            }
            
            .feature-info h3 {
                font-size: 1.3rem;
                font-weight: 600;
                margin: 0 0 0.5rem 0;
                color: var(--text-color, #333);
            }
            
            .feature-info p {
                color: var(--text-secondary, #666);
                margin: 0 0 1rem 0;
                line-height: 1.5;
            }
            
            .feature-action {
                background: var(--primary-color, #2196F3);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.3s ease;
                width: 100%;
            }
            
            .feature-action:hover {
                background: var(--primary-dark, #1976D2);
            }
            
            .feature-content {
                margin-top: 2rem;
                padding: 2rem;
                background: var(--content-bg, #f8f9fa);
                border-radius: 12px;
                border: 1px solid var(--border-color, #e0e0e0);
                min-height: 400px;
            }
            
            .feature-content:empty::before {
                content: 'Select a feature to get started';
                display: block;
                text-align: center;
                color: var(--text-secondary, #666);
                font-style: italic;
                padding: 2rem;
            }
            
            @media (max-width: 768px) {
                .extended-features-panel {
                    padding: 1rem;
                }
                
                .features-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                
                .feature-card {
                    padding: 1rem;
                }
            }
        `;
    }

    setupEventListeners() {
        // Feature card click events
        this.shadowRoot.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const featureId = e.currentTarget.dataset.feature;
                this.activateFeature(featureId);
            });
        });

        // Feature action button events
        this.shadowRoot.querySelectorAll('.feature-action').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const featureId = button.dataset.feature;
                this.activateFeature(featureId);
            });
        });
    }

    async activateFeature(featureId) {
        try {
            // Update active state
            this.activeFeature = featureId;
            this.updateActiveStates();
            
            // Load feature content
            await this.loadFeatureContent(featureId);
            
            // Emit feature activation event
            this.emit('featureActivated', { featureId, feature: this.features.find(f => f.id === featureId) });
            
        } catch (error) {
            console.error(`Failed to activate feature ${featureId}:`, error);
            this.showError(`Failed to load ${featureId} feature`);
        }
    }

    updateActiveStates() {
        // Remove active class from all cards
        this.shadowRoot.querySelectorAll('.feature-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Add active class to selected card
        if (this.activeFeature) {
            const activeCard = this.shadowRoot.querySelector(`[data-feature="${this.activeFeature}"]`);
            if (activeCard) {
                activeCard.classList.add('active');
            }
        }
    }

    async loadFeatureContent(featureId) {
        const contentContainer = this.shadowRoot.getElementById('featureContent');
        
        try {
            // Show loading state
            contentContainer.innerHTML = '<div class="loading">Loading feature...</div>';
            
            // Load appropriate feature component
            let component;
            switch (featureId) {
                case 'conversion':
                    component = await this.loadConversionComponent();
                    break;
                case 'ocr':
                    component = await this.loadOCRComponent();
                    break;
                case 'ai':
                    component = await this.loadAIComponent();
                    break;
                case 'cloud':
                    component = await this.loadCloudComponent();
                    break;
                default:
                    throw new Error(`Unknown feature: ${featureId}`);
            }
            
            // Render component
            if (component) {
                contentContainer.innerHTML = '';
                contentContainer.appendChild(component);
            }
            
        } catch (error) {
            console.error(`Failed to load ${featureId} component:`, error);
            contentContainer.innerHTML = `
                <div class="error">
                    <h3>Failed to load feature</h3>
                    <p>${error.message}</p>
                    <button onclick="this.parentElement.parentElement.parentElement.activateFeature('${featureId}')">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    async loadConversionComponent() {
        const { ConversionPanel } = await import('./conversion-panel.js');
        const component = new ConversionPanel();
        return component;
    }

    async loadOCRComponent() {
        const { OCRPanel } = await import('./ocr-panel.js');
        const component = new OCRPanel();
        return component;
    }

    async loadAIComponent() {
        const { AIPanel } = await import('./ai-panel.js');
        const component = new AIPanel();
        return component;
    }

    async loadCloudComponent() {
        const { CloudPanel } = await import('./cloud-panel.js');
        const component = new CloudPanel();
        return component;
    }

    showError(message) {
        const contentContainer = this.shadowRoot.getElementById('featureContent');
        contentContainer.innerHTML = `
            <div class="error">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    // Public methods for external control
    getActiveFeature() {
        return this.activeFeature;
    }

    getFeatureCapabilities() {
        if (this.featureManager) {
            return this.featureManager.getFeatureCapabilities();
        }
        return {};
    }

    async executeFeature(feature, operation, files, options) {
        if (this.featureManager) {
            return await this.featureManager.executeFeature(feature, operation, files, options);
        }
        throw new Error('Feature manager not available');
    }
}

// Register the component
customElements.define('extended-features-panel', ExtendedFeaturesPanel);
