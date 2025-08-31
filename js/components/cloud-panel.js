/**
 * Cloud Panel Component
 * Provides cloud storage integration features
 */

import { BaseComponent } from './base-component.js';
import { getService } from '../services/extended-features-index.js';

export class CloudPanel extends BaseComponent {
    constructor() {
        super();
        this.cloudService = null;
        this.currentProvider = null;
        this.isAuthenticated = false;
        this.files = [];
        this.uploading = false;
        this.downloading = false;
        
        this.supportedProviders = [
            { id: 'google_drive', name: 'Google Drive', icon: '📁', color: '#4285F4' },
            { id: 'dropbox', name: 'Dropbox', icon: '📦', color: '#0061FF' },
            { id: 'onedrive', name: 'OneDrive', icon: '☁️', color: '#0078D4' }
        ];
    }

    async init() {
        try {
            this.cloudService = getService('cloud');
            if (!this.cloudService) {
                console.warn('Cloud Integration Service not available');
            } else {
                await this.cloudService.initialize();
                await this.checkAuthenticationStatus();
            }
        } catch (error) {
            console.error('Failed to initialize Cloud Panel:', error);
        }
    }

    getTemplate() {
        return `
            <div class="cloud-panel">
                <div class="panel-header">
                    <h2>☁️ Cloud Integration</h2>
                    <p>Save and load files from your cloud storage accounts</p>
                </div>
                
                <div class="providers-section">
                    <h3>Connect Cloud Storage</h3>
                    <div class="providers-grid">
                        ${this.supportedProviders.map(provider => this.renderProviderCard(provider)).join('')}
                    </div>
                </div>
                
                <div class="cloud-content" id="cloudContent" style="display: none;">
                    <div class="cloud-header">
                        <h3 id="cloudProviderName">Cloud Storage</h3>
                        <button class="disconnect-btn" id="disconnectBtn">Disconnect</button>
                    </div>
                    
                    <div class="cloud-actions">
                        <div class="action-group">
                            <h4>Upload Files</h4>
                            <div class="file-upload-area" id="cloudUpload">
                                <div class="upload-placeholder">
                                    <span class="upload-icon">📁</span>
                                    <p>Drop files here or click to browse</p>
                                    <small>Supports PDF, Word, Excel, and more</small>
                                </div>
                                <input type="file" id="cloudFileInput" multiple hidden>
                            </div>
                            <button class="cloud-action-btn" id="uploadFiles" disabled>
                                ☁️ Upload to Cloud
                            </button>
                        </div>
                        
                        <div class="action-group">
                            <h4>Download Files</h4>
                            <div class="files-list" id="filesList">
                                <div class="loading">Loading files...</div>
                            </div>
                            <button class="cloud-action-btn" id="downloadSelected" disabled>
                                📥 Download Selected
                            </button>
                        </div>
                    </div>
                    
                    <div class="cloud-status" id="cloudStatus"></div>
                </div>
                
                <div class="cloud-history" id="cloudHistory" style="display: none;">
                    <h3>Recent Cloud Operations</h3>
                    <div class="history-list" id="historyList"></div>
                </div>
            </div>
        `;
    }

    renderProviderCard(provider) {
        const isConnected = this.currentProvider === provider.id;
        const isAuth = this.isAuthenticated && isConnected;
        
        return `
            <div class="provider-card ${isConnected ? 'connected' : ''}" data-provider="${provider.id}">
                <div class="provider-icon" style="background-color: ${provider.color}">
                    <span class="icon">${provider.icon}</span>
                </div>
                <div class="provider-info">
                    <h4>${provider.name}</h4>
                    <p>${isAuth ? 'Connected' : 'Click to connect'}</p>
                </div>
                <button class="provider-action" data-provider="${provider.id}">
                    ${isAuth ? 'Connected ✓' : 'Connect'}
                </button>
            </div>
        `;
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
            .cloud-panel {
                padding: 2rem;
                background: var(--bg-color, #ffffff);
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }
            
            .panel-header {
                text-align: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid var(--border-color, #e0e0e0);
            }
            
            .panel-header h2 {
                font-size: 2rem;
                color: var(--primary-color, #2196F3);
                margin: 0 0 0.5rem 0;
                font-weight: 600;
            }
            
            .panel-header p {
                color: var(--text-secondary, #666);
                font-size: 1.1rem;
                margin: 0;
            }
            
            .providers-section {
                margin-bottom: 2rem;
            }
            
            .providers-section h3 {
                font-size: 1.3rem;
                color: var(--text-color, #333);
                margin: 0 0 1rem 0;
                font-weight: 600;
            }
            
            .providers-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
            }
            
            .provider-card {
                background: var(--card-bg, #f8f9fa);
                border: 2px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
                transition: all 0.3s ease;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .provider-card:hover {
                border-color: var(--primary-color, #2196F3);
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(33, 150, 243, 0.1);
            }
            
            .provider-card.connected {
                border-color: var(--success-color, #4caf50);
                background: var(--success-light, #f1f8e9);
            }
            
            .provider-icon {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .provider-icon .icon {
                font-size: 1.5rem;
                color: white;
            }
            
            .provider-info {
                flex: 1;
            }
            
            .provider-info h4 {
                font-size: 1.1rem;
                color: var(--text-color, #333);
                margin: 0 0 0.25rem 0;
                font-weight: 600;
            }
            
            .provider-info p {
                color: var(--text-secondary, #666);
                margin: 0;
                font-size: 0.9rem;
            }
            
            .provider-action {
                background: var(--primary-color, #2196F3);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
                flex-shrink: 0;
            }
            
            .provider-action:hover {
                background: var(--primary-dark, #1976D2);
            }
            
            .provider-card.connected .provider-action {
                background: var(--success-color, #4caf50);
                cursor: default;
            }
            
            .cloud-content {
                background: var(--card-bg, #f8f9fa);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .cloud-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
            }
            
            .cloud-header h3 {
                font-size: 1.3rem;
                color: var(--text-color, #333);
                margin: 0;
                font-weight: 600;
            }
            
            .disconnect-btn {
                background: var(--error-color, #f44336);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .disconnect-btn:hover {
                background: var(--error-dark, #d32f2f);
            }
            
            .cloud-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
            }
            
            .action-group h4 {
                font-size: 1.1rem;
                color: var(--text-color, #333);
                margin: 0 0 1rem 0;
                font-weight: 600;
            }
            
            .file-upload-area {
                border: 2px dashed var(--border-color, #e0e0e0);
                border-radius: 8px;
                padding: 1.5rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-bottom: 1rem;
            }
            
            .file-upload-area:hover {
                border-color: var(--primary-color, #2196F3);
                background: var(--primary-light, #f0f8ff);
            }
            
            .upload-placeholder {
                pointer-events: none;
            }
            
            .upload-icon {
                font-size: 2rem;
                display: block;
                margin-bottom: 0.5rem;
                opacity: 0.7;
            }
            
            .upload-placeholder p {
                font-size: 1rem;
                color: var(--text-color, #333);
                margin: 0 0 0.25rem 0;
                font-weight: 500;
            }
            
            .upload-placeholder small {
                color: var(--text-secondary, #666);
                font-size: 0.8rem;
            }
            
            .files-list {
                background: var(--content-bg, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 8px;
                padding: 1rem;
                min-height: 200px;
                margin-bottom: 1rem;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .file-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
            }
            
            .file-item:last-child {
                border-bottom: none;
            }
            
            .file-item input[type="checkbox"] {
                margin: 0;
            }
            
            .file-item .file-icon {
                font-size: 1.2rem;
            }
            
            .file-item .file-info {
                flex: 1;
            }
            
            .file-item .file-name {
                font-weight: 500;
                color: var(--text-color, #333);
                margin: 0;
                font-size: 0.9rem;
            }
            
            .file-item .file-meta {
                color: var(--text-secondary, #666);
                margin: 0;
                font-size: 0.8rem;
            }
            
            .cloud-action-btn {
                background: var(--primary-color, #2196F3);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                font-size: 1rem;
            }
            
            .cloud-action-btn:hover:not(:disabled) {
                background: var(--primary-dark, #1976D2);
                transform: translateY(-2px);
            }
            
            .cloud-action-btn:disabled {
                background: var(--disabled-color, #ccc);
                cursor: not-allowed;
                transform: none;
            }
            
            .cloud-status {
                margin-top: 1.5rem;
                padding: 1rem;
                border-radius: 8px;
                text-align: center;
            }
            
            .cloud-history {
                background: var(--card-bg, #f8f9fa);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 1.5rem;
            }
            
            .cloud-history h3 {
                font-size: 1.3rem;
                color: var(--text-color, #333);
                margin: 0 0 1rem 0;
                font-weight: 600;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
                padding-bottom: 0.5rem;
            }
            
            .history-list {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .history-item {
                background: var(--content-bg, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 0.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .history-info h4 {
                margin: 0 0 0.25rem 0;
                font-size: 1rem;
                color: var(--text-color, #333);
            }
            
            .history-info p {
                margin: 0;
                font-size: 0.9rem;
                color: var(--text-secondary, #666);
            }
            
            .loading {
                text-align: center;
                padding: 2rem;
                color: var(--text-secondary, #666);
                font-style: italic;
            }
            
            .success {
                background: var(--success-bg, #e8f5e8);
                border: 1px solid var(--success-color, #4caf50);
                color: var(--success-color, #4caf50);
            }
            
            .error {
                background: var(--error-bg, #ffebee);
                border: 1px solid var(--error-color, #f44336);
                color: var(--error-color, #f44336);
            }
            
            @media (max-width: 768px) {
                .cloud-panel {
                    padding: 1rem;
                }
                
                .providers-grid {
                    grid-template-columns: 1fr;
                }
                
                .cloud-actions {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
            }
        `;
    }

    setupEventListeners() {
        // Provider cards
        this.shadowRoot.querySelectorAll('.provider-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const providerId = e.currentTarget.dataset.provider;
                this.connectProvider(providerId);
            });
        });
        
        // Cloud actions
        this.shadowRoot.getElementById('disconnectBtn').addEventListener('click', () => {
            this.disconnectProvider();
        });
        
        this.shadowRoot.getElementById('uploadFiles').addEventListener('click', () => {
            this.uploadFiles();
        });
        
        this.shadowRoot.getElementById('downloadSelected').addEventListener('click', () => {
            this.downloadSelectedFiles();
        });
        
        // File upload
        this.setupFileUpload();

        // Listen for changes on file checkboxes to update download button state
        this.shadowRoot.addEventListener('change', (e) => {
            if (e.target.matches('#filesList input[type="checkbox"]')) {
                this.updateDownloadButton();
            }
        });
    }

    setupFileUpload() {
        const uploadArea = this.shadowRoot.getElementById('cloudUpload');
        const fileInput = this.shadowRoot.getElementById('cloudFileInput');
        
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileSelection(files);
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelection(files);
        });
    }

    handleFileSelection(files) {
        if (files.length === 0) return;
        
        const uploadBtn = this.shadowRoot.getElementById('uploadFiles');
        uploadBtn.disabled = false;
        
        const uploadArea = this.shadowRoot.getElementById('cloudUpload');
        uploadArea.innerHTML = `
            <div class="upload-placeholder">
                <span class="upload-icon">📁</span>
                <p>${files.length} file(s) selected</p>
                <small>Ready to upload</small>
            </div>
        `;
    }

    async connectProvider(providerId) {
        if (!this.cloudService) {
            this.showError('Cloud service not available');
            return;
        }
        
        try {
            const success = await this.cloudService.authenticate(providerId);
            if (success) {
                this.currentProvider = providerId;
                this.isAuthenticated = true;
                await this.loadCloudContent();
                this.updateProviderStates();
                this.showSuccess(`Connected to ${this.getProviderName(providerId)}`);
            } else {
                this.showError(`Failed to connect to ${this.getProviderName(providerId)}`);
            }
        } catch (error) {
            console.error('Provider connection failed:', error);
            this.showError(`Connection failed: ${error.message}`);
        }
    }

    async disconnectProvider() {
        if (!this.currentProvider) return;
        
        try {
            await this.cloudService.disconnect(this.currentProvider);
            this.currentProvider = null;
            this.isAuthenticated = false;
            this.files = [];
            
            this.shadowRoot.getElementById('cloudContent').style.display = 'none';
            this.updateProviderStates();
            this.showSuccess('Disconnected from cloud storage');
        } catch (error) {
            console.error('Provider disconnection failed:', error);
            this.showError(`Disconnection failed: ${error.message}`);
        }
    }

    async loadCloudContent() {
        if (!this.currentProvider) return;
        
        const contentContainer = this.shadowRoot.getElementById('cloudContent');
        const providerName = this.shadowRoot.getElementById('cloudProviderName');
        
        providerName.textContent = this.getProviderName(this.currentProvider);
        contentContainer.style.display = 'block';
        
        await this.loadFiles();
        await this.loadHistory();
    }

    async loadFiles() {
        if (!this.cloudService || !this.currentProvider) return;
        
        try {
            this.files = await this.cloudService.listFiles(this.currentProvider);
            this.displayFiles();
        } catch (error) {
            console.error('Failed to load files:', error);
            this.showError('Failed to load files from cloud storage');
        }
    }

    displayFiles() {
        const filesList = this.shadowRoot.getElementById('filesList');
        const downloadBtn = this.shadowRoot.getElementById('downloadSelected');
        
        if (this.files.length === 0) {
            filesList.innerHTML = '<div class="loading">No files found</div>';
            downloadBtn.disabled = true;
            return;
        }
        
        const filesHTML = this.files.map(file => `
            <div class="file-item">
                <input type="checkbox" class="file-checkbox" value="${file.id}">
                <span class="file-icon">📄</span>
                <div class="file-info">
                    <p class="file-name">${file.name}</p>
                    <p class="file-meta">${(file.size / 1024 / 1024).toFixed(2)} MB • ${new Date(file.modified).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
        
        filesList.innerHTML = filesHTML;
        downloadBtn.disabled = true;
    }

    

    async uploadFiles() {
        if (!this.cloudService || !this.currentProvider) return;
        
        const fileInput = this.shadowRoot.getElementById('cloudFileInput');
        const files = Array.from(fileInput.files);
        
        if (files.length === 0) return;
        
        try {
            this.uploading = true;
            this.updateUploadButton(true);
            
            const results = await Promise.all(
                files.map(file => this.cloudService.uploadFile(this.currentProvider, file))
            );
            
            const successCount = results.filter(r => r.success).length;
            this.showSuccess(`Successfully uploaded ${successCount} of ${files.length} files`);
            
            await this.loadFiles();
            this.resetUploadArea();
            
        } catch (error) {
            console.error('File upload failed:', error);
            this.showError(`Upload failed: ${error.message}`);
        } finally {
            this.uploading = false;
            this.updateUploadButton(false);
        }
    }

    async downloadSelectedFiles() {
        if (!this.cloudService || !this.currentProvider) return;
        
        const selectedFiles = this.shadowRoot.querySelectorAll('#filesList input[type="checkbox"]:checked');
        if (selectedFiles.length === 0) return;
        
        try {
            this.downloading = true;
            this.updateDownloadButton(true);
            
            const fileIds = Array.from(selectedFiles).map(cb => cb.value);
            const results = await Promise.all(
                fileIds.map(id => this.cloudService.downloadFile(this.currentProvider, id))
            );
            
            const successCount = results.filter(r => r.success).length;
            this.showSuccess(`Successfully downloaded ${successCount} of ${fileIds.length} files`);
            
        } catch (error) {
            console.error('File download failed:', error);
            this.showError(`Download failed: ${error.message}`);
        } finally {
            this.downloading = false;
            this.updateDownloadButton(false);
        }
    }

    async loadHistory() {
        if (!this.cloudService) return;
        
        try {
            const history = await this.cloudService.getHistory();
            this.displayHistory(history);
        } catch (error) {
            console.error('Failed to load cloud history:', error);
        }
    }

    displayHistory(history) {
        if (history.length === 0) return;
        
        const historyContainer = this.shadowRoot.getElementById('cloudHistory');
        const historyList = this.shadowRoot.getElementById('historyList');
        
        const historyHTML = history.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <h4>${item.type === 'upload' ? '📤 Upload' : '📥 Download'}</h4>
                    <p>${item.fileName} - ${new Date(item.timestamp).toLocaleString()}</p>
                </div>
            </div>
        `).join('');
        
        historyList.innerHTML = historyHTML;
        historyContainer.style.display = 'block';
    }

    updateProviderStates() {
        this.shadowRoot.querySelectorAll('.provider-card').forEach(card => {
            const providerId = card.dataset.provider;
            const isConnected = this.currentProvider === providerId;
            
            card.classList.toggle('connected', isConnected);
            
            const actionBtn = card.querySelector('.provider-action');
            if (isConnected) {
                actionBtn.textContent = 'Connected ✓';
            } else {
                actionBtn.textContent = 'Connect';
            }
        });
    }

    updateUploadButton(loading) {
        const uploadBtn = this.shadowRoot.getElementById('uploadFiles');
        if (loading) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = '⏳ Uploading...';
        } else {
            uploadBtn.disabled = false;
            uploadBtn.textContent = '☁️ Upload to Cloud';
        }
    }

    updateDownloadButton(loading) {
        const downloadBtn = this.shadowRoot.getElementById('downloadSelected');
        if (typeof loading === 'boolean') { // If loading parameter is provided
            if (loading) {
                downloadBtn.disabled = true;
                downloadBtn.textContent = '⏳ Downloading...';
            } else {
                downloadBtn.disabled = false;
                downloadBtn.textContent = '📥 Download Selected';
            }
        } else { // If no loading parameter, update based on selected files
            const selectedFiles = this.shadowRoot.querySelectorAll('#filesList input[type="checkbox"]:checked');
            downloadBtn.disabled = selectedFiles.length === 0;
        }
    }

    resetUploadArea() {
        const uploadArea = this.shadowRoot.getElementById('cloudUpload');
        const fileInput = this.shadowRoot.getElementById('cloudFileInput');
        
        uploadArea.innerHTML = `
            <div class="upload-placeholder">
                <span class="upload-icon">📁</span>
                <p>Drop files here or click to browse</p>
                <small>Supports PDF, Word, Excel, and more</small>
            </div>
        `;
        
        fileInput.value = '';
        this.shadowRoot.getElementById('uploadFiles').disabled = true;
    }

    getProviderName(providerId) {
        const provider = this.supportedProviders.find(p => p.id === providerId);
        return provider ? provider.name : providerId;
    }

    async checkAuthenticationStatus() {
        if (!this.cloudService) return;
        
        for (const provider of this.supportedProviders) {
            try {
                const isAuth = await this.cloudService.isAuthenticated(provider.id);
                if (isAuth) {
                    this.currentProvider = provider.id;
                    this.isAuthenticated = true;
                    await this.loadCloudContent();
                    break;
                }
            } catch (error) {
                console.warn(`Failed to check auth for ${provider.id}:`, error);
            }
        }
        
        this.updateProviderStates();
    }

    showSuccess(message) {
        this.showStatus(message, 'success');
    }

    showError(message) {
        this.showStatus(message, 'error');
    }

    showStatus(message, type) {
        const statusContainer = this.shadowRoot.getElementById('cloudStatus');
        statusContainer.innerHTML = `<div class="${type}">${message}</div>`;
        statusContainer.style.display = 'block';
        
        setTimeout(() => {
            statusContainer.style.display = 'none';
        }, 5000);
    }
}

customElements.define('cloud-panel', CloudPanel);
