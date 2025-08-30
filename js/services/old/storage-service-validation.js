/**
 * StorageService Validation Script
 * Simple validation to ensure the new API works correctly
 */

import { StorageService } from './storage-service.js';

async function validateStorageService() {
    console.log('🔍 Validating StorageService API...');
    
    try {
        // Initialize service
        const storage = new StorageService();
        await storage.init();
        console.log('✅ StorageService initialized successfully');
        
        // Test file save
        const testBlob = new Blob(['test content'], { type: 'text/plain' });
        const fileId = 'validation-test-file';
        const metadata = {
            name: 'test.txt',
            type: 'original'
        };
        
        const saveResult = await storage.saveFile(fileId, testBlob, metadata);
        console.log('✅ saveFile() works:', saveResult);
        
        // Test file retrieval
        const retrievedFile = await storage.getFile(fileId);
        console.log('✅ getFile() works:', retrievedFile !== null);
        
        // Test metadata retrieval
        const metadata2 = await storage.getFileMetadata(fileId);
        console.log('✅ getFileMetadata() works:', metadata2 !== null);
        
        // Test get all files
        const allFiles = await storage.getAllFiles();
        console.log('✅ getAllFiles() works:', allFiles.length > 0);
        
        // Test file deletion
        const deleteResult = await storage.deleteFile(fileId);
        console.log('✅ deleteFile() works:', deleteResult);
        
        // Test backward compatibility
        const legacyResult = await storage.setItem('legacy-test', 'test-value');
        const legacyValue = await storage.getItem('legacy-test');
        console.log('✅ Backward compatibility works:', legacyValue === 'test-value');
        
        console.log('🎉 All StorageService API validations passed!');
        return true;
        
    } catch (error) {
        console.error('❌ StorageService validation failed:', error);
        return false;
    }
}

// Export for use in other modules
export { validateStorageService };

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    validateStorageService();
}