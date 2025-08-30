# Component Specification

## Core Component Rules

**RULE**: Components are isolated. They must not contain business logic or directly call methods from other components.

**IMPLEMENTATION**: Components are responsible only for:
- Rendering UI elements
- Handling user interactions
- Emitting events for business operations
- Listening for state changes to update UI

**VIOLATION EXAMPLES**:
```javascript
// DON'T DO THIS - Direct service calls
this.compressionService.compress(file);

// DON'T DO THIS - Direct component method calls  
this.fileManager.updateFileList();

// DON'T DO THIS - Business logic in components
if (file.size > limit && user.isPremium) {
    // Complex business logic belongs in services
}
```

## Component Catalog

### FileUploader Component

**Purpose**: A generic widget for file input and validation.

**Responsibilities**:
- Render file input interface (drag & drop, click to browse)
- Handle file selection and validation
- Save raw files to the `StorageService` via events
- Emit `fileUploaded` event with validated files

**MUST NOT**:
- Know about compression, conversion, or other processing
- Directly call any service methods
- Contain business logic about file processing
- Manage file storage directly

**Event Interface**:
```javascript
// Emits when files are selected/dropped
this.dispatchEvent(new CustomEvent('fileUploaded', {
    detail: {
        files: validatedFiles,
        source: 'drop|selection',
        timestamp: Date.now()
    }
}));

// Emits when validation fails
this.dispatchEvent(new CustomEvent('fileValidationError', {
    detail: {
        errors: validationErrors,
        rejectedFiles: invalidFiles
    }
}));
```

**API Contract**:
```javascript
class FileUploader extends BaseComponent {
    // Public methods (backward compatibility)
    getSelectedFiles() { return this.files; }
    clearFiles() { this.files = []; this.updateUI(); }
    setAcceptedTypes(types) { this.acceptedTypes = types; }
    
    // Event-driven methods (new standard)
    handleFileSelection(files) {
        const validated = this.validateFiles(files);
        this.emitFileUploaded(validated);
    }
}
```

### MainController/App Component

**Purpose**: The orchestrator that listens for events and calls service methods.

**Responsibilities**:
- Listen for all component events
- Coordinate service calls based on events
- Manage application state transitions
- Update UI components based on service responses

**Event Handling Pattern**:
```javascript
class MainController extends EventTarget {
    setupEventListeners() {
        // Component events
        document.addEventListener('fileUploaded', this.handleFileUploaded.bind(this));
        document.addEventListener('compressionRequested', this.handleCompressionRequested.bind(this));
        document.addEventListener('conversionRequested', this.handleConversionRequested.bind(this));
        
        // Service events
        this.services.forEach(service => {
            service.addEventListener('progress', this.handleServiceProgress.bind(this));
            service.addEventListener('complete', this.handleServiceComplete.bind(this));
            service.addEventListener('error', this.handleServiceError.bind(this));
        });
    }
    
    async handleFileUploaded(event) {
        const { files } = event.detail;
        
        // Coordinate with storage service
        const storageService = this.getService('storage');
        await storageService.saveFiles(files);
        
        // Update file manager component
        this.updateComponent('fileManager', { files });
    }
}
```

### FileManager Component

**Purpose**: Display and manage files using the `StorageService` API.

**Responsibilities**:
- Display list of files from StorageService
- Provide download/delete actions
- Show file metadata and processing status
- Emit events for file operations

**MUST NOT**:
- Directly access localStorage or other storage
- Perform file processing operations
- Manage file uploads (that's FileUploader's job)

**StorageService Integration**:
```javascript
class FileManager extends BaseComponent {
    async init() {
        // Get files from storage service via controller
        this.dispatchEvent(new CustomEvent('requestFileList'));
    }
    
    handleDeleteFile(fileId) {
        this.dispatchEvent(new CustomEvent('fileDeleteRequested', {
            detail: { fileId }
        }));
    }
    
    handleDownloadFile(fileId) {
        this.dispatchEvent(new CustomEvent('fileDownloadRequested', {
            detail: { fileId }
        }));
    }
}
```

### CompressionInterface Component

**Purpose**: UI controls for compression settings and operations.

**Responsibilities**:
- Render compression settings form
- Validate user input locally
- Emit compression requests with settings
- Display compression progress and results

**MUST NOT**:
- Perform actual compression
- Access files directly
- Manage compression algorithms

**Event Interface**:
```javascript
class CompressionInterface extends BaseComponent {
    handleCompressionStart() {
        const settings = this.getCompressionSettings();
        const selectedFiles = this.getSelectedFiles();
        
        this.dispatchEvent(new CustomEvent('compressionRequested', {
            detail: {
                files: selectedFiles,
                settings: settings,
                requestId: this.generateRequestId()
            }
        }));
    }
}
```

### ConversionPanel Component

**Purpose**: UI controls for document conversion operations.

**Responsibilities**:
- Render conversion type selection (PDF to Word, Excel, etc.)
- Collect conversion settings from user
- Emit conversion requests
- Display conversion progress

**Event Interface**:
```javascript
class ConversionPanel extends BaseComponent {
    handleConversionRequest(conversionType) {
        this.dispatchEvent(new CustomEvent('conversionRequested', {
            detail: {
                type: conversionType, // 'pdf-to-word', 'pdf-to-excel'
                files: this.selectedFiles,
                settings: this.getConversionSettings(),
                requestId: this.generateRequestId()
            }
        }));
    }
}
```

### SettingsPanel Component

**Purpose**: Application settings management interface.

**Responsibilities**:
- Render settings form
- Validate settings locally
- Emit settings change events
- Display current settings state

**Event Interface**:
```javascript
class SettingsPanel extends BaseComponent {
    handleSettingsChange(settingKey, value) {
        this.dispatchEvent(new CustomEvent('settingsChanged', {
            detail: {
                key: settingKey,
                value: value,
                category: this.getSettingCategory(settingKey)
            }
        }));
    }
}
```

### ProgressTracker Component

**Purpose**: Display progress for long-running operations.

**Responsibilities**:
- Listen for progress events from controller
- Display progress bars and status messages
- Handle progress cancellation requests
- Show estimated time remaining

**State Management**:
```javascript
class ProgressTracker extends BaseComponent {
    updateProgress(progressData) {
        const { percentage, message, operation } = progressData;
        
        this.setState({
            percentage,
            message,
            operation,
            isActive: percentage < 100
        });
        
        this.render();
    }
}
```

### ResultsDisplay Component

**Purpose**: Show results of completed operations.

**Responsibilities**:
- Display operation results (success/failure)
- Provide download links for processed files
- Show before/after comparisons
- Emit events for result actions

**Event Interface**:
```javascript
class ResultsDisplay extends BaseComponent {
    handleDownloadResult(resultId) {
        this.dispatchEvent(new CustomEvent('resultDownloadRequested', {
            detail: { resultId }
        }));
    }
    
    handleShareResult(resultId) {
        this.dispatchEvent(new CustomEvent('resultShareRequested', {
            detail: { resultId, shareMethod: 'link' }
        }));
    }
}
```

## Component Communication Rules

### 1. Event-Only Communication
```javascript
// CORRECT: Event emission
this.dispatchEvent(new CustomEvent('actionRequested', { detail: data }));

// INCORRECT: Direct method calls
this.otherComponent.doSomething(data);
```

### 2. State Updates via Controller
```javascript
// CORRECT: Controller updates component state
class MainController {
    handleServiceComplete(event) {
        this.updateComponent('resultsDisplay', event.detail);
    }
}

// INCORRECT: Component updating other components
class ComponentA {
    handleAction() {
        this.componentB.updateState(data); // DON'T DO THIS
    }
}
```

### 3. Service Access via Events
```javascript
// CORRECT: Request service action via event
this.dispatchEvent(new CustomEvent('serviceActionRequested', {
    detail: { service: 'storage', method: 'getFiles' }
}));

// INCORRECT: Direct service access
const files = this.storageService.getFiles(); // DON'T DO THIS
```

## Component Lifecycle

### 1. Initialization
```javascript
class BaseComponent extends HTMLElement {
    connectedCallback() {
        this.init();
        this.setupEventListeners();
        this.render();
    }
    
    init() {
        // Component-specific initialization
        // Request initial data via events
        this.requestInitialData();
    }
}
```

### 2. Event Setup
```javascript
setupEventListeners() {
    // Listen for user interactions
    this.addEventListener('click', this.handleClick.bind(this));
    
    // Listen for state updates from controller
    document.addEventListener('stateUpdate', this.handleStateUpdate.bind(this));
}
```

### 3. Cleanup
```javascript
disconnectedCallback() {
    // Remove event listeners
    this.removeEventListeners();
    
    // Clean up resources
    this.cleanup();
}
```

## Component Testing Standards

### 1. Isolated Testing
```javascript
// Test components in isolation
describe('FileUploader', () => {
    let component;
    
    beforeEach(() => {
        component = new FileUploader();
        document.body.appendChild(component);
    });
    
    test('emits fileUploaded event when files selected', () => {
        const eventSpy = jest.fn();
        component.addEventListener('fileUploaded', eventSpy);
        
        component.handleFileSelection([mockFile]);
        
        expect(eventSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: expect.objectContaining({
                    files: [mockFile]
                })
            })
        );
    });
});
```

### 2. Event Testing
```javascript
// Test event emission and handling
test('component emits correct events', async () => {
    const events = [];
    
    component.addEventListener('fileUploaded', (e) => {
        events.push({ type: 'fileUploaded', detail: e.detail });
    });
    
    await component.handleFileSelection([mockFile]);
    
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('fileUploaded');
});
```

## Migration Guidelines

### 1. Identify Violations
- Find direct service calls in components
- Locate business logic in UI components
- Identify component-to-component method calls

### 2. Extract Business Logic
```javascript
// BEFORE: Business logic in component
class FileUploader {
    processFile(file) {
        if (file.size > this.maxSize && !this.user.isPremium) {
            throw new Error('File too large for free users');
        }
        // Complex processing logic...
    }
}

// AFTER: Business logic in service
class FileUploader {
    processFile(file) {
        this.dispatchEvent(new CustomEvent('fileProcessingRequested', {
            detail: { file }
        }));
    }
}
```

### 3. Implement Event Interfaces
- Replace method calls with event emission
- Add event listeners for state updates
- Remove direct dependencies between components

This component specification ensures clean separation of concerns, maintainable code, and proper event-driven architecture throughout the application.