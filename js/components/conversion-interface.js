import { BaseComponent } from './base-component.js';

/**
 * Conversion Interface Component
 * Provides slots for conversion controls
 */
class ConversionInterface extends BaseComponent {
    getStyles() {
        return `
            :host { display: block; }
            .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
            .section-title { margin: 0 0 8px 0; font-weight: 600; color: #111827; font-size: 14px; }
        `;
    }

    getTemplate() {
        return `
            <div class="card">
                <h3 class="section-title">Upload</h3>
                <slot name="uploader"></slot>
                <div style="margin-top:16px">
                    <h3 class="section-title">Controls</h3>
                    <slot name="controls"></slot>
                </div>
            </div>
        `;
    }
}

customElements.define('conversion-interface', ConversionInterface);


