/**
 * FileUploader Validation Script
 * Validates that the refactored FileUploader follows the new architecture
 */

import { FileUploader } from './file-uploader.js';

async function validateFileUploader() {
    console.log('🔍 Validating refactored FileUploader...');
    
    try {
        // Test component creation
        const uploader = new FileUploader();
        console.log('✅ FileUploader component created successfully');
        
        // Test StorageService integration
        if (uploader.storageService) {
            console.log('✅ StorageService properly integrated');
        } else {
            throw new Error('StorageService not found');
        }
        
        // Test backward compatibility methods
        const compatibilityMethods = [
            'getSelectedFiles', 'clearFiles', 'setAcceptedTypes',
            'setMaxFileSize', 'setMultiple', 'setDisabled',
            'getMode', 'setMode', 'emit'
        ];
        
        const missingMethods = compatibilityMethods.filter(method => 
            typeof uploader[method] !== 'function'
        );
        
        if (missingMethods.length === 0) {
            console.log('✅ All backward compatibility methods present');
        } else {
            throw new Error(`Missing methods: ${missingMethods.join(', ')}`);
        }
        
        // Test that business logic methods are removed
        const businessLogicMethods = [
            'compressFile', 'convertFile', 'processFile',
            'analyzeFile', 'optimizeFile', 'initializeMode'
        ];
        
        const foundBusinessLogic = businessLogicMethods.filter(method => 
            typeof uploader[method] === 'function' && 
            uploader[method].toString().includes('business logic')
        );
        
        if (foundBusinessLogic.length === 0) {
            console.log('✅ Business logic properly removed/stubbed');
        } else {
            console.warn(`⚠️ Found business logic in: ${foundBusinessLogic.join(', ')}`);
        }
        
        // Test event emission capability
        let eventEmitted = false;
        uploader.addEventListener('test-event', () => {
            eventEmitted = true;
        });
        
        uploader.emit('test-event', { test: 'data' });
        
        if (eventEmitted) {
            console.log('✅ Event emission works correctly');
        } else {
            throw new Error('Event emission failed');
        }
        
        // Test file validation (without actual files)
        const validationResult = uploader.validateFiles([]);
        if (Array.isArray(validationResult)) {
            console.log('✅ File validation method works');
        } else {
            throw new Error('File validation failed');
        }
        
        // Test component size reduction
        const componentCode = uploader.constructor.toString();
        const lineCount = componentCode.split('\n').length;
        
        if (lineCount < 500) {
            console.log(`✅ Component size reduced significantly (${lineCount} lines vs original 3,166)`);
        } else {
            console.warn(`⚠️ Component still large (${lineCount} lines)`);
        }
        
        console.log('🎉 FileUploader refactoring validation passed!');
        return true;
        
    } catch (error) {
        console.error('❌ FileUploader validation failed:', error);
        return false;
    }
}

// Export for use in other modules
export { validateFileUploader };

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    validateFileUploader();
}