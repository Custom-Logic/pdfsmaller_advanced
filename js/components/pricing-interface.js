/**
 * Pricing Interface Component
 * Hosts subscription panel slot
 */

class PricingInterface extends HTMLElement {
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
                .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
                .section-title { margin: 0 0 8px 0; font-weight: 600; color: #111827; font-size: 14px; }
            </style>
            <div class="card">
                <h3 class="section-title">Subscription</h3>
                <slot name="subscription"></slot>
            </div>
        `;
    }
}

customElements.define('pricing-interface', PricingInterface);


