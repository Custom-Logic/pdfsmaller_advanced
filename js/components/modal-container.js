/**
 * Modal Container Component
 * Hosts modal dialogs opened by the app
 */

class ModalContainer extends HTMLElement {
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
                    display: contents;
                }
                .overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .overlay.active { display: flex; }
                .modal {
                    background: #fff;
                    border-radius: 8px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 85vh;
                    overflow: auto;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .close {
                    position: absolute;
                    top: 10px;
                    right: 12px;
                    background: transparent;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #444;
                }
            </style>
            <div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-hidden="true">
                <div class="modal">
                    <button class="close" id="closeBtn" aria-label="Close">×</button>
                    <slot></slot>
                </div>
            </div>
        `;

        this.shadowRoot.getElementById('closeBtn').addEventListener('click', () => this.hide());
        this.shadowRoot.getElementById('overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hide();
        });
    }

    show() {
        const overlay = this.shadowRoot.getElementById('overlay');
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
    }

    hide() {
        const overlay = this.shadowRoot.getElementById('overlay');
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
}

customElements.define('modal-container', ModalContainer);


