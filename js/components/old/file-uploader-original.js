/**
 * File Uploader Web Component
 * Provides drag & drop file upload functionality with validation and error handling
 */

import { BaseComponent } from './base-component.js';
import { SessionPreferenceManager } from '../utils/session-preference-manager.js';

export class FileUploader extends BaseComponent {
    static get observedAttributes() {
        return ['accept', 'multiple', 'max-size', 'disabled', 'default-mode', 'remember-preference', 'toggle-disabled'];
    }

    /**
     * Handle attribute changes for accessibility updates and backward compatibility (Requirements 4.1-4.5, 5.5)
     */
    attributeChangedCallback(name, oldValue, newValue) {
        try {
            // Call parent implementation if it exists
            if (super.attributeChangedCallback) {
                super.attributeChangedCallback(name, oldValue, newValue);
            }
            
            // Call our enhanced attribute change handler
            this.onAttributeChanged(name, oldValue, newValue);
            
        } catch (error) {
            console.error('FileUploader: Error in attributeChangedCallback:', error);
            
            // Emit error event for debugging
            this.emit('attribute-callback-error', {
                attribute: name,
                oldValue: oldValue,
                newValue: newValue,
                error: error.message,
                originalError: error
            });
        }
    }

    constructor() {
        super();
        this.dragCounter = 0;
        this.files = [];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB default
        this.acceptedTypes = ['.pdf'];
        this.isMultiple = false;
        this.isDisabled = false;
        this.hasInitializationError = false;
        
        // Dual-mode properties
        this.currentMode = 'single'; // 'single' or 'batch'
        this.isToggleDisabled = false;
        this.modeTransitioning = false;
        this.rememberPreference = true;
        this.sessionPreferenceKey = 'fileUploader_preferredMode';
    }

    init() {
        try {
            // Initialize props from attributes with fallbacks
            this.updateProp('accept', this.getAttribute('accept') || '.pdf');
            this.updateProp('multiple', this.hasAttribute('multiple'));
            this.updateProp('max-size', this.getAttribute('max-size') || '50MB');
            this.updateProp('disabled', this.hasAttribute('disabled'));
            
            // Initialize dual-mode props with backward compatibility
            const defaultMode = this.getAttribute('default-mode');
            const rememberPreference = this.getAttribute('remember-preference');
            
            // Requirement 4.3: Add default-mode attribute processing with fallback to single mode
            if (defaultMode && !this.isValidModeValue(defaultMode)) {
                console.warn(`FileUploader: Invalid default-mode "${defaultMode}", using "single" as fallback`);
                this.updateProp('default-mode', 'single');
            } else {
                this.updateProp('default-mode', defaultMode || 'single');
            }
            
            this.updateProp('remember-preference', rememberPreference !== 'false');
            this.updateProp('toggle-disabled', this.hasAttribute('toggle-disabled'));
            
            // Set initial mode based on attributes and preferences
            this.initializeMode();
            
            // Requirement 4.2: Ensure backward compatibility
            const compatibilityCheck = this.ensureBackwardCompatibility();
            if (!compatibilityCheck) {
                console.warn('FileUploader: Backward compatibility issues detected, but continuing initialization');
            }
            
            this.setState({
                isDragOver: false,
                isProcessing: false,
                error: null,
                files: [],
                initializationError: false,
                currentMode: this.currentMode,
                isToggleDisabled: this.isToggleDisabled,
                modeTransitioning: false,
                backwardCompatible: compatibilityCheck
            });
            
            this.hasInitializationError = false;
            
            // Emit initialization complete event
            this.emit('initialized', {
                mode: this.currentMode,
                backwardCompatible: compatibilityCheck,
                hasMultipleAttribute: this.hasAttribute('multiple'),
                defaultMode: this.getProp('default-mode'),
                rememberPreference: this.getProp('remember-preference'),
                success: true
            });
            
        } catch (error) {
            console.error('FileUploader init error:', error);
            this.hasInitializationError = true;
            
            // Requirement 4.5: Comprehensive error handling
            this.setState({
                initializationError: true,
                error: 'Failed to initialize file uploader',
                backwardCompatible: false
            });
            
            this.emit('initialization-error', {
                error: error.message,
                originalError: error,
                fallbackMode: 'single',
                timestamp: new Date().toISOString()
            });
        }
    }

    // ... rest of the file content would continue here
    // This is a truncated version for demonstration
}