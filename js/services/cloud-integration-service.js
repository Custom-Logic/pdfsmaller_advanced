/**
 * Cloud Integration Service
 * Handles integration with cloud storage providers like Google Drive
 */

import { APIClient } from './api-client.js';
import { SecurityService } from './security-service.js';

export class CloudIntegrationService {
    constructor() {
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

    /**
     * Initialize cloud integration service
     */
    async initialize() {
        try {
            // Check for existing authentication tokens
            await this.checkExistingAuth();
            
            // Set up event listeners for OAuth callbacks
            this.setupOAuthListeners();
            
            console.log('Cloud integration service initialized');
        } catch (error) {
            console.error('Failed to initialize cloud integration service:', error);
        }
    }

    /**
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
     * @param {string} provider - Cloud provider name
     * @returns {Promise<boolean>} Authentication success
     */
    async authenticate(provider) {
        try {
            if (!this.supportedProviders.includes(provider)) {
                throw new Error(`Unsupported provider: ${provider}`);
            }

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
     * Upload file to cloud storage
     * @param {File} file - File to upload
     * @param {string} provider - Cloud provider
     * @param {string} destinationPath - Destination path in cloud storage
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    async uploadToCloud(file, provider, destinationPath, options = {}) {
        try {
            if (!this.isAuthenticated.get(provider)) {
                throw new Error(`Not authenticated with ${provider}`);
            }

            const token = this.accessTokens.get(provider);
            if (!token) {
                throw new Error(`No access token for ${provider}`);
            }

            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('destination_path', destinationPath);
            formData.append('options', JSON.stringify(options));

            // Upload to cloud
            const response = await this.apiClient.post(`/cloud/${provider}/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                onProgress: (progress) => {
                    this.emitProgress(progress, 'upload', provider);
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
                destinationPath: destinationPath,
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
                destinationPath: destinationPath,
                fileSize: file.size,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }

    /**
     * Download file from cloud storage
     * @param {string} provider - Cloud provider
     * @param {string} filePath - File path in cloud storage
     * @param {Object} options - Download options
     * @returns {Promise<Object>} Download result
     */
    async downloadFromCloud(provider, filePath, options = {}) {
        try {
            if (!this.isAuthenticated.get(provider)) {
                throw new Error(`Not authenticated with ${provider}`);
            }

            const token = this.accessTokens.get(provider);
            if (!token) {
                throw new Error(`No access token for ${provider}`);
            }

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
                    this.emitProgress(progress, 'download', provider);
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
     * List files in cloud storage
     * @param {string} provider - Cloud provider
     * @param {string} folderPath - Folder path to list
     * @param {Object} options - List options
     * @returns {Promise<Object>} List result
     */
    async listCloudFiles(provider, folderPath = '/', options = {}) {
        try {
            if (!this.isAuthenticated.get(provider)) {
                throw new Error(`Not authenticated with ${provider}`);
            }

            const token = this.accessTokens.get(provider);
            if (!token) {
                throw new Error(`No access token for ${provider}`);
            }

            const response = await this.apiClient.get(`/cloud/${provider}/list`, {
                params: {
                    folder_path: folderPath,
                    options: JSON.stringify(options)
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`List failed: ${errorText}`);
            }

            const result = await response.json();

            // Add to history
            this.addToHistory({
                type: 'list',
                provider: provider,
                folderPath: folderPath,
                success: true,
                result: result,
                timestamp: new Date()
            });

            return result;
        } catch (error) {
            console.error(`Cloud list failed for ${provider}:`, error);
            
            this.addToHistory({
                type: 'list',
                provider: provider,
                folderPath: folderPath,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }

    /**
     * Create folder in cloud storage
     * @param {string} provider - Cloud provider
     * @param {string} folderPath - Folder path to create
     * @param {Object} options - Create options
     * @returns {Promise<Object>} Create result
     */
    async createCloudFolder(provider, folderPath, options = {}) {
        try {
            if (!this.isAuthenticated.get(provider)) {
                throw new Error(`Not authenticated with ${provider}`);
            }

            const token = this.accessTokens.get(provider);
            if (!token) {
                throw new Error(`No access token for ${provider}`);
            }

            const response = await this.apiClient.post(`/cloud/${provider}/folder`, {
                folder_path: folderPath,
                options: options
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Folder creation failed: ${errorText}`);
            }

            const result = await response.json();

            // Add to history
            this.addToHistory({
                type: 'create_folder',
                provider: provider,
                folderPath: folderPath,
                success: true,
                result: result,
                timestamp: new Date()
            });

            return result;
        } catch (error) {
            console.error(`Cloud folder creation failed for ${provider}:`, error);
            
            this.addToHistory({
                type: 'create_folder',
                provider: provider,
                folderPath: folderPath,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }

    /**
     * Disconnect from cloud provider
     * @param {string} provider - Cloud provider to disconnect
     * @returns {Promise<boolean>} Disconnect success
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

    /**
     * Get authentication status for provider
     * @param {string} provider - Cloud provider
     * @returns {boolean} Authentication status
     */
    isProviderAuthenticated(provider) {
        return this.isAuthenticated.get(provider) || false;
    }

    /**
     * Get all authenticated providers
     * @returns {Array<string>} List of authenticated providers
     */
    getAuthenticatedProviders() {
        return this.supportedProviders.filter(provider => 
            this.isAuthenticated.get(provider)
        );
    }

    /**
     * Emit progress event
     */
    emitProgress(progress, operation, provider) {
        const event = new CustomEvent('cloudProgress', {
            detail: { progress, operation, provider }
        });
        window.dispatchEvent(event);
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
     * Get OAuth configuration for provider
     */
    getOAuthConfig(provider) {
        return this.oauthConfigs[provider] || null;
    }
}
