# Design Document

## Overview

The Foundation & Security phase transforms PDFSmaller into a modern, secure platform by implementing a modular JavaScript architecture and comprehensive security framework. This design prioritizes intelligent processing with guaranteed security, moving away from client-side processing to a secure server-based approach with intelligent preview capabilities. The architecture supports the core value proposition of delivering maximum compression results with uncompromising security.

## Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   File Upload   │  │ Intelligent     │  │   Security   │ │
│  │   Components    │  │ Preview System  │  │   Services   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           ES6 Modules & Web Components                  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS/TLS 1.3
                              │ Encrypted Communication
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Flask)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Encryption    │  │  Secure File    │  │    Audit     │ │
│  │    Service      │  │    Service      │  │   Service    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Celery Task Processing                     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Secure Storage & Database                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Encrypted     │  │   PostgreSQL    │  │    Redis     │ │
│  │  File Storage   │  │   Database      │  │    Cache     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Modular Architecture

The frontend will be restructured using modern JavaScript with ES6 modules, following a clean separation of concerns:

```
frontend/
├── index.html                    # Main entry point with progressive enhancement
├── js/
│   ├── main.js                  # Application bootstrap and module loader
│   ├── modules/                 # Core business logic modules
│   │   ├── app.js               # Main application controller
│   │   ├── upload-manager.js    # File upload orchestration
│   │   ├── preview-generator.js # Intelligent preview system
│   │   ├── compression-flow.js  # Compression workflow management
│   │   └── auth-manager.js      # Authentication state management
│   ├── components/              # Reusable Web Components
│   │   ├── base-component.js    # Base component class
│   │   ├── file-uploader.js     # Drag & drop upload component
│   │   ├── progress-tracker.js  # Real-time progress component
│   │   ├── results-display.js   # Compression results component
│   │   └── settings-panel.js    # User settings component
│   ├── services/                # External integrations and APIs
│   │   ├── api-client.js        # Backend API communication
│   │   ├── security-service.js  # Client-side security utilities
│   │   ├── analytics-service.js # User behavior tracking
│   │   └── storage-service.js   # Local storage management
│   └── utils/                   # Utility functions and helpers
│       ├── file-validator.js    # File validation and sanitization
│       ├── format-helper.js     # Data formatting utilities
│       ├── error-handler.js     # Centralized error handling
│       └── dom-helper.js        # DOM manipulation utilities
├── css/
│   ├── main.css                 # Global styles and design system
│   ├── components/              # Component-specific styles
│   │   ├── uploader.css         # File uploader styles
│   │   ├── progress.css         # Progress indicator styles
│   │   └── results.css          # Results display styles
│   └── themes/                  # Theme and branding
│       ├── colors.css           # Color palette and variables
│       └── typography.css       # Font and text styles
└── assets/
    ├── icons/                   # SVG icon library
    ├── images/                  # Static images
    └── fonts/                   # Web fonts (if needed)
```

## Components and Interfaces

### Core Web Components

#### 1. FileUploader Component
```javascript
// js/components/file-uploader.js
export class FileUploader extends HTMLElement {
    static get observedAttributes() {
        return ['accept', 'multiple', 'max-size'];
    }
    
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.files = [];
        this.dragCounter = 0;
    }
    
    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        const dropZone = this.shadowRoot.querySelector('.drop-zone');
        
        dropZone.addEventListener('dragenter', this.handleDragEnter.bind(this));
        dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        dropZone.addEventListener('drop', this.handleDrop.bind(this));
    }
    
    async handleFileSelection(files) {
        for (const file of files) {
            if (this.validateFile(file)) {
                await this.processFile(file);
            }
        }
    }
    
    validateFile(file) {
        // File type validation
        // Size validation
        // Security checks
        return true;
    }
    
    async processFile(file) {
        // Emit file-selected event with file data
        this.dispatchEvent(new CustomEvent('file-selected', {
            detail: { file, timestamp: Date.now() },
            bubbles: true
        }));
    }
}

customElements.define('file-uploader', FileUploader);
```

#### 2. ProgressTracker Component
```javascript
// js/components/progress-tracker.js
export class ProgressTracker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.progress = 0;
        this.status = 'idle';
        this.estimatedTime = null;
    }
    
    updateProgress(data) {
        this.progress = data.percentage;
        this.status = data.status;
        this.estimatedTime = data.estimatedTime;
        this.render();
        
        // Emit progress event
        this.dispatchEvent(new CustomEvent('progress-changed', {
            detail: data,
            bubbles: true
        }));
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                .progress-container {
                    background: var(--bg-secondary);
                    border-radius: 8px;
                    overflow: hidden;
                    height: 8px;
                    position: relative;
                }
                .progress-bar {
                    background: var(--primary-color);
                    height: 100%;
                    transition: width 0.3s ease;
                    width: ${this.progress}%;
                }
                .progress-text {
                    margin-top: 8px;
                    font-size: 14px;
                    color: var(--text-secondary);
                }
            </style>
            <div class="progress-container">
                <div class="progress-bar"></div>
            </div>
            <div class="progress-text">
                ${this.getProgressText()}
            </div>
        `;
    }
    
    getProgressText() {
        if (this.status === 'idle') return 'Ready to process';
        if (this.status === 'uploading') return `Uploading... ${this.progress}%`;
        if (this.status === 'processing') return `Processing... ${this.progress}%`;
        if (this.status === 'complete') return 'Processing complete';
        return `${this.status} - ${this.progress}%`;
    }
}

customElements.define('progress-tracker', ProgressTracker);
```

### Service Layer Design

#### 1. Security Service
```javascript
// js/services/security-service.js
export class SecurityService {
    constructor() {
        this.encryptionAlgorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12;
    }
    
    async generateEncryptionKey() {
        const key = await crypto.subtle.generateKey(
            {
                name: this.encryptionAlgorithm,
                length: this.keyLength
            },
            true,
            ['encrypt', 'decrypt']
        );
        
        return await crypto.subtle.exportKey('raw', key);
    }
    
    async encryptFile(file) {
        try {
            const key = await this.generateEncryptionKey();
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
            const fileBuffer = await file.arrayBuffer();
            
            const importedKey = await crypto.subtle.importKey(
                'raw',
                key,
                { name: this.encryptionAlgorithm },
                false,
                ['encrypt']
            );
            
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: this.encryptionAlgorithm,
                    iv: iv
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
                mimeType: file.type
            };
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }
    
    generateFileHash(file) {
        return crypto.subtle.digest('SHA-256', file);
    }
    
    validateFileIntegrity(file, expectedHash) {
        return this.generateFileHash(file).then(hash => 
            this.compareHashes(hash, expectedHash)
        );
    }
    
    compareHashes(hash1, hash2) {
        if (hash1.byteLength !== hash2.byteLength) return false;
        const view1 = new Uint8Array(hash1);
        const view2 = new Uint8Array(hash2);
        return view1.every((byte, index) => byte === view2[index]);
    }
}
```

#### 2. API Client Service
```javascript
// js/services/api-client.js
export class APIClient {
    constructor() {
        this.baseURL = '/api/v1';
        this.timeout = 30000;
        this.retryAttempts = 3;
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
        
        // Decrypt the downloaded file
        return await this.decryptDownloadedFile(response, decryptionKey);
    }
    
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        // Add authentication if available
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
```

## Data Models

### Backend Security Models

#### 1. Secure File Model
```python
# src/models/secure_file.py
from datetime import datetime, timedelta
from enum import Enum
import uuid
from src.database import db

class ProcessingStatus(Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETED = "deleted"

class SecureFile(db.Model):
    __tablename__ = 'secure_files'
    
    # Primary identification
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    
    # File metadata
    original_filename = db.Column(db.String(255), nullable=False)
    file_hash = db.Column(db.String(64), nullable=False, unique=True)
    file_size = db.Column(db.BigInteger, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    
    # Security information
    encrypted_path = db.Column(db.String(500), nullable=False)
    encryption_key_hash = db.Column(db.String(64), nullable=False)
    iv = db.Column(db.String(32), nullable=False)
    
    # Processing information
    processing_status = db.Column(db.Enum(ProcessingStatus), default=ProcessingStatus.UPLOADED)
    compression_settings = db.Column(db.JSON, nullable=True)
    
    # Timestamps
    upload_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    processing_started = db.Column(db.DateTime, nullable=True)
    processing_completed = db.Column(db.DateTime, nullable=True)
    scheduled_deletion = db.Column(db.DateTime, nullable=False)
    
    # Relationships
    audit_logs = db.relationship('FileAuditLog', backref='secure_file', lazy='dynamic', cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.scheduled_deletion:
            self.scheduled_deletion = datetime.utcnow() + timedelta(hours=2)
    
    def is_expired(self):
        return datetime.utcnow() > self.scheduled_deletion
    
    def extend_retention(self, hours=2):
        self.scheduled_deletion = datetime.utcnow() + timedelta(hours=hours)
```

#### 2. Audit Log Model
```python
# src/models/audit_log.py
from datetime import datetime
from enum import Enum
import uuid
from src.database import db

class AuditAction(Enum):
    FILE_UPLOADED = "file_uploaded"
    FILE_ACCESSED = "file_accessed"
    PROCESSING_STARTED = "processing_started"
    PROCESSING_COMPLETED = "processing_completed"
    FILE_DOWNLOADED = "file_downloaded"
    FILE_DELETED = "file_deleted"
    SECURITY_VIOLATION = "security_violation"
    AUTHENTICATION_FAILED = "authentication_failed"

class FileAuditLog(db.Model):
    __tablename__ = 'file_audit_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = db.Column(db.String(36), db.ForeignKey('secure_files.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    
    # Audit information
    action = db.Column(db.Enum(AuditAction), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Request context
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    session_id = db.Column(db.String(64), nullable=True)
    
    # Additional data
    additional_data = db.Column(db.JSON, nullable=True)
    security_context = db.Column(db.JSON, nullable=True)
    
    # Result information
    success = db.Column(db.Boolean, default=True)
    error_message = db.Column(db.Text, nullable=True)
```

## Error Handling

### Comprehensive Error Handling Strategy

#### 1. Frontend Error Handler
```javascript
// js/utils/error-handler.js
export class ErrorHandler {
    static handleError(error, context = {}) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Log error locally
        console.error('Application Error:', errorInfo);
        
        // Report to monitoring service
        this.reportError(errorInfo);
        
        // Show user-friendly message
        this.showUserNotification(this.getUserFriendlyMessage(error));
    }
    
    static handleSecurityError(error, context = {}) {
        // Security errors need special handling
        const sanitizedError = {
            type: 'SecurityError',
            context: context,
            timestamp: new Date().toISOString()
        };
        
        console.error('Security Error:', sanitizedError);
        this.reportSecurityIncident(sanitizedError);
        this.showUserNotification('A security error occurred. Please refresh and try again.');
    }
    
    static getUserFriendlyMessage(error) {
        const errorMessages = {
            'NetworkError': 'Connection problem. Please check your internet connection.',
            'SecurityError': 'Security error occurred. Please try again.',
            'ValidationError': 'Invalid file format or size. Please check your file.',
            'EncryptionError': 'File encryption failed. Please try again.',
            'UploadError': 'File upload failed. Please try again.'
        };
        
        return errorMessages[error.name] || 'An unexpected error occurred. Please try again.';
    }
    
    static showUserNotification(message, type = 'error') {
        // Create and show notification to user
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    static async reportError(errorInfo) {
        try {
            await fetch('/api/v1/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorInfo)
            });
        } catch (reportingError) {
            console.error('Failed to report error:', reportingError);
        }
    }
}
```

## Testing Strategy

### Frontend Testing Approach

#### 1. Component Testing
```javascript
// tests/components/file-uploader.test.js
import { FileUploader } from '../../js/components/file-uploader.js';

describe('FileUploader Component', () => {
    let uploader;
    
    beforeEach(() => {
        uploader = new FileUploader();
        document.body.appendChild(uploader);
    });
    
    afterEach(() => {
        document.body.removeChild(uploader);
    });
    
    test('should accept valid PDF files', () => {
        const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        expect(uploader.validateFile(mockFile)).toBe(true);
    });
    
    test('should reject files exceeding size limit', () => {
        const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
        expect(uploader.validateFile(largeFile)).toBe(false);
    });
    
    test('should emit file-selected event on valid file', async () => {
        const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        let eventFired = false;
        
        uploader.addEventListener('file-selected', () => {
            eventFired = true;
        });
        
        await uploader.processFile(mockFile);
        expect(eventFired).toBe(true);
    });
});
```

#### 2. Security Service Testing
```javascript
// tests/services/security-service.test.js
import { SecurityService } from '../../js/services/security-service.js';

describe('SecurityService', () => {
    let securityService;
    
    beforeEach(() => {
        securityService = new SecurityService();
    });
    
    test('should generate unique encryption keys', async () => {
        const key1 = await securityService.generateEncryptionKey();
        const key2 = await securityService.generateEncryptionKey();
        
        expect(key1).not.toEqual(key2);
        expect(key1.byteLength).toBe(32); // 256 bits
    });
    
    test('should encrypt and maintain file integrity', async () => {
        const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
        const encrypted = await securityService.encryptFile(testFile);
        
        expect(encrypted.encryptedData).toBeDefined();
        expect(encrypted.key).toBeDefined();
        expect(encrypted.iv).toBeDefined();
        expect(encrypted.originalSize).toBe(testFile.size);
    });
});
```

### Backend Testing Strategy

#### 1. Security Service Testing
```python
# tests/services/test_encryption_service.py
import pytest
from src.services.encryption_service import EncryptionService

class TestEncryptionService:
    def setup_method(self):
        self.encryption_service = EncryptionService()
    
    def test_key_generation(self):
        key1 = self.encryption_service.generate_secure_key()
        key2 = self.encryption_service.generate_secure_key()
        
        assert key1 != key2
        assert len(key1) >= 32
    
    def test_file_encryption_decryption_cycle(self):
        test_data = b"This is test file content for encryption"
        
        encrypted_data, key = self.encryption_service.encrypt_file(test_data)
        decrypted_data = self.encryption_service.decrypt_file(encrypted_data, key)
        
        assert decrypted_data == test_data
    
    def test_encryption_with_invalid_key_fails(self):
        test_data = b"Test content"
        encrypted_data, _ = self.encryption_service.encrypt_file(test_data)
        invalid_key = "invalid_key"
        
        with pytest.raises(Exception):
            self.encryption_service.decrypt_file(encrypted_data, invalid_key)
```

## Performance Considerations

### Frontend Performance Optimizations

1. **Module Loading Strategy**
   - Lazy loading of non-critical modules
   - Dynamic imports for feature-specific code
   - Service worker for caching static assets

2. **File Processing Optimization**
   - Web Workers for encryption operations
   - Chunked file processing for large files
   - Progress tracking with minimal UI updates

3. **Memory Management**
   - Proper cleanup of file buffers
   - Garbage collection optimization
   - Memory-efficient data structures

### Backend Performance Optimizations

1. **Encryption Performance**
   - Async encryption operations
   - Optimized buffer management
   - Connection pooling for database operations

2. **File Storage Optimization**
   - Efficient file system operations
   - Batch cleanup operations
   - Optimized database queries

## Security Considerations

### Comprehensive Security Framework

1. **Data Protection**
   - AES-256-GCM encryption for all file data
   - Secure key generation and management
   - Automatic secure deletion of temporary files

2. **Communication Security**
   - TLS 1.3 for all client-server communication
   - Certificate pinning for enhanced security
   - Request signing for API integrity

3. **Access Control**
   - JWT-based authentication with secure tokens
   - Role-based authorization
   - Rate limiting and abuse prevention

4. **Audit and Compliance**
   - Comprehensive audit logging
   - Tamper-evident log storage
   - GDPR/HIPAA compliance features

This revised design provides a clear, focused approach to implementing the Foundation & Security phase while supporting the intelligent processing architecture and maintaining the highest security standards.