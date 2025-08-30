/**
 * Storage Service
 * The single source of truth for files. Manages all file storage, retrieval, and metadata.
 * Implements the new specification API while maintaining backward compatibility.
 */

import { ErrorHandler } from '../utils/error-handler.js';
import { StandardService } from './standard-service.js';

export class StorageService extends StandardService {
    constructor() {
        super();
        this.storagePrefix = 'pdfsmaller_';
        this.encryptionKey = null;
        this.isEncryptionEnabled = false;
        this.fallbackStorage = new Map(); // In-memory fallback
        this.fileStorage = new Map(); // File blob storage
        this.fileMetadata = new Map(); // File metadata storage
    }

    async init() {
        // Check if localStorage is available
        this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
        
        // Initialize encryption if Web Crypto API is available
        if (this.isWebCryptoAvailable()) {
            await this.initializeEncryption();
        }
        
        // Load existing files from storage
        await this.loadExistingFiles();
        
        // Call parent init
        await super.init();
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

    // ===== NEW SPECIFICATION API =====
    // Core file operations as required by the new architecture

    /**
     * Save file with metadata (NEW API)
     * @param {string} id - Unique file identifier
     * @param {Blob} blob - File blob data
     * @param {Object} metadata - File metadata including type ('original' or 'processed')
     * @returns {Promise<boolean>} Success status
     */
    async saveFile(id, blob, metadata = {}) {
        try {
            this.isProcessing = true;
            this.emitProgress(0, 'Starting file save...');

            // Validate inputs
            if (!id || !blob) {
                throw new Error('File ID and blob are required');
            }

            // Ensure metadata has required fields
            const fileMetadata = {
                id: id,
                name: metadata.name || `file_${id}`,
                size: blob.size,
                type: metadata.type || 'original', // 'original' or 'processed'
                mimeType: blob.type || 'application/octet-stream',
                timestamp: Date.now(),
                processed: metadata.type === 'processed',
                originalFileId: metadata.originalFileId || null,
                processingType: metadata.processingType || null,
                ...metadata
            };

            this.emitProgress(25, 'Preparing file data...');

            // Convert blob to base64 for storage
            const base64Data = await this.blobToBase64(blob);
            
            this.emitProgress(50, 'Encrypting file data...');

            // Store file data
            const fileData = {
                id: id,
                data: base64Data,
                metadata: fileMetadata
            };

            // Save to storage with encryption
            const success = await this.setItem(`file_${id}`, fileData);
            
            if (success) {
                // Update in-memory storage
                this.fileStorage.set(id, blob);
                this.fileMetadata.set(id, fileMetadata);

                this.emitProgress(100, 'File saved successfully');
                this.emitComplete({ fileId: id, metadata: fileMetadata }, 'File saved successfully');

                // Emit specific storage event
                this.dispatchEvent(new CustomEvent('fileSaved', {
                    detail: { fileId: id, metadata: fileMetadata, size: blob.size }
                }));

                return true;
            } else {
                throw new Error('Failed to save file to storage');
            }

        } catch (error) {
            this.emitError(error, { operation: 'saveFile', fileId: id });
            ErrorHandler.handleError(error, { context: 'Storage saveFile', fileId: id });
            return false;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Retrieve file by ID (NEW API)
     * @param {string} id - File identifier
     * @returns {Promise<Object|null>} File object with blob and metadata
     */
    async getFile(id) {
        try {
            if (!id) {
                throw new Error('File ID is required');
            }

            // Check in-memory storage first
            if (this.fileStorage.has(id) && this.fileMetadata.has(id)) {
                return {
                    id: id,
                    blob: this.fileStorage.get(id),
                    metadata: this.fileMetadata.get(id)
                };
            }

            // Load from persistent storage
            const fileData = await this.getItem(`file_${id}`);
            
            if (!fileData) {
                return null;
            }

            // Convert base64 back to blob
            const blob = await this.base64ToBlob(fileData.data, fileData.metadata.mimeType);
            
            // Update in-memory storage
            this.fileStorage.set(id, blob);
            this.fileMetadata.set(id, fileData.metadata);

            return {
                id: id,
                blob: blob,
                metadata: fileData.metadata
            };

        } catch (error) {
            this.emitError(error, { operation: 'getFile', fileId: id });
            ErrorHandler.handleError(error, { context: 'Storage getFile', fileId: id });
            return null;
        }
    }

    /**
     * Get file metadata only (NEW API)
     * @param {string} id - File identifier
     * @returns {Promise<Object|null>} File metadata
     */
    async getFileMetadata(id) {
        try {
            if (!id) {
                throw new Error('File ID is required');
            }

            // Check in-memory storage first
            if (this.fileMetadata.has(id)) {
                return this.fileMetadata.get(id);
            }

            // Load from persistent storage
            const fileData = await this.getItem(`file_${id}`);
            
            if (!fileData) {
                return null;
            }

            // Update in-memory storage
            this.fileMetadata.set(id, fileData.metadata);

            return fileData.metadata;

        } catch (error) {
            this.emitError(error, { operation: 'getFileMetadata', fileId: id });
            ErrorHandler.handleError(error, { context: 'Storage getFileMetadata', fileId: id });
            return null;
        }
    }

    /**
     * Get all stored files (NEW API)
     * @returns {Promise<Array>} Array of file objects with metadata
     */
    async getAllFiles() {
        try {
            const files = [];
            const keys = this.getAllKeys();
            
            for (const key of keys) {
                if (key.startsWith('file_')) {
                    const fileId = key.substring(5); // Remove 'file_' prefix
                    const metadata = await this.getFileMetadata(fileId);
                    
                    if (metadata) {
                        files.push({
                            id: fileId,
                            metadata: metadata
                        });
                    }
                }
            }

            // Sort by timestamp (newest first)
            files.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);

            return files;

        } catch (error) {
            this.emitError(error, { operation: 'getAllFiles' });
            ErrorHandler.handleError(error, { context: 'Storage getAllFiles' });
            return [];
        }
    }

    /**
     * Delete file and cleanup (NEW API)
     * @param {string} id - File identifier
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(id) {
        try {
            if (!id) {
                throw new Error('File ID is required');
            }

            // Get metadata before deletion for event
            const metadata = await this.getFileMetadata(id);
            
            // Remove from persistent storage
            const success = this.removeItem(`file_${id}`);
            
            if (success) {
                // Remove from in-memory storage
                this.fileStorage.delete(id);
                this.fileMetadata.delete(id);

                // Emit deletion event
                this.dispatchEvent(new CustomEvent('fileDeleted', {
                    detail: { 
                        fileId: id, 
                        wasProcessed: metadata ? metadata.processed : false 
                    }
                }));

                return true;
            }

            return false;

        } catch (error) {
            this.emitError(error, { operation: 'deleteFile', fileId: id });
            ErrorHandler.handleError(error, { context: 'Storage deleteFile', fileId: id });
            return false;
        }
    }

    /**
     * Update file metadata (NEW API)
     * @param {string} id - File identifier
     * @param {Object} metadata - Updated metadata
     * @returns {Promise<boolean>} Success status
     */
    async updateMetadata(id, metadata) {
        try {
            if (!id || !metadata) {
                throw new Error('File ID and metadata are required');
            }

            // Get existing file data
            const fileData = await this.getItem(`file_${id}`);
            
            if (!fileData) {
                throw new Error('File not found');
            }

            // Update metadata
            const updatedMetadata = {
                ...fileData.metadata,
                ...metadata,
                id: id, // Ensure ID doesn't change
                lastModified: Date.now()
            };

            // Update file data
            const updatedFileData = {
                ...fileData,
                metadata: updatedMetadata
            };

            // Save updated data
            const success = await this.setItem(`file_${id}`, updatedFileData);
            
            if (success) {
                // Update in-memory storage
                this.fileMetadata.set(id, updatedMetadata);

                // Emit metadata update event
                this.dispatchEvent(new CustomEvent('metadataUpdated', {
                    detail: { fileId: id, metadata: updatedMetadata }
                }));

                return true;
            }

            return false;

        } catch (error) {
            this.emitError(error, { operation: 'updateMetadata', fileId: id });
            ErrorHandler.handleError(error, { context: 'Storage updateMetadata', fileId: id });
            return false;
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Load existing files from storage into memory
     */
    async loadExistingFiles() {
        try {
            const keys = this.getAllKeys();
            
            for (const key of keys) {
                if (key.startsWith('file_')) {
                    const fileId = key.substring(5);
                    const fileData = await this.getItem(key);
                    
                    if (fileData && fileData.metadata) {
                        this.fileMetadata.set(fileId, fileData.metadata);
                        // Don't load blob data into memory until requested
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load existing files:', error);
        }
    }

    /**
     * Convert blob to base64 string
     */
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // Remove data URL prefix
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Convert base64 string to blob
     */
    async base64ToBlob(base64, mimeType = 'application/octet-stream') {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    /**
     * Generate unique file ID
     */
    generateFileId() {
        return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get storage statistics
     */
    getFileStorageInfo() {
        const info = this.getStorageInfo();
        
        return {
            ...info,
            fileCount: this.fileMetadata.size,
            files: Array.from(this.fileMetadata.values()),
            totalFileSize: Array.from(this.fileMetadata.values())
                .reduce((total, metadata) => total + (metadata.size || 0), 0)
        };
    }
}