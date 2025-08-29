/**
 * App Shell Component
 * Provides a simple layout with navigation and content slots
 */

class AppShell extends HTMLElement {
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
                    min-height: 100vh;
                }
                .shell {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                }
                .nav {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    background: transparent;
                }
                .content {
                    flex: 1;
                }
            </style>
            <div class="shell">
                <div class="nav">
                    <slot name="navigation"></slot>
                </div>
                <div class="content">
                    <slot name="content"></slot>
                </div>
            </div>
        `;
    }
}

customElements.define('app-shell', AppShell);


