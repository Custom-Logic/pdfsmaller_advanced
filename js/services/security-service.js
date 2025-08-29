/**
 * Security Service
 * Handles client-side encryption and security operations using Web Crypto API
 */

import { ErrorHandler } from '../utils/error-handler.js';

export class SecurityService {
    constructor() {
        this.encryptionAlgorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12;
        this.tagLength = 128;
    }

    async generateEncryptionKey() {
        try {
            const key = await crypto.subtle.generateKey(
                {
                    name: this.encryptionAlgorithm,
                    length: this.keyLength
                },
                true,
                ['encrypt', 'decrypt']
            );
            
            return await crypto.subtle.exportKey('raw', key);
        } catch (error) {
            throw new Error(`Key generation failed: ${error.message}`);
        }
    }

    async encryptFile(file) {
        try {
            // Generate encryption key and IV
            const key = await this.generateEncryptionKey();
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
            
            // Read file as array buffer
            const fileBuffer = await file.arrayBuffer();
            
            // Import key for encryption
            const importedKey = await crypto.subtle.importKey(
                'raw',
                key,
                { name: this.encryptionAlgorithm },
                false,
                ['encrypt']
            );
            
            // Encrypt the file data
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: this.encryptionAlgorithm,
                    iv: iv,
                    tagLength: this.tagLength
                },
                importedKey,
                fileBuffer
            );
            
            return {
                encryptedData: new Uint8Array(encryptedData),
                key: new Uint8Array(key),
                iv: iv,
                originalSize: file.size,
                originalName: file.name,
                mimeType: file.type,
                timestamp: Date.now()
            };
            
        } catch (error) {
            throw new Error(`File encryption failed: ${error.message}`);
        }
    }

    async decryptFile(encryptedData, key, iv) {
        try {
            // Import key for decryption
            const importedKey = await crypto.subtle.importKey(
                'raw',
                key,
                { name: this.encryptionAlgorithm },
                false,
                ['decrypt']
            );
            
            // Decrypt the data
            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: this.encryptionAlgorithm,
                    iv: iv,
                    tagLength: this.tagLength
                },
                importedKey,
                encryptedData
            );
            
            return new Uint8Array(decryptedData);
            
        } catch (error) {
            throw new Error(`File decryption failed: ${error.message}`);
        }
    }

    async generateFileHash(file) {
        try {
            const fileBuffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
            
            // Convert to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex;
        } catch (error) {
            throw new Error(`Hash generation failed: ${error.message}`);
        }
    }

    async validateFileIntegrity(file, expectedHash) {
        try {
            const actualHash = await this.generateFileHash(file);
            return actualHash === expectedHash;
        } catch (error) {
            throw new Error(`Integrity validation failed: ${error.message}`);
        }
    }

    async generateSecureToken(length = 32) {
        try {
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);
            
            // Convert to base64url
            return btoa(String.fromCharCode(...array))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        } catch (error) {
            throw new Error(`Token generation failed: ${error.message}`);
        }
    }

    async deriveKeyFromPassword(password, salt) {
        try {
            // Import password as key material
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(password),
                { name: 'PBKDF2' },
                false,
                ['deriveKey']
            );
            
            // Derive key using PBKDF2
            const derivedKey = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                {
                    name: this.encryptionAlgorithm,
                    length: this.keyLength
                },
                true,
                ['encrypt', 'decrypt']
            );
            
            return await crypto.subtle.exportKey('raw', derivedKey);
        } catch (error) {
            throw new Error(`Key derivation failed: ${error.message}`);
        }
    }

    async signData(data, privateKey) {
        try {
            const signature = await crypto.subtle.sign(
                {
                    name: 'RSASSA-PKCS1-v1_5',
                    hash: 'SHA-256'
                },
                privateKey,
                data
            );
            
            return new Uint8Array(signature);
        } catch (error) {
            throw new Error(`Data signing failed: ${error.message}`);
        }
    }

    async verifySignature(data, signature, publicKey) {
        try {
            return await crypto.subtle.verify(
                {
                    name: 'RSASSA-PKCS1-v1_5',
                    hash: 'SHA-256'
                },
                publicKey,
                signature,
                data
            );
        } catch (error) {
            throw new Error(`Signature verification failed: ${error.message}`);
        }
    }

    // Utility methods for secure random generation
    generateSecureRandom(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
    }

    // Check if Web Crypto API is available
    isWebCryptoSupported() {
        return typeof crypto !== 'undefined' && 
               typeof crypto.subtle !== 'undefined' &&
               typeof crypto.getRandomValues !== 'undefined';
    }

    // Get supported algorithms
    async getSupportedAlgorithms() {
        const algorithms = [];
        
        try {
            // Test AES-GCM
            await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
            algorithms.push('AES-GCM');
        } catch (e) {
            // Not supported
        }
        
        try {
            // Test RSA-OAEP
            await crypto.subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256'
                },
                false,
                ['encrypt', 'decrypt']
            );
            algorithms.push('RSA-OAEP');
        } catch (e) {
            // Not supported
        }
        
        return algorithms;
    }

    // Secure memory cleanup (best effort)
    secureCleanup(sensitiveData) {
        if (sensitiveData instanceof Uint8Array) {
            // Overwrite with random data
            crypto.getRandomValues(sensitiveData);
        } else if (typeof sensitiveData === 'string') {
            // Can't securely clear strings in JavaScript
            console.warn('Cannot securely clear string data in JavaScript');
        }
    }

    // Constant-time comparison to prevent timing attacks
    constantTimeCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        
        return result === 0;
    }

    // Generate CSP nonce for inline scripts
    generateCSPNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array));
    }

    // Validate file type based on magic bytes
    async validateFileType(file, expectedType) {
        try {
            const buffer = await file.slice(0, 8).arrayBuffer();
            const bytes = new Uint8Array(buffer);
            
            // PDF magic bytes: %PDF
            if (expectedType === 'application/pdf') {
                return bytes[0] === 0x25 && bytes[1] === 0x50 && 
                       bytes[2] === 0x44 && bytes[3] === 0x46;
            }
            
            // Add more file type validations as needed
            return true;
        } catch (error) {
            return false;
        }
    }
}