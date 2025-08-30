/**
 * Error Handling Integration Test
 * Tests the comprehensive error handling system
 */

import { errorHandlingService } from '../services/error-handling-service.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class ErrorHandlingTest {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
    }

    async runAllTests() {
        if (this.isRunning) {
            console.log('Tests are already running');
            return;
        }

        this.isRunning = true;
        this.testResults = [];
        
        console.log('🧪 Starting Error Handling Integration Tests...');
        
        try {
            // Test 1: Service Initialization
            await this.testServiceInitialization();
            
            // Test 2: Notification System
            await this.testNotificationSystem();
            
            // Test 3: Error Message Components
            await this.testErrorMessageComponents();
            
            // Test 4: Loading States
            await this.testLoadingStates();
            
            // Test 5: File Validation Errors
            await this.testFileValidationErrors();
            
            // Test 6: Network Error Handling
            await this.testNetworkErrorHandling();
            
            // Test 7: Retry Mechanism
            await this.testRetryMechanism();
            
            // Test 8: Batch Error Handling
            await this.testBatchErrorHandling();
            
            // Display results
            this.displayTestResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    async testServiceInitialization() {
        const testName = 'Service Initialization';
        console.log(`🔍 Testing: ${testName}`);
        
        try {
            // Test that error handling service initializes
            await errorHandlingService.init();
            
            // Check that notification system is created
            const notificationSystem = document.querySelector('notification-system');
            
            if (notificationSystem) {
                this.addTestResult(testName, true, 'Service initialized and notification system created');
            } else {
                this.addTestResult(testName, false, 'Notification system not found');
            }
            
        } catch (error) {
            this.addTestResult(testName, false, `Initialization failed: ${error.message}`);
        }
    }

    async testNotificationSystem() {
        const testName = 'Notification System';
        console.log(`🔍 Testing: ${testName}`);
        
        try {
            // Test success notification
            const successId = errorHandlingService.showSuccess('Test success message');
            
            // Test error notification
            const errorId = errorHandlingService.showError('Test error message');
            
            // Test warning notification
            const warningId = errorHandlingService.showWarning('Test warning message');
            
            // Test info notification
            const infoId = errorHandlingService.showInfo('Test info message');
            
            // Wait a bit for notifications to appear
            await this.wait(100);
            
            // Check if notifications are in DOM
            const notifications = document.querySelectorAll('.notification');
            
            if (notifications.length >= 4) {
                this.addTestResult(testName, true, `Created ${notifications.length} notifications`);
                
                // Clean up
                errorHandlingService.clearAllNotifications();
            } else {
                this.addTestResult(testName, false, `Expected 4+ notifications, found ${notifications.length}`);
            }
            
        } catch (error) {
            this.addTestResult(testName, false, `Notification test failed: ${error.message}`);
        }
    }

    async testErrorMessageComponents() {
        const testName = 'Error Message Components';
        console.log(`🔍 Testing: ${testName}`);
        
        try {
            // Create a test container
            const container = document.createElement('div');
            container.id = 'test-error-container';
            document.body.appendChild(container);
            
            // Test inline error message
            const error = new Error('Test inline error message');
            const errorId = errorHandlingService.showInlineError(error, container, {
                title: 'Test Error',
                suggestions: ['Test suggestion 1', 'Test suggestion 2'],
                retryCallback: () => console.log('Retry clicked')
            });
            
            // Wait for component to render
            await this.wait(100);
            
            // Check if error message component was created
            const errorMessage = container.querySelector('error-message');
            
            if (errorMessage) {
                this.addTestResult(testName, true, 'Error message component created successfully');
                
                // Clean up
                errorHandlingService.hideInlineError(errorId);
            } else {
                this.addTestResult(testName, false, 'Error message component not found');
            }
            
            // Clean up container
            document.body.removeChild(container);
            
        } catch (error) {
            this.addTestResult(testName, false, `Error message test failed: ${error.message}`);
        }
    }

    async testLoadingStates() {
        const testName = 'Loading States';
        console.log(`🔍 Testing: ${testName}`);
        
        try {
            // Test loading state
            const loadingId = errorHandlingService.showLoadingState('Test loading message', {
                type: 'spinner'
            });
            
            // Wait for loading to appear
            await this.wait(100);
            
            // Check if loading state is visible
            const loadingElement = document.querySelector('loading-state');
            
            if (loadingElement && loadingElement.isVisible && loadingElement.isVisible()) {
                this.addTestResult(testName, true, 'Loading state displayed successfully');
                
                // Test hiding loading state
                errorHandlingService.hideLoadingState(loadingId);
                
                await this.wait(100);
                
                if (!loadingElement.isVisible || !loadingElement.isVisible()) {
                    this.addTestResult(testName + ' (Hide)', true, 'Loading state hidden successfully');
                } else {
                    this.addTestResult(testName + ' (Hide)', false, 'Loading state not hidden');
                }
            } else {
                this.addTestResult(testName, false, 'Loading state not displayed');
            }
            
        } catch (error) {
            this.addTestResult(testName, false, `Loading state test failed: ${error.message}`);
        }
    }

    async testFileValidationErrors() {
        const testName = 'File Validation Errors';
        console.log(`🔍 Testing: ${testName}`);
        
        try {
            // Create a mock invalid file
            const mockFile = {
                name: 'test.txt',
                size: 100 * 1024 * 1024, // 100MB (too large)
                type: 'text/plain' // Wrong type
            };
            
            // Test file validation error
            const validationError = ErrorHandler.createFileError(
                'File validation failed: Invalid type and size too large',
                mockFile.name
            );
            
            errorHandlingService.handleError(validationError, {
                fileName: mockFile.name,
                context: 'File validation test'
            });
            
            // Wait for error to be processed
            await this.wait(100);
            
            // Check if error notification was shown
            const notifications = document.querySelectorAll('.notification--error');
            
            if (notifications.length > 0) {
                this.addTestResult(testName, true, 'File validation error handled correctly');
                
                // Clean up
                errorHandlingService.clearAllNotifications();
            } else {
                this.addTestResult(testName, false, 'File validation error not displayed');
            }
            
        } catch (error) {
            this.addTestResult(testName, false, `File validation test failed: ${error.message}`);
        }
    }

    async testNetworkErrorHandling() {
        const testName = 'Network Error Handling';
        console.log(`🔍 Testing: ${testName}`);
        
        try {
            // Create a network error
            const networkError = ErrorHandler.createNetworkError('Connection failed');
            
            let retryCallbackCalled = false;
            
            errorHandlingService.handleError(networkError, {
                context: 'Network test',
                retryCallback: () => {
                    retryCallbackCalled = true;
                    console.log('Network retry callback executed');
                }
            });
            
            // Wait for error to be processed
            await this.wait(100);
            
            // Check if error notification was shown with retry button
            const notifications = document.querySelectorAll('.notification--error');
            const retryButtons = document.querySelectorAll('[data-action="retry"]');
            
            if (notifications.length > 0 && retryButtons.length > 0) {
                this.addTestResult(testName, true, 'Network error with retry button displayed');
                
                // Test retry button (simulate click)
                if (retryButtons[0]) {
                    retryButtons[0].click();
                    
                    // Wait for callback
                    await this.wait(100);
                    
                    if (retryCallbackCalled) {
                        this.addTestResult(testName + ' (Retry)', true, 'Retry callback executed');
                    } else {
                        this.addTestResult(testName + ' (Retry)', false, 'Retry callback not executed');
                    }
                }
                
                // Clean up
                errorHandlingService.clearAllNotifications();
            } else {
                this.addTestResult(testName, false, 'Network error or retry button not displayed');
            }
            
        } catch (error) {
            this.addTestResult(testName, false, `Network error test failed: ${error.message}`);
        }
    }

    async testRetryMechanism() {
        const testName = 'Retry Mechanism';
        console.log(`🔍 Testing: ${testName}`);
        
        try {
            let attempts = 0;
            const maxAttempts = 3;
            
            const failingOperation = () => {
                attempts++;
                if (attempts < maxAttempts) {
                    throw new Error(`Operation failed (attempt ${attempts})`);
                }
                return 'Success!';
            };
            
            // Test retry mechanism
            const result = await errorHandlingService.handleRetry(failingOperation, {
                maxRetries: maxAttempts,
                retryDelay: 100 // Short delay for testing
            });
            
            if (result === 'Success!' && attempts === maxAttempts) {
                this.addTestResult(testName, true, `Retry mechanism worked after ${attempts} attempts`);
            } else {
                this.addTestResult(testName, false, `Retry mechanism failed: ${result}, attempts: ${attempts}`);
            }
            
        } catch (error) {
            this.addTestResult(testName, false, `Retry mechanism test failed: ${error.message}`);
        }
    }

    async testBatchErrorHandling() {
        const testName = 'Batch Error Handling';
        console.log(`🔍 Testing: ${testName}`);
        
        try {
            // Create multiple errors
            const errors = [
                ErrorHandler.createFileError('File too large', 'document1.pdf'),
                ErrorHandler.createValidationError('Invalid format', 'format'),
                ErrorHandler.createNetworkError('Connection timeout'),
                ErrorHandler.createFileError('Corrupted file', 'document2.pdf')
            ];
            
            // Test batch error handling
            const result = errorHandlingService.handleBatchErrors(errors);
            
            // Wait for errors to be processed
            await this.wait(100);
            
            // Check if batch error notification was shown
            const notifications = document.querySelectorAll('.notification--error');
            
            if (notifications.length > 0 && result.handled && result.type === 'batch') {
                this.addTestResult(testName, true, `Batch error handling processed ${result.errorCount} errors`);
                
                // Clean up
                errorHandlingService.clearAllNotifications();
            } else {
                this.addTestResult(testName, false, 'Batch error handling failed');
            }
            
        } catch (error) {
            this.addTestResult(testName, false, `Batch error test failed: ${error.message}`);
        }
    }

    addTestResult(testName, passed, message) {
        this.testResults.push({
            name: testName,
            passed,
            message,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${message}`);
    }

    displayTestResults() {
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const failed = total - passed;
        
        console.log('\n📊 Test Results Summary:');
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
        }
        
        // Show success notification
        if (failed === 0) {
            errorHandlingService.showSuccess(`All ${total} error handling tests passed!`, {
                title: 'Tests Complete',
                duration: 5000
            });
        } else {
            errorHandlingService.showWarning(`${failed} of ${total} tests failed. Check console for details.`, {
                title: 'Tests Complete',
                duration: 8000
            });
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getTestResults() {
        return this.testResults;
    }

    isTestRunning() {
        return this.isRunning;
    }
}

// Create singleton instance
export const errorHandlingTest = new ErrorHandlingTest();

// Export for global access
window.errorHandlingTest = errorHandlingTest;