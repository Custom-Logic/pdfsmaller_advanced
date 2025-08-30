# Development Rules

## Technology Stack Requirements

### ES6 Modules are Mandatory

**RULE**: ES6 Modules are mandatory. No external UI frameworks (React, Vue, etc.).

**IMPLEMENTATION**:
- All JavaScript code must use ES6 module syntax (`import`/`export`)
- No CommonJS (`require`/`module.exports`) in frontend code
- No external UI frameworks - use vanilla JavaScript with Web Components
- Dynamic imports for code splitting and lazy loading

**CORRECT EXAMPLES**:
```javascript
// ES6 module imports
import { CompressionService } from './services/compression-service.js';
import { FileUploader } from './components/file-uploader.js';

// Dynamic imports for lazy loading
const { AdvancedFeatures } = await import('./modules/advanced-features.js');

// Web Components for UI
class CustomButton extends HTMLElement {
    connectedCallback() {
        this.innerHTML = '<button>Click me</button>';
    }
}
customElements.define('custom-button', CustomButton);
```

**INCORRECT EXAMPLES**:
```javascript
// DON'T DO THIS - CommonJS syntax
const CompressionService = require('./services/compression-service');

// DON'T DO THIS - External frameworks
import React from 'react';
import Vue from 'vue';

// DON'T DO THIS - jQuery or other DOM libraries
import $ from 'jquery';
```

### Testing Requirements

**RULE**: All testing must be Node-based (e.g., Jest). Tests are co-located in `*.test.js` files. Python is not to be used for this project.

**IMPLEMENTATION**:
- Use Jest as the primary testing framework
- Co-locate tests with source files using `.test.js` suffix
- No Python testing tools (pytest, unittest, etc.)
- Focus on JavaScript/Node.js ecosystem only

**Test File Structure**:
```
js/
├── components/
│   ├── file-uploader.js
│   ├── file-uploader.test.js
│   ├── compression-interface.js
│   └── compression-interface.test.js
├── services/
│   ├── storage-service.js
│   ├── storage-service.test.js
│   ├── compression-service.js
│   └── compression-service.test.js
└── utils/
    ├── file-validator.js
    └── file-validator.test.js
```

**Test Examples**:
```javascript
// file-uploader.test.js
import { FileUploader } from './file-uploader.js';

describe('FileUploader', () => {
    let uploader;
    
    beforeEach(() => {
        uploader = new FileUploader();
        document.body.appendChild(uploader);
    });
    
    afterEach(() => {
        document.body.removeChild(uploader);
    });
    
    test('emits fileUploaded event when files are selected', () => {
        const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        const eventSpy = jest.fn();
        
        uploader.addEventListener('fileUploaded', eventSpy);
        uploader.handleFileSelection([mockFile]);
        
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

### Styling Guidelines

**RULE**: Avoid new styles. Component-specific styles go in a CSS file named `[ComponentName].css`. Global styles go in the existing global CSS file.

**IMPLEMENTATION**:
- Minimize creation of new CSS files
- Use existing design system and utility classes
- Component styles should be scoped and minimal
- Global styles only for truly global elements

**File Structure**:
```
css/
├── global.css              # Global styles (existing)
├── components/
│   ├── FileUploader.css    # Component-specific styles
│   ├── CompressionInterface.css
│   └── ProgressTracker.css
└── utils/
    └── utilities.css       # Utility classes
```

**CSS Guidelines**:
```css
/* FileUploader.css - Component-specific styles */
.file-uploader {
    /* Minimal, scoped styles only */
    border: 2px dashed var(--border-color);
    border-radius: var(--border-radius);
    padding: var(--spacing-lg);
}

.file-uploader.drag-over {
    border-color: var(--primary-color);
    background-color: var(--primary-bg-light);
}

/* Use existing CSS custom properties */
.file-uploader__button {
    background: var(--button-bg);
    color: var(--button-text);
    border: var(--button-border);
}
```

**AVOID**:
```css
/* DON'T DO THIS - Avoid new global styles */
body {
    font-family: 'NewFont', sans-serif; /* Use existing fonts */
}

/* DON'T DO THIS - Avoid complex new layouts */
.complex-grid-system {
    display: grid;
    grid-template-areas: "a b c d e f g h";
    /* Use existing layout patterns */
}
```

### Refactoring Approach

**RULE**: Prefer modifying and reorganizing existing code over writing new modules. The goal is to conform to the new architecture, not to add new features.

**IMPLEMENTATION**:
- Refactor existing components to follow event-driven architecture
- Extract business logic from components into services
- Reorganize code structure without changing functionality
- Focus on architectural compliance, not feature additions

**Refactoring Priorities**:

1. **Component Isolation**:
```javascript
// BEFORE: Component with business logic
class FileUploader {
    processFile(file) {
        // Complex validation and processing logic
        if (this.validateFile(file)) {
            this.compressFile(file);
            this.saveToStorage(file);
        }
    }
}

// AFTER: Component with event emission only
class FileUploader {
    processFile(file) {
        // Simple validation, emit event for processing
        if (this.basicValidation(file)) {
            this.dispatchEvent(new CustomEvent('fileProcessingRequested', {
                detail: { file }
            }));
        }
    }
}
```

2. **Service Extraction**:
```javascript
// BEFORE: Business logic scattered in components
// Move to dedicated services

// AFTER: Centralized business logic
class FileProcessingService extends StandardService {
    async processFile(file) {
        const isValid = await this.validateFile(file);
        if (isValid) {
            const compressed = await this.compressFile(file);
            await this.saveToStorage(compressed);
            this.emitComplete(compressed);
        }
    }
}
```

3. **Event-Driven Communication**:
```javascript
// BEFORE: Direct method calls between components
componentA.updateData(data);
componentB.refresh();

// AFTER: Event-driven communication
this.dispatchEvent(new CustomEvent('dataUpdated', { detail: data }));
// Controller handles the event and updates components
```

## Code Organization Standards

### Module Structure
```javascript
// Standard module structure
export class ServiceName extends StandardService {
    constructor() {
        super();
        // Initialization
    }
    
    async init() {
        // Service setup
        await super.init();
    }
    
    // Public API methods
    async publicMethod(params) {
        // Implementation
    }
    
    // Private methods (underscore prefix)
    _privateMethod(params) {
        // Internal implementation
    }
}

// Default export for main class
export default ServiceName;
```

### Import Organization
```javascript
// 1. Standard library imports (if any)
import { EventTarget } from 'events';

// 2. Internal service imports
import { StorageService } from './storage-service.js';
import { ValidationService } from './validation-service.js';

// 3. Component imports
import { BaseComponent } from '../components/base-component.js';

// 4. Utility imports
import { ErrorHandler } from '../utils/error-handler.js';
import { FileValidator } from '../utils/file-validator.js';

// 5. Type definitions (if using TypeScript)
import type { FileMetadata, CompressionSettings } from '../types/index.js';
```

### Error Handling Standards
```javascript
// Consistent error handling pattern
class ServiceClass extends StandardService {
    async performOperation(data) {
        try {
            this.validateInput(data);
            const result = await this.processData(data);
            this.emitComplete(result);
            return result;
        } catch (error) {
            this.handleError(error, { operation: 'performOperation', data });
            throw error;
        }
    }
    
    handleError(error, context = {}) {
        // Log error
        console.error(`${this.constructor.name} error:`, error, context);
        
        // Emit error event
        this.emitError(error, context);
        
        // Report to analytics if available
        if (this.analyticsService) {
            this.analyticsService.trackError(error, context);
        }
    }
}
```

## Performance Guidelines

### Code Splitting
```javascript
// Use dynamic imports for large modules
class MainController {
    async loadAdvancedFeatures() {
        if (!this.advancedFeatures) {
            const { AdvancedFeatures } = await import('./modules/advanced-features.js');
            this.advancedFeatures = new AdvancedFeatures();
        }
        return this.advancedFeatures;
    }
}
```

### Memory Management
```javascript
// Proper cleanup in components
class BaseComponent extends HTMLElement {
    disconnectedCallback() {
        // Remove event listeners
        this.removeEventListeners();
        
        // Clear references
        this.services = null;
        this.data = null;
        
        // Cancel ongoing operations
        if (this.abortController) {
            this.abortController.abort();
        }
    }
}
```

### Lazy Loading
```javascript
// Lazy load components when needed
class ComponentLoader {
    static async loadComponent(componentName) {
        const componentMap = {
            'advanced-editor': () => import('./components/advanced-editor.js'),
            'bulk-processor': () => import('./components/bulk-processor.js'),
            'ai-assistant': () => import('./components/ai-assistant.js')
        };
        
        const loader = componentMap[componentName];
        if (loader) {
            const module = await loader();
            return module.default || module[componentName];
        }
        
        throw new Error(`Component ${componentName} not found`);
    }
}
```

## Quality Assurance

### Code Review Checklist
- [ ] Uses ES6 modules exclusively
- [ ] No external UI frameworks
- [ ] Components are event-driven only
- [ ] Business logic is in services
- [ ] Tests are co-located with source files
- [ ] CSS follows naming conventions
- [ ] No new global styles without justification
- [ ] Error handling follows standard patterns
- [ ] Performance considerations addressed

### Automated Checks
```javascript
// ESLint configuration for enforcement
module.exports = {
    rules: {
        // Enforce ES6 modules
        'import/no-commonjs': 'error',
        
        // Prevent external framework usage
        'import/no-restricted-paths': ['error', {
            patterns: ['react', 'vue', 'angular', 'jquery']
        }],
        
        // Enforce naming conventions
        'camelcase': ['error', { properties: 'always' }],
        
        // Require proper error handling
        'no-unused-catch-bindings': 'error',
        'prefer-promise-reject-errors': 'error'
    }
};
```

### Testing Standards
```javascript
// Test coverage requirements
module.exports = {
    collectCoverageFrom: [
        'js/**/*.js',
        '!js/**/*.test.js',
        '!js/test/**'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
};
```

## Migration Checklist

### Phase 1: Architecture Compliance
- [ ] Audit existing code for architecture violations
- [ ] Identify components with business logic
- [ ] List direct service calls in components
- [ ] Document current event usage

### Phase 2: Service Extraction
- [ ] Extract business logic to services
- [ ] Implement standard service interfaces
- [ ] Add event emission to services
- [ ] Create service registry

### Phase 3: Component Refactoring
- [ ] Remove business logic from components
- [ ] Implement event-driven communication
- [ ] Add proper error handling
- [ ] Update component tests

### Phase 4: Integration
- [ ] Implement MainController
- [ ] Connect services and components via events
- [ ] Test end-to-end workflows
- [ ] Performance optimization

These development rules ensure consistent, maintainable, and architecturally sound code that follows the event-driven, service-centric principles established for this project.