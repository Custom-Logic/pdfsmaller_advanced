/**
 * SimpleFileUploader Tests
 * Tests for the new simplified FileUploader component
 */

import { SimpleFileUploader } from './simple-file-uploader.js';

describe('SimpleFileUploader', () => {
    let uploader;
    let mockFile;

    beforeEach(async () => {
        // Create component
        uploader = new SimpleFileUploader();
        document.body.appendChild(uploader);
        
        // Wait for initialization
        await new Promise(resolve => {
            uploader.addEventListener('initialized', resolve);
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

    describe('Initialization', () => {
        test('should initialize successfully', () => {
            expect(uploader.storageService).toBeDefined();
            expect(uploader.acceptedTypes).toEqual(['.pdf']);
            expect(uploader.maxFileSize).toBe(50 * 1024 * 1024);
        });

        test('should emit initialized event', (done) => {
            const newUploader = new SimpleFileUploader();
            newUploader.addEventListener('initialized', (event) => {
                expect(event.detail.success).toBe(true);
                done();
            });
            document.body.appendChild(newUploader);
            newUploader.connectedCallback();
        });
    });

    describe('File Validation', () => {
        test('should validate file size', () => {
            const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
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

        test('should emit validation error event for invalid files', (done) => {
            const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
            
            uploader.addEventListener('fileValidationError', (event) => {
                expect(event.detail.errors).toHaveLength(1);
                expect(event.detail.rejectedFiles).toHaveLength(1);
                done();
            });
            
            uploader.validateFiles([invalidFile]);
        });
    });

    describe('File Upload Events', () => {
        test('should emit fileUploaded event when files are selected', (done) => {
            uploader.addEventListener('fileUploaded', (event) => {
                expect(event.detail.files).toHaveLength(1);
                expect(event.detail.files[0].name).toBe('test.pdf');
                expect(event.detail.source).toBe('selection');
                done();
            });
            
            uploader.handleFileSelection([mockFile]);
        });

        test('should save files to StorageService', async () => {
            const spy = jest.spyOn(uploader.storageService, 'saveFile').mockResolvedValue(true);
            
            await uploader.handleFileSelection([mockFile]);
            
            expect(spy).toHaveBeenCalledWith(
                expect.any(String),
                mockFile,
                expect.objectContaining({
                    name: 'test.pdf',
                    type: 'original'
                })
            );
        });
    });

    describe('Public API', () => {
        test('getSelectedFiles should return current files', async () => {
            await uploader.handleFileSelection([mockFile]);
            const files = uploader.getSelectedFiles();
            
            expect(files).toHaveLength(1);
        });

        test('clearFiles should remove all files', async () => {
            await uploader.handleFileSelection([mockFile]);
            uploader.clearFiles();
            
            const files = uploader.getSelectedFiles();
            expect(files).toHaveLength(0);
        });

        test('setAcceptedTypes should update accepted file types', () => {
            uploader.setAcceptedTypes(['.jpg', '.png']);
            
            expect(uploader.acceptedTypes).toEqual(['.jpg', '.png']);
        });

        test('setMaxFileSize should update max file size', () => {
            uploader.setMaxFileSize('10MB');
            
            expect(uploader.maxFileSize).toBe(10 * 1024 * 1024);
        });

        test('setMultiple should update multiple file support', () => {
            uploader.setMultiple(true);
            
            expect(uploader.isMultiple).toBe(true);
        });

        test('setDisabled should update disabled state', () => {
            uploader.setDisabled(true);
            
            expect(uploader.isDisabled).toBe(true);
        });
    });

    describe('Event-Driven Architecture', () => {
        test('should only emit events, not call services directly', () => {
            // Verify component doesn't have direct service method calls
            const componentMethods = Object.getOwnPropertyNames(SimpleFileUploader.prototype);
            const businessLogicMethods = ['compress', 'convert', 'process'];
            
            businessLogicMethods.forEach(method => {
                expect(componentMethods).not.toContain(method);
            });
        });

        test('should emit events with proper detail structure', (done) => {
            uploader.addEventListener('fileUploaded', (event) => {
                expect(event.detail).toHaveProperty('files');
                expect(event.detail).toHaveProperty('source');
                expect(event.detail).toHaveProperty('timestamp');
                expect(Array.isArray(event.detail.files)).toBe(true);
                done();
            });
            
            uploader.handleFileSelection([mockFile]);
        });
    });

    describe('Backward Compatibility', () => {
        test('should maintain existing public API methods', () => {
            const expectedMethods = [
                'getSelectedFiles',
                'clearFiles', 
                'setAcceptedTypes',
                'setMaxFileSize',
                'setMultiple',
                'setDisabled'
            ];
            
            expectedMethods.forEach(method => {
                expect(typeof uploader[method]).toBe('function');
            });
        });
    });
});