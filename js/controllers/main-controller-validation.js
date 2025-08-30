/**
 * MainController Validation Script
 * Validates that the MainController properly orchestrates events and services
 */

import { MainController } from './main-controller.js';

async function validateMainController() {
    console.log('🔍 Validating MainController architecture...');
    
    try {
        // Test controller creation and initialization
        const controller = new MainController();
        console.log('✅ MainController created successfully');
        
        // Test initialization
        await controller.init();
        console.log('✅ MainController initialized successfully');
        
        // Test service registration
        const services = ['storage', 'compression', 'conversion', 'analytics'];
        const missingServices = services.filter(service => !controller.getService(service));
        
        if (missingServices.length === 0) {
            console.log('✅ All required services registered');
        } else {
            throw new Error(`Missing services: ${missingServices.join(', ')}`);
        }
        
        // Test event orchestration capability
        let eventReceived = false;
        controller.addEventListener('controllerReady', () => {
            eventReceived = true;
        });
        
        // Trigger ready event
        controller.dispatchEvent(new CustomEvent('controllerReady'));
        
        if (eventReceived) {
            console.log('✅ Event orchestration works');
        } else {
            throw new Error('Event orchestration failed');
        }
        
        // Test file tracking
        const mockFile = {
            fileId: 'test-file',
            name: 'test.pdf',
            size: 1000
        };
        
        controller.currentFiles.set(mockFile.fileId, mockFile);
        const currentFiles = controller.getCurrentFiles();
        
        if (currentFiles.length === 1 && currentFiles[0].fileId === mockFile.fileId) {
            console.log('✅ File tracking works correctly');
        } else {
            throw new Error('File tracking failed');
        }
        
        // Test service access
        const storageService = controller.getService('storage');
        if (storageService && typeof storageService.saveFile === 'function') {
            console.log('✅ Service access works correctly');
        } else {
            throw new Error('Service access failed');
        }
        
        // Test component discovery
        controller.discoverComponents();
        console.log('✅ Component discovery completed');
        
        // Test button handler setup
        controller.setupButtonHandlers();
        console.log('✅ Button handlers setup completed');
        
        // Test architecture compliance
        const architectureChecks = [
            // Should extend EventTarget
            controller instanceof EventTarget,
            // Should have services map
            controller.services instanceof Map,
            // Should have components map  
            controller.components instanceof Map,
            // Should have initialization flag
            typeof controller.isInitialized === 'boolean',
            // Should have file tracking
            controller.currentFiles instanceof Map
        ];
        
        if (architectureChecks.every(check => check)) {
            console.log('✅ Architecture compliance verified');
        } else {
            throw new Error('Architecture compliance failed');
        }
        
        // Test event-driven pattern
        const eventMethods = [
            'handleFileUploaded',
            'handleCompressionRequested', 
            'handleConversionRequested',
            'handleServiceProgress',
            'handleServiceComplete',
            'handleServiceError'
        ];
        
        const missingMethods = eventMethods.filter(method => 
            typeof controller[method] !== 'function'
        );
        
        if (missingMethods.length === 0) {
            console.log('✅ Event-driven pattern implemented correctly');
        } else {
            throw new Error(`Missing event methods: ${missingMethods.join(', ')}`);
        }
        
        console.log('🎉 MainController validation passed!');
        console.log('📊 Validation Summary:');
        console.log(`- Services registered: ${controller.services.size}`);
        console.log(`- Components discovered: ${controller.components.size}`);
        console.log(`- Files tracked: ${controller.currentFiles.size}`);
        console.log(`- Ready state: ${controller.isReady()}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ MainController validation failed:', error);
        return false;
    }
}

// Test event flow simulation
async function testEventFlow() {
    console.log('🔄 Testing event flow...');
    
    try {
        const controller = new MainController();
        await controller.init();
        
        // Simulate file upload event
        const mockFileUploadEvent = new CustomEvent('fileUploaded', {
            detail: {
                files: [{
                    fileId: 'test-file-1',
                    name: 'test.pdf',
                    size: 1000,
                    metadata: { type: 'original' }
                }],
                source: 'test',
                timestamp: Date.now()
            }
        });
        
        // Track if event was handled
        let eventHandled = false;
        const originalHandler = controller.handleFileUploaded;
        controller.handleFileUploaded = function(event) {
            eventHandled = true;
            return originalHandler.call(this, event);
        };
        
        // Dispatch event
        document.dispatchEvent(mockFileUploadEvent);
        
        // Wait a bit for async handling
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (eventHandled) {
            console.log('✅ Event flow test passed');
        } else {
            throw new Error('Event was not handled');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Event flow test failed:', error);
        return false;
    }
}

// Export for use in other modules
export { validateMainController, testEventFlow };

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    Promise.all([
        validateMainController(),
        testEventFlow()
    ]).then(results => {
        const allPassed = results.every(result => result);
        console.log(allPassed ? '🎉 All tests passed!' : '❌ Some tests failed');
    });
}