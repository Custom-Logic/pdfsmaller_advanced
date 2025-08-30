/**
 * File Manager Component
 * Provides UI for users to access and manage their stored files
 */

import { BaseComponent } from './base-component.js';

export class FileManager extends BaseComponent {
    constructor() {
        super();
        this.files = [];
        this.isLoading = false;
        this.error = null;
        this.sortBy = 'timestamp';
        this.filterType = 'all';
        this.searchQuery = '';
    }

    async connectedCallback() {
        await this.init();
        this.render();
        this.setupEventListeners();
    }

    async init() {
        try {
            this.setState({
                isLoading: false,
                error: null,
                files: []
            });
            
            // Request files from StorageService via events
            this.requestFileList();
            
        } catch (error) {
            console.error('FileManager init error:', error);
            this.setState({ error: 'Failed to initialize file manager' });
        }
    }

    render() {
        this.innerHTML = `
            <div class="file-manager">
                ${this.renderHeader()}
                ${this.renderToolbar()}
                ${this.renderContent()}
            </div>
        `;
    }

    renderHeader() {
        return `
            <div class="file-manager-header">
                <h2>File Storage</h2>
                <p>Manage your uploaded and processed files</p>
            </div>
        `;
    }

    renderToolbar() {
        return `
            <div class="file-manager-toolbar">
                <div class="search-container">
                    <input type="search" 
                           class="file-search" 
                           placeholder="Search files..." 
                           value="${this.searchQuery}">
                </div>
                
                <div class="filter-container">
                    <select class="filter-select">
                        <option value="all">All Files</option>
                        <option value="original">Original Files</option>
                        <option value="processed">Processed Files</option>
                    </select>
                </div>
                
                <div class="sort-container">
                    <select class="sort-select">
                        <option value="timestamp">Sort by Date</option>
                        <option value="name">Sort by Name</option>
                        <option value="size">Sort by Size</option>
                    </select>
                </div>
            </div>
        `;
    }    render
Content() {
        if (this.isLoading) {
            return this.renderLoading();
        }
        
        if (this.error) {
            return this.renderError();
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

    renderLoading() {
        return `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading files...</p>
            </div>
        `;
    }

    renderError() {
        return `
            <div class="error-state">
                <h3>Error Loading Files</h3>
                <p>${this.error}</p>
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
    }    ren
derFileItem(file) {
        const metadata = file.metadata;
        const isProcessed = metadata.type === 'processed';
        
        return `
            <div class="file-item" data-file-id="${file.id}">
                <div class="file-icon">
                    📄
                </div>
                
                <div class="file-info">
                    <div class="file-name" title="${metadata.name}">
                        ${metadata.name}
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
                            title="Download file">
                        ⬇️
                    </button>
                    
                    <button class="action-btn delete-btn" 
                            data-action="delete" 
                            data-file-id="${file.id}" 
                            title="Delete file">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    renderStorageInfo() {
        const totalFiles = this.files.length;
        const totalSize = this.files.reduce((sum, file) => sum + (file.metadata.size || 0), 0);
        
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
   setupEventListeners() {
        // Search functionality
        const searchInput = this.querySelector('.file-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.render();
            });
        }
        
        // Filter functionality
        const filterSelect = this.querySelector('.filter-select');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterType = e.target.value;
                this.render();
            });
        }
        
        // Sort functionality
        const sortSelect = this.querySelector('.sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.render();
            });
        }
        
        // File actions
        this.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const fileId = e.target.dataset.fileId;
            
            switch (action) {
                case 'download':
                    this.handleDownloadFile(fileId);
                    break;
                case 'delete':
                    this.handleDeleteFile(fileId);
                    break;
            }
        });
        
        // Toolbar actions
        const retryBtn = this.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.requestFileList());
        }
        
        const refreshBtn = this.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.requestFileList());
        }
        
        const clearAllBtn = this.querySelector('.clear-all-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.handleClearAll());
        }
    }    
// Event Handlers
    requestFileList() {
        this.setState({ isLoading: true, error: null });
        this.render();
        
        // Emit event to request files from StorageService via MainController
        this.dispatchEvent(new CustomEvent('requestFileList', {
            detail: { timestamp: Date.now() }
        }));
    }

    handleFileListReceived(files) {
        this.files = files || [];
        this.setState({ isLoading: false, error: null });
        this.render();
    }

    handleFileListError(error) {
        this.setState({ 
            isLoading: false, 
            error: error.message || 'Failed to load files' 
        });
        this.render();
    }

    handleDownloadFile(fileId) {
        // Emit event to request file download via MainController
        this.dispatchEvent(new CustomEvent('fileDownloadRequested', {
            detail: { fileId }
        }));
    }

    handleDeleteFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (file && confirm(`Delete "${file.metadata.name}"?`)) {
            // Emit event to request file deletion via MainController
            this.dispatchEvent(new CustomEvent('fileDeleteRequested', {
                detail: { fileId }
            }));
        }
    }

    handleClearAll() {
        if (this.files.length === 0) return;
        
        if (confirm(`Delete all ${this.files.length} files?`)) {
            // Emit event to clear all files
            this.dispatchEvent(new CustomEvent('clearAllFilesRequested', {
                detail: { fileCount: this.files.length }
            }));
        }
    }    // Utility Methods

    getFilteredAndSortedFiles() {
        let filtered = [...this.files];
        
        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(file => 
                file.metadata.name.toLowerCase().includes(query)
            );
        }
        
        // Apply type filter
        if (this.filterType !== 'all') {
            filtered = filtered.filter(file => 
                file.metadata.type === this.filterType
            );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (this.sortBy) {
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

    // Public API
    updateFiles(files) {
        this.handleFileListReceived(files);
    }

    showError(error) {
        this.handleFileListError(error);
    }

    refresh() {
        this.requestFileList();
    }
}

// Register the component
customElements.define('file-manager', FileManager);