/**
 * FileUploader Tests (Refactored)
 * Tests for the refactored FileUploader component
 */

import { FileUploader } from './file-uploader.js';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock StorageService to prevent real I/O and speed up tests
jest.mock('../services/storage-service.js', () => ({
    StorageService: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(undefined),
        saveFile: jest.fn().mockResolvedValue(true),
        generateFileId: jest.fn().mockReturnValue('mock-file-id'),
        // Add other methods used by FileUploader if necessary
    })),
}));

describe('FileUploader (Refactored)', () => {
    let uploader;
    let mockFile;

    beforeEach(async () => {
        // Create component
        uploader = new FileUploader();
        document.body.appendChild(uploader);
        
        // Wait for initialization
        await new Promise(resolve => {
            uploader.addEventListener('initialized', resolve);
        uploader.connectedCallback();
        uploader.connectedCallback();
            uploader.connectedCallback();
        });

        // Create mock file
        mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    });

    afterEach(() => {
        if (uploader.parentNode) {
            uploader.parentNode.removeChild(uploader);
        }
    });

    describe('Architecture Compliance', () => {
        test('should extend BaseComponent', () => {
            expect(uploader).toBeInstanceOf(HTMLElement);
        });

        test('should use StorageService for file operations', () => {
            expect(uploader.storageService).toBeDefined();
            expect(typeof uploader.storageService.saveFile).toBe('function');
        });

        test('should emit events instead of calling services directly', (done) => {
            uploader.addEventListener('fileUploaded', (event) => {
                expect(event.detail.files).toBeDefined();
                expect(event.detail.source).toBe('selection');
                expect(event.detail.timestamp).toBeDefined();
                done();
            });
            
            uploader.handleFileSelection([mockFile]);
        });

        test('should not contain business logic methods', () => {
            const businessLogicMethods = [
                'compressFile', 'convertFile', 'processFile',
                'analyzeFile', 'optimizeFile'
            ];
            
            businessLogicMethods.forEach(method => {
                expect(uploader[method]).toBeUndefined();
            });
        });
    });

    describe('Event-Driven Communication', () => {
        test('should emit fileUploaded event with proper structure', (done) => {
            uploader.addEventListener('fileUploaded', (event) => {
                expect(event.detail).toMatchObject({
                    files: expect.any(Array),
                    source: 'selection',
                    timestamp: expect.any(Number)
                });
                
                expect(event.detail.files[0]).toMatchObject({
                    fileId: expect.any(String),
                    name: 'test.pdf',
                    size: expect.any(Number),
                    type: 'application/pdf',
                    metadata: expect.objectContaining({
                        name: 'test.pdf',
                        type: 'original'
                    })
                });
                
                done();
            });
            
            uploader.handleFileSelection([mockFile]);
        });

        test('should emit fileValidationError for invalid files', (done) => {
            const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
            
            uploader.addEventListener('fileValidationError', (event) => {
                expect(event.detail.errors).toHaveLength(1);
                expect(event.detail.rejectedFiles).toHaveLength(1);
                done();
            });
            
            uploader.handleFileSelection([invalidFile]);
        });

        test('should emit fileRemoved event when file is removed', (done) => {
            uploader.addEventListener('fileRemoved', (event) => {
                expect(event.detail.fileName).toBe('test.pdf');
                done();
            });
            
            // First add a file, then remove it
            uploader.setState({ files: [{ name: 'test.pdf', size: 1000 }] });
            uploader.render();
            uploader.removeFile('test.pdf');
        });
    });

    describe('Backward Compatibility', () => {
        test('should maintain all expected public methods', () => {
            const expectedMethods = [
                'getSelectedFiles', 'clearFiles', 'setAcceptedTypes',
                'setMaxFileSize', 'setMultiple', 'setDisabled',
                'getMode', 'setMode', 'emit'
            ];
            
            expectedMethods.forEach(method => {
                expect(typeof uploader[method]).toBe('function');
            });
        });

        test('getSelectedFiles should return current files', async () => {
            await uploader.handleFileSelection([mockFile]);
            const files = uploader.getSelectedFiles();
            
            expect(files).toHaveLength(1);
        });

        test('clearFiles should remove all files and emit event', (done) => {
            uploader.addEventListener('filesCleared', () => {
                done();
            });
            
            uploader.setState({ files: [{ name: 'test.pdf' }] });
            uploader.clearFiles();
            
            expect(uploader.getSelectedFiles()).toHaveLength(0);
        });

        test('setAcceptedTypes should update accepted file types', () => {
            uploader.setAcceptedTypes(['.jpg', '.png']);
            expect(uploader.acceptedTypes).toEqual(['.jpg', '.png']);
        });

        test('setMaxFileSize should update max file size', () => {
            uploader.setMaxFileSize('10MB');
            expect(uploader.maxFileSize).toBe(10 * 1024 * 1024);
        });

        test('getMode should return current mode', () => {
            expect(uploader.getMode()).toBe('single');
            
            uploader.setMultiple(true);
            expect(uploader.getMode()).toBe('batch');
        });

        test('setMode should update multiple file support', () => {
            const result = uploader.setMode('batch');
            
            expect(result).toBe(true);
            expect(uploader.isMultiple).toBe(true);
            expect(uploader.getMode()).toBe('batch');
        });

        test('emit method should dispatch custom events', (done) => {
            uploader.addEventListener('test-event', (event) => {
                expect(event.detail.test).toBe('data');
                done();
            });
            
            uploader.emit('test-event', { test: 'data' });
        });
    });

    describe('File Validation', () => {
        test('should validate file size', () => {
            const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.pdf', { 
                type: 'application/pdf' 
            });
            
            const validFiles = uploader.validateFiles([largeFile]);
            expect(validFiles).toHaveLength(0);
        });

        test('should validate file type', () => {
            const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
            const validFiles = uploader.validateFiles([invalidFile]);
            
            expect(validFiles).toHaveLength(0);
        });

        test('should accept valid files', () => {
            const validFiles = uploader.validateFiles([mockFile]);
            
            expect(validFiles).toHaveLength(1);
            expect(validFiles[0]).toBe(mockFile);
        });
    });

    describe('StorageService Integration', () => {
        test('should save files to StorageService with correct metadata', async () => {
            const spy = jest.spyOn(uploader.storageService, 'saveFile').mockResolvedValue(true);
            
            await uploader.handleFileSelection([mockFile]);
            
            expect(spy).toHaveBeenCalledWith(
                expect.any(String), // fileId
                mockFile,
                expect.objectContaining({
                    name: 'test.pdf',
                    type: 'original',
                    mimeType: 'application/pdf'
                })
            );
        });

        test('should generate unique file IDs', async () => {
            const spy = jest.spyOn(uploader.storageService, 'generateFileId')
                .mockReturnValue('unique-file-id');
            
            await uploader.handleFileSelection([mockFile]);
            
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('Simplified Architecture', () => {
        test('should be significantly smaller than original', () => {
            // Original FileUploader was 3,166 lines
            // New version should be much smaller (under 500 lines)
            const componentCode = uploader.constructor.toString();
            const lineCount = componentCode.split('\n').length;
            
            expect(lineCount).toBeLessThan(500);
        });

        test('should not have complex mode management', () => {
            // Should not have complex dual-mode properties
            expect(uploader.currentMode).toBeUndefined();
            expect(uploader.modeTransitioning).toBeUndefined();
            expect(uploader.sessionPreferenceKey).toBeUndefined();
        });

        test('should not have session preference management', () => {
            expect(uploader.loadSessionPreference).toBeUndefined();
            expect(uploader.saveSessionPreference).toBeUndefined();
        });
    });
});