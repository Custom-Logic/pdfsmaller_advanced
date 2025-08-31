/**
 * File Manager Component
 * Provides UI for users to access and manage their stored files
 * Follows Shadow DOM architecture with BaseComponent pattern
 */

import { BaseComponent } from './base-component.js';

export class FileManager extends BaseComponent {
    constructor() {
        super();
        
        // Initialize component state using BaseComponent
        this.setState({
            files: [],
            isLoading: false,
            error: null,
            searchQuery: '',
            filterType: 'all',
            sortBy: 'timestamp'
        }, false); // Don't render immediately
    }

    // BaseComponent lifecycle method
    init() {
        console.log('FileManager: Initializing...');
        // Component-specific initialization
        this.requestFileList();
    }

    // BaseComponent lifecycle method - called after component is connected and rendered
    onConnected() {
        console.log('FileManager: Connected to DOM');
        this.setupEventListeners();
    }

    // BaseComponent lifecycle method - called when state changes
    onStateChanged(oldState, newState) {
        // Handle specific state changes that require side effects
        if (oldState.isLoading !== newState.isLoading) {
            this.updateAriaLive();
        }
        
        if (oldState.files !== newState.files) {
            this.announceFileCountChange(newState.files.length);
        }
    }
    // Shadow DOM event listener setup
    setupEventListeners() {
        console.log('FileManager: Setting up event listeners with shadow DOM');
        
        // Search functionality with shadow DOM context
        const searchInput = this.$('.file-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.setState({ searchQuery: e.target.value });
            }, 300));
        }
        
        // Filter functionality
        const filterSelect = this.$('.filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.setState({ filterType: e.target.value });
            });
        }
        
        // Sort functionality
        const sortSelect = this.$('.sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.setState({ sortBy: e.target.value });
            });
        }
        
        // File actions - use event delegation on shadow root
        this.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const fileId = e.target.dataset.fileId;
            
            if (action && fileId) {
                e.preventDefault();
                
                switch (action) {
                    case 'download':
                        this.handleDownloadFile(fileId);
                        break;
                    case 'delete':
                        this.handleDeleteFile(fileId);
                        break;
                }
            }
        });
        
        // Toolbar actions
        const refreshBtn = this.$('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }
        
        const clearAllBtn = this.$('.clear-all-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.handleClearAll());
        }
        
        const retryBtn = this.$('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.requestFileList());
        }
    }

    // Event Handlers
    requestFileList() {
        console.log('FileManager: Requesting file list...');
        this.setState({ isLoading: true, error: null });
        
        // Emit event to request files from StorageService via MainController
        // Use document.dispatchEvent to ensure MainController receives it
        document.dispatchEvent(new CustomEvent('requestFileList', {
            detail: { timestamp: Date.now() },
            bubbles: true,
            composed: true
        }));
    }

    handleDownloadFile(fileId) {
        console.log('FileManager: Download requested for file:', fileId);
        // Emit event to request file download via MainController
        document.dispatchEvent(new CustomEvent('fileDownloadRequested', {
            detail: { fileId },
            bubbles: true,
            composed: true
        }));
    }

    handleDeleteFile(fileId) {
        const { files } = this.getState();
        const file = files.find(f => f.id === fileId);
        
        if (file && confirm(`Delete "${file.metadata.name}"?`)) {
            console.log('FileManager: Delete requested for file:', fileId);
            // Emit event to request file deletion via MainController
            document.dispatchEvent(new CustomEvent('fileDeleteRequested', {
                detail: { fileId },
                bubbles: true,
                composed: true
            }));
        }
    }

    handleClearAll() {
        const { files } = this.getState();
        
        if (files.length === 0) return;
        
        if (confirm(`Delete all ${files.length} files?`)) {
            console.log('FileManager: Clear all requested for', files.length, 'files');
            // Emit event to clear all files
            document.dispatchEvent(new CustomEvent('clearAllFilesRequested', {
                detail: { fileCount: files.length },
                bubbles: true,
                composed: true
            }));
        }
    }

    // Utility Methods using state
    getFilteredAndSortedFiles() {
        const { files, searchQuery, filterType, sortBy } = this.getState();
        let filtered = [...files];
        
        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(file => 
                file.metadata.name.toLowerCase().includes(query)
            );
        }
        
        // Apply type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(file => 
                file.metadata.type === filterType
            );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.metadata.name.toLowerCase();
                    bValue = b.metadata.name.toLowerCase();
                    break;
                case 'size':
                    aValue = a.metadata.size || 0;
                    bValue = b.metadata.size || 0;
                    break;
                case 'timestamp':
                default:
                    aValue = a.metadata.timestamp || 0;
                    bValue = b.metadata.timestamp || 0;
                    break;
            }
            
            return aValue < bValue ? 1 : -1; // Descending order
        });
        
        return filtered;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // BaseComponent required method - return HTML template
    getTemplate() {
        const { files, isLoading, error, searchQuery, filterType, sortBy } = this.getState();
        
        return `
            <div class="file-manager">
                ${this.renderHeader()}
                ${this.renderToolbar()}
                ${this.renderContent()}
            </div>
        `;
    }

    // BaseComponent required method - return CSS styles
    getStyles() {
        return `
            :host {
                display: block;
                width: 100%;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            /* Component Variables */
            .file-manager {
                --fm-bg: var(--card-bg, #ffffff);
                --fm-border: var(--border-color, #e5e7eb);
                --fm-text: var(--text-color, #374151);
                --fm-text-muted: var(--text-muted, #6b7280);
                --fm-primary: var(--primary-color, #3b82f6);
                --fm-danger: var(--danger-color, #ef4444);
                --fm-success: var(--success-color, #10b981);
                --fm-radius: var(--border-radius, 12px);
                --fm-shadow: var(--shadow-sm, 0 4px 6px rgba(0,0,0,0.1));
            }

            /* Main Container */
            .file-manager {
                background: var(--fm-bg);
                border: 1px solid var(--fm-border);
                border-radius: var(--fm-radius);
                box-shadow: var(--fm-shadow);
                overflow: hidden;
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            /* Header Section */
            .file-manager-header {
                padding: 24px;
                border-bottom: 1px solid var(--fm-border);
                background: #f9fafb;
            }

            .file-manager-header h2 {
                margin: 0 0 8px 0;
                color: var(--fm-text);
                font-size: 20px;
                font-weight: 600;
            }

            .file-manager-header p {
                margin: 0;
                color: var(--fm-text-muted);
                font-size: 14px;
            }

            /* Toolbar Section */
            .file-manager-toolbar {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 24px;
                border-bottom: 1px solid var(--fm-border);
                background: var(--fm-bg);
                flex-wrap: wrap;
            }

            .search-container {
                position: relative;
                flex: 1;
                min-width: 200px;
            }

            .file-search {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--fm-border);
                border-radius: 6px;
                font-size: 14px;
                background: var(--fm-bg);
                color: var(--fm-text);
                outline: none;
                transition: border-color 0.2s ease;
            }

            .file-search:focus {
                border-color: var(--fm-primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .filter-select,
            .sort-select {
                padding: 8px 12px;
                border: 1px solid var(--fm-border);
                border-radius: 6px;
                font-size: 14px;
                background: var(--fm-bg);
                color: var(--fm-text);
                cursor: pointer;
                outline: none;
                transition: border-color 0.2s ease;
            }

            .filter-select:focus,
            .sort-select:focus {
                border-color: var(--fm-primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

        /* Content Section */
        .file-list-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            min-height: 400px;
        }

        .file-list {
            flex: 1;
            overflow-y: auto;
            padding: 0;
            max-height: 400px;
        }

            /* State Templates */
            .loading-state,
            .error-state,
            .empty-state {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 48px 24px;
                text-align: center;
            }

            .loading-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #f3f4f6;
                border-top-color: var(--fm-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .error-state h3 {
                color: var(--fm-danger);
                margin: 16px 0 8px 0;
                font-size: 18px;
                font-weight: 600;
            }

            .empty-state h3 {
                color: var(--fm-text-muted);
                margin: 16px 0 8px 0;
                font-size: 18px;
                font-weight: 600;
            }

            .error-state p,
            .empty-state p {
                margin: 0 0 24px 0;
                font-size: 14px;
                color: var(--fm-text-muted);
            }

            /* File Items */
            .file-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 24px;
                border-bottom: 1px solid #f3f4f6;
                transition: background-color 0.2s ease;
            }

            .file-item:hover {
                background: #f9fafb;
            }

            .file-item:last-child {
                border-bottom: none;
            }

            .file-icon {
                font-size: 24px;
                flex-shrink: 0;
            }

            .file-info {
                flex: 1;
                min-width: 0;
            }

            .file-name {
                font-size: 14px;
                font-weight: 500;
                color: var(--fm-text);
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .file-meta {
                display: flex;
                gap: 12px;
                font-size: 12px;
                color: var(--fm-text-muted);
            }

            .file-status {
                flex-shrink: 0;
            }

            .status-badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
            }

            .status-badge.original {
                background: #dbeafe;
                color: #1e40af;
            }

            .status-badge.processed {
                background: #dcfce7;
                color: #166534;
            }

            /* File Actions */
            .file-actions {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }

            .action-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 6px;
                background: transparent;
                cursor: pointer;
                transition: background-color 0.2s ease;
                font-size: 16px;
            }

            .action-btn:hover {
                background: #f3f4f6;
            }

            .action-btn.delete-btn:hover {
                background: #fee2e2;
            }

            .action-btn:focus {
                outline: 2px solid var(--fm-primary);
                outline-offset: 2px;
            }

            /* Storage Info */
            .storage-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                border-top: 1px solid var(--fm-border);
                background: #f9fafb;
            }

            .storage-stats {
                display: flex;
                gap: 24px;
                font-size: 14px;
                color: var(--fm-text-muted);
            }

            .storage-actions {
                display: flex;
                gap: 8px;
            }

            /* Buttons */
            .btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                text-decoration: none;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                outline: none;
            }

            .btn:focus {
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .btn-primary {
                background: var(--fm-primary);
                color: white;
            }

            .btn-primary:hover {
                background: #2563eb;
            }

            .btn-secondary {
                background: #6b7280;
                color: white;
            }

            .btn-secondary:hover {
                background: #4b5563;
            }

            .btn-outline {
                background: transparent;
                color: var(--fm-text);
                border: 1px solid var(--fm-border);
            }

            .btn-outline:hover {
                background: #f9fafb;
                border-color: #9ca3af;
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .file-manager-toolbar {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 12px;
                }
                
                .search-container {
                    min-width: auto;
                }
                
                .file-item {
                    padding: 12px 16px;
                    gap: 12px;
                }
                
                .file-meta {
                    flex-direction: column;
                    gap: 4px;
                }
                
                .storage-info {
                    flex-direction: column;
                    gap: 16px;
                    align-items: stretch;
                }
                
                .storage-actions {
                    justify-content: center;
                }
            }

            @media (max-width: 480px) {
                .file-manager-header {
                    padding: 16px;
                }
                
                .file-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
                
                .file-actions {
                    align-self: flex-end;
                }
                
                .storage-stats {
                    justify-content: center;
                }
            }

            /* Accessibility */
            @media (prefers-reduced-motion: reduce) {
                .file-item,
                .action-btn,
                .btn {
                    transition: none;
                }
                
                .loading-spinner {
                    animation: none;
                }
            }

            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
        `;
    }

    // Template rendering methods
    renderHeader() {
        return `
            <div class="file-manager-header">
                <h2>File Storage</h2>
                <p>Manage your uploaded and processed files</p>
            </div>
        `;
    }

    renderToolbar() {
        const { searchQuery, filterType, sortBy } = this.getState();
        
        return `
            <div class="file-manager-toolbar">
                <div class="search-container">
                    <input type="search" 
                           class="file-search" 
                           placeholder="Search files..." 
                           value="${this.escapeHtml(searchQuery)}">
                </div>
                
                <div class="filter-container">
                    <select class="filter-select">
                        <option value="all" ${filterType === 'all' ? 'selected' : ''}>All Files</option>
                        <option value="original" ${filterType === 'original' ? 'selected' : ''}>Original Files</option>
                        <option value="processed" ${filterType === 'processed' ? 'selected' : ''}>Processed Files</option>
                    </select>
                </div>
                
                <div class="sort-container">
                    <select class="sort-select">
                        <option value="timestamp" ${sortBy === 'timestamp' ? 'selected' : ''}>Sort by Date</option>
                        <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Sort by Name</option>
                        <option value="size" ${sortBy === 'size' ? 'selected' : ''}>Sort by Size</option>
                    </select>
                </div>
            </div>
        `;
    }

    renderContent() {
        const { isLoading, error, files } = this.getState();
        
        if (isLoading) {
            return this.renderLoadingState();
        }
        
        if (error) {
            return this.renderErrorState();
        }
        
        const filteredFiles = this.getFilteredAndSortedFiles();
        
        if (filteredFiles.length === 0) {
            return this.renderEmptyState();
        }
        
        return `
            <div class="file-list-container">
                <div class="file-list">
                    ${filteredFiles.map(file => this.renderFileItem(file)).join('')}
                </div>
                ${this.renderStorageInfo()}
            </div>
        `;
    }

    renderLoadingState() {
        return `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading files...</p>
            </div>
        `;
    }

    renderErrorState() {
        const { error } = this.getState();
        return `
            <div class="error-state">
                <h3>Error Loading Files</h3>
                <p>${this.escapeHtml(error)}</p>
                <button class="btn btn-primary retry-btn">Retry</button>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>No Files Found</h3>
                <p>Upload some files to see them here.</p>
            </div>
        `;
    }

    renderFileItem(file) {
        const metadata = file.metadata;
        const isProcessed = metadata.type === 'processed';
        
        return `
            <div class="file-item" data-file-id="${file.id}">
                <div class="file-icon">
                    📄
                </div>
                
                <div class="file-info">
                    <div class="file-name" title="${this.escapeHtml(metadata.name)}">
                        ${this.escapeHtml(metadata.name)}
                    </div>
                    <div class="file-meta">
                        <span class="file-size">${this.formatFileSize(metadata.size)}</span>
                        <span class="file-date">${this.formatDate(metadata.timestamp)}</span>
                    </div>
                </div>
                
                <div class="file-status">
                    <span class="status-badge ${isProcessed ? 'processed' : 'original'}">
                        ${isProcessed ? 'Processed' : 'Original'}
                    </span>
                </div>
                
                <div class="file-actions">
                    <button class="action-btn download-btn" 
                            data-action="download" 
                            data-file-id="${file.id}" 
                            title="Download file"
                            aria-label="Download ${this.escapeHtml(metadata.name)}">
                        ⬇️
                    </button>
                    
                    <button class="action-btn delete-btn" 
                            data-action="delete" 
                            data-file-id="${file.id}" 
                            title="Delete file"
                            aria-label="Delete ${this.escapeHtml(metadata.name)}">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    renderStorageInfo() {
        const { files } = this.getState();
        const totalFiles = files.length;
        const totalSize = files.reduce((sum, file) => sum + (file.metadata.size || 0), 0);
        
        return `
            <div class="storage-info">
                <div class="storage-stats">
                    <span><strong>${totalFiles}</strong> files</span>
                    <span><strong>${this.formatFileSize(totalSize)}</strong> total</span>
                </div>
                
                <div class="storage-actions">
                    <button class="btn btn-outline refresh-btn">Refresh</button>
                    <button class="btn btn-secondary clear-all-btn">Clear All</button>
                </div>
            </div>
        `;
    }

    // Public API (backward compatibility)
    updateFiles(files) {
        this.setState({ 
            files: files || [], 
            isLoading: false, 
            error: null 
        });
    }

    showError(error) {
        this.setState({ 
            error: error.message || error, 
            isLoading: false 
        });
    }

    refresh() {
        this.requestFileList();
    }

    // Utility methods
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateAriaLive() {
        const { isLoading } = this.getState();
        this.setAttribute('aria-busy', isLoading.toString());
    }

    announceFileCountChange(count) {
        if (typeof this.announceToScreenReader === 'function') {
            this.announceToScreenReader(`File list updated. ${count} files available.`);
        }
    }
}

// Register the component
customElements.define('file-manager', FileManager);
