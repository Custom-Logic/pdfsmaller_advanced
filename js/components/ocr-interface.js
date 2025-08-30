/**
 * OCR Interface Component
 * Provides slots for OCR controls
 */

class OcrInterface extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .interface-container {
                    max-width: 800px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-6, 24px);
                }

                .interface-header {
                    text-align: center;
                    margin-bottom: var(--space-6, 24px);
                }

                .interface-title {
                    font-size: var(--text-3xl, 30px);
                    font-weight: var(--font-bold, 700);
                    color: white;
                    margin: 0 0 var(--space-3, 12px) 0;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .interface-subtitle {
                    font-size: var(--text-lg, 18px);
                    color: rgba(255, 255, 255, 0.9);
                    margin: 0;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }

                .upload-section {
                    background: white;
                    border-radius: var(--radius-2xl, 16px);
                    padding: var(--space-8, 32px);
                    box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
                    border: 1px solid var(--gray-100, #f3f4f6);
                }

                .controls-section {
                    background: white;
                    border-radius: var(--radius-2xl, 16px);
                    padding: var(--space-8, 32px);
                    box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
                    border: 1px solid var(--gray-100, #f3f4f6);
                }

                .section-title {
                    font-size: var(--text-xl, 20px);
                    font-weight: var(--font-semibold, 600);
                    color: var(--gray-900, #111827);
                    margin: 0 0 var(--space-4, 16px) 0;
                    text-align: center;
                }

                @media (max-width: 768px) {
                    .upload-section,
                    .controls-section {
                        padding: var(--space-6, 24px);
                        border-radius: var(--radius-xl, 12px);
                    }

                    .interface-title {
                        font-size: var(--text-2xl, 24px);
                    }

                    .interface-subtitle {
                        font-size: var(--text-base, 16px);
                    }
                }
            </style>
            
            <div class="interface-container">
                <div class="interface-header">
                    <h2 class="interface-title">OCR Processing</h2>
                    <p class="interface-subtitle">Extract text from scanned documents and images</p>
                </div>

                <div class="upload-section">
                    <h3 class="section-title">Upload Document</h3>
                    <slot name="uploader"></slot>
                </div>

                <div class="controls-section">
                    <slot name="controls"></slot>
                </div>
            </div>
        `;
    }
}

customElements.define('ocr-interface', OcrInterface);


