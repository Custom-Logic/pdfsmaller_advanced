/**
 * AI Tools Interface Component
 * Provides slots for AI tools controls
 */

class AIToolsInterface extends HTMLElement {
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
                    <h2 class="interface-title">AI Tools</h2>
                    <p class="interface-subtitle">Leverage AI to analyze and enhance your documents</p>
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

customElements.define('ai-tools-interface', AIToolsInterface);


