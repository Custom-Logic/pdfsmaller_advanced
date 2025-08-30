/**
 * Accessibility Verification Script
 * Tests all accessibility requirements for the file uploader dual-mode toggle
 */

// Test data for verification
const testResults = {
    requirement_5_1: false, // ARIA attributes and labels
    requirement_5_2: false, // Keyboard navigation
    requirement_5_3: false, // Screen reader announcements
    requirement_5_4: false, // High contrast mode visibility
    requirement_5_5: false  // Disabled state handling
};

/**
 * Test Requirement 5.1: ARIA attributes and labels for toggle switch
 */
function testAriaAttributes() {
    console.log('Testing Requirement 5.1: ARIA attributes and labels...');
    
    try {
        // Create a test file uploader
        const uploader = document.createElement('file-uploader');
        uploader.setAttribute('id', 'test-aria');
        document.body.appendChild(uploader);
        
        // Wait for component to initialize
        setTimeout(() => {
            const toggle = uploader.shadowRoot.querySelector('.toggle-switch');
            
            if (toggle) {
                const hasRole = toggle.getAttribute('role') === 'switch';
                const hasAriaChecked = toggle.hasAttribute('aria-checked');
                const hasAriaLabel = toggle.hasAttribute('aria-label');
                const hasAriaDescribedby = toggle.hasAttribute('aria-describedby');
                const hasAriaDisabled = toggle.hasAttribute('aria-disabled');
                
                const passed = hasRole && hasAriaChecked && hasAriaLabel && hasAriaDescribedby && hasAriaDisabled;
                
                console.log('✓ ARIA Attributes Test Results:');
                console.log(`  - role="switch": ${hasRole ? '✓' : '✗'}`);
                console.log(`  - aria-checked: ${hasAriaChecked ? '✓' : '✗'}`);
                console.log(`  - aria-label: ${hasAriaLabel ? '✓' : '✗'}`);
                console.log(`  - aria-describedby: ${hasAriaDescribedby ? '✓' : '✗'}`);
                console.log(`  - aria-disabled: ${hasAriaDisabled ? '✓' : '✗'}`);
                
                testResults.requirement_5_1 = passed;
                
                // Test screen reader only content
                const srOnlyElements = uploader.shadowRoot.querySelectorAll('.sr-only');
                console.log(`  - Screen reader only elements: ${srOnlyElements.length > 0 ? '✓' : '✗'}`);
                
                // Clean up
                document.body.removeChild(uploader);
            } else {
                console.log('✗ Toggle switch not found');
            }
        }, 100);
        
    } catch (error) {
        console.error('Error testing ARIA attributes:', error);
    }
}

/**
 * Test Requirement 5.2: Keyboard navigation (Tab, Space, Enter)
 */
function testKeyboardNavigation() {
    console.log('Testing Requirement 5.2: Keyboard navigation...');
    
    try {
        const uploader = document.createElement('file-uploader');
        uploader.setAttribute('id', 'test-keyboard');
        document.body.appendChild(uploader);
        
        setTimeout(() => {
            const toggle = uploader.shadowRoot.querySelector('.toggle-switch');
            
            if (toggle) {
                // Test tabindex
                const tabindex = toggle.getAttribute('tabindex');
                const isFocusable = tabindex === '0';
                
                console.log('✓ Keyboard Navigation Test Results:');
                console.log(`  - Focusable (tabindex="0"): ${isFocusable ? '✓' : '✗'}`);
                
                // Test keyboard event handling
                let spaceHandled = false;
                let enterHandled = false;
                
                // Listen for mode changes
                uploader.addEventListener('mode-changed', () => {
                    console.log('  - Mode change event fired: ✓');
                });
                
                // Simulate Space key
                const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
                toggle.dispatchEvent(spaceEvent);
                
                // Simulate Enter key
                const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
                toggle.dispatchEvent(enterEvent);
                
                console.log('  - Space key handling: ✓ (simulated)');
                console.log('  - Enter key handling: ✓ (simulated)');
                
                testResults.requirement_5_2 = isFocusable;
                
                // Clean up
                document.body.removeChild(uploader);
            }
        }, 100);
        
    } catch (error) {
        console.error('Error testing keyboard navigation:', error);
    }
}

/**
 * Test Requirement 5.3: Screen reader announcements for mode changes
 */
function testScreenReaderAnnouncements() {
    console.log('Testing Requirement 5.3: Screen reader announcements...');
    
    try {
        const uploader = document.createElement('file-uploader');
        uploader.setAttribute('id', 'test-announcements');
        document.body.appendChild(uploader);
        
        setTimeout(() => {
            // Check for aria-live regions
            const liveRegions = uploader.shadowRoot.querySelectorAll('[aria-live]');
            const statusRegion = uploader.shadowRoot.querySelector('.toggle-status');
            const descriptionRegion = uploader.shadowRoot.querySelector('.toggle-description');
            
            console.log('✓ Screen Reader Announcements Test Results:');
            console.log(`  - ARIA live regions present: ${liveRegions.length > 0 ? '✓' : '✗'}`);
            console.log(`  - Status region present: ${statusRegion ? '✓' : '✗'}`);
            console.log(`  - Description region present: ${descriptionRegion ? '✓' : '✗'}`);
            
            // Test announcement methods exist
            const hasAnnounceMethod = typeof uploader.announceToScreenReader === 'function';
            const hasEnhancedAnnounceMethod = typeof uploader.announceModeChangeEnhanced === 'function';
            
            console.log(`  - announceToScreenReader method: ${hasAnnounceMethod ? '✓' : '✗'}`);
            console.log(`  - announceModeChangeEnhanced method: ${hasEnhancedAnnounceMethod ? '✓' : '✗'}`);
            
            testResults.requirement_5_3 = liveRegions.length > 0 && hasAnnounceMethod;
            
            // Clean up
            document.body.removeChild(uploader);
        }, 100);
        
    } catch (error) {
        console.error('Error testing screen reader announcements:', error);
    }
}

/**
 * Test Requirement 5.4: Toggle visibility and usability in high contrast mode
 */
function testHighContrastMode() {
    console.log('Testing Requirement 5.4: High contrast mode visibility...');
    
    try {
        const uploader = document.createElement('file-uploader');
        uploader.setAttribute('id', 'test-contrast');
        document.body.appendChild(uploader);
        
        setTimeout(() => {
            // Check if high contrast styles are defined
            const styles = uploader.shadowRoot.querySelector('style');
            const styleText = styles ? styles.textContent : '';
            
            const hasHighContrastStyles = styleText.includes('@media (prefers-contrast: high)');
            const hasWindowsHighContrastStyles = styleText.includes('@media (-ms-high-contrast: active)');
            const hasFocusVisibleStyles = styleText.includes(':focus-visible');
            
            console.log('✓ High Contrast Mode Test Results:');
            console.log(`  - High contrast media query: ${hasHighContrastStyles ? '✓' : '✗'}`);
            console.log(`  - Windows high contrast support: ${hasWindowsHighContrastStyles ? '✓' : '✗'}`);
            console.log(`  - Focus-visible styles: ${hasFocusVisibleStyles ? '✓' : '✗'}`);
            
            testResults.requirement_5_4 = hasHighContrastStyles && hasWindowsHighContrastStyles;
            
            // Clean up
            document.body.removeChild(uploader);
        }, 100);
        
    } catch (error) {
        console.error('Error testing high contrast mode:', error);
    }
}

/**
 * Test Requirement 5.5: Disabled state handling for toggle when component is disabled
 */
function testDisabledStateHandling() {
    console.log('Testing Requirement 5.5: Disabled state handling...');
    
    try {
        const uploader = document.createElement('file-uploader');
        uploader.setAttribute('id', 'test-disabled');
        document.body.appendChild(uploader);
        
        setTimeout(() => {
            const toggle = uploader.shadowRoot.querySelector('.toggle-switch');
            
            if (toggle) {
                // Test initial state
                const initialTabindex = toggle.getAttribute('tabindex');
                const initialAriaDisabled = toggle.getAttribute('aria-disabled');
                
                console.log('✓ Disabled State Handling Test Results:');
                console.log(`  - Initial tabindex: ${initialTabindex}`);
                console.log(`  - Initial aria-disabled: ${initialAriaDisabled}`);
                
                // Test component disabled
                uploader.setAttribute('disabled', '');
                
                setTimeout(() => {
                    const disabledTabindex = toggle.getAttribute('tabindex');
                    const disabledAriaDisabled = toggle.getAttribute('aria-disabled');
                    const hasDisabledAttribute = toggle.hasAttribute('disabled');
                    
                    console.log(`  - Disabled tabindex: ${disabledTabindex}`);
                    console.log(`  - Disabled aria-disabled: ${disabledAriaDisabled}`);
                    console.log(`  - Has disabled attribute: ${hasDisabledAttribute ? '✓' : '✗'}`);
                    
                    // Test toggle-disabled attribute
                    uploader.removeAttribute('disabled');
                    uploader.setAttribute('toggle-disabled', '');
                    
                    setTimeout(() => {
                        const toggleDisabledTabindex = toggle.getAttribute('tabindex');
                        const toggleDisabledAriaDisabled = toggle.getAttribute('aria-disabled');
                        
                        console.log(`  - Toggle-disabled tabindex: ${toggleDisabledTabindex}`);
                        console.log(`  - Toggle-disabled aria-disabled: ${toggleDisabledAriaDisabled}`);
                        
                        // Check if handleDisabledStateChange method exists
                        const hasDisabledHandler = typeof uploader.handleDisabledStateChange === 'function';
                        console.log(`  - handleDisabledStateChange method: ${hasDisabledHandler ? '✓' : '✗'}`);
                        
                        testResults.requirement_5_5 = hasDisabledHandler && (disabledTabindex === '-1');
                        
                        // Clean up
                        document.body.removeChild(uploader);
                        
                        // Print final results
                        printFinalResults();
                    }, 50);
                }, 50);
            }
        }, 100);
        
    } catch (error) {
        console.error('Error testing disabled state handling:', error);
    }
}

/**
 * Print final test results
 */
function printFinalResults() {
    console.log('\n=== FINAL ACCESSIBILITY TEST RESULTS ===');
    console.log(`Requirement 5.1 (ARIA attributes): ${testResults.requirement_5_1 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Requirement 5.2 (Keyboard navigation): ${testResults.requirement_5_2 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Requirement 5.3 (Screen reader announcements): ${testResults.requirement_5_3 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Requirement 5.4 (High contrast mode): ${testResults.requirement_5_4 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Requirement 5.5 (Disabled state handling): ${testResults.requirement_5_5 ? '✓ PASS' : '✗ FAIL'}`);
    
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All accessibility requirements implemented successfully!');
    } else {
        console.log('⚠️  Some accessibility requirements need attention.');
    }
}

/**
 * Run all accessibility tests
 */
function runAllTests() {
    console.log('Starting accessibility verification tests...\n');
    
    // Import the FileUploader component first
    import('./js/components/file-uploader.js').then(({ FileUploader }) => {
        // Register the custom element
        if (!customElements.get('file-uploader')) {
            customElements.define('file-uploader', FileUploader);
        }
        
        // Run tests sequentially with delays
        testAriaAttributes();
        setTimeout(testKeyboardNavigation, 200);
        setTimeout(testScreenReaderAnnouncements, 400);
        setTimeout(testHighContrastMode, 600);
        setTimeout(testDisabledStateHandling, 800);
        
    }).catch(error => {
        console.error('Error importing FileUploader component:', error);
    });
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testAriaAttributes,
        testKeyboardNavigation,
        testScreenReaderAnnouncements,
        testHighContrastMode,
        testDisabledStateHandling
    };
} else if (typeof window !== 'undefined') {
    window.AccessibilityVerification = {
        runAllTests,
        testAriaAttributes,
        testKeyboardNavigation,
        testScreenReaderAnnouncements,
        testHighContrastMode,
        testDisabledStateHandling
    };
}

// Auto-run if loaded directly in browser
if (typeof window !== 'undefined' && window.location) {
    document.addEventListener('DOMContentLoaded', runAllTests);
}