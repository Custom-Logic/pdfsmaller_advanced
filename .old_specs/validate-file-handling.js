/**
 * Validation script for file handling adaptation functionality
 * Tests the core logic without requiring a browser environment
 */

// Mock File objects for testing
class MockFile {
    constructor(name, size = 1024, type = 'application/pdf') {
        this.name = name;
        this.size = size;
        this.type = type;
    }
}

// Mock FileUploader class with just the file handling methods
class MockFileUploader {
    constructor(mode = 'single') {
        this.currentMode = mode;
    }

    getMode() {
        return this.currentMode;
    }

    setMode(mode) {
        this.currentMode = mode;
    }

    /**
     * Adapt files when switching modes
     * @param {string} mode - The target mode
     * @returns {Array} Adapted files array
     */
    adaptFilesForMode(mode) {
        try {
            const currentFiles = this.files || [];
            
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

    setFiles(files) {
        this.files = files;
    }

    getFiles() {
        return this.files || [];
    }
}

// Test functions
function runTests() {
    console.log('🧪 Running File Handling Adaptation Tests\n');

    // Test 1: Requirement 3.1 - Single mode file selection
    console.log('📋 Test 1: Single File Mode - Multiple File Selection (Requirement 3.1)');
    const uploader1 = new MockFileUploader('single');
    const files1 = [
        new MockFile('file1.pdf'),
        new MockFile('file2.pdf'),
        new MockFile('file3.pdf')
    ];
    
    const result1 = uploader1.validateFilesForMode(files1, 'selection');
    console.log(`   Input: ${files1.length} files`);
    console.log(`   Output: ${result1.adaptedFiles.length} files`);
    console.log(`   Selected: ${result1.adaptedFiles[0]?.name}`);
    console.log(`   Expected: file3.pdf (last file)`);
    console.log(`   ✅ Pass: ${result1.adaptedFiles[0]?.name === 'file3.pdf' && result1.adaptedFiles.length === 1}`);
    console.log(`   Warnings: ${result1.warnings.join(', ')}\n`);

    // Test 2: Requirement 3.2 - Single mode drag & drop
    console.log('📋 Test 2: Single File Mode - Multiple File Drag & Drop (Requirement 3.2)');
    const uploader2 = new MockFileUploader('single');
    const files2 = [
        new MockFile('dropped1.pdf'),
        new MockFile('dropped2.pdf'),
        new MockFile('dropped3.pdf')
    ];
    
    const result2 = uploader2.validateFilesForMode(files2, 'drop');
    console.log(`   Input: ${files2.length} files`);
    console.log(`   Output: ${result2.adaptedFiles.length} files`);
    console.log(`   Selected: ${result2.adaptedFiles[0]?.name}`);
    console.log(`   Expected: dropped1.pdf (first file)`);
    console.log(`   ✅ Pass: ${result2.adaptedFiles[0]?.name === 'dropped1.pdf' && result2.adaptedFiles.length === 1}`);
    console.log(`   Warnings: ${result2.warnings.join(', ')}\n`);

    // Test 3: Requirement 3.3 - Batch mode multiple files
    console.log('📋 Test 3: Batch Mode - Multiple Files (Requirement 3.3)');
    const uploader3 = new MockFileUploader('batch');
    const files3 = [
        new MockFile('batch1.pdf'),
        new MockFile('batch2.pdf'),
        new MockFile('batch3.pdf')
    ];
    
    const result3 = uploader3.validateFilesForMode(files3, 'selection');
    console.log(`   Input: ${files3.length} files`);
    console.log(`   Output: ${result3.adaptedFiles.length} files`);
    console.log(`   Expected: 3 files (all files)`);
    console.log(`   ✅ Pass: ${result3.adaptedFiles.length === 3 && !result3.filesAdapted}`);
    console.log(`   Warnings: ${result3.warnings.join(', ') || 'None'}\n`);

    // Test 4: Requirement 3.4 - Batch to single mode transition
    console.log('📋 Test 4: Mode Transition - Batch to Single (Requirement 3.4)');
    const uploader4 = new MockFileUploader('batch');
    const files4 = [
        new MockFile('transition1.pdf'),
        new MockFile('transition2.pdf'),
        new MockFile('transition3.pdf')
    ];
    
    uploader4.setFiles(files4);
    const adaptedFiles4 = uploader4.adaptFilesForMode('single');
    console.log(`   Original files: ${files4.length}`);
    console.log(`   After transition: ${adaptedFiles4.length} files`);
    console.log(`   Kept file: ${adaptedFiles4[0]?.name}`);
    console.log(`   Expected: transition1.pdf (first file)`);
    console.log(`   ✅ Pass: ${adaptedFiles4[0]?.name === 'transition1.pdf' && adaptedFiles4.length === 1}\n`);

    // Test 5: Requirement 3.5 - Single to batch mode transition
    console.log('📋 Test 5: Mode Transition - Single to Batch (Requirement 3.5)');
    const uploader5 = new MockFileUploader('single');
    const files5 = [new MockFile('single.pdf')];
    
    uploader5.setFiles(files5);
    const adaptedFiles5 = uploader5.adaptFilesForMode('batch');
    console.log(`   Original files: ${files5.length}`);
    console.log(`   After transition: ${adaptedFiles5.length} files`);
    console.log(`   Maintained file: ${adaptedFiles5[0]?.name}`);
    console.log(`   Expected: single.pdf (same file)`);
    console.log(`   ✅ Pass: ${adaptedFiles5[0]?.name === 'single.pdf' && adaptedFiles5.length === 1}\n`);

    console.log('🎉 All tests completed!');
}

// Run the tests
runTests();