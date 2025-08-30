/**
 * StorageService Tests
 * Tests for the new StorageService API
 */

import { StorageService } from './storage-service.js';

describe('StorageService', () => {
    let storageService;
    let mockFile;
    let mockBlob;

    beforeEach(async () => {
        storageService = new StorageService();
        await storageService.init();

        // Create mock file data
        mockBlob = new Blob(['test file content'], { type: 'application/pdf' });
        mockFile = {
            name: 'test.pdf',
            size: mockBlob.size,
            type: 'application/pdf'
        };

        // Clear any existing data
        storageService.clear();
    });

    afterEach(() => {
        storageService.clear();
    });

    describe('File Operations', () => {
        test('saveFile should store file with metadata', async () => {
            const fileId = 'test-file-1';
            const metadata = {
                name: mockFile.name,
                type: 'original',
                processingType: null
            };

            const result = await storageService.saveFile(fileId, mockBlob, metadata);

            expect(result).toBe(true);
            expect(storageService.fileMetadata.has(fileId)).toBe(true);
            expect(storageService.fileStorage.has(fileId)).toBe(true);
        });

        test('getFile should retrieve file with blob and metadata', async () => {
            const fileId = 'test-file-2';
            const metadata = {
                name: mockFile.name,
                type: 'original'
            };

            // Save file first
            await storageService.saveFile(fileId, mockBlob, metadata);

            // Retrieve file
            const retrievedFile = await storageService.getFile(fileId);

            expect(retrievedFile).not.toBeNull();
            expect(retrievedFile.id).toBe(fileId);
            expect(retrievedFile.blob).toBeInstanceOf(Blob);
            expect(retrievedFile.metadata.name).toBe(mockFile.name);
            expect(retrievedFile.metadata.type).toBe('original');
        });

        test('getFileMetadata should return metadata only', async () => {
            const fileId = 'test-file-3';
            const metadata = {
                name: mockFile.name,
                type: 'processed',
                originalFileId: 'original-file-1'
            };

            // Save file first
            await storageService.saveFile(fileId, mockBlob, metadata);

            // Get metadata
            const retrievedMetadata = await storageService.getFileMetadata(fileId);

            expect(retrievedMetadata).not.toBeNull();
            expect(retrievedMetadata.name).toBe(mockFile.name);
            expect(retrievedMetadata.type).toBe('processed');
            expect(retrievedMetadata.originalFileId).toBe('original-file-1');
            expect(retrievedMetadata.processed).toBe(true);
        });

        test('getAllFiles should return all stored files', async () => {
            // Save multiple files
            await storageService.saveFile('file-1', mockBlob, { name: 'file1.pdf', type: 'original' });
            await storageService.saveFile('file-2', mockBlob, { name: 'file2.pdf', type: 'processed' });
            await storageService.saveFile('file-3', mockBlob, { name: 'file3.pdf', type: 'original' });

            const allFiles = await storageService.getAllFiles();

            expect(allFiles).toHaveLength(3);
            expect(allFiles[0].metadata.name).toBeDefined();
            expect(allFiles[0].metadata.type).toBeDefined();
        });

        test('deleteFile should remove file and emit event', async () => {
            const fileId = 'test-file-delete';
            let deleteEventFired = false;

            // Listen for delete event
            storageService.addEventListener('fileDeleted', (event) => {
                deleteEventFired = true;
                expect(event.detail.fileId).toBe(fileId);
            });

            // Save file first
            await storageService.saveFile(fileId, mockBlob, { name: 'delete-test.pdf', type: 'original' });

            // Delete file
            const result = await storageService.deleteFile(fileId);

            expect(result).toBe(true);
            expect(storageService.fileMetadata.has(fileId)).toBe(false);
            expect(storageService.fileStorage.has(fileId)).toBe(false);
            expect(deleteEventFired).toBe(true);
        });

        test('updateMetadata should update file metadata', async () => {
            const fileId = 'test-file-update';
            const originalMetadata = {
                name: 'original.pdf',
                type: 'original'
            };

            // Save file first
            await storageService.saveFile(fileId, mockBlob, originalMetadata);

            // Update metadata
            const updatedMetadata = {
                name: 'updated.pdf',
                processingType: 'compression'
            };

            const result = await storageService.updateMetadata(fileId, updatedMetadata);

            expect(result).toBe(true);

            // Verify update
            const metadata = await storageService.getFileMetadata(fileId);
            expect(metadata.name).toBe('updated.pdf');
            expect(metadata.processingType).toBe('compression');
            expect(metadata.type).toBe('original'); // Should preserve original type
        });
    });

    describe('Event Emission', () => {
        test('should emit progress events during saveFile', async () => {
            const progressEvents = [];

            storageService.addEventListener('progress', (event) => {
                progressEvents.push(event.detail);
            });

            await storageService.saveFile('test-progress', mockBlob, { name: 'test.pdf' });

            expect(progressEvents.length).toBeGreaterThan(0);
            expect(progressEvents[0].percentage).toBe(0);
            expect(progressEvents[progressEvents.length - 1].percentage).toBe(100);
        });

        test('should emit complete event after successful save', async () => {
            let completeEventFired = false;

            storageService.addEventListener('complete', (event) => {
                completeEventFired = true;
                expect(event.detail.result.fileId).toBeDefined();
            });

            await storageService.saveFile('test-complete', mockBlob, { name: 'test.pdf' });

            expect(completeEventFired).toBe(true);
        });

        test('should emit error event on failure', async () => {
            let errorEventFired = false;

            storageService.addEventListener('error', (event) => {
                errorEventFired = true;
                expect(event.detail.error).toBeDefined();
            });

            // Try to save with invalid parameters
            await storageService.saveFile(null, null);

            expect(errorEventFired).toBe(true);
        });
    });

    describe('Backward Compatibility', () => {
        test('legacy setItem/getItem methods should still work', async () => {
            const key = 'legacy-test';
            const value = { test: 'data' };

            const setResult = await storageService.setItem(key, value);
            expect(setResult).toBe(true);

            const retrievedValue = await storageService.getItem(key);
            expect(retrievedValue).toEqual(value);
        });

        test('should maintain existing utility methods', () => {
            expect(typeof storageService.setObject).toBe('function');
            expect(typeof storageService.getArray).toBe('function');
            expect(typeof storageService.setCache).toBe('function');
        });
    });

    describe('File Type Differentiation', () => {
        test('should differentiate between original and processed files', async () => {
            const originalId = 'original-file';
            const processedId = 'processed-file';

            await storageService.saveFile(originalId, mockBlob, {
                name: 'original.pdf',
                type: 'original'
            });

            await storageService.saveFile(processedId, mockBlob, {
                name: 'compressed.pdf',
                type: 'processed',
                originalFileId: originalId,
                processingType: 'compression'
            });

            const originalMetadata = await storageService.getFileMetadata(originalId);
            const processedMetadata = await storageService.getFileMetadata(processedId);

            expect(originalMetadata.type).toBe('original');
            expect(originalMetadata.processed).toBe(false);

            expect(processedMetadata.type).toBe('processed');
            expect(processedMetadata.processed).toBe(true);
            expect(processedMetadata.originalFileId).toBe(originalId);
        });
    });
});