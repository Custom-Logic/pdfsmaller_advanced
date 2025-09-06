import { BaseComponent } from './base-component.js';

/**
 * App Shell Component
 * Provides a simple layout with navigation and content slots
 */
class AppShell extends BaseComponent {
    getStyles() {
        return `
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
        `;
    }

    getTemplate() {
        return `
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


