/**
 * Conversion Interface Component
 * Provides slots for conversion controls
 */



class ConversionInterface extends HTMLElement {
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
                    <h2 class="interface-title">Convert PDF</h2>
                    <p class="interface-subtitle">Transform your PDFs into editable formats</p>
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

customElements.define('conversion-interface', ConversionInterface);


