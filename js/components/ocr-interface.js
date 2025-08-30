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


