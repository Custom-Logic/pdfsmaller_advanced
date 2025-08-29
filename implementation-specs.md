# PDFSmaller Implementation Specifications

## Project Overview
Based on the steering documents, PDFSmaller is a privacy-first PDF compression platform with intelligent processing capabilities. The project is currently in Phase 1 with core infrastructure ready, moving into Phase 2 for enhanced compression and processing.

## Phase 2 Implementation Specs

### 1. Frontend Modernization (Weeks 1-2)

#### 1.1 ES6 Module Restructure
**File Structure:**
```
frontend/
├── index.html
├── js/
│   ├── main.js                 # Application entry point
│   ├── modules/
│   │   ├── app.js             # Core application logic
│   │   ├── compression.js     # Compression management
│   │   ├── preview.js         # Preview generation
│   │   └── upload.js          # File handling
│   ├── components/
│   │   ├── file-uploader.js   # Drag & drop component
│   │   ├── progress-tracker.js # Progress tracking
│   │   ├── results-display.js # Results display
│   │   └── settings-panel.js  # Compression settings
│   ├── services/
│   │   ├── api-client.js      # Backend communication
│   │   ├── pdf-analyzer.js    # PDF analysis
│   │   └── security.js        # Encryption utilities
│   └── utils/
│       ├── dom-helper.js      # DOM manipulation
│       ├── file-validator.js  # File validation
│       └── format-helper.js   # Size formatting
```

#### 1.2 Core Application Module (`js/main.js`)
```javascript
// Main application entry point
import { App } from './modules/app.js';
import { ModuleLoader } from './utils/module-loader.js';

class PDFSmallerApp {
    constructor() {
        this.moduleLoader = new ModuleLoader();
        this.init();
    }
    
    async init() {
        await this.moduleLoader.loadCoreModules();
        this.setupEventListeners();
        this.initializeAnalytics();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PDFSmallerApp();
});
```

#### 1.3 Component System (`js/components/base-component.js`)
```javascript
// Base component class for all UI components
export class BaseComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }
    
    connectedCallback() {
        this.setupEventListeners();
    }
    
    render() {
        // Override in subclasses
    }
    
    setupEventListeners() {
        // Override in subclasses
    }
}
```

### 2. Enhanced Compression System (Weeks 3-4)

#### 2.1 Intelligent Compression Service (`js/services/compression-service.js`)
```javascript
export class CompressionService {
    constructor() {
        this.pdfAnalyzer = new PDFAnalyzer();
        this.apiClient = new APIClient();
    }
    
    async analyzeFile(file) {
        const analysis = await this.pdfAnalyzer.analyze(file);
        return {
            fileSize: file.size,
            pageCount: analysis.pageCount,
            compressionPotential: analysis.compressionPotential,
            recommendedSettings: this.getRecommendedSettings(analysis)
        };
    }
    
    async compressFile(file, settings) {
        // Client-side compression attempt first
        const clientResult = await this.attemptClientCompression(file, settings);
        
        if (clientResult.compressionRatio < 0.8) {
            // Fall back to server-side compression
            return await this.serverCompression(file, settings);
        }
        
        return clientResult;
    }
}
```

#### 2.2 PDF Analysis Service (`js/services/pdf-analyzer.js`)
```javascript
export class PDFAnalyzer {
    async analyze(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        return {
            pageCount: pdfDoc.getPageCount(),
            fileSize: file.size,
            compressionPotential: this.calculateCompressionPotential(pdfDoc),
            documentType: this.classifyDocument(pdfDoc),
            metadata: await this.extractMetadata(pdfDoc)
        };
    }
    
    calculateCompressionPotential(pdfDoc) {
        // Analyze images, fonts, and content for compression opportunities
        // Return score from 0-1 indicating compression potential
    }
}
```

### 3. Backend Enhancement (Weeks 5-6)

#### 3.1 Enhanced Compression Service (`src/services/enhanced_compression_service.py`)
```python
class EnhancedCompressionService:
    def __init__(self):
        self.encryption_service = EncryptionService()
        self.audit_service = AuditService()
        self.ml_service = MLService()
    
    async def compress_with_intelligence(self, file_data: bytes, user_preferences: dict) -> dict:
        # Analyze file content
        analysis = await self.analyze_content(file_data)
        
        # Get AI recommendations
        recommendations = self.ml_service.get_recommendations(analysis)
        
        # Apply user preferences
        settings = self.merge_preferences(recommendations, user_preferences)
        
        # Compress with optimal settings
        result = await self.compress_file(file_data, settings)
        
        # Log for analytics
        self.audit_service.log_compression(analysis, settings, result)
        
        return result
    
    async def analyze_content(self, file_data: bytes) -> dict:
        # Extract PDF metadata, analyze images, detect text density
        # Return comprehensive analysis for ML processing
        pass
```

#### 3.2 Bulk Processing Service (`src/services/bulk_compression_service.py`)
```python
class BulkCompressionService:
    def __init__(self):
        self.celery_app = celery_app
        self.storage_service = StorageService()
    
    async def create_batch_job(self, files: list, settings: dict, user_id: str) -> str:
        # Create batch job record
        batch_id = str(uuid.uuid4())
        
        # Store files securely
        file_paths = await self.store_files(files, batch_id)
        
        # Create Celery task
        task = self.celery_app.send_task(
            'process_batch_compression',
            args=[batch_id, file_paths, settings, user_id]
        )
        
        return batch_id
    
    async def get_batch_status(self, batch_id: str) -> dict:
        # Return batch processing status and progress
        pass
```

### 4. Security Implementation (Weeks 7-8)

#### 4.1 Encryption Service (`src/services/encryption_service.py`)
```python
from cryptography.fernet import Fernet
import secrets

class EncryptionService:
    def __init__(self):
        self.key = Fernet.generate_key()
        self.cipher_suite = Fernet(self.key)
    
    def encrypt_file(self, file_data: bytes) -> tuple[bytes, str]:
        """Encrypt file data and return encrypted data + key"""
        encrypted_data = self.cipher_suite.encrypt(file_data)
        return encrypted_data, self.key.decode()
    
    def decrypt_file(self, encrypted_data: bytes, key: str) -> bytes:
        """Decrypt file data using provided key"""
        cipher = Fernet(key.encode())
        return cipher.decrypt(encrypted_data)
    
    def generate_secure_key(self) -> str:
        """Generate secure random key for file encryption"""
        return secrets.token_urlsafe(32)
```

#### 4.2 Secure File Service (`src/services/secure_file_service.py`)
```python
class SecureFileService:
    def __init__(self):
        self.encryption_service = EncryptionService()
        self.storage_path = os.environ.get('SECURE_STORAGE_PATH', '/tmp/secure_files')
    
    async def store_encrypted_file(self, file_data: bytes) -> str:
        """Store file with encryption and return file ID"""
        file_id = str(uuid.uuid4())
        encrypted_data, key = self.encryption_service.encrypt_file(file_data)
        
        # Store encrypted file
        file_path = os.path.join(self.storage_path, f"{file_id}.enc")
        with open(file_path, 'wb') as f:
            f.write(encrypted_data)
        
        # Store key separately (in production, use secure key management)
        key_path = os.path.join(self.storage_path, f"{file_id}.key")
        with open(key_path, 'w') as f:
            f.write(key)
        
        return file_id
    
    async def schedule_deletion(self, file_id: str, delay_minutes: int):
        """Schedule file deletion after specified delay"""
        # Use Celery to schedule cleanup task
        cleanup_task = self.celery_app.send_task(
            'cleanup_secure_file',
            args=[file_id],
            countdown=delay_minutes * 60
        )
```

### 5. API Enhancement (Weeks 9-10)

#### 5.1 Enhanced Compression Routes (`src/routes/compression_routes.py`)
```python
@compression_bp.route('/compress/intelligent', methods=['POST'])
@jwt_required()
@rate_limit(limit=10, per=300)  # 10 requests per 5 minutes
async def intelligent_compression():
    """Intelligent compression with AI recommendations"""
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        user_preferences = data.get('preferences', {})
        
        # Get user context
        current_user = get_jwt_identity()
        user_tier = get_user_tier(current_user)
        
        # Validate file access
        if not validate_file_access(file_id, current_user):
            raise UnauthorizedError("File access denied")
        
        # Process with intelligence
        compression_service = EnhancedCompressionService()
        result = await compression_service.compress_with_intelligence(
            file_id, user_preferences
        )
        
        return jsonify({
            'success': True,
            'job_id': result['job_id'],
            'estimated_time': result['estimated_time'],
            'compression_ratio': result['compression_ratio']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@compression_bp.route('/batch', methods=['POST'])
@jwt_required()
@rate_limit(limit=5, per=3600)  # 5 batch jobs per hour
async def create_batch_job():
    """Create batch compression job"""
    try:
        data = request.get_json()
        files = data.get('files', [])
        settings = data.get('settings', {})
        
        # Validate batch size limits
        current_user = get_jwt_identity()
        user_tier = get_user_tier(current_user)
        
        if len(files) > get_batch_limit(user_tier):
            raise ValidationError("Batch size exceeds tier limit")
        
        # Create batch job
        batch_service = BulkCompressionService()
        batch_id = await batch_service.create_batch_job(
            files, settings, current_user
        )
        
        return jsonify({
            'success': True,
            'batch_id': batch_id,
            'status': 'processing'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400
```

### 6. Database Schema Updates

#### 6.1 Enhanced Compression Jobs Table
```sql
-- Add new fields to compression_jobs table
ALTER TABLE compression_jobs ADD COLUMN IF NOT EXISTS:
    compression_ratio DECIMAL(5,4),
    processing_time_ms INTEGER,
    file_size_before BIGINT,
    file_size_after BIGINT,
    compression_settings JSONB,
    ai_recommendations JSONB,
    quality_score DECIMAL(3,2);

-- Create new table for batch jobs
CREATE TABLE IF NOT EXISTS batch_jobs (
    id SERIAL PRIMARY KEY,
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
);

-- Create table for file analysis cache
CREATE TABLE IF NOT EXISTS file_analysis_cache (
    id SERIAL PRIMARY KEY,
    file_hash VARCHAR(64) UNIQUE NOT NULL,
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);
```

### 7. Testing Specifications

#### 7.1 Frontend Testing (`frontend/test/`)
```javascript
// Component testing
describe('FileUploader Component', () => {
    test('should handle drag and drop events', () => {
        const uploader = new FileUploader();
        const mockEvent = new DragEvent('drop');
        
        uploader.handleDrop(mockEvent);
        expect(uploader.files).toHaveLength(1);
    });
    
    test('should validate file types', () => {
        const uploader = new FileUploader();
        const validFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
        
        expect(uploader.validateFile(validFile)).toBe(true);
        expect(uploader.validateFile(invalidFile)).toBe(false);
    });
});

// Service testing
describe('CompressionService', () => {
    test('should analyze PDF files correctly', async () => {
        const service = new CompressionService();
        const mockFile = new File(['mock pdf content'], 'test.pdf');
        
        const analysis = await service.analyzeFile(mockFile);
        expect(analysis).toHaveProperty('pageCount');
        expect(analysis).toHaveProperty('compressionPotential');
    });
});
```

#### 7.2 Backend Testing (`tests/`)
```python
# Test enhanced compression service
class TestEnhancedCompressionService:
    def test_intelligent_compression(self):
        service = EnhancedCompressionService()
        mock_file_data = b"mock pdf content"
        user_preferences = {"quality": "high", "target_size": "50%"}
        
        result = service.compress_with_intelligence(mock_file_data, user_preferences)
        
        assert result['success'] is True
        assert 'job_id' in result
        assert 'compression_ratio' in result

# Test bulk processing
class TestBulkCompressionService:
    def test_batch_job_creation(self):
        service = BulkCompressionService()
        mock_files = ["file1.pdf", "file2.pdf"]
        settings = {"quality": "medium"}
        user_id = "test_user"
        
        batch_id = service.create_batch_job(mock_files, settings, user_id)
        
        assert batch_id is not None
        assert len(batch_id) > 0
```

### 8. Performance Requirements

#### 8.1 Frontend Performance
- **Page Load Time**: < 2 seconds
- **Compression Preview**: < 1 second
- **File Upload**: Support up to 100MB files
- **Memory Usage**: < 200MB for large PDF processing

#### 8.2 Backend Performance
- **API Response Time**: < 500ms for metadata requests
- **Compression Processing**: < 30 seconds for 10MB files
- **Batch Processing**: Handle 100+ files simultaneously
- **Database Queries**: < 100ms for standard operations

### 9. Security Requirements

#### 9.1 Data Protection
- **File Encryption**: AES-256 encryption at rest
- **Transit Security**: TLS 1.3 for all communications
- **Access Control**: JWT-based authentication with role-based permissions
- **Audit Logging**: Complete audit trail for all operations

#### 9.2 Rate Limiting
- **Free Users**: 10 requests per 5 minutes
- **Pro Users**: 100 requests per 5 minutes
- **Batch Jobs**: 5 per hour for Pro users
- **File Size Limits**: 100MB for free, 500MB for Pro

### 10. Deployment Specifications

#### 10.1 Environment Configuration
```bash
# Production environment variables
DATABASE_URL=postgresql://user:pass@localhost/pdfsmaller
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
UPLOAD_FOLDER=/var/pdfsmaller/uploads
MAX_FILE_SIZE=104857600
SECURE_STORAGE_PATH=/var/pdfsmaller/secure
```

#### 10.2 Docker Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - FLASK_ENV=production
    volumes:
      - ./uploads:/var/pdfsmaller/uploads
      - ./secure:/var/pdfsmaller/secure
    depends_on:
      - postgres
      - redis
  
  celery:
    build: .
    command: celery -A src.celery_app worker --loglevel=info
    environment:
      - FLASK_ENV=production
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pdfsmaller
      POSTGRES_USER: pdfsmaller
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

## Implementation Timeline

### Week 1-2: Frontend Modernization
- [ ] Restructure frontend directory
- [ ] Implement ES6 module system
- [ ] Create base component classes
- [ ] Set up build system

### Week 3-4: Enhanced Compression
- [ ] Implement intelligent compression service
- [ ] Add PDF analysis capabilities
- [ ] Create compression preview system
- [ ] Integrate client/server compression

### Week 5-6: Backend Enhancement
- [ ] Implement enhanced compression service
- [ ] Add bulk processing capabilities
- [ ] Create ML recommendation system
- [ ] Update database schema

### Week 7-8: Security Implementation
- [ ] Implement encryption service
- [ ] Add secure file handling
- [ ] Implement audit logging
- [ ] Add rate limiting

### Week 9-10: API Enhancement
- [ ] Update compression routes
- [ ] Add batch processing endpoints
- [ ] Implement intelligent compression API
- [ ] Add progress tracking

### Week 11-12: Testing & Optimization
- [ ] Write comprehensive tests
- [ ] Performance optimization
- [ ] Security testing
- [ ] Documentation updates

## Success Criteria

### Phase 2 Completion
- [ ] Bulk processing handles 100+ files efficiently
- [ ] Compression quality meets industry standards
- [ ] User experience is smooth and intuitive
- [ ] Performance meets SLA requirements
- [ ] Security implementation is comprehensive
- [ ] Test coverage >80%

This implementation specification provides a clear roadmap for completing Phase 2 of the PDFSmaller project, focusing on enhanced compression capabilities, security improvements, and user experience enhancements.
