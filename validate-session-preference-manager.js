// Simple validation script for SessionPreferenceManager
import { SessionPreferenceManager } from './js/utils/session-preference-manager.js';

console.log('SessionPreferenceManager validation starting...');

try {
    // Test basic functionality
    console.log('Testing basic functionality...');
    
    // Test constants
    console.log('DEFAULT_PREFERENCE_KEY:', SessionPreferenceManager.DEFAULT_PREFERENCE_KEY);
    console.log('VALID_MODES:', SessionPreferenceManager.VALID_MODES);
    console.log('DEFAULT_MODE:', SessionPreferenceManager.DEFAULT_MODE);
    
    // Test mode validation
    console.log('Testing mode validation...');
    console.log('isValidMode("single"):', SessionPreferenceManager.isValidMode('single'));
    console.log('isValidMode("batch"):', SessionPreferenceManager.isValidMode('batch'));
    console.log('isValidMode("invalid"):', SessionPreferenceManager.isValidMode('invalid'));
    
    // Test session storage availability
    console.log('Testing session storage availability...');
    console.log('isSessionStorageAvailable():', SessionPreferenceManager.isSessionStorageAvailable());
    
    // Test default mode
    console.log('Testing default mode...');
    console.log('getDefaultMode():', SessionPreferenceManager.getDefaultMode());
    console.log('getDefaultMode("batch"):', SessionPreferenceManager.getDefaultMode('batch'));
    
    // Test preference enabled check
    console.log('Testing preference enabled check...');
    console.log('isPreferenceEnabled(true):', SessionPreferenceManager.isPreferenceEnabled(true));
    console.log('isPreferenceEnabled(false):', SessionPreferenceManager.isPreferenceEnabled(false));
    console.log('isPreferenceEnabled("true"):', SessionPreferenceManager.isPreferenceEnabled('true'));
    
    // Test mode resolution
    console.log('Testing mode resolution...');
    const resolution1 = SessionPreferenceManager.resolveInitialMode({});
    console.log('resolveInitialMode({}):', resolution1);
    
    const resolution2 = SessionPreferenceManager.resolveInitialMode({ 
        multipleAttribute: true 
    });
    console.log('resolveInitialMode({ multipleAttribute: true }):', resolution2);
    
    const resolution3 = SessionPreferenceManager.resolveInitialMode({ 
        defaultMode: 'batch' 
    });
    console.log('resolveInitialMode({ defaultMode: "batch" }):', resolution3);
    
    console.log('SessionPreferenceManager validation completed successfully!');
    
} catch (error) {
    console.error('SessionPreferenceManager validation failed:', error);
}