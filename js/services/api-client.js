/**
 * API Client Service
 * Handles all communication with the backend API
 */

import { ErrorHandler } from '../utils/error-handler.js';

export class APIClient {
    constructor() {
        this.baseURL = 'https://api.pdfsmaller.site/api/v1';
        this.timeout = 30000;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

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

        // Remove Content-Type for FormData
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
        
        throw lastError;
    }

    async uploadEncryptedFile(encryptedFileData, metadata) {
        const formData = new FormData();
        formData.append('encrypted_file', new Blob([encryptedFileData.encryptedData]));
        formData.append('encryption_key', this.arrayBufferToBase64(encryptedFileData.key));
        formData.append('iv', this.arrayBufferToBase64(encryptedFileData.iv));
        formData.append('metadata', JSON.stringify(metadata));
        
        return await this.makeRequest('/upload', {
            method: 'POST',
            body: formData
        });
    }

    async getProcessingStatus(jobId) {
        return await this.makeRequest(`/status/${jobId}`);
    }

    async downloadProcessedFile(jobId, decryptionKey) {
        const response = await this.makeRequest(`/download/${jobId}`, {
            method: 'GET',
            responseType: 'blob'
        });
        
        // In a real implementation, this would decrypt the downloaded file
        return response;
    }

    async login(credentials) {
        return await this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async register(userData) {
        return await this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async logout(token) {
        return await this.makeRequest('/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
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
            return null;
        }
    }

    async getUserProfile() {
        return await this.makeRequest('/user/profile');
    }

    async updateUserProfile(profileData) {
        return await this.makeRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async getUsageStats() {
        return await this.makeRequest('/user/usage');
    }

    async createStripeSession(priceId) {
        return await this.makeRequest('/billing/create-session', {
            method: 'POST',
            body: JSON.stringify({ priceId })
        });
    }

    async getBillingInfo() {
        return await this.makeRequest('/billing/info');
    }

    async cancelSubscription() {
        return await this.makeRequest('/billing/cancel', {
            method: 'POST'
        });
    }

    // Utility methods
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
            return await this.makeRequest('/health');
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
}