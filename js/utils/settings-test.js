/**
 * Settings Panel Test Utilities
 * Provides testing functions for the modern settings panel
 */

export class SettingsTest {
    constructor() {
        this.testResults = [];
    }

    /**
     * Run all tests for the settings panel
     * @param {HTMLElement} settingsPanel - The settings panel element
     * @returns {Object} Test results
     */
    async runAllTests(settingsPanel) {
        console.log('🧪 Starting Settings Panel Tests...');
        
        this.testResults = [];
        
        // Test 1: Component initialization
        await this.testComponentInitialization(settingsPanel);
        
        // Test 2: Settings state management
        await this.testSettingsState(settingsPanel);
        
        // Test 3: Mode toggle functionality
        await this.testModeToggle(settingsPanel);
        
        // Test 4: Slider functionality
        await this.testSliderFunctionality(settingsPanel);
        
        // Test 5: Dropdown functionality
        await this.testDropdownFunctionality(settingsPanel);
        
        // Test 6: Checkbox functionality
        await this.testCheckboxFunctionality(settingsPanel);
        
        // Test 7: Pro access handling
        await this.testProAccessHandling(settingsPanel);
        
        // Test 8: State persistence
        await this.testStatePersistence(settingsPanel);
        
        return this.generateTestReport();
    }

    /**
     * Test component initialization
     */
    async testComponentInitialization(settingsPanel) {
        const testName = 'Component Initialization';
        
        try {
            // Check if component is defined
            const isCustomElement = settingsPanel instanceof HTMLElement;
            this.assert(isCustomElement, 'Settings panel is a custom element');
            
            // Check if shadow DOM is created
            const hasShadowRoot = !!settingsPanel.shadowRoot;
            this.assert(hasShadowRoot, 'Shadow DOM is created');
            
            // Check if required elements exist
            const shadow = settingsPanel.shadowRoot;
            const requiredElements = [
                'singleMode',
                'bulkMode', 
                'compressionLevel',
                'imageQuality',
                'serverProcessing'
            ];
            
            for (const elementId of requiredElements) {
                const element = shadow.getElementById(elementId);
                this.assert(!!element, `Required element ${elementId} exists`);
            }
            
            this.addTestResult(testName, true, 'All initialization checks passed');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test settings state management
     */
    async testSettingsState(settingsPanel) {
        const testName = 'Settings State Management';
        
        try {
            // Test getting initial settings
            const initialSettings = settingsPanel.getSettings();
            this.assert(typeof initialSettings === 'object', 'getSettings returns object');
            this.assert('compressionLevel' in initialSettings, 'Has compressionLevel');
            this.assert('imageQuality' in initialSettings, 'Has imageQuality');
            this.assert('useServerProcessing' in initialSettings, 'Has useServerProcessing');
            this.assert('processingMode' in initialSettings, 'Has processingMode');
            
            // Test setting new settings
            const newSettings = {
                compressionLevel: 'high',
                imageQuality: 85,
                useServerProcessing: true,
                processingMode: 'single'
            };
            
            settingsPanel.setSettings(newSettings);
            const updatedSettings = settingsPanel.getSettings();
            
            this.assert(updatedSettings.compressionLevel === 'high', 'Compression level updated');
            this.assert(updatedSettings.imageQuality === 85, 'Image quality updated');
            this.assert(updatedSettings.useServerProcessing === true, 'Server processing updated');
            
            this.addTestResult(testName, true, 'Settings state management works correctly');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test mode toggle functionality
     */
    async testModeToggle(settingsPanel) {
        const testName = 'Mode Toggle Functionality';
        
        try {
            const shadow = settingsPanel.shadowRoot;
            const singleMode = shadow.getElementById('singleMode');
            const bulkMode = shadow.getElementById('bulkMode');
            
            // Test initial state
            this.assert(singleMode.classList.contains('active'), 'Single mode is initially active');
            this.assert(!bulkMode.classList.contains('active'), 'Bulk mode is initially inactive');
            
            // Test clicking single mode (should stay active)
            singleMode.click();
            await this.wait(100);
            
            const settings = settingsPanel.getSettings();
            this.assert(settings.processingMode === 'single', 'Single mode is set correctly');
            
            this.addTestResult(testName, true, 'Mode toggle functionality works');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test slider functionality
     */
    async testSliderFunctionality(settingsPanel) {
        const testName = 'Slider Functionality';
        
        try {
            const shadow = settingsPanel.shadowRoot;
            const slider = shadow.getElementById('imageQuality');
            const valueDisplay = shadow.getElementById('qualityValue');
            
            // Test initial value
            const initialValue = parseInt(slider.value);
            this.assert(initialValue >= 10 && initialValue <= 100, 'Initial slider value is valid');
            this.assert(valueDisplay.textContent === `${initialValue}%`, 'Value display matches slider');
            
            // Test changing slider value
            slider.value = 90;
            slider.dispatchEvent(new Event('input'));
            await this.wait(100);
            
            this.assert(valueDisplay.textContent === '90%', 'Value display updates on slider change');
            
            const settings = settingsPanel.getSettings();
            this.assert(settings.imageQuality === 90, 'Settings updated with new slider value');
            
            this.addTestResult(testName, true, 'Slider functionality works correctly');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test dropdown functionality
     */
    async testDropdownFunctionality(settingsPanel) {
        const testName = 'Dropdown Functionality';
        
        try {
            const shadow = settingsPanel.shadowRoot;
            const dropdown = shadow.getElementById('compressionLevel');
            
            // Test initial value
            const initialValue = dropdown.value;
            this.assert(['low', 'medium', 'high', 'maximum'].includes(initialValue), 'Initial dropdown value is valid');
            
            // Test changing dropdown value
            dropdown.value = 'high';
            dropdown.dispatchEvent(new Event('change'));
            await this.wait(100);
            
            const settings = settingsPanel.getSettings();
            this.assert(settings.compressionLevel === 'high', 'Settings updated with new dropdown value');
            
            this.addTestResult(testName, true, 'Dropdown functionality works correctly');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test checkbox functionality
     */
    async testCheckboxFunctionality(settingsPanel) {
        const testName = 'Checkbox Functionality';
        
        try {
            const shadow = settingsPanel.shadowRoot;
            const checkbox = shadow.getElementById('serverProcessing');
            
            // Test initial state
            const initialChecked = checkbox.checked;
            this.assert(typeof initialChecked === 'boolean', 'Checkbox has boolean state');
            
            // Test toggling checkbox
            checkbox.checked = !initialChecked;
            checkbox.dispatchEvent(new Event('change'));
            await this.wait(100);
            
            const settings = settingsPanel.getSettings();
            this.assert(settings.useServerProcessing === !initialChecked, 'Settings updated with checkbox state');
            
            this.addTestResult(testName, true, 'Checkbox functionality works correctly');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test Pro access handling
     */
    async testProAccessHandling(settingsPanel) {
        const testName = 'Pro Access Handling';
        
        try {
            // Test Pro upgrade event
            let proUpgradeTriggered = false;
            const proUpgradeHandler = (event) => {
                proUpgradeTriggered = true;
                this.assert(event.detail.feature === 'bulk-processing', 'Correct feature in Pro upgrade event');
            };
            
            document.addEventListener('show-pro-upgrade', proUpgradeHandler);
            
            // Try to click bulk mode (should trigger Pro upgrade)
            const shadow = settingsPanel.shadowRoot;
            const bulkMode = shadow.getElementById('bulkMode');
            bulkMode.click();
            await this.wait(100);
            
            this.assert(proUpgradeTriggered, 'Pro upgrade event was triggered');
            
            document.removeEventListener('show-pro-upgrade', proUpgradeHandler);
            
            this.addTestResult(testName, true, 'Pro access handling works correctly');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Test state persistence
     */
    async testStatePersistence(settingsPanel) {
        const testName = 'State Persistence';
        
        try {
            // Set some test settings
            const testSettings = {
                compressionLevel: 'maximum',
                imageQuality: 50,
                useServerProcessing: false,
                processingMode: 'single'
            };
            
            settingsPanel.setSettings(testSettings);
            
            // Check if settings are saved to localStorage
            const savedSettings = localStorage.getItem('pdfsmaller_modern_settings');
            this.assert(!!savedSettings, 'Settings are saved to localStorage');
            
            const parsedSettings = JSON.parse(savedSettings);
            this.assert(parsedSettings.compressionLevel === 'maximum', 'Compression level persisted');
            this.assert(parsedSettings.imageQuality === 50, 'Image quality persisted');
            
            this.addTestResult(testName, true, 'State persistence works correctly');
        } catch (error) {
            this.addTestResult(testName, false, error.message);
        }
    }

    /**
     * Add a test result
     */
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

    /**
     * Assert a condition
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    /**
     * Wait for a specified time
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.passed).length;
        const failedTests = totalTests - passedTests;
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0
            },
            results: this.testResults
        };
        
        console.log('📊 Test Report:');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${report.summary.successRate}%`);
        
        return report;
    }
}

// Export for use in tests
export const settingsTest = new SettingsTest();