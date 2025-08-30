# Service Specification

## Core Service Rules

**RULE**: All business logic (compression, conversion, etc.) must reside in a service module within the `/services` directory.

**IMPLEMENTATION**: Services are responsible for:
- Encapsulating all business logic and algorithms
- Managing data persistence and retrieval
- Performing complex operations and calculations
- Emitting progress, status, and completion events
- Providing standardized APIs for controllers

**VIOLATION EXAMPLES**:
```javascript
// DON'T DO THIS - Business logic in components
class FileUploader {
    validateFile(file) {
        if (file.size > this.maxSize && !this.user.isPremium) {
            // Complex business rules belong in services
        }
    }
}

// DON'T DO THIS - Direct DOM manipulation in services
class CompressionService {
    updateProgressBar(percentage) {
        document.querySelector('.progress').style.width = percentage + '%';
    }
}
```

## Standard Service Interface

All services must extend the base service class and implement the standard interface:

```javascript
class StandardService extends EventTarget {
    constructor() {
        super();
        this.isInitialized = false;
        this.isProcessing = false;
        this.lastError = null;
    }
    
    async init() {
        // Service initialization logic
        this.isInitialized = true;
        this.emitServiceReady();
    }
    
    // Standard event emission methods
    emitProgress(percentage, message, data = {}) {
        this.dispatchEvent(new CustomEvent('progress', {
            detail: {
                percentage,
                message,
                data,
                timestamp: Date.now(),
                service: this.constructor.name
            }
        }));
    }
    
    emitComplete(result, message = 'Operation completed') {
        this.isProcessing = false;
        this.dispatchEvent(new CustomEvent('complete', {
            detail: {
                result,
                message,
                timestamp: Date.now(),
                service: this.constructor.name
            }
        }));
    }
    
    emitError(error, context = {}) {
        this.isProcessing = false;
        this.lastError = error;
        this.dispatchEvent(new CustomEvent('error', {
            detail: {
                error: error.message || error,
                context,
                timestamp: Date.now(),
                service: this.constructor.name
            }
        }));
    }
    
    emitStatusChange(status, data = {}) {
        this.dispatchEvent(new CustomEvent('statusChanged', {
            detail: {
                status,
                data,
                timestamp: Date.now(),
                service: this.constructor.name
            }
        }));
    }
    
    emitServiceReady() {
        this.dispatchEvent(new CustomEvent('serviceReady', {
            detail: {
                service: this.constructor.name,
                timestamp: Date.now()
            }
        }));
    }
}
```

## Service Catalog

### StorageService

**Purpose**: The single source of truth for files. Manages all file storage, retrieval, and metadata.

**API Requirements**:
```javascript
class StorageService extends StandardService {
    // Core file operations
    async saveFile(id, blob, metadata = {}) {
        // Store file with metadata
        // Emit progress and completion events
    }
    
    async getFile(id) {
        // Retrieve file by ID
        // Return file blob and metadata
    }
    
    async getAllFiles() {
        // Return list of all stored files
        // Include metadata and status
    }
    
    async deleteFile(id) {
        // Remove file and cleanup
        // Emit deletion event
    }
    
    async updateMetadata(id, metadata) {
        // Update file metadata
        // Emit metadata update event
    }
}
```

**Storage Requirements**:
- Must store data in LocalStorage with encryption
- Must differentiate between `original` and `processed` file types
- Must handle storage quota limits gracefully
- Must provide fallback storage mechanisms

**Event Interface**:
```javascript
// File operations
this.emitProgress(50, 'Saving file to storage...');
this.emitComplete({ fileId, metadata }, 'File saved successfully');

// Specific storage events
this.dispatchEvent(new CustomEvent('fileSaved', {
    detail: { fileId, metadata, size: blob.size }
}));

this.dispatchEvent(new CustomEvent('fileDeleted', {
    detail: { fileId, wasProcessed: metadata.processed }
}));
```

### CompressionService

**Purpose**: Handles all PDF compression operations with intelligent optimization.

**API Requirements**:
```javascript
class CompressionService extends StandardService {
    async compressFile(file, settings = {}) {
        // Analyze file and apply compression
        // Emit progress events during processing
        // Return compressed file and statistics
    }
    
    async batchCompress(files, settings = {}) {
        // Compress multiple files
        // Emit progress for each file and overall batch
        // Return batch results
    }
    
    async analyzeFile(file) {
        // Analyze compression potential
        // Return optimization recommendations
    }
    
    async getCompressionPreview(file, settings) {
        // Generate compression preview/estimate
        // Return estimated results without processing
    }
}
```

**Event Interface**:
```javascript
// Compression progress
this.emitProgress(25, 'Analyzing PDF structure...');
this.emitProgress(50, 'Optimizing images...');
this.emitProgress(75, 'Compressing document...');
this.emitComplete({
    originalSize: 1024000,
    compressedSize: 512000,
    compressionRatio: 0.5,
    compressedFile: blob
});

// Compression-specific events
this.dispatchEvent(new CustomEvent('compressionStarted', {
    detail: { fileId, settings }
}));

this.dispatchEvent(new CustomEvent('compressionAnalysisComplete', {
    detail: { fileId, analysis, recommendations }
}));
```

### ConversionService

**Purpose**: Handles document conversion operations (PDF to Word, Excel, etc.).

**API Requirements**:
```javascript
class ConversionService extends StandardService {
    async convertToWord(file, settings = {}) {
        // Convert PDF to Word document
        // Preserve formatting and layout
    }
    
    async convertToExcel(file, settings = {}) {
        // Convert PDF to Excel spreadsheet
        // Extract tables and data
    }
    
    async convertToText(file, settings = {}) {
        // Extract plain text from PDF
        // Maintain structure where possible
    }
    
    async getSupportedFormats() {
        // Return list of supported conversion formats
    }
}
```

**Event Interface**:
```javascript
// Conversion progress
this.emitProgress(20, 'Extracting text content...');
this.emitProgress(60, 'Preserving formatting...');
this.emitProgress(90, 'Generating Word document...');
this.emitComplete({
    originalFile: file,
    convertedFile: wordBlob,
    conversionType: 'pdf-to-word',
    preservedElements: ['text', 'images', 'tables']
});
```

### OCRService

**Purpose**: Optical Character Recognition and text extraction from images and scanned PDFs.

**API Requirements**:
```javascript
class OCRService extends StandardService {
    async extractText(file, options = {}) {
        // Extract text from images or scanned PDFs
        // Support multiple languages
    }
    
    async createSearchablePDF(file, options = {}) {
        // Convert scanned PDF to searchable PDF
        // Overlay extracted text
    }
    
    async getSupportedLanguages() {
        // Return list of supported OCR languages
    }
}
```

### AIService

**Purpose**: AI-powered features like summarization and translation.

**API Requirements**:
```javascript
class AIService extends StandardService {
    async summarizeDocument(file, options = {}) {
        // Generate document summary
        // Support different summary lengths
    }
    
    async translateDocument(file, targetLanguage, options = {}) {
        // Translate document content
        // Preserve formatting
    }
    
    async analyzeContent(file) {
        // Analyze document content and structure
        // Return insights and recommendations
    }
}
```

### AnalyticsService

**Purpose**: Track user behavior and application performance.

**API Requirements**:
```javascript
class AnalyticsService extends StandardService {
    trackEvent(eventName, properties = {}) {
        // Track user interactions
        // Send to analytics platform
    }
    
    trackPerformance(metric, value, context = {}) {
        // Track performance metrics
        // Monitor application health
    }
    
    trackError(error, context = {}) {
        // Track errors and exceptions
        // Send error reports
    }
}
```

### SecurityService

**Purpose**: Handle encryption, authentication, and security operations.

**API Requirements**:
```javascript
class SecurityService extends StandardService {
    async encryptFile(file, options = {}) {
        // Encrypt file data
        // Return encrypted blob and key info
    }
    
    async decryptFile(encryptedFile, keyInfo) {
        // Decrypt file data
        // Return original file
    }
    
    validateFileIntegrity(file) {
        // Check file for security issues
        // Scan for malware/suspicious content
    }
}
```

## Service Communication Patterns

### 1. Service-to-Service Communication
```javascript
class CompressionService extends StandardService {
    async compressFile(file, settings) {
        // Get file from storage service via controller
        this.dispatchEvent(new CustomEvent('serviceRequest', {
            detail: {
                targetService: 'storage',
                method: 'getFile',
                params: { fileId: file.id }
            }
        }));
        
        // Wait for response via controller
        // Process file
        // Save result via storage service
    }
}
```

### 2. Progress Reporting Pattern
```javascript
class LongRunningService extends StandardService {
    async processLargeFile(file) {
        const steps = [
            { name: 'Validation', weight: 10 },
            { name: 'Analysis', weight: 30 },
            { name: 'Processing', weight: 50 },
            { name: 'Finalization', weight: 10 }
        ];
        
        let completedWeight = 0;
        
        for (const step of steps) {
            this.emitProgress(completedWeight, `Starting ${step.name}...`);
            
            await this.performStep(step, (stepProgress) => {
                const totalProgress = completedWeight + (step.weight * stepProgress / 100);
                this.emitProgress(totalProgress, `${step.name}: ${stepProgress}%`);
            });
            
            completedWeight += step.weight;
        }
        
        this.emitComplete(result);
    }
}
```

### 3. Error Handling Pattern
```javascript
class RobustService extends StandardService {
    async performOperation(data) {
        try {
            this.isProcessing = true;
            this.emitStatusChange('processing');
            
            const result = await this.doWork(data);
            
            this.emitComplete(result);
            return result;
            
        } catch (error) {
            this.emitError(error, { operation: 'performOperation', data });
            
            // Attempt recovery if possible
            if (this.canRecover(error)) {
                return await this.attemptRecovery(data);
            }
            
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }
}
```

## Service Testing Standards

### 1. Unit Testing
```javascript
describe('CompressionService', () => {
    let service;
    
    beforeEach(() => {
        service = new CompressionService();
    });
    
    test('emits progress events during compression', async () => {
        const progressEvents = [];
        service.addEventListener('progress', (e) => {
            progressEvents.push(e.detail);
        });
        
        await service.compressFile(mockFile);
        
        expect(progressEvents.length).toBeGreaterThan(0);
        expect(progressEvents[0].percentage).toBe(0);
        expect(progressEvents[progressEvents.length - 1].percentage).toBe(100);
    });
});
```

### 2. Integration Testing
```javascript
describe('Service Integration', () => {
    test('compression service integrates with storage service', async () => {
        const storageService = new StorageService();
        const compressionService = new CompressionService();
        
        // Setup service communication via mock controller
        const controller = new MockController();
        controller.registerService('storage', storageService);
        controller.registerService('compression', compressionService);
        
        const result = await compressionService.compressFile(mockFile);
        
        expect(result.success).toBe(true);
        expect(storageService.hasFile(result.fileId)).toBe(true);
    });
});
```

## Service Configuration

### 1. Service Registry
```javascript
class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.dependencies = new Map();
    }
    
    register(name, serviceClass, dependencies = []) {
        this.services.set(name, serviceClass);
        this.dependencies.set(name, dependencies);
    }
    
    async initializeAll() {
        // Initialize services in dependency order
        const initOrder = this.resolveDependencies();
        
        for (const serviceName of initOrder) {
            const ServiceClass = this.services.get(serviceName);
            const service = new ServiceClass();
            await service.init();
            this.services.set(serviceName, service);
        }
    }
}
```

### 2. Service Configuration
```javascript
// Service configuration
const serviceConfig = {
    storage: {
        encryptionEnabled: true,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        storageQuota: 500 * 1024 * 1024  // 500MB
    },
    compression: {
        defaultQuality: 80,
        maxConcurrentJobs: 3,
        timeoutMs: 300000 // 5 minutes
    },
    analytics: {
        enabled: true,
        endpoint: '/api/analytics',
        batchSize: 10
    }
};
```

## Migration Guidelines

### 1. Extract Business Logic
```javascript
// BEFORE: Business logic in component
class FileUploader {
    validateFile(file) {
        const maxSize = this.user.isPremium ? 100MB : 10MB;
        if (file.size > maxSize) {
            throw new Error('File too large');
        }
        
        if (!this.supportedTypes.includes(file.type)) {
            throw new Error('Unsupported file type');
        }
        
        return true;
    }
}

// AFTER: Business logic in service
class FileValidationService extends StandardService {
    validateFile(file, userTier) {
        const limits = this.getTierLimits(userTier);
        
        if (file.size > limits.maxFileSize) {
            throw new ValidationError('File exceeds size limit', {
                fileSize: file.size,
                limit: limits.maxFileSize
            });
        }
        
        if (!limits.supportedTypes.includes(file.type)) {
            throw new ValidationError('Unsupported file type', {
                fileType: file.type,
                supported: limits.supportedTypes
            });
        }
        
        return { valid: true, tier: userTier };
    }
}
```

### 2. Implement Event Interfaces
- Add standard event emission to all services
- Replace direct method calls with event-driven communication
- Implement progress reporting for long-running operations

### 3. Standardize APIs
- Ensure all services extend StandardService
- Implement consistent error handling
- Add proper documentation and type definitions

This service specification ensures consistent, maintainable, and well-architected business logic throughout the application.