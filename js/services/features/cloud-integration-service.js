/**
 * Cloud Storage Service (Refactored)
 * Handles integration with cloud storage providers like Google Drive, Dropbox, OneDrive
 * Follows the new event-driven, service-centric architecture
 */

import { StandardService } from './standard-service.js';
import { APIClient } from './api-client.js';
import { SecurityService } from './security-service.js';

export class CloudStorageService extends StandardService {
    constructor() {
        super();
        this.apiClient = new APIClient();
        this.securityService = new SecurityService();
        this.cloudHistory = new Map();
        this.supportedProviders = ['google_drive', 'dropbox', 'onedrive'];
        this.oauthConfigs = {
            google_drive: {
                clientId: process.env.GOOGLE_CLIENT_ID || '',
                scope: 'https://www.googleapis.com/auth/drive.file',
                redirectUri: `${window.location.origin}/auth/google/callback`
            },
            dropbox: {
                clientId: process.env.DROPBOX_CLIENT_ID || '',
                scope: 'files.content.write files.content.read',
                redirectUri: `${window.location.origin}/auth/dropbox/callback`
            },
            onedrive: {
                clientId: process.env.ONEDRIVE_CLIENT_ID || '',
                scope: 'files.readwrite',
                redirectUri: `${window.location.origin}/auth/onedrive/callback`
            }
        };
        this.isAuthenticated = new Map();
        this.accessTokens = new Map();
    }

    async init() {
        try {
            await super.init();
            
            // Check for existing authentication tokens
            await this.checkExistingAuth();
            
            // Set up event listeners for OAuth callbacks
            this.setupOAuthListeners();
            
            this.emitStatusChange('initialized');
        } catch (error) {
            this.emitError(error, { operation: 'initialization' });
            throw error;
        }
    }

    /**
     * Primary API: Upload file to cloud storage
     * @param {string} fileId - File ID from storage service
     * @param {string} cloudProvider - Cloud provider name
     * @param {Object} uploadOptions - Upload options
     * @returns {Promise<Object>} Upload result
     */
    async uploadToCloud(fileId, cloudProvider, uploadOptions = {}) {
        try {
            this.isProcessing = true;
            this.emitStatusChange('uploading', { fileId, provider: cloudProvider });
            this.emitProgress(0, 'Starting cloud upload...');

            // Validate provider
            this.validateProvider(cloudProvider);

            // Ensure authentication
            await this.ensureAuthenticated(cloudProvider);

            // Get file from storage (via event to MainController)
            const file = await this.requestFile(fileId);
            
            // Perform upload
            const result = await this.performUpload(file, cloudProvider, uploadOptions);

            this.emitProgress(100, 'Cloud upload completed');
            this.emitComplete(result, `Upload to ${cloudProvider} completed successfully`);
            
            return result;
        } catch (error) {
            this.emitError(error, { fileId, provider: cloudProvider, operation: 'upload' });
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Primary API: Download file from cloud storage
     * @param {string} cloudProvider - Cloud provider name
     * @param {string} filePath - File path in cloud storage
     * @param {Object} downloadOptions - Download options
     * @returns {Promise<Object>} Download result
     */
    async downloadFromCloud(cloudProvider, filePath, downloadOptions = {}) {
        try {
            this.isProcessing = true;
            this.emitStatusChange('downloading', { provider: cloudProvider, filePath });
            this.emitProgress(0, 'Starting cloud download...');

            // Validate provider
            this.validateProvider(cloudProvider);

            // Ensure authentication
            await this.ensureAuthenticated(cloudProvider);
            
            // Perform download
            const result = await this.performDownload(cloudProvider, filePath, downloadOptions);

            this.emitProgress(100, 'Cloud download completed');
            this.emitComplete(result, `Download from ${cloudProvider} completed successfully`);
            
            return result;
        } catch (error) {
            this.emitError(error, { provider: cloudProvider, filePath, operation: 'download' });
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Validate cloud provider
     */
    validateProvider(provider) {
        if (!this.supportedProviders.includes(provider)) {
            throw new Error(`Unsupported provider: ${provider}. Supported providers: ${this.supportedProviders.join(', ')}`);
        }
    }

    /**
     * Ensure authentication with provider
     */
    async ensureAuthenticated(provider) {
        if (!this.isAuthenticated.get(provider)) {
            this.emitProgress(10, `Authenticating with ${provider}...`);
            await this.authenticate(provider);
        }
    }

    /**
     * Request file from storage service via events
     */
    async requestFile(fileId) {
        return new Promise((resolve, reject) => {
            // Emit request for file
            this.dispatchEvent(new CustomEvent('fileRequested', {
                detail: { fileId, requestId: Date.now() }
            }));

            // Listen for file response (this would be handled by MainController)
            const timeout = setTimeout(() => {
                reject(new Error('File request timeout'));
            }, 10000);

            const handleFileResponse = (event) => {
                if (event.detail.fileId === fileId) {
                    clearTimeout(timeout);
                    document.removeEventListener('fileResponse', handleFileResponse);
                    
                    if (event.detail.error) {
                        reject(new Error(event.detail.error));
                    } else {
                        resolve(event.detail.file);
                    }
                }
            };

            document.addEventListener('fileResponse', handleFileResponse);
        });
    }
    /*
*
     * Check for existing authentication
     */
    async checkExistingAuth() {
        for (const provider of this.supportedProviders) {
            try {
                const token = this.securityService.getStoredToken(`cloud_${provider}`);
                if (token) {
                    // Validate token with provider
                    const isValid = await this.validateToken(provider, token);
                    if (isValid) {
                        this.isAuthenticated.set(provider, true);
                        this.accessTokens.set(provider, token);
                    } else {
                        // Remove invalid token
                        this.securityService.removeStoredToken(`cloud_${provider}`);
                    }
                }
            } catch (error) {
                console.warn(`Failed to check auth for ${provider}:`, error);
            }
        }
    }

    /**
     * Setup OAuth event listeners
     */
    setupOAuthListeners() {
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'oauth_callback') {
                this.handleOAuthCallback(event.data.provider, event.data.code);
            }
        });
    }

    /**
     * Authenticate with cloud provider
     */
    async authenticate(provider) {
        try {
            if (this.isAuthenticated.get(provider)) {
                return true; // Already authenticated
            }

            const config = this.oauthConfigs[provider];
            if (!config.clientId) {
                throw new Error(`OAuth not configured for ${provider}`);
            }

            // Start OAuth flow
            const authUrl = this.buildOAuthUrl(provider, config);
            const authWindow = window.open(authUrl, 'oauth', 'width=600,height=600');

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('OAuth authentication timeout'));
                }, 300000); // 5 minutes timeout

                const checkAuth = setInterval(() => {
                    if (this.isAuthenticated.get(provider)) {
                        clearInterval(checkAuth);
                        clearTimeout(timeout);
                        resolve(true);
                    }
                }, 1000);

                // Listen for window close
                const checkClosed = setInterval(() => {
                    if (authWindow.closed) {
                        clearInterval(checkClosed);
                        clearInterval(checkAuth);
                        clearTimeout(timeout);
                        reject(new Error('OAuth window closed'));
                    }
                }, 1000);
            });
        } catch (error) {
            console.error(`Authentication failed for ${provider}:`, error);
            throw error;
        }
    }

    /**
     * Build OAuth URL for provider
     */
    buildOAuthUrl(provider, config) {
        switch (provider) {
            case 'google_drive':
                return `https://accounts.google.com/o/oauth2/v2/auth?` +
                    `client_id=${config.clientId}&` +
                    `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
                    `scope=${encodeURIComponent(config.scope)}&` +
                    `response_type=code&` +
                    `access_type=offline&` +
                    `prompt=consent`;
            
            case 'dropbox':
                return `https://www.dropbox.com/oauth2/authorize?` +
                    `client_id=${config.clientId}&` +
                    `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
                    `response_type=code&` +
                    `scope=${encodeURIComponent(config.scope)}`;
            
            case 'onedrive':
                return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
                    `client_id=${config.clientId}&` +
                    `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
                    `scope=${encodeURIComponent(config.scope)}&` +
                    `response_type=code&` +
                    `response_mode=query`;
            
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    /**
     * Handle OAuth callback
     */
    async handleOAuthCallback(provider, code) {
        try {
            // Exchange code for access token
            const tokenResponse = await this.exchangeCodeForToken(provider, code);
            
            if (tokenResponse.access_token) {
                // Store token securely
                this.securityService.storeToken(`cloud_${provider}`, tokenResponse.access_token);
                
                // Update state
                this.isAuthenticated.set(provider, true);
                this.accessTokens.set(provider, tokenResponse.access_token);
                
                // Add to history
                this.addToHistory({
                    type: 'authentication',
                    provider: provider,
                    success: true,
                    timestamp: new Date()
                });
                
                console.log(`Successfully authenticated with ${provider}`);
            }
        } catch (error) {
            console.error(`OAuth callback failed for ${provider}:`, error);
            
            this.addToHistory({
                type: 'authentication',
                provider: provider,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
        }
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(provider, code) {
        try {
            const response = await this.apiClient.post(`/cloud/${provider}/token`, {
                code: code,
                redirect_uri: this.oauthConfigs[provider].redirectUri
            });

            if (!response.ok) {
                throw new Error('Failed to exchange code for token');
            }

            return await response.json();
        } catch (error) {
            console.error('Token exchange failed:', error);
            throw error;
        }
    }

    /**
     * Validate access token with provider
     */
    async validateToken(provider, token) {
        try {
            const response = await this.apiClient.get(`/cloud/${provider}/validate`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.ok;
        } catch (error) {
            console.warn(`Token validation failed for ${provider}:`, error);
            return false;
        }
    } 
   /**
     * Perform file upload to cloud storage
     */
    async performUpload(file, provider, options) {
        try {
            const token = this.accessTokens.get(provider);
            if (!token) {
                throw new Error(`No access token for ${provider}`);
            }

            this.emitProgress(20, 'Preparing file for upload...');

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('destination_path', options.destinationPath || '/');
            formData.append('options', JSON.stringify(options));

            this.emitProgress(30, 'Uploading to cloud...');

            // Upload to cloud
            const response = await this.apiClient.post(`/cloud/${provider}/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                onProgress: (progress) => {
                    this.emitProgress(30 + (progress * 0.6), `Uploading... ${Math.round(progress)}%`);
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${errorText}`);
            }

            const result = await response.json();

            // Add to history
            this.addToHistory({
                type: 'upload',
                provider: provider,
                fileName: file.name,
                destinationPath: options.destinationPath || '/',
                fileSize: file.size,
                success: true,
                result: result,
                timestamp: new Date()
            });

            return result;
        } catch (error) {
            console.error(`Cloud upload failed for ${provider}:`, error);
            
            this.addToHistory({
                type: 'upload',
                provider: provider,
                fileName: file.name,
                destinationPath: options.destinationPath || '/',
                fileSize: file.size,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }

    /**
     * Perform file download from cloud storage
     */
    async performDownload(provider, filePath, options) {
        try {
            const token = this.accessTokens.get(provider);
            if (!token) {
                throw new Error(`No access token for ${provider}`);
            }

            this.emitProgress(20, 'Requesting file from cloud...');

            // Download from cloud
            const response = await this.apiClient.get(`/cloud/${provider}/download`, {
                params: {
                    file_path: filePath,
                    options: JSON.stringify(options)
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                responseType: 'blob',
                onProgress: (progress) => {
                    this.emitProgress(20 + (progress * 0.7), `Downloading... ${Math.round(progress)}%`);
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Download failed: ${errorText}`);
            }

            const blob = await response.blob();
            const fileName = filePath.split('/').pop() || 'downloaded_file';
            const file = new File([blob], fileName, { type: blob.type });

            const result = {
                success: true,
                file: file,
                filePath: filePath,
                fileSize: blob.size,
                downloadUrl: URL.createObjectURL(blob)
            };

            // Add to history
            this.addToHistory({
                type: 'download',
                provider: provider,
                fileName: fileName,
                filePath: filePath,
                fileSize: blob.size,
                success: true,
                result: result,
                timestamp: new Date()
            });

            return result;
        } catch (error) {
            console.error(`Cloud download failed for ${provider}:`, error);
            
            this.addToHistory({
                type: 'download',
                provider: provider,
                fileName: 'unknown',
                filePath: filePath,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }

    /**
     * Add operation to history
     */
    addToHistory(operationData) {
        const historyEntry = {
            id: Date.now(),
            ...operationData
        };

        this.cloudHistory.set(historyEntry.id, historyEntry);

        // Keep only last 100 entries
        if (this.cloudHistory.size > 100) {
            const firstKey = this.cloudHistory.keys().next().value;
            this.cloudHistory.delete(firstKey);
        }

        return historyEntry;
    }

    /**
     * Get cloud operation history
     */
    getCloudHistory() {
        return Array.from(this.cloudHistory.values());
    }

    /**
     * Clear cloud operation history
     */
    clearHistory() {
        this.cloudHistory.clear();
    }

    /**
     * Get supported providers
     */
    getSupportedProviders() {
        return [...this.supportedProviders];
    }

    /**
     * Get authentication status for provider
     */
    isProviderAuthenticated(provider) {
        return this.isAuthenticated.get(provider) || false;
    }

    /**
     * Get all authenticated providers
     */
    getAuthenticatedProviders() {
        return this.supportedProviders.filter(provider => 
            this.isAuthenticated.get(provider)
        );
    }

    /**
     * Disconnect from cloud provider
     */
    async disconnect(provider) {
        try {
            if (!this.supportedProviders.includes(provider)) {
                throw new Error(`Unsupported provider: ${provider}`);
            }

            // Revoke token on server
            const token = this.accessTokens.get(provider);
            if (token) {
                try {
                    await this.apiClient.post(`/cloud/${provider}/revoke`, {}, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                } catch (error) {
                    console.warn(`Failed to revoke token for ${provider}:`, error);
                }
            }

            // Clear local state
            this.isAuthenticated.set(provider, false);
            this.accessTokens.delete(provider);
            this.securityService.removeStoredToken(`cloud_${provider}`);

            // Add to history
            this.addToHistory({
                type: 'disconnect',
                provider: provider,
                success: true,
                timestamp: new Date()
            });

            return true;
        } catch (error) {
            console.error(`Disconnect failed for ${provider}:`, error);
            
            this.addToHistory({
                type: 'disconnect',
                provider: provider,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }
}