# PDFSmaller Technical Implementation Guide

## Quick Start Implementation

### 1. Frontend Module System Setup

#### 1.1 Update `frontend/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDFSmaller - Intelligent PDF Compression</title>
    <link rel="stylesheet" href="css/app.css">
</head>
<body>
    <div id="app">
        <header class="app-header">
            <h1>PDFSmaller</h1>
            <nav class="main-nav">
                <button id="upload-btn" class="btn-primary">Upload PDF</button>
                <button id="settings-btn" class="btn-secondary">Settings</button>
            </nav>
        </header>
        
        <main class="app-main">
            <div id="upload-area" class="upload-area">
                <div class="upload-prompt">
                    <p>Drag & drop your PDF here or click to browse</p>
                    <input type="file" id="file-input" accept=".pdf" multiple hidden>
                </div>
            </div>
            
            <div id="compression-panel" class="compression-panel" hidden>
                <div class="file-info">
                    <h3 id="file-name"></h3>
                    <p id="file-size"></p>
                    <p id="page-count"></p>
                </div>
                
                <div class="compression-settings">
                    <label for="quality-select">Quality:</label>
                    <select id="quality-select">
                        <option value="high">High Quality</option>
                        <option value="medium">Medium Quality</option>
                        <option value="low">Low Quality</option>
                    </select>
                    
                    <button id="compress-btn" class="btn-primary">Compress PDF</button>
                </div>
                
                <div id="progress-container" class="progress-container" hidden>
                    <div class="progress-bar">
                        <div id="progress-fill" class="progress-fill"></div>
                    </div>
                    <p id="progress-text">Processing...</p>
                </div>
            </div>
            
            <div id="results-panel" class="results-panel" hidden>
                <h3>Compression Complete!</h3>
                <div class="result-stats">
                    <p>Original size: <span id="original-size"></span></p>
                    <p>Compressed size: <span id="compressed-size"></span></p>
                    <p>Compression ratio: <span id="compression-ratio"></span></p>
                </div>
                <button id="download-btn" class="btn-primary">Download</button>
            </div>
        </main>
    </div>
    
    <script type="module" src="js/main.js"></script>
</body>
</html>
```

#### 1.2 Create Core Application Module (`frontend/js/modules/app.js`)
```javascript
export class App {
    constructor() {
        this.modules = new Map();
        this.currentFile = null;
        this.init();
    }
    
    async init() {
        await this.loadModules();
        this.setupEventListeners();
        this.initializeComponents();
    }
    
    async loadModules() {
        // Dynamic module loading
        const { CompressionManager } = await import('./compression.js');
        const { UploadManager } = await import('./upload.js');
        const { ResultsDisplay } = await import('./results.js');
        
        this.modules.set('compression', new CompressionManager());
        this.modules.set('upload', new UploadManager());
        this.modules.set('results', new ResultsDisplay());
    }
    
    setupEventListeners() {
        // File upload handling
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });
        
        // Drag and drop
        const uploadArea = document.getElementById('upload-area');
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        uploadArea.addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        // Compression button
        document.getElementById('compress-btn').addEventListener('click', () => {
            this.startCompression();
        });
    }
    
    async handleFileSelection(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (!this.validateFile(file)) return;
        
        this.currentFile = file;
        await this.showCompressionPanel(file);
    }
    
    validateFile(file) {
        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file');
            return false;
        }
        
        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            alert('File size must be less than 100MB');
            return false;
        }
        
        return true;
    }
    
    async showCompressionPanel(file) {
        // Hide upload area, show compression panel
        document.getElementById('upload-area').hidden = true;
        document.getElementById('compression-panel').hidden = false;
        
        // Display file information
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('file-size').textContent = this.formatFileSize(file.size);
        
        // Analyze PDF for page count
        const pageCount = await this.getPageCount(file);
        document.getElementById('page-count').textContent = `${pageCount} pages`;
    }
    
    async getPageCount(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            return pdfDoc.getPageCount();
        } catch (error) {
            console.error('Error reading PDF:', error);
            return 'Unknown';
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    async startCompression() {
        const quality = document.getElementById('quality-select').value;
        const compressionManager = this.modules.get('compression');
        
        // Show progress
        document.getElementById('progress-container').hidden = false;
        document.getElementById('compress-btn').disabled = true;
        
        try {
            const result = await compressionManager.compressFile(this.currentFile, { quality });
            this.showResults(result);
        } catch (error) {
            console.error('Compression failed:', error);
            alert('Compression failed. Please try again.');
        } finally {
            document.getElementById('progress-container').hidden = true;
            document.getElementById('compress-btn').disabled = false;
        }
    }
    
    showResults(result) {
        document.getElementById('compression-panel').hidden = true;
        document.getElementById('results-panel').hidden = false;
        
        document.getElementById('original-size').textContent = this.formatFileSize(result.originalSize);
        document.getElementById('compressed-size').textContent = this.formatFileSize(result.compressedSize);
        document.getElementById('compression-ratio').textContent = `${result.compressionRatio}%`;
        
        // Setup download
        document.getElementById('download-btn').onclick = () => {
            this.downloadFile(result.compressedData, result.filename);
        };
    }
    
    downloadFile(data, filename) {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
```

#### 1.3 Create Compression Manager (`frontend/js/modules/compression.js`)
```javascript
export class CompressionManager {
    constructor() {
        this.apiClient = new APIClient();
    }
    
    async compressFile(file, settings) {
        // Try client-side compression first
        try {
            const clientResult = await this.clientSideCompression(file, settings);
            
            // If client-side compression is good enough, use it
            if (clientResult.compressionRatio > 0.7) {
                return clientResult;
            }
        } catch (error) {
            console.log('Client-side compression failed, falling back to server:', error);
        }
        
        // Fall back to server-side compression
        return await this.serverSideCompression(file, settings);
    }
    
    async clientSideCompression(file, settings) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        // Apply compression settings
        const compressedPdf = await this.applyCompressionSettings(pdfDoc, settings);
        
        // Convert to bytes
        const compressedBytes = await compressedPdf.save();
        
        return {
            compressedData: compressedBytes,
            filename: this.generateCompressedFilename(file.name),
            originalSize: file.size,
            compressedSize: compressedBytes.byteLength,
            compressionRatio: ((file.size - compressedBytes.byteLength) / file.size * 100).toFixed(1),
            method: 'client-side'
        };
    }
    
    async serverSideCompression(file, settings) {
        // Upload file to server
        const uploadResult = await this.apiClient.uploadFile(file);
        
        // Start compression job
        const jobResult = await this.apiClient.startCompression(uploadResult.fileId, settings);
        
        // Poll for completion
        const finalResult = await this.pollJobCompletion(jobResult.jobId);
        
        // Download compressed file
        const compressedData = await this.apiClient.downloadFile(finalResult.fileId);
        
        return {
            compressedData: compressedData,
            filename: this.generateCompressedFilename(file.name),
            originalSize: file.size,
            compressedSize: finalResult.compressedSize,
            compressionRatio: finalResult.compressionRatio,
            method: 'server-side'
        };
    }
    
    async applyCompressionSettings(pdfDoc, settings) {
        const pages = pdfDoc.getPages();
        
        // Apply quality-based compression
        switch (settings.quality) {
            case 'low':
                // Aggressive compression
                for (const page of pages) {
                    // Reduce image quality, remove metadata
                    await this.compressPage(page, { imageQuality: 0.3, removeMetadata: true });
                }
                break;
            case 'medium':
                // Balanced compression
                for (const page of pages) {
                    await this.compressPage(page, { imageQuality: 0.6, removeMetadata: false });
                }
                break;
            case 'high':
            default:
                // Light compression
                for (const page of pages) {
                    await this.compressPage(page, { imageQuality: 0.8, removeMetadata: false });
                }
                break;
        }
        
        return pdfDoc;
    }
    
    async compressPage(page, options) {
        // This is a simplified version - in production, you'd use more sophisticated
        // PDF manipulation libraries for actual image compression
        if (options.removeMetadata) {
            // Remove page metadata
            page.setMetadata({});
        }
    }
    
    generateCompressedFilename(originalName) {
        const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
        return `${nameWithoutExt}_compressed.pdf`;
    }
    
    async pollJobCompletion(jobId) {
        const maxAttempts = 60; // 5 minutes with 5-second intervals
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const status = await this.apiClient.getJobStatus(jobId);
            
            if (status.status === 'completed') {
                return status.result;
            } else if (status.status === 'failed') {
                throw new Error(`Compression job failed: ${status.error}`);
            }
            
            // Wait 5 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        }
        
        throw new Error('Compression job timed out');
    }
}
```

### 2. Backend Service Implementation

#### 2.1 Enhanced Compression Service (`pdf_smaller_backend/src/services/enhanced_compression_service.py`)
```python
import asyncio
import os
import uuid
from typing import Dict, Any, Tuple
from pathlib import Path
import fitz  # PyMuPDF
from PIL import Image
import io

class EnhancedCompressionService:
    def __init__(self):
        self.temp_dir = Path(os.environ.get('TEMP_DIR', '/tmp/pdfsmaller'))
        self.temp_dir.mkdir(exist_ok=True)
    
    async def compress_with_intelligence(self, file_path: str, user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Intelligent PDF compression with content analysis"""
        
        # Analyze PDF content
        analysis = await self.analyze_pdf_content(file_path)
        
        # Get optimal compression settings
        optimal_settings = self.get_optimal_settings(analysis, user_preferences)
        
        # Compress with optimal settings
        compressed_path = await self.compress_pdf(file_path, optimal_settings)
        
        # Calculate results
        original_size = os.path.getsize(file_path)
        compressed_size = os.path.getsize(compressed_path)
        compression_ratio = (original_size - compressed_size) / original_size
        
        return {
            'success': True,
            'compressed_path': compressed_path,
            'original_size': original_size,
            'compressed_size': compressed_size,
            'compression_ratio': compression_ratio,
            'settings_used': optimal_settings,
            'analysis': analysis
        }
    
    async def analyze_pdf_content(self, file_path: str) -> Dict[str, Any]:
        """Analyze PDF content for compression optimization"""
        
        doc = fitz.open(file_path)
        analysis = {
            'page_count': len(doc),
            'total_size': os.path.getsize(file_path),
            'image_count': 0,
            'text_density': 0,
            'image_heavy': False,
            'text_heavy': False,
            'mixed_content': False
        }
        
        total_text_length = 0
        total_image_area = 0
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Extract text
            text = page.get_text()
            total_text_length += len(text)
            
            # Extract images
            image_list = page.get_images()
            analysis['image_count'] += len(image_list)
            
            for img in image_list:
                xref = img[0]
                pix = fitz.Pixmap(doc, xref)
                total_image_area += pix.width * pix.height
                pix = None
        
        doc.close()
        
        # Calculate content type
        page_area = 595 * 842 * len(doc)  # A4 page area in points
        text_density = total_text_length / page_area
        image_density = total_image_area / page_area
        
        analysis['text_density'] = text_density
        analysis['image_density'] = image_density
        
        if image_density > 0.3:
            analysis['image_heavy'] = True
        elif text_density > 0.1:
            analysis['text_heavy'] = True
        else:
            analysis['mixed_content'] = True
        
        return analysis
    
    def get_optimal_settings(self, analysis: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Determine optimal compression settings based on content analysis"""
        
        base_settings = {
            'image_quality': 0.8,
            'remove_metadata': False,
            'downsample_images': False,
            'compress_text': True,
            'optimize_fonts': True
        }
        
        # Adjust based on content type
        if analysis['image_heavy']:
            base_settings['image_quality'] = 0.6
            base_settings['downsample_images'] = True
        elif analysis['text_heavy']:
            base_settings['image_quality'] = 0.9
            base_settings['compress_text'] = True
            base_settings['optimize_fonts'] = True
        
        # Apply user preferences
        if 'quality' in user_preferences:
            quality = user_preferences['quality']
            if quality == 'low':
                base_settings['image_quality'] = 0.4
                base_settings['remove_metadata'] = True
                base_settings['downsample_images'] = True
            elif quality == 'high':
                base_settings['image_quality'] = 0.9
                base_settings['remove_metadata'] = False
                base_settings['downsample_images'] = False
        
        return base_settings
    
    async def compress_pdf(self, file_path: str, settings: Dict[str, Any]) -> str:
        """Compress PDF with specified settings"""
        
        doc = fitz.open(file_path)
        output_path = self.temp_dir / f"compressed_{uuid.uuid4()}.pdf"
        
        # Create new document for compressed version
        new_doc = fitz.open()
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Create new page
            new_page = new_doc.new_page(width=page.rect.width, height=page.rect.height)
            
            # Copy content with compression
            if settings['downsample_images']:
                await self.compress_page_images(page, new_page, settings['image_quality'])
            else:
                new_page.show_pdf_page(page.rect, doc, page_num)
            
            # Apply text compression if enabled
            if settings['compress_text']:
                await self.compress_page_text(new_page)
        
        # Save compressed document
        new_doc.save(str(output_path), garbage=4, deflate=True, clean=True)
        new_doc.close()
        doc.close()
        
        return str(output_path)
    
    async def compress_page_images(self, source_page, target_page, quality: float):
        """Compress images on a page"""
        
        image_list = source_page.get_images()
        
        for img in image_list:
            xref = img[0]
            pix = fitz.Pixmap(source_page.parent, xref)
            
            # Convert to PIL Image for compression
            img_data = pix.tobytes("png")
            pil_image = Image.open(io.BytesIO(img_data))
            
            # Compress image
            compressed_img = await self.compress_image(pil_image, quality)
            
            # Insert compressed image
            img_bytes = io.BytesIO()
            compressed_img.save(img_bytes, format='JPEG', quality=int(quality * 100))
            img_bytes.seek(0)
            
            # Insert into target page
            target_page.insert_image(target_page.rect, stream=img_bytes.getvalue())
            
            pix = None
    
    async def compress_image(self, image: Image.Image, quality: float) -> Image.Image:
        """Compress PIL image"""
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'LA', 'P'):
            image = image.convert('RGB')
        
        # Resize if too large
        max_size = 2048
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        return image
    
    async def compress_page_text(self, page):
        """Compress text on a page (placeholder for advanced text compression)"""
        # In a full implementation, this would handle font optimization,
        # text compression, and other text-related optimizations
        pass
```

#### 2.2 Bulk Processing Service (`pdf_smaller_backend/src/services/bulk_compression_service.py`)
```python
import asyncio
import uuid
from typing import List, Dict, Any
from pathlib import Path
import os
from celery import current_app

class BulkCompressionService:
    def __init__(self):
        self.celery_app = current_app
        self.storage_service = StorageService()
    
    async def create_batch_job(self, files: List[str], settings: Dict[str, Any], user_id: str) -> str:
        """Create a new batch compression job"""
        
        batch_id = str(uuid.uuid4())
        
        # Store files securely
        file_paths = await self.store_files(files, batch_id)
        
        # Create batch job record in database
        batch_job = await self.create_batch_record(batch_id, user_id, len(files), settings)
        
        # Start Celery task for background processing
        task = self.celery_app.send_task(
            'process_batch_compression',
            args=[batch_id, file_paths, settings, user_id],
            task_id=batch_id
        )
        
        return batch_id
    
    async def store_files(self, files: List[str], batch_id: str) -> List[str]:
        """Store files for batch processing"""
        
        batch_dir = Path(f"/tmp/batch_{batch_id}")
        batch_dir.mkdir(exist_ok=True)
        
        stored_paths = []
        
        for file_path in files:
            if os.path.exists(file_path):
                # Copy file to batch directory
                filename = os.path.basename(file_path)
                new_path = batch_dir / filename
                
                # Copy file
                with open(file_path, 'rb') as src, open(new_path, 'wb') as dst:
                    dst.write(src.read())
                
                stored_paths.append(str(new_path))
        
        return stored_paths
    
    async def create_batch_record(self, batch_id: str, user_id: str, file_count: int, settings: Dict[str, Any]):
        """Create batch job record in database"""
        
        # This would typically use your database models
        # For now, we'll create a simple record structure
        
        batch_record = {
            'id': batch_id,
            'user_id': user_id,
            'status': 'pending',
            'total_files': file_count,
            'processed_files': 0,
            'failed_files': 0,
            'settings': settings,
            'created_at': datetime.utcnow()
        }
        
        # In production, save to database
        # await self.db.batch_jobs.insert_one(batch_record)
        
        return batch_record
    
    async def get_batch_status(self, batch_id: str) -> Dict[str, Any]:
        """Get current status of batch job"""
        
        # Get Celery task status
        task_result = self.celery_app.AsyncResult(batch_id)
        
        # Get batch record from database
        # batch_record = await self.db.batch_jobs.find_one({'id': batch_id})
        
        # For now, return mock data
        batch_record = {
            'id': batch_id,
            'status': 'processing',
            'total_files': 10,
            'processed_files': 5,
            'failed_files': 0
        }
        
        return {
            'batch_id': batch_id,
            'status': batch_record['status'],
            'progress': {
                'total': batch_record['total_files'],
                'processed': batch_record['processed_files'],
                'failed': batch_record['failed_files'],
                'percentage': (batch_record['processed_files'] / batch_record['total_files']) * 100
            },
            'celery_status': task_result.status
        }
    
    async def cancel_batch_job(self, batch_id: str, user_id: str) -> bool:
        """Cancel a batch job"""
        
        # Verify user owns the job
        # batch_record = await self.db.batch_jobs.find_one({'id': batch_id, 'user_id': user_id})
        # if not batch_record:
        #     raise ValueError("Batch job not found or access denied")
        
        # Revoke Celery task
        self.celery_app.control.revoke(batch_id, terminate=True)
        
        # Update database status
        # await self.db.batch_jobs.update_one(
        #     {'id': batch_id},
        #     {'$set': {'status': 'cancelled'}}
        # )
        
        return True
```

### 3. Database Schema Updates

#### 3.1 Migration Script (`pdf_smaller_backend/src/database/migrations.py`)
```python
from sqlalchemy import text
from src.database.init_db import get_db_session

def run_migrations():
    """Run database migrations for Phase 2 features"""
    
    session = get_db_session()
    
    try:
        # Add new columns to compression_jobs table
        session.execute(text("""
            ALTER TABLE compression_jobs 
            ADD COLUMN IF NOT EXISTS compression_ratio DECIMAL(5,4),
            ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
            ADD COLUMN IF NOT EXISTS file_size_before BIGINT,
            ADD COLUMN IF NOT EXISTS file_size_after BIGINT,
            ADD COLUMN IF NOT EXISTS compression_settings JSONB,
            ADD COLUMN IF NOT EXISTS ai_recommendations JSONB,
            ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2)
        """))
        
        # Create batch_jobs table
        session.execute(text("""
            CREATE TABLE IF NOT EXISTS batch_jobs (
                id VARCHAR(36) PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                total_files INTEGER NOT NULL,
                processed_files INTEGER DEFAULT 0,
                failed_files INTEGER DEFAULT 0,
                settings JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                error_log TEXT
            )
        """))
        
        # Create file_analysis_cache table
        session.execute(text("""
            CREATE TABLE IF NOT EXISTS file_analysis_cache (
                id SERIAL PRIMARY KEY,
                file_hash VARCHAR(64) UNIQUE NOT NULL,
                analysis_data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL
            )
        """))
        
        # Create index for performance
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id 
            ON batch_jobs(user_id)
        """))
        
        session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_file_analysis_hash 
            ON file_analysis_cache(file_hash)
        """))
        
        session.commit()
        print("Database migrations completed successfully")
        
    except Exception as e:
        session.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    run_migrations()
```

### 4. Testing Implementation

#### 4.1 Frontend Test Setup (`frontend/test/setup.js`)
```javascript
// Test setup for frontend components
import { jest } from '@jest/globals';

// Mock PDF.js library
global.PDFLib = {
    PDFDocument: {
        load: jest.fn().mockResolvedValue({
            getPageCount: () => 5,
            getPages: () => [],
            save: jest.fn().mockResolvedValue(new ArrayBuffer(1000))
        })
    }
};

// Mock File API
global.File = class MockFile {
    constructor(parts, filename, options) {
        this.name = filename;
        this.size = parts.join('').length;
        this.type = options?.type || 'application/octet-stream';
    }
    
    arrayBuffer() {
        return Promise.resolve(new ArrayBuffer(this.size));
    }
};

// Mock fetch API
global.fetch = jest.fn();

// Mock console methods
global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
};
```

#### 4.2 Component Tests (`frontend/test/components/file-uploader.test.js`)
```javascript
import { FileUploader } from '../../js/components/file-uploader.js';

describe('FileUploader Component', () => {
    let uploader;
    
    beforeEach(() => {
        // Create DOM element for testing
        document.body.innerHTML = '<div id="test-container"></div>';
        const container = document.getElementById('test-container');
        
        uploader = new FileUploader();
        container.appendChild(uploader);
    });
    
    afterEach(() => {
        document.body.innerHTML = '';
    });
    
    test('should initialize with correct structure', () => {
        expect(uploader.shadowRoot).toBeTruthy();
        expect(uploader.shadowRoot.querySelector('.upload-area')).toBeTruthy();
    });
    
    test('should handle file selection', () => {
        const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
        const event = { target: { files: [file] } };
        
        uploader.handleFileSelection(event);
        
        expect(uploader.selectedFile).toBe(file);
        expect(uploader.isFileSelected()).toBe(true);
    });
    
    test('should validate PDF files correctly', () => {
        const validFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
        
        expect(uploader.validateFile(validFile)).toBe(true);
        expect(uploader.validateFile(invalidFile)).toBe(false);
    });
    
    test('should emit file-selected event', () => {
        const mockCallback = jest.fn();
        uploader.addEventListener('file-selected', mockCallback);
        
        const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
        uploader.selectFile(file);
        
        expect(mockCallback).toHaveBeenCalledWith(
            expect.objectContaining({ detail: { file } })
        );
    });
});
```

### 5. Build and Deployment

#### 5.1 Build Script (`frontend/scripts/build.js`)
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildSystem {
    constructor() {
        this.sourceDir = path.join(__dirname, '..', 'js');
        this.buildDir = path.join(__dirname, '..', 'dist');
        this.entryPoint = path.join(this.sourceDir, 'main.js');
    }
    
    async build() {
        console.log('Starting build process...');
        
        // Clean build directory
        this.cleanBuildDir();
        
        // Bundle JavaScript modules
        await this.bundleJavaScript();
        
        // Copy static assets
        this.copyStaticAssets();
        
        // Copy HTML
        this.copyHTML();
        
        // Minify CSS
        this.minifyCSS();
        
        console.log('Build completed successfully!');
    }
    
    cleanBuildDir() {
        if (fs.existsSync(this.buildDir)) {
            fs.rmSync(this.buildDir, { recursive: true });
        }
        fs.mkdirSync(this.buildDir, { recursive: true });
    }
    
    async bundleJavaScript() {
        console.log('Bundling JavaScript modules...');
        
        // Use esbuild for fast bundling
        const esbuild = require('esbuild');
        
        try {
            await esbuild.build({
                entryPoints: [this.entryPoint],
                bundle: true,
                outfile: path.join(this.buildDir, 'js', 'bundle.js'),
                format: 'iife',
                target: ['es2020'],
                minify: true,
                sourcemap: true,
                loader: {
                    '.js': 'jsx'
                }
            });
        } catch (error) {
            console.error('JavaScript bundling failed:', error);
            throw error;
        }
    }
    
    copyStaticAssets() {
        console.log('Copying static assets...');
        
        const staticDir = path.join(__dirname, '..', 'static');
        const distStaticDir = path.join(this.buildDir, 'static');
        
        if (fs.existsSync(staticDir)) {
            this.copyDirectory(staticDir, distStaticDir);
        }
    }
    
    copyHTML() {
        console.log('Copying HTML files...');
        
        const htmlFile = path.join(__dirname, '..', 'index.html');
        const distHtmlFile = path.join(this.buildDir, 'index.html');
        
        if (fs.existsSync(htmlFile)) {
            let htmlContent = fs.readFileSync(htmlFile, 'utf8');
            
            // Update script reference to bundled version
            htmlContent = htmlContent.replace(
                'src="js/main.js"',
                'src="js/bundle.js"'
            );
            
            fs.writeFileSync(distHtmlFile, htmlContent);
        }
    }
    
    minifyCSS() {
        console.log('Minifying CSS...');
        
        const cssDir = path.join(__dirname, '..', 'css');
        const distCssDir = path.join(this.buildDir, 'css');
        
        if (fs.existsSync(cssDir)) {
            fs.mkdirSync(distCssDir, { recursive: true });
            
            const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
            
            cssFiles.forEach(file => {
                const cssPath = path.join(cssDir, file);
                const distCssPath = path.join(distCssDir, file);
                
                let cssContent = fs.readFileSync(cssPath, 'utf8');
                
                // Simple CSS minification (remove comments and extra whitespace)
                cssContent = cssContent
                    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                    .replace(/\s+/g, ' ') // Collapse whitespace
                    .replace(/;\s*}/g, '}') // Remove trailing semicolons
                    .trim();
                
                fs.writeFileSync(distCssPath, cssContent);
            });
        }
    }
    
    copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const items = fs.readdirSync(src);
        
        items.forEach(item => {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            
            if (fs.statSync(srcPath).isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    }
}

// Run build if called directly
if (require.main === module) {
    const builder = new BuildSystem();
    builder.build().catch(console.error);
}

module.exports = BuildSystem;
```

## Implementation Checklist

### Week 1-2: Frontend Foundation
- [ ] Set up ES6 module structure
- [ ] Implement base component system
- [ ] Create file uploader component
- [ ] Set up build system with esbuild

### Week 3-4: Core Functionality
- [ ] Implement PDF analysis service
- [ ] Create compression manager
- [ ] Add client-side compression
- [ ] Integrate with backend API

### Week 5-6: Backend Services
- [ ] Implement enhanced compression service
- [ ] Add bulk processing capabilities
- [ ] Create database migrations
- [ ] Update API endpoints

### Week 7-8: Testing & Polish
- [ ] Write comprehensive tests
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Documentation updates

This technical implementation guide provides the essential code and structure needed to start implementing Phase 2 of the PDFSmaller project. Each component is designed to be modular and testable, following the architecture principles outlined in the steering documents.
