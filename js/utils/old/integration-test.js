/**
 * Integration Test Utility
 * Tests the file processing pipeline integration
 */

import { fileProcessingService } from '../services/file-processing-service.js';
import { uiIntegrationService } from '../services/ui-integration-service.js';
import { appState } from '../services/app-state.js';

export class IntegrationTest {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
    }

    async runTests() {
        if (this.isRunning) {
            console.warn('Tests are already running');
            return;
        }

        this.isRunning = true;
        this.testResults = [];

        console.group('🧪 Running Integration Tests');

        try {
            // Test 1: Service initialization
            await this.testServiceInitialization();

            // Test 2: App state integration
            await this.testAppStateIntegration();

            // Test 3: File validation
            await this.testFileValidation();

            // Test 4: Component discovery
            await this.testComponentDiscovery();

            // Test 5: Event system
            await this.testEventSystem();

            // Test 6: Error handling
            await this.testErrorHandling();

            this.printResults();

        } catch (error) {
            console.error('Test suite failed:', error);
        } finally {
            this.isRunning = false;
            console.groupEnd();
        }
    }

    async testServiceInitialization() {
        const testName = 'Service Initialization';
        console.log(`Testing: ${testName}`);

        try {
            // Check if services are initialized
            const fpService = window.fileProcessingService;
            const uiService = window.uiIntegrationService;
            const appStateService = window.appState;

            this.assert(fpService !== undefined, 'File processing service should be available');
            this.assert(uiService !== undefined, 'UI integration service should be available');
            this.assert(appStateService !== undefined, 'App state service should be available');

            // Check if services have required methods
            this.assert(typeof fpService.processFiles === 'function', 'File processing service should have processFiles method');
            this.assert(typeof uiService.processFiles === 'function', 'UI integration service should have processFiles method');
            this.assert(typeof appStateService.get === 'function', 'App state should have get method');

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    async testAppStateIntegration() {
        const testName = 'App State Integration';
        console.log(`Testing: ${testName}`);

        try {
            // Test getting default settings
            const settings = appState.getSettings();
            this.assert(settings !== null, 'Should get settings from app state');
            this.assert(typeof settings.compressionLevel === 'string', 'Should have compression level setting');
            this.assert(typeof settings.imageQuality === 'number', 'Should have image quality setting');

            // Test setting values
            const originalLevel = settings.compressionLevel;
            appState.set('compressionLevel', 'high');
            const newSettings = appState.getSettings();
            this.assert(newSettings.compressionLevel === 'high', 'Should update compression level');

            // Restore original value
            appState.set('compressionLevel', originalLevel);

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    async testFileValidation() {
        const testName = 'File Validation';
        console.log(`Testing: ${testName}`);

        try {
            // Create a mock PDF file
            const mockPdfFile = new File(['%PDF-1.4 mock content'], 'test.pdf', {
                type: 'application/pdf'
            });

            // Test validation
            const validation = await fileProcessingService.validateFile(mockPdfFile);
            this.assert(validation !== null, 'Should return validation result');
            this.assert(typeof validation.isValid === 'boolean', 'Should have isValid property');
            this.assert(Array.isArray(validation.errors), 'Should have errors array');

            // Create invalid file
            const invalidFile = new File(['invalid content'], 'test.txt', {
                type: 'text/plain'
            });

            const invalidValidation = await fileProcessingService.validateFile(invalidFile);
            this.assert(invalidValidation.isValid === false, 'Should reject invalid file type');

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    async testComponentDiscovery() {
        const testName = 'Component Discovery';
        console.log(`Testing: ${testName}`);

        try {
            // Check if UI integration service discovered components
            const components = uiIntegrationService.components;
            this.assert(components instanceof Map, 'Should have components map');

            // Check for expected component types
            const fileUploaders = document.querySelectorAll('file-uploader');
            const bulkUploaders = document.querySelectorAll('bulk-uploader');
            
            console.log(`Found ${fileUploaders.length} file uploaders`);
            console.log(`Found ${bulkUploaders.length} bulk uploaders`);

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    async testEventSystem() {
        const testName = 'Event System';
        console.log(`Testing: ${testName}`);

        try {
            let eventReceived = false;
            
            // Test file processing service events
            const unsubscribe = fileProcessingService.on('test-event', (data) => {
                eventReceived = true;
            });

            // Emit test event
            fileProcessingService.emit('test-event', { test: true });

            this.assert(eventReceived, 'Should receive emitted event');

            // Clean up
            unsubscribe();

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    async testErrorHandling() {
        const testName = 'Error Handling';
        console.log(`Testing: ${testName}`);

        try {
            // Test error handling with invalid input
            try {
                await fileProcessingService.processFiles(null);
                this.fail(testName, 'Should throw error for null input');
            } catch (error) {
                this.assert(error.message.includes('No files provided'), 'Should throw appropriate error message');
            }

            // Test error handling with empty array
            try {
                await fileProcessingService.processFiles([]);
                this.fail(testName, 'Should throw error for empty array');
            } catch (error) {
                this.assert(error.message.includes('No files provided'), 'Should throw appropriate error message');
            }

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    pass(testName) {
        this.testResults.push({ name: testName, status: 'PASS' });
        console.log(`✅ ${testName}: PASS`);
    }

    fail(testName, message) {
        this.testResults.push({ name: testName, status: 'FAIL', message });
        console.log(`❌ ${testName}: FAIL - ${message}`);
    }

    printResults() {
        console.group('📊 Test Results');
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;

        console.log(`Total: ${total}, Passed: ${passed}, Failed: ${failed}`);
        
        if (failed > 0) {
            console.group('❌ Failed Tests');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`${r.name}: ${r.message}`));
            console.groupEnd();
        }

        console.groupEnd();

        // Return summary
        return {
            total,
            passed,
            failed,
            success: failed === 0,
            results: this.testResults
        };
    }

    // Test with actual file upload simulation
    async testFileUploadSimulation() {
        const testName = 'File Upload Simulation';
        console.log(`Testing: ${testName}`);

        try {
            // Create a more realistic mock PDF
            const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000125 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
229
%%EOF`;

            const mockFile = new File([pdfContent], 'test.pdf', {
                type: 'application/pdf'
            });

            // Test validation
            const validation = await fileProcessingService.validateFile(mockFile);
            this.assert(validation.isValid, 'Mock PDF should pass validation');

            this.pass(testName);
        } catch (error) {
            this.fail(testName, error.message);
        }
    }
}

// Create global test instance
export const integrationTest = new IntegrationTest();

// Add to window for console access
window.integrationTest = integrationTest;

// Auto-run tests in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Run tests after a short delay to allow services to initialize
    setTimeout(() => {
        console.log('🧪 Auto-running integration tests in development mode');
        integrationTest.runTests();
    }, 2000);
}