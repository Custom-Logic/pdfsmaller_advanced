/**
 * Cloud Integration Panel Component
 * Provides Google Drive and other cloud storage integration
 */

import { BaseComponent } from './base-component.js';
import { getService } from '../services/extended-features-index.js';

export class CloudIntegrationPanel extends BaseComponent {
    constructor() {
        super();
        this.cloudService = null;
        this.isAuthenticated = false;
        this.userInfo = null;
        this.files = [];
        this.isLoading = false;
        this.currentFolder = 'root';
        this.folderStack = ['root'];
    }

    async init() {
        try {
            this.cloudService = getService('cloud');
            if (!this.cloudService) {
                console.warn('Cloud service not available');
            }
            
            // Check authentication status
            await this.checkAuthStatus();
        } catch (error) {
            console.error('Failed to initialize Cloud Integration Panel:', error);
        }
    }

    async checkAuthStatus() {
        try {
            if (this.cloudService) {
                this.isAuthenticated = await this.cloudService.isAuthenticated();
                if (this.isAuthenticated) {
                    this.userInfo = await this.cloudService.getUserInfo();
                    await this.loadFiles();
                }
            }
        } catch (error) {
            console.error('Failed to check auth status:', error);
        }
    }

    async loadFiles() {
        if (!this.isAuthenticated || !this.cloudService) return;
        
        try {
            this.isLoading = true;
            this.files = await this.cloudService.listFiles(this.currentFolder);
            this.render();
        } catch (error) {
            console.error('Failed to load files:', error);
            this.showError('Failed to load files from cloud storage');
        } finally {
            this.isLoading = false;
        }
    }

    getTemplate() {
        return `
            <div class="cloud-integration-panel">
                <div class="panel-header">
                    <h2>☁️ Cloud Integration</h2>
                    <p>Access your files from Google Drive and other cloud storage services</p>
                </div>
                
                <div class="cloud-content">
                    ${this.isAuthenticated ? this.getAuthenticatedTemplate() : this.getAuthTemplate()}
                </div>
            </div>
        `;
    }

    getAuthTemplate() {
        return `
            <div class="auth-section">
                <div class="auth-info">
                    <div class="auth-icon">🔐</div>
                    <h3>Connect Your Cloud Storage</h3>
                    <p>Securely access your files from Google Drive, Dropbox, and OneDrive</p>
                </div>
                
                <div class="cloud-providers">
                    <button class="cloud-provider-btn google-drive" onclick="this.connectGoogleDrive()">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23DB4437' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%23F4B400' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23DB4437' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23F4B400' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E" alt="Google Drive">
                        <span>Connect Google Drive</span>
                    </button>
                    
                    <button class="cloud-provider-btn dropbox" onclick="this.connectDropbox()">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23006EFF' d='M6 6.002C6 4.346 7.346 3 9.002 3H15c1.657 0 3 1.343 3 3v.002C18 7.658 16.658 9 15 9H9.002C7.346 9 6 7.654 6 5.998V6.002zM6 15.002C6 13.346 7.346 12 9.002 12H15c1.657 0 3 1.343 3 3v.002C18 18.658 16.658 20 15 20H9.002C7.346 20 6 18.654 6 16.998V15.002z'/%3E%3C/svg%3E" alt="Dropbox">
                        <span>Connect Dropbox</span>
                    </button>
                    
                    <button class="cloud-provider-btn onedrive" onclick="this.connectOneDrive()">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%230078D4' d='M21.866 12.866l-9.022 9.022a.5.5 0 01-.707 0l-9.022-9.022a.5.5 0 010-.707l9.022-9.022a.5.5 0 01.707 0l9.022 9.022a.5.5 0 010 .707z'/%3E%3C/svg%3E" alt="OneDrive">
                        <span>Connect OneDrive</span>
                    </button>
                </div>
                
                <div class="auth-note">
                    <p>🔒 Your files remain private and secure. We only access files you explicitly choose to process.</p>
                </div>
            </div>
        `;
    }

    getAuthenticatedTemplate() {
        return `
            <div class="authenticated-section">
                <div class="user-info">
                    <div class="user-avatar">
                        <img src="${this.userInfo?.picture || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%236B7280\' d=\'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\'/%3E%3C/svg%3E'}" alt="User Avatar">
                    </div>
                    <div class="user-details">
                        <h4>${this.userInfo?.name || 'User'}</h4>
                        <p>${this.userInfo?.email || 'Connected to cloud storage'}</p>
                    </div>
                    <button class="disconnect-btn" onclick="this.disconnect()">Disconnect</button>
                </div>
                
                <div class="breadcrumb">
                    <button class="breadcrumb-item" onclick="this.navigateToRoot()">🏠 Root</button>
                    ${this.folderStack.slice(1).map((folder, index) => `
                        <span class="breadcrumb-separator">/</span>
                        <button class="breadcrumb-item" onclick="this.navigateToFolder('${folder}', ${index + 1})">
                            📁 ${folder === 'root' ? 'Root' : folder}
                        </button>
                    `).join('')}
                </div>
                
                <div class="file-browser">
                    <div class="browser-header">
                        <h3>Files and Folders</h3>
                        <button class="refresh-btn" onclick="this.refresh()" ${this.isLoading ? 'disabled' : ''}>
                            🔄 Refresh
                        </button>
                    </div>
                    
                    ${this.isLoading ? this.getLoadingTemplate() : this.getFilesTemplate()}
                </div>
                
                <div class="cloud-actions">
                    <button class="btn btn-secondary" onclick="this.uploadToCloud()">
                        📤 Upload to Cloud
                    </button>
                    <button class="btn btn-primary" onclick="this.syncFiles()">
                        🔄 Sync Files
                    </button>
                </div>
            </div>
        `;
    }

    getLoadingTemplate() {
        return `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading files...</p>
            </div>
        `;
    }

    getFilesTemplate() {
        if (this.files.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <p>No files found in this folder</p>
                    <button class="btn btn-secondary" onclick="this.createFolder()">Create Folder</button>
                </div>
            `;
        }
        
        return `
            <div class="files-grid">
                ${this.files.map(file => this.renderFileItem(file)).join('')}
            </div>
        `;
    }

    renderFileItem(file) {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const icon = isFolder ? '📁' : this.getFileIcon(file.mimeType);
        
        return `
            <div class="file-item ${isFolder ? 'folder' : 'file'}" data-file-id="${file.id}">
                <div class="file-icon">${icon}</div>
                <div class="file-info">
                    <h4 class="file-name">${file.name}</h4>
                    <p class="file-meta">
                        ${isFolder ? 'Folder' : this.formatFileSize(file.size)}
                        ${file.modifiedTime ? `• Modified ${this.formatDate(file.modifiedTime)}` : ''}
                    </p>
                </div>
                <div class="file-actions">
                    ${isFolder ? 
                        `<button class="action-btn" onclick="this.openFolder('${file.id}')">Open</button>` :
                        `<button class="action-btn" onclick="this.downloadFile('${file.id}')">Download</button>`
                    }
                </div>
            </div>
        `;
    }

    getFileIcon(mimeType) {
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('image')) return '🖼️';
        if (mimeType.includes('text')) return '📝';
        if (mimeType.includes('spreadsheet')) return '📊';
        if (mimeType.includes('document')) return '📋';
        return '📄';
    }

    formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    async connectGoogleDrive() {
        try {
            if (this.cloudService) {
                await this.cloudService.authenticate('google');
                await this.checkAuthStatus();
            }
        } catch (error) {
            console.error('Failed to connect Google Drive:', error);
            this.showError('Failed to connect to Google Drive');
        }
    }

    async connectDropbox() {
        try {
            if (this.cloudService) {
                await this.cloudService.authenticate('dropbox');
                await this.checkAuthStatus();
            }
        } catch (error) {
            console.error('Failed to connect Dropbox:', error);
            this.showError('Failed to connect to Dropbox');
        }
    }

    async connectOneDrive() {
        try {
            if (this.cloudService) {
                await this.cloudService.authenticate('onedrive');
                await this.checkAuthStatus();
            }
        } catch (error) {
            console.error('Failed to connect OneDrive:', error);
            this.showError('Failed to connect to OneDrive');
        }
    }

    async disconnect() {
        try {
            if (this.cloudService) {
                await this.cloudService.disconnect();
                this.isAuthenticated = false;
                this.userInfo = null;
                this.files = [];
                this.currentFolder = 'root';
                this.folderStack = ['root'];
                this.render();
            }
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    }

    async openFolder(folderId) {
        try {
            this.currentFolder = folderId;
            this.folderStack.push(folderId);
            await this.loadFiles();
        } catch (error) {
            console.error('Failed to open folder:', error);
        }
    }

    async navigateToFolder(folderId, index) {
        try {
            this.currentFolder = folderId;
            this.folderStack = this.folderStack.slice(0, index + 1);
            await this.loadFiles();
        } catch (error) {
            console.error('Failed to navigate to folder:', error);
        }
    }

    async navigateToRoot() {
        try {
            this.currentFolder = 'root';
            this.folderStack = ['root'];
            await this.loadFiles();
        } catch (error) {
            console.error('Failed to navigate to root:', error);
        }
    }

    async refresh() {
        await this.loadFiles();
    }

    async downloadFile(fileId) {
        try {
            if (this.cloudService) {
                const file = await this.cloudService.downloadFile(fileId);
                // Trigger download
                const link = document.createElement('a');
                link.href = URL.createObjectURL(file);
                link.download = file.name || 'download';
                link.click();
            }
        } catch (error) {
            console.error('Failed to download file:', error);
            this.showError('Failed to download file');
        }
    }

    async uploadToCloud() {
        // This would open a file picker and upload to cloud
        console.log('Upload to cloud requested');
    }

    async syncFiles() {
        try {
            if (this.cloudService) {
                await this.cloudService.syncFiles();
                this.showSuccess('Files synced successfully');
            }
        } catch (error) {
            console.error('Failed to sync files:', error);
            this.showError('Failed to sync files');
        }
    }

    async createFolder() {
        const folderName = prompt('Enter folder name:');
        if (folderName && this.cloudService) {
            try {
                await this.cloudService.createFolder(folderName, this.currentFolder);
                await this.loadFiles();
                this.showSuccess('Folder created successfully');
            } catch (error) {
                console.error('Failed to create folder:', error);
                this.showError('Failed to create folder');
            }
        }
    }

    showError(message) {
        // Show error message to user
        console.error(message);
    }

    showSuccess(message) {
        // Show success message to user
        console.log(message);
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
            .cloud-integration-panel {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .auth-section {
                text-align: center;
                padding: 40px 20px;
            }
            
            .auth-info {
                margin-bottom: 30px;
            }
            
            .auth-icon {
                font-size: 3rem;
                margin-bottom: 20px;
            }
            
            .cloud-providers {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .cloud-provider-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
                text-decoration: none;
                color: inherit;
            }
            
            .cloud-provider-btn:hover {
                border-color: #3b82f6;
                transform: translateY(-2px);
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            }
            
            .cloud-provider-btn img {
                width: 48px;
                height: 48px;
                margin-bottom: 12px;
            }
            
            .cloud-provider-btn span {
                font-weight: 600;
                color: #374151;
            }
            
            .auth-note {
                background: #f3f4f6;
                padding: 16px;
                border-radius: 8px;
                max-width: 500px;
                margin: 0 auto;
            }
            
            .auth-note p {
                margin: 0;
                color: #6b7280;
                font-size: 0.875rem;
            }
            
            .authenticated-section {
                padding: 20px 0;
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 20px;
                background: #f9fafb;
                border-radius: 12px;
                margin-bottom: 24px;
            }
            
            .user-avatar img {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                object-fit: cover;
            }
            
            .user-details h4 {
                margin: 0 0 4px 0;
                color: #1f2937;
            }
            
            .user-details p {
                margin: 0;
                color: #6b7280;
                font-size: 0.875rem;
            }
            
            .disconnect-btn {
                margin-left: auto;
                padding: 8px 16px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                background: white;
                color: #6b7280;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .disconnect-btn:hover {
                background: #f3f4f6;
                border-color: #d1d5db;
            }
            
            .breadcrumb {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 24px;
                flex-wrap: wrap;
            }
            
            .breadcrumb-item {
                background: none;
                border: none;
                color: #3b82f6;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .breadcrumb-item:hover {
                background: #eff6ff;
            }
            
            .breadcrumb-separator {
                color: #9ca3af;
            }
            
            .file-browser {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                overflow: hidden;
                margin-bottom: 24px;
            }
            
            .browser-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #e5e7eb;
                background: #f9fafb;
            }
            
            .browser-header h3 {
                margin: 0;
                color: #1f2937;
            }
            
            .refresh-btn {
                padding: 8px 16px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: white;
                color: #374151;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .refresh-btn:hover:not(:disabled) {
                background: #f3f4f6;
            }
            
            .refresh-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .files-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 16px;
                padding: 20px;
            }
            
            .file-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                transition: all 0.2s;
            }
            
            .file-item:hover {
                border-color: #3b82f6;
                box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1);
            }
            
            .file-item.folder {
                background: #f0f9ff;
                border-color: #0ea5e9;
            }
            
            .file-icon {
                font-size: 2rem;
                flex-shrink: 0;
            }
            
            .file-info {
                flex: 1;
                min-width: 0;
            }
            
            .file-name {
                margin: 0 0 4px 0;
                color: #1f2937;
                font-size: 0.875rem;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .file-meta {
                margin: 0;
                color: #6b7280;
                font-size: 0.75rem;
            }
            
            .file-actions {
                flex-shrink: 0;
            }
            
            .action-btn {
                padding: 6px 12px;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                background: white;
                color: #374151;
                cursor: pointer;
                font-size: 0.75rem;
                transition: all 0.2s;
            }
            
            .action-btn:hover {
                background: #f3f4f6;
                border-color: #9ca3af;
            }
            
            .loading-state {
                text-align: center;
                padding: 40px 20px;
            }
            
            .spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #e5e7eb;
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            }
            
            .empty-state {
                text-align: center;
                padding: 40px 20px;
            }
            
            .empty-icon {
                font-size: 3rem;
                margin-bottom: 16px;
                opacity: 0.5;
            }
            
            .cloud-actions {
                display: flex;
                gap: 16px;
                justify-content: center;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
    }
}
