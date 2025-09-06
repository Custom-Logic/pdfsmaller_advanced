import { BaseComponent } from './base-component.js';

/**
 * Pricing Interface Component
 * Hosts subscription panel slot
 */
class PricingInterface extends BaseComponent {
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
                <h3 class="section-title">Subscription</h3>
                <slot name="subscription"></slot>
            </div>
        `;
    }
}

customElements.define('pricing-interface', PricingInterface);


