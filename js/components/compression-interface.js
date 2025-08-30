/**
 * Compression Interface Component
 * Modern two-column layout for compression workflow
 */

class CompressionInterface extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            
            <div class="interface-container">
                <!-- Settings Sidebar -->
                <div class="settings-sidebar">
                    <div class="settings-panel">
                        <h3 class="panel-title">Compression Settings</h3>
                        <slot name="settings"></slot>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div class="main-content">
                    <!-- Mode Toggle -->
                    <div class="mode-toggle-section">
                        <div class="mode-toggle">
                            <button class="toggle-option active" data-mode="single">
                                <span>Single File</span>
                            </button>
                            <button class="toggle-option" data-mode="bulk">
                                <span>Bulk</span>
                                <span class="pro-badge">PRO</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Upload Section -->
                    <div class="content-section upload-section">
                        <h3 class="section-title">Upload Files</h3>
                        <slot name="uploader"></slot>
                    </div>
                    
                    <!-- Progress Section -->
                    <div class="content-section progress-section">
                        <h3 class="section-title">Progress</h3>
                        <slot name="progress"></slot>
                    </div>
                    
                    <!-- Results Section -->
                    <div class="content-section results-section">
                        <h3 class="section-title">Results</h3>
                        <slot name="results"></slot>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const toggleButtons = this.shadowRoot.querySelectorAll('.toggle-option');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });
    }

    switchMode(mode) {
        const toggleButtons = this.shadowRoot.querySelectorAll('.toggle-option');
        
        // Update button states
        toggleButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.mode === mode);
        });

        // Dispatch mode change event
        this.dispatchEvent(new CustomEvent('modechange', {
            detail: { mode },
            bubbles: true
        }));
    }

    getCurrentMode() {
        const activeButton = this.shadowRoot.querySelector('.toggle-option.active');
        return activeButton ? activeButton.dataset.mode : 'single';
    }

    setMode(mode) {
        this.switchMode(mode);
    }
}

customElements.define('compression-interface', CompressionInterface);


