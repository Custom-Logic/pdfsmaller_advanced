# UI/UX Specification

## Navigation Standards

**RULE**: The nav menu must provide clear access to: File Storage, User Profile/Authentication, and Pricing.

**IMPLEMENTATION**: The navigation should be consistent across all pages and provide intuitive access to core functionality.

### Primary Navigation Structure
```html
<nav class="main-navigation">
    <div class="nav-brand">
        <a href="/" class="brand-link">PDFSmaller</a>
    </div>
    
    <div class="nav-menu">
        <a href="#file-storage" class="nav-item" data-action="openFileManager">
            <icon name="folder"></icon>
            File Storage
        </a>
        
        <a href="#profile" class="nav-item" data-action="openProfile">
            <icon name="user"></icon>
            Profile
        </a>
        
        <a href="#pricing" class="nav-item" data-action="openPricing">
            <icon name="credit-card"></icon>
            Pricing
        </a>
        
        <button class="nav-item auth-toggle" data-action="toggleAuth">
            <icon name="login"></icon>
            <span class="auth-text">Sign In</span>
        </button>
    </div>
</nav>
```

### Navigation Behavior
```javascript
class NavigationController {
    constructor() {
        this.setupNavigationEvents();
    }
    
    setupNavigationEvents() {
        document.addEventListener('click', (event) => {
            const action = event.target.dataset.action;
            
            switch (action) {
                case 'openFileManager':
                    this.dispatchEvent(new CustomEvent('fileManagerRequested'));
                    break;
                case 'openProfile':
                    this.dispatchEvent(new CustomEvent('profileRequested'));
                    break;
                case 'openPricing':
                    this.dispatchEvent(new CustomEvent('pricingRequested'));
                    break;
                case 'toggleAuth':
                    this.dispatchEvent(new CustomEvent('authToggleRequested'));
                    break;
            }
        });
    }
}
```

## File Manager Modal

**RULE**: Must open in a dialog modal and present a list of files from the `StorageService`, with options for local download or cloud upload.

**IMPLEMENTATION**: The file manager should be a modal overlay that provides comprehensive file management capabilities.

### File Manager Structure
```html
<dialog class="file-manager-modal" id="fileManagerModal">
    <div class="modal-header">
        <h2>File Storage</h2>
        <button class="close-button" data-action="closeFileManager">
            <icon name="close"></icon>
        </button>
    </div>
    
    <div class="modal-content">
        <div class="file-manager-toolbar">
            <div class="search-container">
                <input type="search" placeholder="Search files..." class="file-search">
            </div>
            
            <div class="view-controls">
                <button class="view-toggle" data-view="grid" title="Grid view">
                    <icon name="grid"></icon>
                </button>
                <button class="view-toggle active" data-view="list" title="List view">
                    <icon name="list"></icon>
                </button>
            </div>
            
            <div class="sort-controls">
                <select class="sort-select">
                    <option value="name">Sort by Name</option>
                    <option value="date">Sort by Date</option>
                    <option value="size">Sort by Size</option>
                    <option value="type">Sort by Type</option>
                </select>
            </div>
        </div>
        
        <div class="file-list-container">
            <div class="file-list" id="fileList">
                <!-- Files populated by StorageService -->
            </div>
            
            <div class="empty-state" style="display: none;">
                <icon name="folder-empty"></icon>
                <h3>No files stored</h3>
                <p>Upload files to see them here</p>
            </div>
        </div>
    </div>
    
    <div class="modal-footer">
        <div class="storage-info">
            <span class="storage-used">0 MB</span> / <span class="storage-total">500 MB</span> used
            <div class="storage-bar">
                <div class="storage-progress"></div>
            </div>
        </div>
        
        <div class="modal-actions">
            <button class="btn-secondary" data-action="clearStorage">Clear All</button>
            <button class="btn-primary" data-action="uploadToCloud">Upload to Cloud</button>
        </div>
    </div>
</dialog>
```

### File Manager Component
```javascript
class FileManager extends BaseComponent {
    constructor() {
        super();
        this.currentView = 'list';
        this.sortBy = 'date';
        this.searchQuery = '';
        this.files = [];
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadFiles();
    }
    
    setupEventListeners() {
        // Request files from StorageService via events
        this.dispatchEvent(new CustomEvent('requestFileList'));
        
        // Listen for file updates
        document.addEventListener('filesUpdated', this.handleFilesUpdated.bind(this));
        
        // UI event handlers
        this.addEventListener('click', this.handleClick.bind(this));
        this.addEventListener('change', this.handleChange.bind(this));
        this.addEventListener('input', this.handleInput.bind(this));
    }
    
    handleClick(event) {
        const action = event.target.dataset.action;
        
        switch (action) {
            case 'downloadFile':
                this.handleDownloadFile(event.target.dataset.fileId);
                break;
            case 'deleteFile':
                this.handleDeleteFile(event.target.dataset.fileId);
                break;
            case 'shareFile':
                this.handleShareFile(event.target.dataset.fileId);
                break;
            case 'uploadToCloud':
                this.handleUploadToCloud();
                break;
            case 'clearStorage':
                this.handleClearStorage();
                break;
        }
    }
    
    handleDownloadFile(fileId) {
        this.dispatchEvent(new CustomEvent('fileDownloadRequested', {
            detail: { fileId }
        }));
    }
    
    handleDeleteFile(fileId) {
        this.dispatchEvent(new CustomEvent('fileDeleteRequested', {
            detail: { fileId }
        }));
    }
    
    renderFileList() {
        const fileList = this.querySelector('#fileList');
        const filteredFiles = this.filterAndSortFiles();
        
        if (filteredFiles.length === 0) {
            this.showEmptyState();
            return;
        }
        
        fileList.innerHTML = filteredFiles.map(file => this.renderFileItem(file)).join('');
        this.updateStorageInfo();
    }
    
    renderFileItem(file) {
        return `
            <div class="file-item" data-file-id="${file.id}">
                <div class="file-icon">
                    <icon name="${this.getFileIcon(file.type)}"></icon>
                </div>
                
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                        <span class="file-date">${this.formatDate(file.dateModified)}</span>
                        <span class="file-type">${file.type}</span>
                    </div>
                </div>
                
                <div class="file-status">
                    ${file.processed ? '<span class="status-processed">Processed</span>' : '<span class="status-original">Original</span>'}
                </div>
                
                <div class="file-actions">
                    <button class="action-btn" data-action="downloadFile" data-file-id="${file.id}" title="Download">
                        <icon name="download"></icon>
                    </button>
                    
                    <button class="action-btn" data-action="shareFile" data-file-id="${file.id}" title="Share">
                        <icon name="share"></icon>
                    </button>
                    
                    <button class="action-btn danger" data-action="deleteFile" data-file-id="${file.id}" title="Delete">
                        <icon name="trash"></icon>
                    </button>
                </div>
            </div>
        `;
    }
}
```

## Pricing Page Standards

**RULE**: Keep the current visual interface but ensure the plans are logically structured and easily accessible.

**IMPLEMENTATION**: Maintain existing design while improving information architecture and user flow.

### Pricing Structure
```html
<section class="pricing-section">
    <div class="pricing-header">
        <h1>Choose Your Plan</h1>
        <p>Select the plan that best fits your PDF processing needs</p>
    </div>
    
    <div class="pricing-toggle">
        <label class="toggle-container">
            <input type="checkbox" class="billing-toggle">
            <span class="toggle-slider"></span>
            <span class="toggle-labels">
                <span class="monthly">Monthly</span>
                <span class="annual">Annual <span class="discount">Save 20%</span></span>
            </span>
        </label>
    </div>
    
    <div class="pricing-grid">
        <div class="pricing-card free">
            <div class="card-header">
                <h3>Free</h3>
                <div class="price">
                    <span class="amount">$0</span>
                    <span class="period">/month</span>
                </div>
            </div>
            
            <div class="card-features">
                <ul class="feature-list">
                    <li class="feature-item">
                        <icon name="check"></icon>
                        Up to 5 files per day
                    </li>
                    <li class="feature-item">
                        <icon name="check"></icon>
                        Basic compression
                    </li>
                    <li class="feature-item">
                        <icon name="check"></icon>
                        10MB file size limit
                    </li>
                </ul>
            </div>
            
            <div class="card-action">
                <button class="btn-outline" data-plan="free">Get Started</button>
            </div>
        </div>
        
        <div class="pricing-card pro featured">
            <div class="card-badge">Most Popular</div>
            <div class="card-header">
                <h3>Pro</h3>
                <div class="price">
                    <span class="amount monthly-price">$9.99</span>
                    <span class="amount annual-price" style="display: none;">$7.99</span>
                    <span class="period">/month</span>
                </div>
            </div>
            
            <div class="card-features">
                <ul class="feature-list">
                    <li class="feature-item">
                        <icon name="check"></icon>
                        Unlimited files
                    </li>
                    <li class="feature-item">
                        <icon name="check"></icon>
                        Advanced compression
                    </li>
                    <li class="feature-item">
                        <icon name="check"></icon>
                        100MB file size limit
                    </li>
                    <li class="feature-item">
                        <icon name="check"></icon>
                        PDF to Word/Excel conversion
                    </li>
                    <li class="feature-item">
                        <icon name="check"></icon>
                        OCR text extraction
                    </li>
                    <li class="feature-item">
                        <icon name="check"></icon>
                        Priority processing
                    </li>
                </ul>
            </div>
            
            <div class="card-action">
                <button class="btn-primary" data-plan="pro">Start Free Trial</button>
            </div>
        </div>
        
        <div class="pricing-card enterprise">
            <div class="card-header">
                <h3>Enterprise</h3>
                <div class="price">
                    <span class="amount">Custom</span>
                </div>
            </div>
            
            <div class="card-features">
                <ul class="feature-list">
                    <li class="feature-item">
                        <icon name="check"></icon>
                        Everything in Pro
                    </li>
                    <li class="feature-item">
                        <icon name="check"></icon>
                        API access
                    </li>
                    <li class="feature-item">
                        <icon name="check"></icon>
                        Team management
                    </li>
                    <li class="feature-item">
                        <icon name="check"></icon>
                        Custom integrations
                    </li>
                    <li class="feature-item">
                        <icon name="check"></icon>
                        Dedicated support
                    </li>
                </ul>
            </div>
            
            <div class="card-action">
                <button class="btn-outline" data-plan="enterprise">Contact Sales</button>
            </div>
        </div>
    </div>
</section>
```

## Settings Page Standards

**RULE**: Streamline and clean up the tabs to be consistent with the visual design of the rest of the application.

**IMPLEMENTATION**: Organize settings into logical groups with consistent styling and clear navigation.

### Settings Structure
```html
<div class="settings-container">
    <div class="settings-sidebar">
        <nav class="settings-nav">
            <a href="#general" class="nav-item active" data-tab="general">
                <icon name="settings"></icon>
                General
            </a>
            <a href="#processing" class="nav-item" data-tab="processing">
                <icon name="cpu"></icon>
                Processing
            </a>
            <a href="#storage" class="nav-item" data-tab="storage">
                <icon name="database"></icon>
                Storage
            </a>
            <a href="#privacy" class="nav-item" data-tab="privacy">
                <icon name="shield"></icon>
                Privacy
            </a>
            <a href="#account" class="nav-item" data-tab="account">
                <icon name="user"></icon>
                Account
            </a>
        </nav>
    </div>
    
    <div class="settings-content">
        <div class="settings-panel active" id="general">
            <div class="panel-header">
                <h2>General Settings</h2>
                <p>Configure general application preferences</p>
            </div>
            
            <div class="settings-group">
                <h3>Interface</h3>
                <div class="setting-item">
                    <label class="setting-label">
                        <span class="label-text">Theme</span>
                        <select class="setting-control">
                            <option value="auto">Auto</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label class="setting-label">
                        <span class="label-text">Language</span>
                        <select class="setting-control">
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                        </select>
                    </label>
                </div>
            </div>
        </div>
        
        <div class="settings-panel" id="processing">
            <div class="panel-header">
                <h2>Processing Settings</h2>
                <p>Configure how files are processed</p>
            </div>
            
            <div class="settings-group">
                <h3>Default Compression</h3>
                <div class="setting-item">
                    <label class="setting-label">
                        <span class="label-text">Compression Level</span>
                        <select class="setting-control">
                            <option value="low">Low (Faster)</option>
                            <option value="medium">Medium</option>
                            <option value="high">High (Smaller)</option>
                        </select>
                    </label>
                </div>
            </div>
        </div>
    </div>
</div>
```

### Settings Component
```javascript
class SettingsPanel extends BaseComponent {
    constructor() {
        super();
        this.currentTab = 'general';
        this.settings = {};
    }
    
    init() {
        this.setupTabNavigation();
        this.loadSettings();
        this.setupSettingsHandlers();
    }
    
    setupTabNavigation() {
        this.addEventListener('click', (event) => {
            if (event.target.matches('[data-tab]')) {
                event.preventDefault();
                const tab = event.target.dataset.tab;
                this.switchTab(tab);
            }
        });
    }
    
    switchTab(tabName) {
        // Update active states
        this.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });
        
        this.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === tabName);
        });
        
        this.currentTab = tabName;
        
        // Emit tab change event
        this.dispatchEvent(new CustomEvent('settingsTabChanged', {
            detail: { tab: tabName }
        }));
    }
    
    handleSettingChange(key, value) {
        this.settings[key] = value;
        
        // Emit settings change event
        this.dispatchEvent(new CustomEvent('settingsChanged', {
            detail: {
                key,
                value,
                category: this.getSettingCategory(key)
            }
        }));
    }
}
```

## Responsive Design Standards

### Mobile Navigation
```css
@media (max-width: 768px) {
    .main-navigation {
        flex-direction: column;
    }
    
    .nav-menu {
        display: none;
        width: 100%;
        background: var(--nav-bg);
    }
    
    .nav-menu.open {
        display: flex;
        flex-direction: column;
    }
    
    .mobile-menu-toggle {
        display: block;
    }
}
```

### Modal Responsiveness
```css
@media (max-width: 768px) {
    .file-manager-modal {
        width: 100vw;
        height: 100vh;
        max-width: none;
        max-height: none;
        border-radius: 0;
    }
    
    .modal-content {
        padding: 1rem;
    }
    
    .file-manager-toolbar {
        flex-direction: column;
        gap: 1rem;
    }
}
```

## Accessibility Standards

### ARIA Labels and Roles
```html
<!-- Navigation -->
<nav class="main-navigation" role="navigation" aria-label="Main navigation">
    <button class="mobile-menu-toggle" aria-expanded="false" aria-controls="nav-menu">
        <span class="sr-only">Toggle navigation menu</span>
    </button>
</nav>

<!-- Modal -->
<dialog class="file-manager-modal" role="dialog" aria-labelledby="modal-title" aria-describedby="modal-description">
    <h2 id="modal-title">File Storage</h2>
    <p id="modal-description">Manage your uploaded files</p>
</dialog>

<!-- Settings -->
<div class="settings-container" role="tabpanel">
    <nav class="settings-nav" role="tablist">
        <a href="#general" role="tab" aria-selected="true" aria-controls="general-panel">General</a>
    </nav>
</div>
```

### Keyboard Navigation
```javascript
class AccessibilityManager {
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            // Tab navigation
            if (event.key === 'Tab') {
                this.handleTabNavigation(event);
            }
            
            // Escape key for modals
            if (event.key === 'Escape') {
                this.handleEscapeKey(event);
            }
            
            // Arrow keys for tab navigation
            if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
                this.handleArrowNavigation(event);
            }
        });
    }
    
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        container.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                if (event.shiftKey && document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                } else if (!event.shiftKey && document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }
}
```

This UI/UX specification ensures consistent, accessible, and user-friendly interfaces throughout the application while maintaining the event-driven architecture principles.