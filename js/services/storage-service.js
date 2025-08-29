/**
 * Storage Service
 * Handles local storage operations with encryption and fallbacks
 */

import { ErrorHandler } from '../utils/error-handler.js';

export class StorageService {
    constructor() {
        this.storagePrefix = 'pdfsmaller_';
        this.encryptionKey = null;
        this.isEncryptionEnabled = false;
        this.fallbackStorage = new Map(); // In-memory fallback
    }

    async init() {
        // Check if localStorage is available
        this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
        
        // Initialize encryption if Web Crypto API is available
        if (this.isWebCryptoAvailable()) {
            await this.initializeEncryption();
        }
    }

    checkLocalStorageAvailability() {
        try {
            const testKey = '__localStorage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('localStorage not available, using fallback storage');
            return false;
        }
    }

    isWebCryptoAvailable() {
        return typeof crypto !== 'undefined' && 
               typeof crypto.subtle !== 'undefined';
    }

    async initializeEncryption() {
        try {
            // Try to get existing encryption key from sessionStorage
            const existingKey = sessionStorage.getItem(this.storagePrefix + 'encryption_key');
            
            if (existingKey) {
                this.encryptionKey = await this.importKey(existingKey);
            } else {
                // Generate new encryption key
                this.encryptionKey = await this.generateEncryptionKey();
                
                // Store key in sessionStorage (cleared when browser closes)
                const exportedKey = await this.exportKey(this.encryptionKey);
                sessionStorage.setItem(this.storagePrefix + 'encryption_key', exportedKey);
            }
            
            this.isEncryptionEnabled = true;
        } catch (error) {
            console.warn('Failed to initialize encryption:', error);
            this.isEncryptionEnabled = false;
        }
    }

    async generateEncryptionKey() {
        return await crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    async exportKey(key) {
        const exported = await crypto.subtle.exportKey('raw', key);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    }

    async importKey(keyString) {
        const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
        return await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
        );
    }

    async encryptData(data) {
        if (!this.isEncryptionEnabled || !this.encryptionKey) {
            return data;
        }

        try {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encodedData = new TextEncoder().encode(JSON.stringify(data));
            
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.encryptionKey,
                encodedData
            );

            return {
                encrypted: true,
                iv: btoa(String.fromCharCode(...iv)),
                data: btoa(String.fromCharCode(...new Uint8Array(encryptedData)))
            };
        } catch (error) {
            console.warn('Encryption failed, storing unencrypted:', error);
            return data;
        }
    }

    async decryptData(encryptedData) {
        if (!encryptedData || !encryptedData.encrypted || !this.isEncryptionEnabled || !this.encryptionKey) {
            return encryptedData;
        }

        try {
            const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
            const data = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));
            
            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                this.encryptionKey,
                data
            );

            const decodedData = new TextDecoder().decode(decryptedData);
            return JSON.parse(decodedData);
        } catch (error) {
            console.warn('Decryption failed:', error);
            return null;
        }
    }

    async setItem(key, value, options = {}) {
        try {
            const fullKey = this.storagePrefix + key;
            
            // Prepare data with metadata
            const dataToStore = {
                value: value,
                timestamp: Date.now(),
                expires: options.expires || null,
                version: options.version || 1
            };

            // Encrypt if enabled
            const processedData = await this.encryptData(dataToStore);
            const serializedData = JSON.stringify(processedData);

            // Store in localStorage or fallback
            if (this.isLocalStorageAvailable) {
                localStorage.setItem(fullKey, serializedData);
            } else {
                this.fallbackStorage.set(fullKey, serializedData);
            }

            return true;
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'Storage setItem', key });
            return false;
        }
    }

    async getItem(key, defaultValue = null) {
        try {
            const fullKey = this.storagePrefix + key;
            
            // Get from localStorage or fallback
            let serializedData;
            if (this.isLocalStorageAvailable) {
                serializedData = localStorage.getItem(fullKey);
            } else {
                serializedData = this.fallbackStorage.get(fullKey);
            }

            if (!serializedData) {
                return defaultValue;
            }

            // Parse data
            const parsedData = JSON.parse(serializedData);
            
            // Decrypt if needed
            const decryptedData = await this.decryptData(parsedData);
            
            if (!decryptedData) {
                return defaultValue;
            }

            // Check expiration
            if (decryptedData.expires && Date.now() > decryptedData.expires) {
                this.removeItem(key);
                return defaultValue;
            }

            return decryptedData.value;
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'Storage getItem', key });
            return defaultValue;
        }
    }

    removeItem(key) {
        try {
            const fullKey = this.storagePrefix + key;
            
            if (this.isLocalStorageAvailable) {
                localStorage.removeItem(fullKey);
            } else {
                this.fallbackStorage.delete(fullKey);
            }
            
            return true;
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'Storage removeItem', key });
            return false;
        }
    }

    clear() {
        try {
            if (this.isLocalStorageAvailable) {
                // Remove only items with our prefix
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.storagePrefix)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            } else {
                // Clear fallback storage
                for (const key of this.fallbackStorage.keys()) {
                    if (key.startsWith(this.storagePrefix)) {
                        this.fallbackStorage.delete(key);
                    }
                }
            }
            
            return true;
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'Storage clear' });
            return false;
        }
    }

    getAllKeys() {
        try {
            const keys = [];
            
            if (this.isLocalStorageAvailable) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.storagePrefix)) {
                        keys.push(key.substring(this.storagePrefix.length));
                    }
                }
            } else {
                for (const key of this.fallbackStorage.keys()) {
                    if (key.startsWith(this.storagePrefix)) {
                        keys.push(key.substring(this.storagePrefix.length));
                    }
                }
            }
            
            return keys;
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'Storage getAllKeys' });
            return [];
        }
    }

    getStorageInfo() {
        const info = {
            isLocalStorageAvailable: this.isLocalStorageAvailable,
            isEncryptionEnabled: this.isEncryptionEnabled,
            itemCount: 0,
            estimatedSize: 0
        };

        try {
            const keys = this.getAllKeys();
            info.itemCount = keys.length;

            // Estimate storage size
            if (this.isLocalStorageAvailable) {
                let totalSize = 0;
                keys.forEach(key => {
                    const fullKey = this.storagePrefix + key;
                    const value = localStorage.getItem(fullKey);
                    if (value) {
                        totalSize += fullKey.length + value.length;
                    }
                });
                info.estimatedSize = totalSize;
            }
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'Storage getStorageInfo' });
        }

        return info;
    }

    // Utility methods for specific data types
    async setObject(key, object, options = {}) {
        return await this.setItem(key, object, options);
    }

    async getObject(key, defaultValue = {}) {
        return await this.getItem(key, defaultValue);
    }

    async setArray(key, array, options = {}) {
        return await this.setItem(key, array, options);
    }

    async getArray(key, defaultValue = []) {
        return await this.getItem(key, defaultValue);
    }

    async setString(key, string, options = {}) {
        return await this.setItem(key, string, options);
    }

    async getString(key, defaultValue = '') {
        return await this.getItem(key, defaultValue);
    }

    async setNumber(key, number, options = {}) {
        return await this.setItem(key, number, options);
    }

    async getNumber(key, defaultValue = 0) {
        return await this.getItem(key, defaultValue);
    }

    async setBoolean(key, boolean, options = {}) {
        return await this.setItem(key, boolean, options);
    }

    async getBoolean(key, defaultValue = false) {
        return await this.getItem(key, defaultValue);
    }

    // Cache-like methods with TTL
    async setCache(key, value, ttlSeconds = 3600) {
        const expires = Date.now() + (ttlSeconds * 1000);
        return await this.setItem(key, value, { expires });
    }

    async getCache(key, defaultValue = null) {
        return await this.getItem(key, defaultValue);
    }

    // Session-only storage (cleared when page closes)
    setSessionItem(key, value) {
        try {
            const fullKey = this.storagePrefix + key;
            sessionStorage.setItem(fullKey, JSON.stringify(value));
            return true;
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'Session storage setItem', key });
            return false;
        }
    }

    getSessionItem(key, defaultValue = null) {
        try {
            const fullKey = this.storagePrefix + key;
            const value = sessionStorage.getItem(fullKey);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'Session storage getItem', key });
            return defaultValue;
        }
    }

    removeSessionItem(key) {
        try {
            const fullKey = this.storagePrefix + key;
            sessionStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            ErrorHandler.handleError(error, { context: 'Session storage removeItem', key });
            return false;
        }
    }
}