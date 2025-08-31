/**
 * API Client Service
 * Handles all communication with the backend API
 * Updated to match actual API endpoints and improve reliability
 */

import { ErrorHandler } from '../utils/error-handler.js';

export class APIClient {
    constructor() {
        this.baseURL = 'https://api.pdfsmaller.site/api';
        this.timeout = 30000;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Make HTTP request with retry logic and error handling
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.timeout,
            ...options
        };

        // Add authentication if available
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Remove Content-Type for FormData to let browser set it automatically
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);
                
                config.signal = controller.signal;
                
                const response = await fetch(url, config);
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Handle different response types
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                } else if (options.responseType === 'blob') {
                    return await response.blob();
                } else {
                    return await response.text();
                }
                
            } catch (error) {
                lastError = error;
                
                // Don't retry on certain errors
                if (error.name === 'AbortError' || 
                    (error.message && error.message.includes('401')) ||
                    (error.message && error.message.includes('403'))) {
                    break;
                }
                
                // Wait before retry (except on last attempt)
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        
        ErrorHandler.handleError(lastError, { context: 'API Request', endpoint });
        throw lastError;
    }

    // ==================== AUTH ENDPOINTS ====================

    async login(email, password) {
        return await this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(name, email, password) {
        return await this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
    }

    async getProfile() {
        return await this.makeRequest('/auth/profile', {
            method: 'GET'
        });
    }

    async logout() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                await this.makeRequest('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                // Even if logout fails, clear local storage
                console.warn('Logout API call failed, but clearing local storage:', error);
            }
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }

    async validateToken(token) {
        try {
            return await this.makeRequest('/auth/validate', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // ==================== COMPRESSION ENDPOINTS ====================

    async compressSingle(file, compressionLevel = 'medium', imageQuality = 80) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('compressionLevel', compressionLevel);
        formData.append('imageQuality', imageQuality.toString());

        return await this.makeRequest('/compress/single', {
            method: 'POST',
            body: formData,
            timeout: 120000 // 2 minutes for file uploads
        });
    }

    async compressBulk(files, compressionLevel = 'medium', imageQuality = 80) {
        const formData = new FormData();
        
        // Append each file with proper indexing
        files.forEach((file, index) => {
            formData.append(`files[${index}]`, file);
        });
        
        formData.append('compressionLevel', compressionLevel);
        formData.append('imageQuality', imageQuality.toString());

        return await this.makeRequest('/compress/bulk', {
            method: 'POST',
            body: formData,
            timeout: 300000 // 5 minutes for bulk uploads
        });
    }

    async uploadEncryptedFile(encryptedFileData, metadata) {
        const formData = new FormData();
        formData.append('encrypted_file', new Blob([encryptedFileData.encryptedData]));
        formData.append('encryption_key', this.arrayBufferToBase64(encryptedFileData.key));
        formData.append('iv', this.arrayBufferToBase64(encryptedFileData.iv));
        formData.append('metadata', JSON.stringify(metadata));
        
        return await this.makeRequest('/upload', {
            method: 'POST',
            body: formData,
            timeout: 120000
        });
    }

    async getProcessingStatus(jobId) {
        return await this.makeRequest(`/status/${jobId}`, {
            method: 'GET'
        });
    }

    async downloadProcessedFile(jobId) {
        return await this.makeRequest(`/download/${jobId}`, {
            method: 'GET',
            responseType: 'blob'
        });
    }

    // ==================== SUBSCRIPTION ENDPOINTS ====================

    async getSubscription() {
        return await this.makeRequest('/subscriptions', {
            method: 'GET'
        });
    }

    async createSubscription(planId, paymentMethodId) {
        return await this.makeRequest('/subscriptions/create', {
            method: 'POST',
            body: JSON.stringify({ planId, paymentMethodId })
        });
    }

    async cancelSubscription() {
        return await this.makeRequest('/subscriptions/cancel', {
            method: 'POST'
        });
    }

    async createStripeSession(priceId) {
        return await this.makeRequest('/billing/create-session', {
            method: 'POST',
            body: JSON.stringify({ priceId })
        });
    }

    async getBillingInfo() {
        return await this.makeRequest('/billing/info', {
            method: 'GET'
        });
    }

    // ==================== USER ENDPOINTS ====================

    async getUserProfile() {
        return await this.makeRequest('/user/profile', {
            method: 'GET'
        });
    }

    async updateUserProfile(profileData) {
        return await this.makeRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async getUsageStats() {
        return await this.makeRequest('/user/usage', {
            method: 'GET'
        });
    }

    // ==================== UTILITY METHODS ====================

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Health check endpoint
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                timeout: 5000
            });
            return await response.json();
        } catch (error) {
            return { 
                status: 'error', 
                message: error.message,
                online: false 
            };
        }
    }

    // Check if API is reachable
    async isApiReachable() {
        try {
            const health = await this.healthCheck();
            return health.status === 'ok' || health.online === true;
        } catch (error) {
            return false;
        }
    }

    // Get API status with detailed information
    async getApiStatus() {
        try {
            const health = await this.healthCheck();
            return {
                online: true,
                status: health.status,
                timestamp: health.timestamp,
                version: health.version
            };
        } catch (error) {
            return {
                online: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Create and export a singleton instance
export const apiClient = new APIClient();