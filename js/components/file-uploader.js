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

    /**
     * Initialize the mode based on attributes, session preference, and existing multiple attribute
     * Uses SessionPreferenceManager for centralized preference handling
     * Implements backward compatibility requirements 4.1, 4.2, 4.3, 4.4, 4.5
     */
    initializeMode() {
        try {
            // Enhanced backward compatibility logic
            const multipleAttribute = this.hasAttribute('multiple');
            const defaultModeAttribute = this.getAttribute('default-mode');
            const rememberPreference = this.getProp('remember-preference', true);
            
            // Requirement 4.1: Set initial toggle state based on existing 'multiple' attribute
            let initialMode = 'single'; // Default fallback
            
            // Requirement 4.2: Process existing 'multiple' attribute for backward compatibility
            if (multipleAttribute) {
                initialMode = 'batch';
                console.log('FileUploader: Initial mode set to "batch" based on existing multiple attribute');
            }
            
            // Requirement 4.3: Add default-mode attribute processing with fallback to single mode
            if (defaultModeAttribute) {
                if (this.isValidModeValue(defaultModeAttribute)) {
                    initialMode = defaultModeAttribute;
                    console.log(`FileUploader: Initial mode set to "${defaultModeAttribute}" based on default-mode attribute`);
                } else {
                    // Requirement 4.5: Comprehensive error handling for invalid mode values
                    console.warn(`FileUploader: Invalid default-mode value "${defaultModeAttribute}". Falling back to single mode.`);
                    this.emit('mode-initialization-error', {
                        error: 'invalid_default_mode',
                        invalidValue: defaultModeAttribute,
                        fallbackMode: 'single',
                        message: `Invalid default-mode "${defaultModeAttribute}". Must be "single" or "batch".`
                    });
                    initialMode = 'single';
                }
            }
            
            // Use SessionPreferenceManager to resolve final mode with enhanced error handling
            let resolvedMode;
            try {
                resolvedMode = SessionPreferenceManager.resolveInitialMode({
                    defaultMode: initialMode,
                    rememberPreference: rememberPreference,
                    multipleAttribute: multipleAttribute,
                    preferenceKey: this.sessionPreferenceKey
                });
            } catch (sessionError) {
                console.error('FileUploader: Error resolving mode with SessionPreferenceManager:', sessionError);
                resolvedMode = initialMode; // Use our calculated initial mode as fallback
                
                this.emit('mode-initialization-error', {
                    error: 'session_preference_error',
                    fallbackMode: resolvedMode,
                    originalError: sessionError,
                    message: 'Failed to load session preference. Using default mode.'
                });
            }
            
            // Validate resolved mode before setting
            if (!this.isValidModeValue(resolvedMode)) {
                console.error(`FileUploader: Invalid resolved mode "${resolvedMode}". Falling back to single mode.`);
                resolvedMode = 'single';
                
                this.emit('mode-initialization-error', {
                    error: 'invalid_resolved_mode',
                    invalidValue: resolvedMode,
                    fallbackMode: 'single',
                    message: 'Mode resolution failed. Using single mode as fallback.'
                });
            }
            
            // Set initial mode
            this.currentMode = resolvedMode;
            this.isToggleDisabled = this.getProp('toggle-disabled', false);
            
            // Update multiple attribute to match resolved mode (maintains consistency)
            this.updateMultipleAttribute();
            
            // Emit initialization success event
            this.emit('mode-initialized', {
                initialMode: resolvedMode,
                basedOnMultipleAttribute: multipleAttribute,
                basedOnDefaultMode: defaultModeAttribute,
                sessionPreferenceUsed: rememberPreference,
                success: true
            });
            
        } catch (error) {
            console.error('FileUploader: Critical error initializing mode:', error);
            
            // Requirement 4.5: Comprehensive error handling - use safe fallback
            this.currentMode = 'single';
            this.isToggleDisabled = false;
            
            this.emit('mode-initialization-error', {
                error: 'critical_initialization_error',
                fallbackMode: 'single',
                originalError: error,
                message: 'Critical error during mode initialization. Using single mode.'
            });
            
            // Still try to update multiple attribute for consistency
            try {
                this.updateMultipleAttribute();
            } catch (updateError) {
                console.error('FileUploader: Failed to update multiple attribute after error:', updateError);
            }
        }
    }

    /**
     * Load mode preference from session storage using SessionPreferenceManager
     * @returns {string|null} The saved mode preference or null
     */
    loadSessionPreference() {
        try {
            return SessionPreferenceManager.loadPreference(this.sessionPreferenceKey);
        } catch (error) {
            console.warn('Could not load session preference:', error);
            return null;
        }
    }

    /**
     * Save mode preference to session storage using SessionPreferenceManager
     * @param {string} mode - The mode to save
     */
    saveSessionPreference(mode) {
        try {
            if (this.getProp('remember-preference', true)) {
                SessionPreferenceManager.savePreference(mode, this.sessionPreferenceKey);
            }
        } catch (error) {
            console.warn('Could not save session preference:', error);
        }
    }

    /**
     * Update the multiple attribute based on current mode
     * This ensures the file input element respects current mode limitations
     * Enhanced for backward compatibility (Requirements 4.1, 4.2, 4.4)
     */
    updateMultipleAttribute() {
        try {
            const shouldBeMultiple = this.currentMode === 'batch';
            const currentMultiple = this.getProp('multiple', false);
            
            // Requirement 4.1: Ensure multiple attribute reflects current mode
            this.updateProp('multiple', shouldBeMultiple);
            
            // Update the file input element if it exists
            const fileInput = this.$('.file-input');
            if (fileInput) {
                if (shouldBeMultiple) {
                    fileInput.setAttribute('multiple', '');
                } else {
                    fileInput.removeAttribute('multiple');
                }
                
                // Also update accept attribute to ensure consistency
                const acceptValue = this.getProp('accept', '.pdf');
                fileInput.setAttribute('accept', acceptValue);
                
                // Emit event if multiple attribute actually changed
                if (currentMultiple !== shouldBeMultiple) {
                    // Requirement 4.4: Maintain existing event names and data structures
                    this.emit('multiple-attribute-updated', {
                        oldValue: currentMultiple,
                        newValue: shouldBeMultiple,
                        mode: this.currentMode,
                        reason: 'mode-sync',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            console.error('FileUploader: Error updating multiple attribute:', error);
            
            // Requirement 4.5: Comprehensive error handling
            this.emit('multiple-attribute-error', {
                error: 'update_failed',
                currentMode: this.currentMode,
                message: error.message,
                originalError: error
            });
        }
    }

    /**
     * Ensure backward compatibility by maintaining all existing methods
     * Requirement 4.2: All existing component methods continue to work unchanged
     */
    ensureBackwardCompatibility() {
        try {
            // Verify all expected methods exist
            const compatibilityCheck = this.verifyBackwardCompatibility();
            
            if (!compatibilityCheck.compatible) {
                console.error('FileUploader: Backward compatibility check failed:', compatibilityCheck);
                
                this.emit('compatibility-error', {
                    error: 'missing_methods',
                    missingMethods: compatibilityCheck.missingMethods,
                    availableMethods: compatibilityCheck.availableMethods,
                    message: 'Some expected methods are missing'
                });
                
                return false;
            }
            
            // Emit compatibility success event
            this.emit('compatibility-verified', {
                success: true,
                methodCount: compatibilityCheck.totalAvailable,
                methods: compatibilityCheck.availableMethods
            });
            
            return true;
        } catch (error) {
            console.error('FileUploader: Error ensuring backward compatibility:', error);
            
            this.emit('compatibility-error', {
                error: 'verification_failed',
                message: error.message,
                originalError: error
            });
            
            return false;
        }
    }

    /**
     * Handle legacy API calls for backward compatibility
     * @param {string} methodName - Name of the method being called
     * @param {Array} args - Arguments passed to the method
     * @returns {*} Result of the method call
     */
    handleLegacyApiCall(methodName, args = []) {
        try {
            // Log legacy API usage for monitoring
            console.log(`FileUploader: Legacy API call: ${methodName}`, args);
            
            // Emit event for tracking legacy usage
            this.emit('legacy-api-used', {
                method: methodName,
                arguments: args,
                timestamp: new Date().toISOString()
            });
            
            // Call the actual method
            if (typeof this[methodName] === 'function') {
                return this[methodName].apply(this, args);
            } else {
                throw new Error(`Method ${methodName} not found`);
            }
        } catch (error) {
            console.error(`FileUploader: Error in legacy API call ${methodName}:`, error);
            
            this.emit('legacy-api-error', {
                method: methodName,
                arguments: args,
                error: error.message,
                originalError: error
            });
            
            throw error;
        }
    }

    /**
     * Get the current mode (Requirement 7.3)
     * @returns {string} Current mode ('single' or 'batch')
     */
    getMode() {
        return this.currentMode;
    }

    /**
     * Set the mode programmatically (Requirements 7.1, 7.2)
     * Enhanced for backward compatibility (Requirements 4.2, 4.4, 4.5)
     * @param {string} mode - The mode to set ('single' or 'batch')
     * @returns {boolean} True if mode was changed successfully
     */
    setMode(mode) {
        try {
            // Requirement 4.5: Comprehensive error handling for invalid mode values
            if (!this.isValidModeValue(mode)) {
                console.error('FileUploader: Invalid mode:', mode);
                
                // Requirement 4.4: Maintain existing event names and data structures
                this.emit('mode-change-error', {
                    error: 'invalid_mode',
                    requestedMode: mode,
                    currentMode: this.currentMode,
                    message: 'Mode must be either "single" or "batch"',
                    validModes: ['single', 'batch'],
                    timestamp: new Date().toISOString()
                });
                return false;
            }

            // Check if mode change is allowed
            if (this.isToggleDisabled || this.modeTransitioning) {
                console.warn('FileUploader: Cannot change mode - toggle disabled or transitioning');
                
                this.emit('mode-change-error', {
                    error: 'mode_change_blocked',
                    requestedMode: mode,
                    currentMode: this.currentMode,
                    message: 'Mode change is currently disabled or in progress',
                    isToggleDisabled: this.isToggleDisabled,
                    modeTransitioning: this.modeTransitioning,
                    timestamp: new Date().toISOString()
                });
                return false;
            }

            // If already in the requested mode, return success (no change needed)
            if (this.currentMode === mode) {
                console.log(`FileUploader: Already in ${mode} mode, no change needed`);
                return true;
            }

            // Store old mode for event data
            const oldMode = this.currentMode;

            // Perform the mode switch
            const success = this.switchMode(mode, 'programmatic');
            
            // Update toggle UI state if mode change was successful (Requirement 7.4)
            if (success) {
                this.updateToggleUIState();
                
                // Requirement 4.4: Maintain existing event names and data structures
                // Emit additional backward compatibility event
                this.emit('mode-set', {
                    oldMode: oldMode,
                    newMode: mode,
                    success: true,
                    method: 'programmatic',
                    timestamp: new Date().toISOString()
                });
                
                console.log(`FileUploader: Mode successfully changed from ${oldMode} to ${mode}`);
            } else {
                console.error(`FileUploader: Failed to change mode from ${oldMode} to ${mode}`);
            }
            
            return success;
        } catch (error) {
            console.error('FileUploader: Exception in setMode:', error);
            
            // Requirement 4.5: Comprehensive error handling
            this.emit('mode-change-error', {
                error: 'exception',
                requestedMode: mode,
                currentMode: this.currentMode,
                message: error.message,
                exception: error,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }

    /**
     * Update toggle UI state to reflect current mode (Requirement 7.4)
     * This ensures programmatic changes update the toggle UI correctly
     */
    updateToggleUIState() {
        try {
            const toggleSwitch = this.$('.toggle-switch');
            if (toggleSwitch) {
                const modeConfig = this.getModeConfig();
                const isDisabled = this.isToggleDisabledState();
                
                // Update ARIA attributes (Requirement 5.1)
                toggleSwitch.setAttribute('aria-checked', this.currentMode === 'batch');
                toggleSwitch.setAttribute('aria-pressed', this.currentMode === 'batch');
                toggleSwitch.setAttribute('aria-disabled', isDisabled.toString());
                toggleSwitch.setAttribute('data-mode', this.currentMode);
                
                // Update aria-label with current state
                const newAriaLabel = `Toggle between single file and batch files mode. Currently ${modeConfig.label} mode.`;
                toggleSwitch.setAttribute('aria-label', newAriaLabel);
                
                // Update title for tooltip
                const newTitle = isDisabled 
                    ? 'Toggle is disabled' 
                    : `Switch to ${this.currentMode === 'single' ? 'batch' : 'single'} mode`;
                toggleSwitch.setAttribute('title', newTitle);
                
                // Update visual state classes
                const toggleContainer = this.$('.mode-toggle');
                if (toggleContainer) {
                    toggleContainer.className = toggleContainer.className
                        .replace(/mode-(single|batch)/g, '')
                        .trim() + ` mode-${this.currentMode}`;
                }
                
                // Update label active states and aria-hidden attributes
                const singleLabel = this.$('.toggle-label-single');
                const batchLabel = this.$('.toggle-label-batch');
                
                if (singleLabel) {
                    if (this.currentMode === 'single') {
                        singleLabel.classList.add('active');
                        singleLabel.setAttribute('aria-hidden', 'false');
                    } else {
                        singleLabel.classList.remove('active');
                        singleLabel.setAttribute('aria-hidden', 'true');
                    }
                }
                
                if (batchLabel) {
                    if (this.currentMode === 'batch') {
                        batchLabel.classList.add('active');
                        batchLabel.setAttribute('aria-hidden', 'false');
                    } else {
                        batchLabel.classList.remove('active');
                        batchLabel.setAttribute('aria-hidden', 'true');
                    }
                }
                
                // Update toggle description with live region
                const toggleDescription = this.$('.toggle-description');
                if (toggleDescription) {
                    toggleDescription.textContent = modeConfig.description;
                }
                
                // Update status region for screen readers
                this.updateToggleStatusRegion();
            }
        } catch (error) {
            console.error('Error updating toggle UI state:', error);
        }
    }

    /**
     * Switch between modes with proper state management and file adaptation
     * @param {string} newMode - The mode to switch to ('single' or 'batch')
     * @param {string} triggeredBy - What triggered the mode change ('programmatic', 'click', 'keyboard')
     * @returns {boolean} True if mode was switched successfully
     */
    switchMode(newMode, triggeredBy = 'programmatic') {
        try {
            if (newMode !== 'single' && newMode !== 'batch') {
                console.error('Invalid mode for switch:', newMode);
                return false;
            }

            if (this.isToggleDisabled || this.modeTransitioning) {
                return false;
            }

            const oldMode = this.currentMode;
            if (oldMode === newMode) {
                return true;
            }

            // Start mode transition with animation
            this.modeTransitioning = true;
            this.setState({ modeTransitioning: true });

            // Add transitioning class for animations
            this.classList.add('mode-transitioning');

            // Adapt files for the new mode
            const originalFiles = this.getState('files') || [];
            const adaptedFiles = this.adaptFilesForMode(newMode);

            // Update mode state
            this.currentMode = newMode;
            this.updateMultipleAttribute();

            // Update component state with new mode
            this.setState({
                currentMode: newMode,
                files: adaptedFiles
            });

            // Save preference using SessionPreferenceManager
            SessionPreferenceManager.handleModeChange(newMode, {
                rememberPreference: this.getProp('remember-preference', true),
                preferenceKey: this.sessionPreferenceKey
            });

            // Emit mode change event with proper event data structure (Requirement 7.5)
            const modeChangeData = {
                oldMode,
                newMode,
                filesAffected: adaptedFiles.length,
                originalFileCount: originalFiles.length,
                adaptedFileCount: adaptedFiles.length,
                timestamp: new Date(),
                triggeredBy, // Indicates what triggered the mode change
                component: this,
                success: true
            };
            
            this.emit('mode-changed', modeChangeData);

            // If files were adapted, emit files-adapted event
            if (originalFiles.length !== adaptedFiles.length) {
                this.emit('files-adapted', {
                    originalFiles,
                    adaptedFiles,
                    mode: newMode,
                    reason: 'mode-switch'
                });
            }

            // End mode transition after animation completes
            setTimeout(() => {
                this.modeTransitioning = false;
                this.setState({ modeTransitioning: false });
                this.classList.remove('mode-transitioning');
            }, 500); // Match the CSS animation duration

            return true;
        } catch (error) {
            console.error('Error switching mode:', error);
            this.modeTransitioning = false;
            this.setState({ modeTransitioning: false });
            this.classList.remove('mode-transitioning');
            return false;
        }
    }

    /**
     * Adapt files when switching modes
     * @param {string} mode - The target mode
     * @returns {Array} Adapted files array
     */
    adaptFilesForMode(mode) {
        try {
            const currentFiles = this.getState('files') || [];
            
            if (mode === 'single') {
                // Keep only the first file when switching to single mode (Requirement 3.4)
                return currentFiles.length > 0 ? [currentFiles[0]] : [];
            } else if (mode === 'batch') {
                // Preserve all files when switching to batch mode (Requirement 3.5)
                return [...currentFiles];
            }
            
            return currentFiles;
        } catch (error) {
            console.error('Error adapting files for mode:', error);
            return [];
        }
    }

    /**
     * Validate and adapt files based on current mode before processing
     * @param {Array} files - Files to validate and adapt
     * @param {string} source - Source of files ('selection' or 'drop')
     * @returns {Array} Adapted files array that respects current mode limitations
     */
    adaptFilesForCurrentMode(files, source = 'selection') {
        try {
            if (!Array.isArray(files) || files.length === 0) {
                return [];
            }

            const currentMode = this.getMode();
            
            if (currentMode === 'single') {
                // In single file mode, only accept one file
                if (source === 'drop') {
                    // For drag and drop (Requirement 3.2): take the first file
                    return [files[0]];
                } else {
                    // For file selection (Requirement 3.1): take the last selected file
                    return [files[files.length - 1]];
                }
            } else if (currentMode === 'batch') {
                // In batch mode, accept all files (Requirement 3.3)
                return [...files];
            }
            
            return files;
        } catch (error) {
            console.error('Error adapting files for current mode:', error);
            return [];
        }
    }

    /**
     * Validate files against current mode limitations
     * @param {Array} files - Files to validate
     * @param {string} source - Source of files ('selection' or 'drop')
     * @returns {Object} Validation result with adapted files and warnings
     */
    validateFilesForMode(files, source = 'selection') {
        try {
            const currentMode = this.getMode();
            const originalCount = files.length;
            const adaptedFiles = this.adaptFilesForCurrentMode(files, source);
            const warnings = [];

            // Generate warnings when files are adapted due to mode limitations
            if (currentMode === 'single' && originalCount > 1) {
                const selectedFile = source === 'drop' ? 'first' : 'last';
                warnings.push(`Only one file allowed in single file mode. Selected the ${selectedFile} file from ${originalCount} files.`);
            }

            return {
                adaptedFiles,
                warnings,
                filesAdapted: originalCount !== adaptedFiles.length
            };
        } catch (error) {
            console.error('Error validating files for mode:', error);
            return {
                adaptedFiles: files,
                warnings: [],
                filesAdapted: false
            };
        }
    }

    getTemplate() {
        // If we have initialization errors, show fallback
        if (this.hasInitializationError) {
            return this.getFallbackTemplate();
        }

        try {
            const state = this.getState() || {};
            const isDisabled = this.getProp('disabled', false);
            const isProcessing = state.isProcessing || false;
            const multiple = this.getProp('multiple', false);
            
            const uploaderClasses = [
                'file-uploader',
                state.isDragOver ? 'drag-over' : '',
                isDisabled ? 'disabled' : '',
                isProcessing ? 'processing' : '',
                state.modeTransitioning ? 'mode-transitioning' : '',
                `mode-${this.currentMode}`
            ].filter(Boolean).join(' ');
            
            return `
                <div class="${uploaderClasses}">
                    ${this.renderToggleSwitch()}
                    
                    <div class="upload-area" 
                         role="button" 
                         tabindex="${isDisabled ? -1 : 0}" 
                         aria-label="${this.getAriaLabel()}"
                         aria-describedby="upload-instructions">
                        <div class="upload-icon">
                            ${this.getUploadIcon()}
                        </div>
                        <div class="upload-text">
                            ${this.getUploadText()}
                        </div>
                        <div class="upload-subtext" id="upload-instructions">
                            ${this.getUploadSubtext()}
                        </div>
                    </div>
                    
                    <input type="file" 
                           class="file-input" 
                           accept="${this.getProp('accept', '.pdf')}"
                           ${multiple ? 'multiple' : ''}
                           ${isDisabled ? 'disabled' : ''}
                           aria-hidden="true">
                    
                    ${state.error ? `
                        <div class="upload-error" role="alert" aria-live="polite">
                            <div class="error-icon">⚠️</div>
                            <div class="error-message">${this.escapeHtml(state.error)}</div>
                        </div>
                    ` : ''}
                    
                    ${(state.files && state.files.length > 0) ? this.renderFileList() : ''}
                </div>
            `;
        } catch (error) {
            console.error('Template rendering error:', error);
            return this.getFallbackTemplate();
        }
    }

    getFallbackTemplate() {
        const accept = this.getAttribute('accept') || '.pdf';
        const multiple = this.hasAttribute('multiple');
        
        return `
            <div class="file-uploader-fallback">
                <div class="fallback-content">
                    <div class="fallback-icon">📁</div>
                    <h3>File Upload</h3>
                    <p>Enhanced uploader unavailable. Use basic file input:</p>
                    <input type="file" 
                           accept="${accept}" 
                           ${multiple ? 'multiple' : ''}
                           class="fallback-input">
                    <div class="fallback-info">
                        Accepted: ${accept.toUpperCase()} files
                        ${multiple ? ' (Multiple files allowed)' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderToggleSwitch() {
        try {
            const state = this.getState() || {};
            const isToggleDisabled = this.isToggleDisabledState();
            const isTransitioning = state.modeTransitioning || false;
            const currentMode = this.currentMode;
            const modeConfig = this.getModeConfig();
            
            const toggleClasses = [
                'mode-toggle',
                isToggleDisabled ? 'disabled' : '',
                isTransitioning ? 'transitioning' : '',
                `mode-${currentMode}`
            ].filter(Boolean).join(' ');
            
            // Enhanced ARIA attributes for better accessibility (Requirement 5.1)
            const toggleId = `toggle-switch-${this.id || 'default'}`;
            const descriptionId = `toggle-description-${this.id || 'default'}`;
            const statusId = `toggle-status-${this.id || 'default'}`;
            
            return `
                <div class="${toggleClasses}" role="group" aria-labelledby="${toggleId}-label">
                    <div class="toggle-container">
                        <span class="toggle-label toggle-label-single ${currentMode === 'single' ? 'active' : ''}" 
                              id="single-mode-label"
                              aria-hidden="${currentMode !== 'single'}">
                            Single File
                        </span>
                        
                        <button class="toggle-switch" 
                                id="${toggleId}"
                                type="button"
                                role="switch"
                                aria-checked="${currentMode === 'batch'}"
                                aria-label="Toggle between single file and batch files mode. Currently ${modeConfig.label} mode."
                                aria-describedby="${descriptionId} ${statusId}"
                                aria-pressed="${currentMode === 'batch'}"
                                ${isToggleDisabled ? 'disabled aria-disabled="true"' : 'aria-disabled="false"'}
                                tabindex="${isToggleDisabled ? -1 : 0}"
                                data-mode="${currentMode}"
                                title="${isToggleDisabled ? 'Toggle is disabled' : `Switch to ${currentMode === 'single' ? 'batch' : 'single'} mode`}">
                            <span class="toggle-track" aria-hidden="true">
                                <span class="toggle-thumb" aria-hidden="true"></span>
                            </span>
                            <span class="sr-only" id="${toggleId}-label">
                                Upload mode toggle: ${modeConfig.label}
                            </span>
                        </button>
                        
                        <span class="toggle-label toggle-label-batch ${currentMode === 'batch' ? 'active' : ''}" 
                              id="batch-mode-label"
                              aria-hidden="${currentMode !== 'batch'}">
                            Batch Files
                        </span>
                    </div>
                    
                    <div class="toggle-description" id="${descriptionId}" aria-live="polite">
                        ${modeConfig.description}
                    </div>
                    
                    <!-- Screen reader status announcements (Requirement 5.3) -->
                    <div class="toggle-status sr-only" 
                         id="${statusId}" 
                         aria-live="assertive" 
                         aria-atomic="true">
                        ${isToggleDisabled ? 'Toggle is disabled' : `${modeConfig.label} mode active`}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering toggle switch:', error);
            return `
                <div class="mode-toggle error" role="alert">
                    <div class="toggle-error">Toggle unavailable due to error</div>
                </div>
            `;
        }
    }

    renderFileList() {
        try {
            const files = this.getState('files') || [];
            if (!files.length) return '';
            
            return `
                <div class="file-list">
                    <div class="file-list-header">
                        <span>Selected Files (${files.length})</span>
                        <button class="clear-files-btn" type="button" aria-label="Clear all files">
                            Clear All
                        </button>
                    </div>
                    <div class="file-items">
                        ${files.map((file, index) => {
                            try {
                                return `
                                    <div class="file-item" data-index="${index}">
                                        <div class="file-icon">
                                            ${this.getFileIcon(file.type || '')}
                                        </div>
                                        <div class="file-info">
                                            <div class="file-name" title="${file.name || 'Unknown file'}">${file.name || 'Unknown file'}</div>
                                            <div class="file-size">${this.formatFileSize(file.size || 0)}</div>
                                        </div>
                                        <button class="remove-file-btn" type="button" 
                                                data-index="${index}" 
                                                aria-label="Remove ${file.name || 'file'}">
                                            ×
                                        </button>
                                    </div>
                                `;
                            } catch (itemError) {
                                console.warn('Error rendering file item:', itemError);
                                return `
                                    <div class="file-item" data-index="${index}">
                                        <div class="file-icon">FILE</div>
                                        <div class="file-info">
                                            <div class="file-name">Error loading file</div>
                                            <div class="file-size">Unknown size</div>
                                        </div>
                                        <button class="remove-file-btn" type="button" data-index="${index}">×</button>
                                    </div>
                                `;
                            }
                        }).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering file list:', error);
            return `
                <div class="upload-error" role="alert">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">Error displaying file list</div>
                </div>
            `;
        }
    }

    getStyles() {
        return `
            :host {
                display: block;
                width: 100%;
                font-family: var(--font-sans, system-ui, sans-serif);
            }
            
            .file-uploader {
                position: relative;
            }
            
            .upload-area {
                border: 2px dashed var(--gray-300, #d1d5db);
                border-radius: var(--radius-2xl, 16px);
                padding: var(--space-12, 3rem) var(--space-6, 1.5rem);
                text-align: center;
                cursor: pointer;
                transition: all var(--duration-300, 300ms) var(--ease-out, ease-out);
                background: #fefefe;
                min-height: 240px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: var(--space-4, 1rem);
                position: relative;
                overflow: hidden;
            }
            
            .upload-area::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
                opacity: 0;
                transition: opacity var(--duration-300, 300ms) var(--ease-out, ease-out);
                pointer-events: none;
            }
            
            .upload-area:hover:not(.disabled) {
                border-color: var(--color-primary, #3b82f6);
                background: var(--primary-50, #eff6ff);
                transform: translateY(-2px);
                box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
            }
            
            .upload-area:hover:not(.disabled)::before {
                opacity: 1;
            }
            
            .upload-area:focus {
                outline: none;
                border-color: var(--color-primary, #3b82f6);
                box-shadow: 0 0 0 3px var(--primary-100, #dbeafe);
            }
            
            .file-uploader.drag-over .upload-area {
                border-color: var(--color-primary, #3b82f6);
                background: var(--primary-100, #dbeafe);
                transform: scale(1.02) translateY(-4px);
                box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1)), 0 0 0 4px var(--primary-200, #bfdbfe);
                border-style: solid;
            }
            
            .file-uploader.disabled .upload-area {
                opacity: 0.6;
                cursor: not-allowed;
                background: #f9f9f9;
                border-color: var(--gray-200, #e5e7eb);
            }
            
            .upload-icon {
                width: 80px;
                height: 80px;
                color: var(--color-primary, #3b82f6);
                margin-bottom: var(--space-2, 0.5rem);
                transition: all var(--duration-300, 300ms) var(--ease-out, ease-out);
            }
            
            .upload-icon svg {
                width: 100%;
                height: 100%;
                filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.1));
            }
            
            .upload-text {
                font-size: var(--text-xl, 1.25rem);
                font-weight: var(--font-semibold, 600);
                color: var(--gray-800, #1f2937);
                margin-bottom: var(--space-1, 0.25rem);
                transition: color var(--duration-200, 200ms) var(--ease-out, ease-out);
            }
            
            .upload-subtext {
                font-size: var(--text-sm, 0.875rem);
                color: var(--gray-600, #4b5563);
                line-height: var(--leading-relaxed, 1.625);
                max-width: 400px;
            }
            
            .file-input {
                position: absolute;
                opacity: 0;
                pointer-events: none;
                width: 0;
                height: 0;
            }
            
            .upload-error {
                display: flex;
                align-items: flex-start;
                gap: var(--space-3, 0.75rem);
                padding: var(--space-4, 1rem);
                margin-top: var(--space-4, 1rem);
                background: var(--error-50, #fef2f2);
                border: 2px solid var(--error-200, #fecaca);
                border-radius: var(--radius-lg, 8px);
                color: var(--error-800, #991b1b);
                animation: slideIn var(--duration-300, 300ms) var(--ease-out, ease-out);
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .error-icon {
                font-size: var(--text-lg, 1.125rem);
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .error-message {
                font-size: var(--text-sm, 0.875rem);
                line-height: var(--leading-relaxed, 1.625);
                white-space: pre-line;
            }
            
            /* Fallback styles */
            .file-uploader-fallback {
                border: 2px solid #fbbf24;
                border-radius: var(--radius-2xl, 16px);
                padding: var(--space-8, 2rem);
                text-align: center;
                background: #fefefe;
            }
            
            .fallback-content {
                max-width: 400px;
                margin: 0 auto;
            }
            
            .fallback-icon {
                font-size: 3rem;
                margin-bottom: var(--space-4, 1rem);
            }
            
            .fallback-content h3 {
                color: #d97706;
                margin: 0 0 var(--space-3, 0.75rem);
                font-size: var(--text-lg, 1.125rem);
            }
            
            .fallback-content p {
                color: var(--gray-600, #4b5563);
                margin: 0 0 var(--space-4, 1rem);
            }
            
            .fallback-input {
                margin: var(--space-4, 1rem) 0;
                padding: var(--space-2, 0.5rem);
                border: 1px solid var(--gray-300, #d1d5db);
                border-radius: var(--radius-md, 6px);
                background: white;
            }
            
            .fallback-info {
                font-size: var(--text-sm, 0.875rem);
                color: var(--gray-500, #6b7280);
                margin-top: var(--space-2, 0.5rem);
            }
            
            /* Toggle Switch Styles */
            .mode-toggle {
                margin-bottom: var(--space-6, 1.5rem);
                padding: var(--space-4, 1rem);
                background: var(--gray-50, #f9fafb);
                border: 1px solid var(--gray-200, #e5e7eb);
                border-radius: var(--radius-lg, 8px);
                transition: all var(--duration-200, 200ms) var(--ease-out, ease-out);
            }
            
            .mode-toggle.disabled {
                opacity: 0.6;
                pointer-events: none;
                background: var(--gray-100, #f3f4f6);
            }
            
            .mode-toggle.transitioning {
                pointer-events: none;
            }
            
            .toggle-container {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--space-4, 1rem);
                margin-bottom: var(--space-2, 0.5rem);
            }
            
            .toggle-label {
                font-size: var(--text-sm, 0.875rem);
                font-weight: var(--font-medium, 500);
                color: var(--gray-600, #4b5563);
                transition: all var(--duration-200, 200ms) var(--ease-out, ease-out);
                user-select: none;
                min-width: 80px;
                text-align: center;
            }
            
            .toggle-label.active {
                color: var(--color-primary, #3b82f6);
                font-weight: var(--font-semibold, 600);
            }
            
            .toggle-switch {
                position: relative;
                width: 52px;
                height: 28px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 0;
                outline: none;
                transition: all var(--duration-200, 200ms) var(--ease-out, ease-out);
            }
            
            .toggle-switch:disabled {
                cursor: not-allowed;
                opacity: 0.6;
            }
            
            .toggle-switch:focus {
                outline: none;
            }
            
            .toggle-switch:focus .toggle-track {
                box-shadow: 0 0 0 3px var(--primary-100, #dbeafe);
            }
            
            .toggle-track {
                display: block;
                width: 100%;
                height: 100%;
                background: var(--gray-300, #d1d5db);
                border-radius: 14px;
                position: relative;
                transition: all var(--duration-300, 300ms) var(--ease-out, ease-out);
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .mode-batch .toggle-track {
                background: var(--color-primary, #3b82f6);
            }
            
            .toggle-thumb {
                position: absolute;
                top: 2px;
                left: 2px;
                width: 24px;
                height: 24px;
                background: white;
                border-radius: 50%;
                transition: all var(--duration-300, 300ms) var(--ease-out, ease-out);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                transform: translateX(0);
            }
            
            .mode-batch .toggle-thumb {
                transform: translateX(24px);
            }
            
            .toggle-switch:hover:not(:disabled) .toggle-thumb {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
                transform: translateX(0) scale(1.05);
            }
            
            .mode-batch .toggle-switch:hover:not(:disabled) .toggle-thumb {
                transform: translateX(24px) scale(1.05);
            }
            
            .toggle-switch:active:not(:disabled) .toggle-thumb {
                transform: translateX(0) scale(0.95);
            }
            
            .mode-batch .toggle-switch:active:not(:disabled) .toggle-thumb {
                transform: translateX(24px) scale(0.95);
            }
            
            .toggle-description {
                text-align: center;
                font-size: var(--text-xs, 0.75rem);
                color: var(--gray-500, #6b7280);
                font-style: italic;
                transition: color var(--duration-200, 200ms) var(--ease-out, ease-out);
            }
            
            .mode-toggle.transitioning .toggle-description {
                color: var(--color-primary, #3b82f6);
            }
            
            /* Toggle animations */
            @keyframes toggleSlide {
                0% {
                    transform: translateX(0);
                }
                100% {
                    transform: translateX(24px);
                }
            }
            
            @keyframes toggleSlideBack {
                0% {
                    transform: translateX(24px);
                }
                100% {
                    transform: translateX(0);
                }
            }
            
            /* Mode-specific upload area styling */
            .file-uploader.mode-single .upload-area {
                border-style: dashed;
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(59, 130, 246, 0.01) 100%);
            }
            
            .file-uploader.mode-batch .upload-area {
                border-style: solid;
                border-width: 2px;
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
            }
            
            .file-uploader.mode-batch .upload-area::before {
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%);
            }
            
            /* Mode transition animations */
            .file-uploader.mode-transitioning .upload-area {
                animation: modeTransition var(--duration-500, 500ms) var(--ease-out, ease-out);
                pointer-events: none;
            }
            
            .file-uploader.mode-transitioning .upload-icon {
                animation: iconTransition var(--duration-400, 400ms) var(--ease-out, ease-out);
            }
            
            .file-uploader.mode-transitioning .upload-text,
            .file-uploader.mode-transitioning .upload-subtext {
                animation: textFadeTransition var(--duration-300, 300ms) var(--ease-out, ease-out);
            }
            
            @keyframes modeTransition {
                0% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(0.98);
                    opacity: 0.8;
                    border-color: var(--color-primary, #3b82f6);
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
            
            @keyframes iconTransition {
                0% {
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.1) rotate(5deg);
                    opacity: 0.7;
                }
                100% {
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
            }
            
            @keyframes textFadeTransition {
                0% {
                    opacity: 1;
                    transform: translateY(0);
                }
                50% {
                    opacity: 0.5;
                    transform: translateY(-5px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Mode-specific visual indicators */
            .file-uploader.mode-single .upload-area::after {
                content: '';
                position: absolute;
                top: 10px;
                right: 10px;
                width: 20px;
                height: 20px;
                background: var(--color-primary, #3b82f6);
                border-radius: 50%;
                opacity: 0.6;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                color: white;
                transition: all var(--duration-200, 200ms) var(--ease-out, ease-out);
            }
            
            .file-uploader.mode-batch .upload-area::after {
                content: '+';
                position: absolute;
                top: 10px;
                right: 10px;
                width: 24px;
                height: 24px;
                background: var(--color-primary, #3b82f6);
                border-radius: 6px;
                opacity: 0.7;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: bold;
                color: white;
                transition: all var(--duration-200, 200ms) var(--ease-out, ease-out);
            }
            
            .file-uploader.mode-single .upload-area::after {
                content: '1';
            }
            
            /* Processing state */
            .file-uploader.processing .upload-area {
                pointer-events: none;
                opacity: 0.8;
                background: #f9f9f9;
                border-color: var(--gray-300, #d1d5db);
            }
            
            .file-uploader.processing .upload-icon {
                animation: pulse 2s infinite;
            }
            
            .file-uploader.processing .mode-toggle {
                pointer-events: none;
                opacity: 0.7;
            }
            
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.7;
                    transform: scale(1.05);
                }
            }

            /* High Contrast Mode Support (Requirement 5.4) */
            @media (prefers-contrast: high) {
                .toggle-switch {
                    border: 2px solid currentColor;
                    background: transparent;
                }
                
                .toggle-track {
                    border: 2px solid currentColor !important;
                    background: transparent !important;
                }
                
                .toggle-thumb {
                    border: 2px solid currentColor !important;
                    background: currentColor !important;
                    box-shadow: none !important;
                }
                
                .mode-batch .toggle-thumb {
                    background: transparent !important;
                    border: 2px solid currentColor !important;
                }
                
                .toggle-switch:focus .toggle-track {
                    box-shadow: 0 0 0 3px currentColor !important;
                    outline: 2px solid currentColor;
                    outline-offset: 2px;
                }
                
                .toggle-label.active {
                    font-weight: bold;
                    text-decoration: underline;
                }
                
                .mode-toggle.disabled {
                    opacity: 0.5;
                    border: 1px dashed currentColor;
                }
            }

            /* Windows High Contrast Mode */
            @media (-ms-high-contrast: active) {
                .toggle-switch {
                    border: 2px solid WindowText;
                    background: Window;
                }
                
                .toggle-track {
                    border: 2px solid WindowText !important;
                    background: Window !important;
                }
                
                .toggle-thumb {
                    border: 2px solid WindowText !important;
                    background: WindowText !important;
                }
                
                .mode-batch .toggle-thumb {
                    background: Window !important;
                    border: 2px solid WindowText !important;
                }
                
                .toggle-switch:focus {
                    outline: 2px solid Highlight;
                    outline-offset: 2px;
                }
                
                .toggle-label.active {
                    color: HighlightText;
                    background: Highlight;
                    padding: 2px 4px;
                }
            }

            /* Enhanced Disabled State Styling (Requirement 5.5) */
            .mode-toggle.disabled {
                opacity: 0.6;
                pointer-events: none;
                position: relative;
            }
            
            .mode-toggle.disabled::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 0, 0, 0.1) 2px,
                    rgba(0, 0, 0, 0.1) 4px
                );
                pointer-events: none;
                z-index: 1;
            }
            
            .toggle-switch:disabled {
                cursor: not-allowed !important;
                opacity: 0.5;
                background: var(--gray-200, #e5e7eb);
                border-color: var(--gray-300, #d1d5db);
            }
            
            .toggle-switch:disabled .toggle-track {
                background: var(--gray-300, #d1d5db) !important;
                border-color: var(--gray-400, #9ca3af) !important;
            }
            
            .toggle-switch:disabled .toggle-thumb {
                background: var(--gray-400, #9ca3af) !important;
                box-shadow: none !important;
                transform: none !important;
            }
            
            .mode-toggle.disabled .toggle-label {
                color: var(--gray-400, #9ca3af);
                cursor: not-allowed;
            }
            
            .mode-toggle.disabled .toggle-description {
                color: var(--gray-400, #9ca3af);
                font-style: italic;
            }

            /* Screen Reader Only Content */
            .sr-only {
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            }

            /* Focus Management for Keyboard Users */
            .toggle-switch:focus-visible {
                outline: 2px solid var(--color-primary, #3b82f6);
                outline-offset: 2px;
                box-shadow: 0 0 0 4px var(--primary-100, #dbeafe);
            }
            
            /* Reduced Motion Support */
            @media (prefers-reduced-motion: reduce) {
                .toggle-switch,
                .toggle-thumb,
                .toggle-track,
                .mode-toggle {
                    transition: none !important;
                    animation: none !important;
                }
                
                .file-uploader.mode-transitioning {
                    transition: none !important;
                }
            }
        `;
    }

    setupEventListeners() {
        // Don't setup listeners here - wait for onRendered
    }

    onRendered() {
        if (this.hasInitializationError) {
            this.setupFallbackListeners();
            return;
        }

        try {
            const uploadArea = this.$('.upload-area');
            const fileInput = this.$('.file-input');
            const toggleSwitch = this.$('.toggle-switch');

            if (!uploadArea || !fileInput) {
                console.warn('FileUploader: Required elements not found');
                this.handleRenderError();
                return;
            }

            this.removeAllEventListeners();

            // Upload area event listeners
            this.safeAddEventListener(uploadArea, 'dragenter', this.handleDragEnter.bind(this));
            this.safeAddEventListener(uploadArea, 'dragleave', this.handleDragLeave.bind(this));
            this.safeAddEventListener(uploadArea, 'dragover', this.handleDragOver.bind(this));
            this.safeAddEventListener(uploadArea, 'drop', this.handleDrop.bind(this));
            this.safeAddEventListener(uploadArea, 'click', this.handleAreaClick.bind(this));
            this.safeAddEventListener(uploadArea, 'keydown', this.handleAreaKeydown.bind(this));
            
            // File input event listener
            this.safeAddEventListener(fileInput, 'change', this.handleFileInputChange.bind(this));
            
            // File list event listener
            this.safeAddEventListener(this, 'click', this.handleFileListClick.bind(this));
            
            // Toggle switch event listeners
            if (toggleSwitch) {
                this.safeAddEventListener(toggleSwitch, 'click', this.handleToggleClick.bind(this));
                this.safeAddEventListener(toggleSwitch, 'keydown', this.handleToggleKeydown.bind(this));
            }
            
            console.log("File Uploader event listeners hooked up");
        } catch (error) {
            console.error('FileUploader onRendered error:', error);
            this.handleRenderError();
        }
    }

    safeAddEventListener(element, event, handler) {
        try {
            if (element && typeof handler === 'function') {
                this.addEventListener(element, event, handler);
            }
        } catch (error) {
            console.warn(`Failed to add ${event} listener:`, error);
        }
    }

    setupFallbackListeners() {
        try {
            const fallbackInput = this.$('.fallback-input');
            if (fallbackInput) {
                this.safeAddEventListener(fallbackInput, 'change', this.handleFallbackInputChange.bind(this));
            }
        } catch (error) {
            console.error('Error setting up fallback listeners:', error);
        }
    }

    handleFallbackInputChange(e) {
        try {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
                // Emit basic file selection event
                this.emit('files-selected-fallback', { files });
                console.log('Files selected via fallback:', files.map(f => f.name));
            }
        } catch (error) {
            console.error('Error handling fallback input change:', error);
        }
    }

    handleRenderError() {
        try {
            this.hasInitializationError = true;
            this.render(); // Re-render with fallback template
        } catch (fallbackError) {
            console.error('FileUploader fallback render failed:', fallbackError);
        }
    }

    handleDragEnter(e) {
        try {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.getProp('disabled') || this.getState('isProcessing')) return;
            
            this.dragCounter++;
            
            if (this.dragCounter === 1) {
                this.setState({ isDragOver: true });
                this.emit('drag-enter', { 
                    event: e,
                    files: e.dataTransfer.files.length 
                });
            }
        } catch (error) {
            console.error('Error in handleDragEnter:', error);
        }
    }

    handleDragLeave(e) {
        try {
            e.preventDefault();
            e.stopPropagation();
            
            this.dragCounter--;
            
            if (this.dragCounter === 0) {
                this.setState({ isDragOver: false });
                this.emit('drag-leave', { event: e });
            }
        } catch (error) {
            console.error('Error in handleDragLeave:', error);
        }
    }

    handleDragOver(e) {
        try {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.getProp('disabled') || this.getState('isProcessing')) {
                e.dataTransfer.dropEffect = 'none';
                return;
            }
            
            e.dataTransfer.dropEffect = 'copy';
            this.emit('drag-over', { 
                event: e,
                files: e.dataTransfer.files.length 
            });
        } catch (error) {
            console.error('Error in handleDragOver:', error);
        }
    }

    handleDrop(e) {
        try {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.getProp('disabled') || this.getState('isProcessing')) return;
            
            this.dragCounter = 0;
            this.setState({ isDragOver: false });
            
            const files = Array.from(e.dataTransfer.files);
            
            this.emit('drop', { 
                event: e,
                files: files,
                mode: this.getMode()
            });
            
            setTimeout(() => {
                this.processFiles(files, 'drop');
            }, 100);
        } catch (error) {
            console.error('Error in handleDrop:', error);
            this.setState({ error: 'Failed to process dropped files' });
        }
    }

    handleAreaClick() {
        try {
            if (this.getProp('disabled')) return;
            const fileInput = this.$('.file-input');
            if (fileInput) {
                fileInput.click();
            }
        } catch (error) {
            console.error('Error in handleAreaClick:', error);
        }
    }

    handleAreaKeydown(e) {
        try {
            if (this.getProp('disabled')) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const fileInput = this.$('.file-input');
                if (fileInput) {
                    fileInput.click();
                }
            }
        } catch (error) {
            console.error('Error in handleAreaKeydown:', error);
        }
    }

    handleFileInputChange(e) {
        try {
            const files = Array.from(e.target.files || []);
            this.processFiles(files, 'selection');
            e.target.value = '';
        } catch (error) {
            console.error('Error in handleFileInputChange:', error);
            this.setState({ error: 'Failed to process selected files' });
        }
    }

    handleFileListClick(e) {
        try {
            if (e.target.matches('.remove-file-btn')) {
                const index = parseInt(e.target.dataset.index);
                if (!isNaN(index)) {
                    this.removeFile(index);
                }
            } else if (e.target.matches('.clear-files-btn')) {
                this.clearFiles();
            }
        } catch (error) {
            console.error('Error in handleFileListClick:', error);
        }
    }

    handleToggleClick(e) {
        try {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.isToggleDisabledState()) {
                return;
            }
            
            const oldMode = this.currentMode;
            const success = this.toggleModeWithTrigger('click');
            
            if (success) {
                // Update toggle UI state
                this.updateToggleUIState();
                
                // Announce mode change with context
                this.announceModeChange(this.currentMode, {
                    filesAffected: this.getFiles().length,
                    triggeredBy: 'click'
                });
            }
        } catch (error) {
            console.error('Error in handleToggleClick:', error);
        }
    }

    handleToggleKeydown(e) {
        try {
            // Enhanced keyboard navigation (Requirement 5.2)
            if (this.isToggleDisabledState()) {
                // Announce that toggle is disabled when user tries to interact
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    this.announceToScreenReader('Toggle is disabled and cannot be changed');
                }
                return;
            }
            
            // Handle Space and Enter keys for toggle activation (Requirement 5.2)
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                
                const oldMode = this.currentMode;
                const newMode = oldMode === 'single' ? 'batch' : 'single';
                
                // Provide immediate feedback for keyboard users
                this.announceToScreenReader(`Switching to ${newMode} mode...`);
                
                const success = this.toggleModeWithTrigger('keyboard');
                
                if (success) {
                    // Update toggle UI state
                    this.updateToggleUIState();
                    
                    // Enhanced screen reader announcement (Requirement 5.3)
                    this.announceModeChangeEnhanced(this.currentMode, {
                        filesAffected: this.getFiles().length,
                        triggeredBy: 'keyboard',
                        oldMode: oldMode
                    });
                    
                    // Update status region for screen readers
                    this.updateToggleStatusRegion();
                } else {
                    this.announceToScreenReader('Mode change failed. Please try again.');
                }
            }
            
            // Handle Escape key to provide context help
            else if (e.key === 'Escape') {
                e.preventDefault();
                const modeConfig = this.getModeConfig();
                this.announceToScreenReader(`Currently in ${modeConfig.label} mode. ${modeConfig.description}. Press Space or Enter to switch modes.`);
            }
            
            // Handle arrow keys for additional navigation feedback
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const currentMode = this.currentMode;
                const targetMode = currentMode === 'single' ? 'batch' : 'single';
                this.announceToScreenReader(`Press Space or Enter to switch to ${targetMode} mode`);
            }
        } catch (error) {
            console.error('Error in handleToggleKeydown:', error);
            this.announceToScreenReader('An error occurred with the toggle. Please try again.');
        }
    }

    async processFiles(files, source = 'selection') {
        if (this.getProp('disabled') || this.getState('isProcessing')) return;
        
        this.setState({ error: null, isProcessing: true });
        this.emit('processing-start', { files, source });
        
        try {
            // First, adapt files based on current mode (Requirements 3.1, 3.2, 3.3)
            const modeValidation = this.validateFilesForMode(files, source);
            const filesToProcess = modeValidation.adaptedFiles;
            
            const validFiles = [];
            const errors = [];
            const warnings = [...modeValidation.warnings]; // Include mode adaptation warnings
            
            // Emit mode adaptation event if files were adapted
            if (modeValidation.filesAdapted) {
                this.emit('files-adapted', {
                    originalFiles: files,
                    adaptedFiles: filesToProcess,
                    mode: this.getMode(),
                    reason: 'mode-limitation'
                });
            }
            
            // Validate each adapted file
            for (const file of filesToProcess) {
                try {
                    const validation = await this.validateFile(file);
                    if (validation.isValid) {
                        validFiles.push(file);
                        
                        if (validation.warnings && validation.warnings.length > 0) {
                            warnings.push(`${file.name}: ${validation.warnings.join(', ')}`);
                        }
                    } else {
                        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
                    }
                } catch (validationError) {
                    console.error('File validation error:', validationError);
                    errors.push(`${file.name}: Validation failed`);
                }
            }
            
            if (errors.length > 0) {
                const errorMessage = errors.length === 1 
                    ? errors[0] 
                    : `${errors.length} files failed validation:\n${errors.join('\n')}`;
                this.setState({ error: errorMessage });
                this.emit('validation-error', { errors, files: filesToProcess });
            }
            
            if (warnings.length > 0 && validFiles.length > 0) {
                console.warn('File upload warnings:', warnings);
                this.emit('validation-warning', { warnings, files: validFiles });
            }
            
            if (validFiles.length > 0) {
                this.addFiles(validFiles);
                this.emit('files-processed', { 
                    validFiles, 
                    totalFiles: files.length,
                    adaptedFiles: filesToProcess.length,
                    errors: errors.length,
                    warnings: warnings.length
                });
            } else if (errors.length === 0 && validFiles.length === 0) {
                this.setState({ error: 'No valid files were selected.' });
            }
            
        } catch (error) {
            const errorMessage = `Processing error: ${error.message}`;
            this.setState({ error: errorMessage });
            this.emit('processing-error', { error, files });
            console.error('File processing error:', error);
        } finally {
            this.setState({ isProcessing: false });
            this.emit('processing-complete', { files });
        }
    }

    async validateFile(file) {
        const validation = { 
            isValid: true, 
            errors: [], 
            warnings: [] 
        };
        
        try {
            if (!file || !file.name) {
                validation.isValid = false;
                validation.errors.push('Invalid file object');
                return validation;
            }
            
            const maxSize = this.parseFileSize(this.getProp('max-size', '50MB'));
            if (file.size > maxSize) {
                validation.isValid = false;
                validation.errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size of ${this.getProp('max-size', '50MB')}`);
            } else if (file.size > maxSize * 0.8) {
                validation.warnings.push(`Large file size (${this.formatFileSize(file.size)}). Processing may take longer.`);
            }
            
            if (file.size === 0) {
                validation.isValid = false;
                validation.errors.push('File is empty');
                return validation;
            }
            
            const acceptedTypes = this.getProp('accept', '.pdf').split(',').map(t => t.trim());
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            const isAccepted = acceptedTypes.some(type => {
                if (type.startsWith('.')) {
                    return fileExtension === type.toLowerCase();
                } else {
                    return file.type === type || file.type.startsWith(type.split('/')[0] + '/');
                }
            });
            
            if (!isAccepted) {
                validation.isValid = false;
                const acceptedDisplay = acceptedTypes.map(type => 
                    type.startsWith('.') ? type.toUpperCase() : type
                ).join(', ');
                validation.errors.push(`File type "${fileExtension.toUpperCase()}" not supported. Accepted types: ${acceptedDisplay}`);
            }
            
            if (file.name.length > 255) {
                validation.isValid = false;
                validation.errors.push('File name is too long (maximum 255 characters)');
            }
            
            const problematicChars = /[<>:"|?*\x00-\x1f]/;
            if (problematicChars.test(file.name)) {
                validation.warnings.push('File name contains special characters that may cause issues');
            }
            
            if (fileExtension === '.pdf' || file.type === 'application/pdf') {
                try {
                    const firstBytes = await this.readFileBytes(file, 0, 8);
                    const pdfHeader = new TextDecoder().decode(firstBytes);
                    if (!pdfHeader.startsWith('%PDF-')) {
                        validation.isValid = false;
                        validation.errors.push('File does not appear to be a valid PDF');
                    }
                } catch (error) {
                    validation.warnings.push('Could not verify PDF format');
                }
            }
        } catch (error) {
            console.error('Validation error:', error);
            validation.isValid = false;
            validation.errors.push('File validation failed');
        }
        
        return validation;
    }
    
    async readFileBytes(file, start, length) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = () => resolve(new Uint8Array(reader.result));
                reader.onerror = () => reject(reader.error || new Error('File read failed'));
                reader.readAsArrayBuffer(file.slice(start, start + length));
            } catch (error) {
                reject(error);
            }
        });
    }

    addFiles(files) {
        try {
            const currentFiles = this.getState('files') || [];
            const currentMode = this.getMode();
            
            let newFiles;
            if (currentMode === 'batch') {
                // In batch mode, add all files to existing ones (Requirement 3.3)
                newFiles = [...currentFiles, ...files];
            } else {
                // In single mode, replace existing files with the new ones
                // Only keep the last selected file (Requirement 3.1)
                newFiles = files.slice(-1);
            }
            
            this.setState({ files: newFiles });
            this.emit('files-selected', {
                files: newFiles,
                newFiles: files,
                mode: currentMode,
                replaced: currentMode === 'single' && currentFiles.length > 0
            });
        } catch (error) {
            console.error('Error adding files:', error);
            this.setState({ error: 'Failed to add files' });
        }
    }

    removeFile(index) {
        try {
            const files = this.getState('files') || [];
            const newFiles = files.filter((_, i) => i !== index);
            this.setState({ files: newFiles });
            this.emit('files-changed', { files: newFiles });
        } catch (error) {
            console.error('Error removing file:', error);
        }
    }

    clearFiles() {
        try {
            this.setState({ files: [] });
            this.emit('files-changed', { files: [] });
        } catch (error) {
            console.error('Error clearing files:', error);
        }
    }

    // Template helper methods with error handling
    getUploadIcon() {
        try {
            const state = this.getState() || {};
            const currentMode = this.getMode();
            
            if (state.isProcessing) {
                return `
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="6" opacity="0.2"/>
                        <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="6" 
                                stroke-dasharray="164" stroke-dashoffset="41" stroke-linecap="round">
                            <animateTransform attributeName="transform" type="rotate" 
                                            values="0 50 50;360 50 50" dur="1s" repeatCount="indefinite"/>
                        </circle>
                        <path d="M50 30V70M30 50H70" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
                    </svg>
                `;
            }
            
            if (state.isDragOver) {
                if (currentMode === 'batch') {
                    return `
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.15" />
                            <path d="M50 25V75M25 50H75" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
                            <!-- Multiple files representation -->
                            <rect x="20" y="15" width="35" height="25" rx="3" fill="none" stroke="currentColor" stroke-width="2" opacity="0.8" />
                            <rect x="25" y="20" width="35" height="25" rx="3" fill="none" stroke="currentColor" stroke-width="2" opacity="0.9" />
                            <rect x="30" y="25" width="35" height="25" rx="3" fill="none" stroke="currentColor" stroke-width="2" />
                            <path d="M35 35H60V38H35z M35 40H60V43H35z M35 45H55V48H35z" fill="currentColor" opacity="0.8" />
                            <path d="M40 65L50 55L60 65M50 55V75" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" />
                        </svg>
                    `;
                } else {
                    return `
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.1" />
                            <path d="M50 25V75M25 50H75" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
                            <rect x="30" y="20" width="40" height="30" rx="4" fill="none" stroke="currentColor" stroke-width="3" opacity="0.6" />
                            <path d="M38 30H62V35H38z M38 40H62V45H38z M38 50H55V55H38z" fill="currentColor" opacity="0.8" />
                            <path d="M45 65L50 60L55 65M50 60V75" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none" />
                        </svg>
                    `;
                }
            }
            
            // Mode-specific icons for normal state
            if (currentMode === 'batch') {
                return `
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.08" />
                        <path d="M50 30V70M30 50H70" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
                        <!-- Multiple files stack -->
                        <rect x="25" y="20" width="30" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5" />
                        <rect x="30" y="25" width="30" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2" opacity="0.7" />
                        <rect x="35" y="30" width="30" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
                        <path d="M40 35H60V38H40z M40 40H60V43H40z M40 45H55V48H40z" fill="currentColor" opacity="0.6" />
                        <!-- Batch indicator -->
                        <circle cx="75" cy="25" r="8" fill="currentColor" opacity="0.2" />
                        <text x="75" y="30" text-anchor="middle" font-size="10" font-weight="bold" fill="currentColor">+</text>
                    </svg>
                `;
            } else {
                return `
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.08" />
                        <path d="M50 30V70M30 50H70" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
                        <!-- Single file -->
                        <rect x="35" y="25" width="30" height="25" rx="3" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6" />
                        <path d="M40 35H60V38H40z M40 40H60V43H40z M40 45H55V48H40z" fill="currentColor" opacity="0.4" />
                        <!-- Single file indicator -->
                        <circle cx="75" cy="25" r="6" fill="currentColor" opacity="0.3" />
                        <text x="75" y="29" text-anchor="middle" font-size="8" font-weight="bold" fill="currentColor">1</text>
                    </svg>
                `;
            }
        } catch (error) {
            console.warn('Error generating upload icon:', error);
            return `<div style="font-size: 3rem;">📁</div>`;
        }
    }
    
    getUploadText() {
        try {
            const state = this.getState() || {};
            const currentMode = this.getMode();
            
            if (state.isProcessing) {
                return currentMode === 'batch' ? 'Processing files...' : 'Processing file...';
            }
            
            if (state.isDragOver) {
                return currentMode === 'batch' ? 'Drop files here' : 'Drop file here';
            }
            
            // Mode-specific instructions
            if (currentMode === 'batch') {
                return 'Drop your files here or click to browse';
            } else {
                return 'Drop your PDF here or click to browse';
            }
        } catch (error) {
            console.warn('Error getting upload text:', error);
            return 'Click to upload files';
        }
    }
    
    getAriaLabel() {
        try {
            const state = this.getState() || {};
            const currentMode = this.getMode();
            
            if (state.isProcessing) {
                return currentMode === 'batch' ? 'Processing multiple files, please wait' : 'Processing file, please wait';
            }
            
            if (state.isDragOver) {
                return currentMode === 'batch' ? 'Drop files to upload multiple files' : 'Drop file to upload single file';
            }
            
            // Mode-specific aria labels
            if (currentMode === 'batch') {
                return 'Multiple files upload area. Click to browse or drag and drop files here.';
            } else {
                return 'Single file upload area. Click to browse or drag and drop a file here.';
            }
        } catch (error) {
            console.warn('Error getting aria label:', error);
            return 'File upload area';
        }
    }
    
    escapeHtml(text) {
        try {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        } catch (error) {
            console.warn('Error escaping HTML:', error);
            return String(text || '').replace(/[<>&"']/g, '');
        }
    }

    /**
     * Announce text to screen readers using aria-live region
     * @param {string} message - The message to announce
     */
    announceToScreenReader(message) {
        try {
            // Create or find existing aria-live region
            let liveRegion = document.getElementById('file-uploader-announcements');
            if (!liveRegion) {
                liveRegion = document.createElement('div');
                liveRegion.id = 'file-uploader-announcements';
                liveRegion.setAttribute('aria-live', 'polite');
                liveRegion.setAttribute('aria-atomic', 'true');
                liveRegion.style.position = 'absolute';
                liveRegion.style.left = '-10000px';
                liveRegion.style.width = '1px';
                liveRegion.style.height = '1px';
                liveRegion.style.overflow = 'hidden';
                document.body.appendChild(liveRegion);
            }
            
            // Clear and set new message
            liveRegion.textContent = '';
            setTimeout(() => {
                liveRegion.textContent = message;
            }, 100);
        } catch (error) {
            console.warn('Error announcing to screen reader:', error);
        }
    }

    /**
     * Announce mode-specific changes to screen readers
     * @param {string} newMode - The new mode that was switched to
     * @param {Object} context - Additional context about the change
     */
    announceModeChange(newMode, context = {}) {
        try {
            const modeConfig = this.getModeConfig();
            let message = `Switched to ${modeConfig.label} mode. ${modeConfig.description}.`;
            
            if (context.filesAffected > 0) {
                if (newMode === 'single' && context.filesAffected > 1) {
                    message += ` Only the first file has been kept.`;
                } else if (newMode === 'batch') {
                    message += ` All ${context.filesAffected} files are still selected.`;
                }
            }
            
            this.announceToScreenReader(message);
        } catch (error) {
            console.warn('Error announcing mode change:', error);
        }
    }

    /**
     * Enhanced screen reader announcements for mode changes (Requirement 5.3)
     * @param {string} newMode - The new mode that was switched to
     * @param {Object} context - Additional context about the change
     */
    announceModeChangeEnhanced(newMode, context = {}) {
        try {
            const modeConfig = this.getModeConfig();
            const oldModeConfig = context.oldMode ? this.getModeConfigForMode(context.oldMode) : null;
            const filesCount = context.filesAffected || 0;
            const triggeredBy = context.triggeredBy || 'unknown';
            
            let message = `Mode changed to ${modeConfig.label}. ${modeConfig.description}.`;
            
            // Add context about how the change was triggered
            if (triggeredBy === 'keyboard') {
                message += ' Changed using keyboard.';
            } else if (triggeredBy === 'click') {
                message += ' Changed using mouse.';
            }
            
            // Add file-specific information
            if (filesCount > 0) {
                if (newMode === 'single' && context.oldMode === 'batch' && filesCount > 1) {
                    message += ` ${filesCount} files were selected. Only the first file has been kept.`;
                } else if (newMode === 'batch' && context.oldMode === 'single') {
                    message += ` ${filesCount} file${filesCount > 1 ? 's' : ''} ${filesCount > 1 ? 'are' : 'is'} still selected.`;
                } else {
                    message += ` ${filesCount} file${filesCount > 1 ? 's' : ''} selected.`;
                }
            } else {
                message += ' No files currently selected.';
            }
            
            // Add usage instructions
            message += ' Press Space or Enter to switch modes again.';
            
            this.announceToScreenReader(message);
        } catch (error) {
            console.warn('Error in enhanced mode change announcement:', error);
            // Fallback to basic announcement
            this.announceModeChange(newMode, context);
        }
    }

    /**
     * Update the toggle status region for screen readers (Requirement 5.3)
     */
    updateToggleStatusRegion() {
        try {
            const statusElement = this.$('.toggle-status');
            if (statusElement) {
                const modeConfig = this.getModeConfig();
                const isDisabled = this.isToggleDisabledState();
                
                if (isDisabled) {
                    statusElement.textContent = 'Toggle is disabled';
                } else {
                    statusElement.textContent = `${modeConfig.label} mode active. ${modeConfig.description}`;
                }
            }
        } catch (error) {
            console.warn('Error updating toggle status region:', error);
        }
    }

    /**
     * Get mode configuration for a specific mode
     * @param {string} mode - The mode to get config for
     * @returns {Object} Mode configuration object
     */
    getModeConfigForMode(mode) {
        try {
            const configs = {
                single: {
                    multiple: false,
                    maxFiles: 1,
                    label: 'Single File',
                    instructions: 'Drop your PDF here or click to browse',
                    ariaLabel: 'Single file upload area',
                    icon: 'single-file',
                    description: 'Upload one file at a time',
                    dragMessage: 'Drop file here',
                    processingMessage: 'Processing file...',
                    emptyMessage: 'No file selected'
                },
                batch: {
                    multiple: true,
                    maxFiles: Infinity,
                    label: 'Batch Files',
                    instructions: 'Drop your files here or click to browse',
                    ariaLabel: 'Multiple files upload area',
                    icon: 'batch-files',
                    description: 'Upload multiple files together',
                    dragMessage: 'Drop files here',
                    processingMessage: 'Processing files...',
                    emptyMessage: 'No files selected'
                }
            };
            
            return configs[mode] || configs.single;
        } catch (error) {
            console.error('Error getting mode config for mode:', mode, error);
            return {
                multiple: false,
                maxFiles: 1,
                label: 'Single File',
                instructions: 'Drop your file here or click to browse',
                ariaLabel: 'File upload area',
                icon: 'single-file',
                description: 'Upload files',
                dragMessage: 'Drop file here',
                processingMessage: 'Processing...',
                emptyMessage: 'No files selected'
            };
        }
    }

    getUploadSubtext() {
        try {
            const maxSize = this.getProp('max-size', '50MB');
            const accept = this.getProp('accept', '.pdf');
            const currentMode = this.getMode();
            
            let text = `Maximum file size: ${maxSize}`;
            if (accept) {
                const types = accept.split(',').map(t => t.trim().toUpperCase()).join(', ');
                text += ` • Accepted: ${types}`;
            }
            
            // Mode-specific instructions
            if (currentMode === 'batch') {
                text += ' • Upload multiple files at once';
            } else {
                text += ' • Upload one file at a time';
            }
            
            return text;
        } catch (error) {
            console.warn('Error getting upload subtext:', error);
            return 'File upload area';
        }
    }

    getFileIcon(mimeType) {
        try {
            if (!mimeType) return 'FILE';
            if (mimeType === 'application/pdf') return 'PDF';
            if (mimeType.startsWith('image/')) return 'IMG';
            return 'FILE';
        } catch (error) {
            return 'FILE';
        }
    }

    formatFileSize(bytes) {
        try {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        } catch (error) {
            return 'Unknown size';
        }
    }

    parseFileSize(sizeString) {
        try {
            const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
            const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
            if (!match) return 50 * 1024 * 1024; // Default 50MB
            
            const value = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            return Math.round(value * (units[unit] || 1));
        } catch (error) {
            return 50 * 1024 * 1024; // Default 50MB
        }
    }

    // Public API with error handling
    getFiles() {
        try {
            return this.getState('files') || [];
        } catch (error) {
            console.error('Error getting files:', error);
            return [];
        }
    }

    setFiles(files) {
        try {
            const validFiles = Array.isArray(files) ? files : [];
            this.setState({ files: validFiles });
            this.emit('files-changed', { files: validFiles });
        } catch (error) {
            console.error('Error setting files:', error);
        }
    }

    reset() {
        try {
            this.setState({ 
                files: [], 
                error: null, 
                isDragOver: false, 
                isProcessing: false 
            });
            
            this.dragCounter = 0;
            
            const fileInput = this.$('.file-input');
            if (fileInput) {
                fileInput.value = '';
            }
            
            this.emit('reset');
        } catch (error) {
            console.error('Error resetting component:', error);
        }
    }

    setError(message) {
        try {
            this.setState({ error: message });
        } catch (error) {
            console.error('Error setting error message:', error);
        }
    }

    clearError() {
        try {
            this.setState({ error: null });
        } catch (error) {
            console.error('Error clearing error:', error);
        }
    }
    
    isProcessing() {
        try {
            return this.getState('isProcessing') || false;
        } catch (error) {
            return false;
        }
    }
    
    hasFiles() {
        try {
            return this.getFiles().length > 0;
        } catch (error) {
            return false;
        }
    }
    
    hasError() {
        try {
            return !!this.getState('error');
        } catch (error) {
            return false;
        }
    }
    
    getError() {
        try {
            return this.getState('error');
        } catch (error) {
            return null;
        }
    }
    
    getTotalFileSize() {
        try {
            return this.getFiles().reduce((total, file) => total + (file.size || 0), 0);
        } catch (error) {
            return 0;
        }
    }
    
    getFileCount() {
        try {
            return this.getFiles().length;
        } catch (error) {
            return 0;
        }
    }
    
    setDisabled(disabled) {
        try {
            this.updateProp('disabled', disabled);
        } catch (error) {
            console.error('Error setting disabled state:', error);
        }
    }
    
    isDisabled() {
        try {
            return this.getProp('disabled', false);
        } catch (error) {
            return false;
        }
    }
    
    openFileDialog() {
        try {
            if (this.isDisabled() || this.isProcessing()) return;
            
            const fileInput = this.$('.file-input');
            if (fileInput) {
                fileInput.click();
            }
        } catch (error) {
            console.error('Error opening file dialog:', error);
        }
    }
    
    async validateFiles(files) {
        try {
            const results = [];
            for (const file of files) {
                const validation = await this.validateFile(file);
                results.push({ file, validation });
            }
            return results;
        } catch (error) {
            console.error('Error validating files:', error);
            return [];
        }
    }

    /**
     * Handle attribute changes for dual-mode functionality
     * Implements backward compatibility requirements 4.1, 4.2, 4.3, 4.4, 4.5
     */
    onAttributeChanged(name, oldValue, newValue) {
        try {
            super.onAttributeChanged?.(name, oldValue, newValue);
            
            switch (name) {
                case 'default-mode':
                    // Requirement 4.3: Add default-mode attribute processing with fallback to single mode
                    if (this.isValidModeValue(newValue)) {
                        this.updateProp('default-mode', newValue);
                        // Only change mode if no session preference exists and component is initialized
                        if (this.currentMode && !this.loadSessionPreference()) {
                            const success = this.setMode(newValue);
                            if (success) {
                                this.emit('mode-changed-by-attribute', {
                                    attribute: 'default-mode',
                                    oldValue: oldValue,
                                    newValue: newValue,
                                    currentMode: this.currentMode
                                });
                            }
                        }
                    } else if (newValue !== null) {
                        // Requirement 4.5: Comprehensive error handling for invalid mode values
                        console.warn(`FileUploader: Invalid default-mode value "${newValue}". Ignoring change.`);
                        this.emit('attribute-validation-error', {
                            attribute: 'default-mode',
                            invalidValue: newValue,
                            validValues: ['single', 'batch'],
                            message: `Invalid default-mode "${newValue}". Must be "single" or "batch".`
                        });
                    }
                    break;
                    
                case 'remember-preference':
                    // Requirement 8.5: Handle remember-preference attribute changes
                    const shouldRemember = newValue !== 'false' && newValue !== null;
                    this.updateProp('remember-preference', shouldRemember);
                    
                    // If preference memory is being disabled, optionally clear existing preference
                    if (!shouldRemember && oldValue !== newValue) {
                        console.log('FileUploader: Preference memory disabled');
                        this.emit('preference-memory-changed', {
                            enabled: false,
                            previouslyEnabled: oldValue !== 'false' && oldValue !== null
                        });
                    } else if (shouldRemember && oldValue !== newValue) {
                        console.log('FileUploader: Preference memory enabled');
                        this.emit('preference-memory-changed', {
                            enabled: true,
                            previouslyEnabled: oldValue !== 'false' && oldValue !== null
                        });
                    }
                    break;
                    
                case 'toggle-disabled':
                    // Enhanced toggle-disabled handling
                    const isDisabled = newValue !== null;
                    const wasDisabled = this.isToggleDisabled;
                    
                    this.isToggleDisabled = isDisabled;
                    this.updateProp('toggle-disabled', isDisabled);
                    this.setState({ isToggleDisabled: isDisabled });
                    
                    if (isDisabled !== wasDisabled) {
                        this.emit('toggle-disabled-changed', {
                            disabled: isDisabled,
                            previouslyDisabled: wasDisabled
                        });
                        
                        // Update accessibility attributes
                        this.handleDisabledStateChange();
                    }
                    break;
                    
                case 'multiple':
                    // Requirement 4.1, 4.2: Handle legacy multiple attribute for backward compatibility
                    if (!this.modeTransitioning && this.currentMode) {
                        const hasMultiple = newValue !== null;
                        const targetMode = hasMultiple ? 'batch' : 'single';
                        
                        if (this.currentMode !== targetMode) {
                            console.log(`FileUploader: Multiple attribute changed, switching to ${targetMode} mode`);
                            const success = this.setMode(targetMode);
                            
                            if (success) {
                                // Requirement 4.4: Maintain existing event names and data structures
                                this.emit('mode-changed-by-attribute', {
                                    attribute: 'multiple',
                                    oldValue: oldValue,
                                    newValue: newValue,
                                    currentMode: this.currentMode,
                                    legacyCompatibility: true
                                });
                            } else {
                                console.warn(`FileUploader: Failed to change mode based on multiple attribute change`);
                                this.emit('attribute-mode-change-error', {
                                    attribute: 'multiple',
                                    targetMode: targetMode,
                                    currentMode: this.currentMode,
                                    message: 'Failed to change mode based on multiple attribute'
                                });
                            }
                        }
                    }
                    break;
                    
                case 'disabled':
                    // Handle component disabled state changes
                    const componentDisabled = newValue !== null;
                    this.updateProp('disabled', componentDisabled);
                    
                    // Update toggle disabled state when component is disabled
                    if (componentDisabled) {
                        this.handleDisabledStateChange();
                    }
                    break;
                    
                default:
                    // Handle other attributes that might affect backward compatibility
                    if (['accept', 'max-size'].includes(name)) {
                        this.updateProp(name, newValue);
                    }
                    break;
            }
        } catch (error) {
            console.error('FileUploader: Error handling attribute change:', error);
            
            // Requirement 4.5: Comprehensive error handling
            this.emit('attribute-change-error', {
                attribute: name,
                oldValue: oldValue,
                newValue: newValue,
                error: error.message,
                originalError: error
            });
        }
    }

    /**
     * Public API method to toggle between modes
     * @returns {boolean} True if toggle was successful
     */
    toggleMode() {
        try {
            const newMode = this.currentMode === 'single' ? 'batch' : 'single';
            return this.setMode(newMode);
        } catch (error) {
            console.error('Error toggling mode:', error);
            return false;
        }
    }

    /**
     * Toggle mode with trigger information for event emission
     * @param {string} triggeredBy - What triggered the toggle ('click', 'keyboard', 'programmatic')
     * @returns {boolean} True if toggle was successful
     */
    toggleModeWithTrigger(triggeredBy = 'programmatic') {
        try {
            const newMode = this.currentMode === 'single' ? 'batch' : 'single';
            return this.switchMode(newMode, triggeredBy);
        } catch (error) {
            console.error('Error toggling mode with trigger:', error);
            return false;
        }
    }

    /**
     * Check if the toggle is currently disabled
     * @returns {boolean} True if toggle is disabled
     */
    isToggleDisabledState() {
        return this.isToggleDisabled || this.modeTransitioning || this.getProp('disabled', false);
    }

    /**
     * Handle focus management when component disabled state changes (Requirement 5.5)
     */
    handleDisabledStateChange() {
        try {
            const toggleSwitch = this.$('.toggle-switch');
            const isDisabled = this.isToggleDisabledState();
            
            if (toggleSwitch) {
                if (isDisabled) {
                    // Remove focus if toggle becomes disabled
                    if (document.activeElement === toggleSwitch) {
                        toggleSwitch.blur();
                        
                        // Move focus to next focusable element or upload area
                        const uploadArea = this.$('.upload-area');
                        if (uploadArea && !this.getProp('disabled', false)) {
                            uploadArea.focus();
                        }
                    }
                    
                    // Update tabindex and ARIA attributes
                    toggleSwitch.setAttribute('tabindex', '-1');
                    toggleSwitch.setAttribute('aria-disabled', 'true');
                    
                    // Announce state change to screen readers
                    this.announceToScreenReader('Toggle has been disabled');
                } else {
                    // Re-enable focus
                    toggleSwitch.setAttribute('tabindex', '0');
                    toggleSwitch.setAttribute('aria-disabled', 'false');
                    
                    // Announce state change to screen readers
                    this.announceToScreenReader('Toggle has been enabled');
                }
                
                // Update UI state
                this.updateToggleUIState();
            }
        } catch (error) {
            console.error('Error handling disabled state change:', error);
        }
    }

    /**
     * Get mode configuration for UI rendering
     * @returns {Object} Mode configuration object
     */
    getModeConfig() {
        try {
            const mode = this.getMode();
            const configs = {
                single: {
                    multiple: false,
                    maxFiles: 1,
                    label: 'Single File',
                    instructions: 'Drop your PDF here or click to browse',
                    ariaLabel: 'Single file upload area',
                    icon: 'single-file',
                    description: 'Upload one file at a time',
                    dragMessage: 'Drop file here',
                    processingMessage: 'Processing file...',
                    emptyMessage: 'No file selected'
                },
                batch: {
                    multiple: true,
                    maxFiles: Infinity,
                    label: 'Batch Files',
                    instructions: 'Drop your files here or click to browse',
                    ariaLabel: 'Multiple files upload area',
                    icon: 'batch-files',
                    description: 'Upload multiple files together',
                    dragMessage: 'Drop files here',
                    processingMessage: 'Processing files...',
                    emptyMessage: 'No files selected'
                }
            };
            
            return configs[mode] || configs.single;
        } catch (error) {
            console.error('Error getting mode config:', error);
            return {
                multiple: false,
                maxFiles: 1,
                label: 'Single File',
                instructions: 'Drop your file here or click to browse',
                ariaLabel: 'File upload area',
                icon: 'single-file',
                description: 'Upload files',
                dragMessage: 'Drop file here',
                processingMessage: 'Processing...',
                emptyMessage: 'No files selected'
            };
        }
    }

    /**
     * Get mode-specific CSS classes for styling
     * @returns {string} Space-separated CSS classes
     */
    getModeSpecificClasses() {
        try {
            const mode = this.getMode();
            const state = this.getState() || {};
            
            const classes = [`mode-${mode}`];
            
            if (state.modeTransitioning) {
                classes.push('mode-transitioning');
            }
            
            if (mode === 'batch') {
                classes.push('supports-multiple');
            } else {
                classes.push('single-only');
            }
            
            return classes.join(' ');
        } catch (error) {
            console.error('Error getting mode-specific classes:', error);
            return 'mode-single';
        }
    }

    /**
     * Get current files array
     * @returns {Array} Current files
     */
    getFiles() {
        try {
            return this.getState('files') || [];
        } catch (error) {
            console.error('Error getting files:', error);
            return [];
        }
    }

    /**
     * Announce mode change to screen readers with context
     * @param {string} newMode - The new mode
     * @param {Object} context - Additional context for the announcement
     */
    announceModeChange(newMode, context = {}) {
        try {
            const modeConfig = this.getModeConfig();
            const filesCount = context.filesAffected || 0;
            const triggeredBy = context.triggeredBy || 'unknown';
            
            let message = `Mode changed to ${modeConfig.label}. ${modeConfig.description}.`;
            
            if (filesCount > 0) {
                if (newMode === 'single' && filesCount > 1) {
                    message += ` ${filesCount} files were selected, but only the first file will be kept in single file mode.`;
                } else if (filesCount === 1) {
                    message += ` 1 file is currently selected.`;
                } else if (filesCount > 1) {
                    message += ` ${filesCount} files are currently selected.`;
                }
            } else {
                message += ' No files are currently selected.';
            }
            
            // Add trigger context for accessibility
            if (triggeredBy === 'keyboard') {
                message += ' Use Tab to navigate to other controls.';
            }
            
            this.announceToScreenReader(message);
        } catch (error) {
            console.error('Error announcing mode change:', error);
        }
    }

    /**
     * Validate if a mode value is valid
     * @param {string} mode - Mode value to validate
     * @returns {boolean} True if mode is valid
     */
    isValidModeValue(mode) {
        return typeof mode === 'string' && (mode === 'single' || mode === 'batch');
    }

    /**
     * Get all existing component methods for backward compatibility verification
     * Requirement 4.2: Ensure all existing component methods continue to work unchanged
     * @returns {Array} List of public method names
     */
    getPublicMethods() {
        return [
            // File management methods
            'getFiles', 'setFiles', 'addFiles', 'removeFile', 'clearFiles',
            // State methods
            'reset', 'setError', 'clearError', 'isProcessing', 'hasFiles', 'hasError', 'getError',
            // Utility methods
            'getTotalFileSize', 'getFileCount', 'setDisabled', 'isDisabled', 'openFileDialog',
            // Validation methods
            'validateFiles', 'validateFile',
            // New dual-mode methods (additive only)
            'getMode', 'setMode', 'toggleMode'
        ];
    }

    /**
     * Verify backward compatibility by checking that all expected methods exist
     * @returns {Object} Compatibility check results
     */
    verifyBackwardCompatibility() {
        try {
            const expectedMethods = this.getPublicMethods();
            const missingMethods = [];
            const availableMethods = [];
            
            expectedMethods.forEach(methodName => {
                if (typeof this[methodName] === 'function') {
                    availableMethods.push(methodName);
                } else {
                    missingMethods.push(methodName);
                }
            });
            
            const isCompatible = missingMethods.length === 0;
            
            return {
                compatible: isCompatible,
                availableMethods: availableMethods,
                missingMethods: missingMethods,
                totalExpected: expectedMethods.length,
                totalAvailable: availableMethods.length
            };
        } catch (error) {
            console.error('FileUploader: Error verifying backward compatibility:', error);
            return {
                compatible: false,
                error: error.message,
                availableMethods: [],
                missingMethods: [],
                totalExpected: 0,
                totalAvailable: 0
            };
        }
    }

    /**
     * Announce text to screen readers using aria-live region
     * @param {string} message - The message to announce
     */
    announceToScreenReader(message) {
        try {
            // Create or find existing aria-live region
            let liveRegion = document.getElementById('file-uploader-announcements');
            if (!liveRegion) {
                liveRegion = document.createElement('div');
                liveRegion.id = 'file-uploader-announcements';
                liveRegion.setAttribute('aria-live', 'polite');
                liveRegion.setAttribute('aria-atomic', 'true');
                liveRegion.style.position = 'absolute';
                liveRegion.style.left = '-10000px';
                liveRegion.style.width = '1px';
                liveRegion.style.height = '1px';
                liveRegion.style.overflow = 'hidden';
                document.body.appendChild(liveRegion);
            }
            
            // Clear previous message and set new one
            liveRegion.textContent = '';
            setTimeout(() => {
                liveRegion.textContent = message;
            }, 100);
            
            // Clear the message after it's been announced
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 5000);
        } catch (error) {
            console.error('Error announcing to screen reader:', error);
        }
    }
}

// Define the custom element
BaseComponent.define('file-uploader', FileUploader);