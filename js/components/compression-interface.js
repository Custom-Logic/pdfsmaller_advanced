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
            <style>
                :host {
                    display: block;
                    --primary: #3b82f6;
                    --primary-hover: #2563eb;
                    --gray-50: #f9fafb;
                    --gray-100: #f3f4f6;
                    --gray-200: #e5e7eb;
                    --gray-300: #d1d5db;
                    --gray-600: #4b5563;
                    --gray-700: #374151;
                    --gray-800: #1f2937;
                    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
                    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
                    --radius-lg: 0.5rem;
                    --radius-xl: 0.75rem;
                    --radius-2xl: 1rem;
                    --space-3: 0.75rem;
                    --space-4: 1rem;
                    --space-6: 1.5rem;
                    --space-8: 2rem;
                }

                .interface-container {
                    display: grid;
                    grid-template-columns: 320px 1fr;
                    gap: var(--space-8);
                    align-items: start;
                }

                .settings-sidebar {
                    position: sticky;
                    top: var(--space-8);
                }

                .settings-panel {
                    background: white;
                    border-radius: var(--radius-2xl);
                    box-shadow: var(--shadow-lg);
                    padding: var(--space-6);
                    border: 1px solid var(--gray-200);
                }

                .panel-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: var(--gray-800);
                    margin: 0 0 var(--space-4) 0;
                    padding-bottom: var(--space-3);
                    border-bottom: 1px solid var(--gray-200);
                }

                .main-content {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-6);
                }

                .mode-toggle-section {
                    background: white;
                    border-radius: var(--radius-2xl);
                    box-shadow: var(--shadow-lg);
                    padding: var(--space-6);
                    border: 1px solid var(--gray-200);
                }

                .mode-toggle {
                    display: flex;
                    background: var(--gray-100);
                    border-radius: var(--radius-lg);
                    padding: 4px;
                    gap: 4px;
                }

                .toggle-option {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 16px;
                    border: none;
                    background: transparent;
                    color: var(--gray-600);
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                }

                .toggle-option.active {
                    background: white;
                    color: var(--primary);
                    font-weight: 600;
                    box-shadow: var(--shadow-sm);
                }

                .toggle-option:hover:not(.active) {
                    color: var(--gray-700);
                    background: rgba(255, 255, 255, 0.5);
                }

                .pro-badge {
                    background: linear-gradient(135deg, #a855f7, #7c3aed);
                    color: white;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 9999px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .content-section {
                    background: white;
                    border-radius: var(--radius-2xl);
                    box-shadow: var(--shadow-lg);
                    padding: var(--space-6);
                    border: 1px solid var(--gray-200);
                }

                .content-section:empty {
                    display: none;
                }

                .section-title {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--gray-800);
                    margin: 0 0 var(--space-4) 0;
                    padding-bottom: var(--space-3);
                    border-bottom: 1px solid var(--gray-200);
                }

                /* Responsive Design */
                @media (max-width: 1024px) {
                    .interface-container {
                        grid-template-columns: 1fr;
                        gap: var(--space-6);
                    }

                    .settings-sidebar {
                        position: static;
                    }
                }

                @media (max-width: 768px) {
                    .settings-panel,
                    .mode-toggle-section,
                    .content-section {
                        padding: var(--space-4);
                    }

                    .mode-toggle {
                        flex-direction: column;
                    }

                    .toggle-option {
                        justify-content: center;
                        padding: var(--space-4);
                    }
                }

                @media (max-width: 480px) {
                    .settings-panel,
                    .mode-toggle-section,
                    .content-section {
                        padding: var(--space-3);
                        border-radius: var(--radius-xl);
                    }
                }

                /* Focus styles for accessibility */
                .toggle-option:focus-visible {
                    outline: 3px solid var(--primary);
                    outline-offset: 2px;
                }

                /* Reduced motion support */
                @media (prefers-reduced-motion: reduce) {
                    .toggle-option {
                        transition: none;
                    }
                }
            </style>
            
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


