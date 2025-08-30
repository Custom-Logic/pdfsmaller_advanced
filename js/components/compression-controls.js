/**
 * Compression Controls Component
 * Provides UI for compression settings and initiates the compression process.
 */

import { BaseComponent } from './base-component.js';

export class CompressionControls extends BaseComponent {
    constructor() {
        super();
    }

    getTemplate() {
        return `
            <div class="controls-container">
                <div class="controls-header">
                    <h3>Compression Settings</h3>
                    <p>Choose your desired level of compression.</p>
                </div>

                <div class="settings-group">
                    <label for="compressionLevel">Quality vs. Size</label>
                    <select id="compressionLevel" class="setting-select">
                        <option value="low">Low (Best Quality)</option>
                        <option value="medium" selected>Medium (Balanced)</option>
                        <option value="high">High (Smaller Size)</option>
                        <option value="maximum">Maximum (Smallest Size)</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label for="imageQuality">Image Quality (10-100)</label>
                    <input type="range" id="imageQuality" min="10" max="100" value="80" class="setting-slider">
                    <span class="slider-value">80</span>
                </div>

                <div class="action-group">
                    <button id="startCompressionBtn" class="btn btn-primary btn-full">Start Compression</button>
                </div>
            </div>
        `;
    }

    getStyles() {
        return `
            .controls-container {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 24px;
            }
            .controls-header {
                text-align: center;
                margin-bottom: 24px;
            }
            .controls-header h3 {
                font-size: 1.25rem;
                font-weight: 600;
                margin: 0 0 8px 0;
            }
            .controls-header p {
                font-size: 0.875rem;
                color: #6b7280;
                margin: 0;
            }
            .settings-group {
                margin-bottom: 20px;
            }
            .settings-group label {
                display: block;
                font-size: 0.875rem;
                font-weight: 500;
                margin-bottom: 8px;
            }
            .setting-select, .setting-slider {
                width: 100%;
            }
            .action-group {
                margin-top: 24px;
            }
            .btn-full {
                width: 100%;
            }
        `;
    }

    setupEventListeners() {
        const startBtn = this.shadowRoot.getElementById('startCompressionBtn');
        startBtn.addEventListener('click', () => {
            const compressionLevel = this.shadowRoot.getElementById('compressionLevel').value;
            const imageQuality = this.shadowRoot.getElementById('imageQuality').value;

            this.dispatchEvent(new CustomEvent('serviceStartRequest', {
                detail: {
                    serviceType: 'compression',
                    options: {
                        compressionLevel,
                        imageQuality: parseInt(imageQuality, 10)
                    }
                },
                bubbles: true,
                composed: true
            }));
        });

        const slider = this.shadowRoot.getElementById('imageQuality');
        const sliderValue = this.shadowRoot.querySelector('.slider-value');
        slider.addEventListener('input', (e) => {
            sliderValue.textContent = e.target.value;
        });
    }
}

customElements.define('compression-controls', CompressionControls);
