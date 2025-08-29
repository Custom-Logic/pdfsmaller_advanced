/**
 * Compression Interface Component
 * Shell that provides layout slots for compression flow
 */

class CompressionInterface extends HTMLElement {
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
                :host { display: block; }
                .container { display: grid; gap: 16px; }
                .grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
                @media (min-width: 900px) {
                    .grid { grid-template-columns: 320px 1fr; }
                }
                .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
                .section-title { margin: 0 0 8px 0; font-weight: 600; color: #111827; font-size: 14px; }
            </style>
            <div class="container">
                <div class="grid">
                    <div class="card">
                        <h3 class="section-title">Settings</h3>
                        <slot name="settings"></slot>
                    </div>
                    <div class="card">
                        <h3 class="section-title">Upload</h3>
                        <slot name="uploader"></slot>
                        <div style="margin-top:16px">
                            <h3 class="section-title">Progress</h3>
                            <slot name="progress"></slot>
                        </div>
                        <div style="margin-top:16px">
                            <h3 class="section-title">Results</h3>
                            <slot name="results"></slot>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('compression-interface', CompressionInterface);


