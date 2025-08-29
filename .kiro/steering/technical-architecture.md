# Technical Architecture Document

## System Overview

PDFSmaller is a distributed web application with a modern frontend and scalable backend architecture designed for PDF processing and conversion.

### 🏗️ **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (ES6+ Modules)                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Upload    │ │ Compression │ │   Results   │          │
│  │  Manager    │ │    Flow     │ │   Display   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Flask)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │    Auth     │ │ Compression │ │Subscription │          │
│  │   Routes    │ │   Routes    │ │   Routes    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer (Business Logic)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │    Auth     │ │ Compression │ │Subscription │          │
│  │   Service   │ │   Service   │ │   Service   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ PostgreSQL  │ │    Redis    │ │   Celery    │          │
│  │   Database  │ │   Cache     │ │ Task Queue  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 **Technology Stack Details**

#### **Frontend Stack**
- **Language**: Vanilla JavaScript (ES6+)
- **Module System**: ES6 modules with dynamic imports
- **Build Tools**: Custom build scripts with Terser minification
- **Libraries**: 
  - `pdf-lib`: PDF manipulation and compression
  - `compressorjs`: Image compression
  - Custom components for UI elements
- **Architecture Pattern**: Component-based with service layer

#### **Backend Stack**
- **Framework**: Flask 2.3.3 with Blueprint organization
- **Database**: SQLAlchemy 2.0.23 with PostgreSQL/SQLite
- **Authentication**: JWT with Flask-JWT-Extended 4.5.3
- **Task Queue**: Celery 5.3.4 with Redis 5.0.1
- **Payment**: Stripe 6.7.0 integration
- **Security**: Flask-Limiter 3.5.0, CORS, rate limiting

### 🏛️ **Component Architecture**

#### **Frontend Components**

##### **1. Core Application (`main.js`)**
```javascript
class PDFSmallerApp {
    // Dynamic module loading
    // Error handling and initialization
    // Module lifecycle management
}
```

##### **2. Upload Manager (`upload-manager.js`)**
```javascript
class UploadManager {
    // Drag & drop handling
    // File validation
    // Progress tracking
    // Error handling
}
```

##### **3. Compression Flow (`compression-flow.js`)**
```javascript
class CompressionFlow {
    // Client-side compression
    // Server-side processing
    // Job management
    // Results handling
}
```

##### **4. Results Display (`results-display.js`)**
```javascript
class ResultsDisplay {
    // Download management
    // Progress visualization
    // Error display
    // File information
}
```

#### **Backend Services**

##### **1. Authentication Service**
```python
class AuthService:
    def register_user(email, password, name) -> User
    def authenticate_user(email, password) -> str
    def verify_token(token) -> User
    def refresh_token(token) -> str
```

##### **2. Compression Service**
```python
class CompressionService:
    def compress_pdf(file_path, settings) -> dict
    def bulk_compress(files, settings) -> str
    def get_compression_status(job_id) -> dict
    def cleanup_temp_files() -> None
```

##### **3. Subscription Service**
```python
class SubscriptionService:
    def create_subscription(user_id, plan_id) -> Subscription
    def check_usage_limits(user_id, operation) -> bool
    def get_user_tier(user_id) -> str
    def process_payment(payment_data) -> dict
```

### 🔐 **Security Architecture**

#### **Authentication Flow**
1. User submits credentials
2. Server validates and generates JWT
3. Client stores JWT in secure storage
4. Subsequent requests include JWT in Authorization header
5. Server validates JWT and extracts user context

#### **Security Middleware**
- **Rate Limiting**: Per-user and per-endpoint limits
- **Input Validation**: File type, size, and content validation
- **Header Validation**: Security header checking
- **CORS Configuration**: Restricted origin policies
- **File Sanitization**: Malware scanning and validation

#### **Data Protection**
- **Encryption**: JWT tokens, sensitive data
- **Hashing**: Password storage with bcrypt
- **Validation**: Input sanitization and type checking
- **Access Control**: Role-based permissions

### 📊 **Data Flow Architecture**

#### **PDF Compression Flow**
```
1. User Upload → File Validation → Storage
2. Compression Request → Job Creation → Queue
3. Background Processing → Progress Updates → Completion
4. Result Storage → Download Link → Cleanup
```

#### **Bulk Processing Flow**
```
1. Multiple Files → Batch Validation → Job Creation
2. Celery Task → Parallel Processing → Progress Tracking
3. Result Aggregation → ZIP Creation → Storage
4. Notification → Download → Cleanup
```

### 🗄️ **Database Design**

#### **Core Tables**
```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscription_tier VARCHAR(50) DEFAULT 'free'
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    plan_id VARCHAR(100) NOT NULL,
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compression jobs table
CREATE TABLE compression_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    file_count INTEGER DEFAULT 1,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

### 🚀 **Performance Considerations**

#### **Frontend Optimization**
- **Code Splitting**: Dynamic imports for feature modules
- **Lazy Loading**: Components loaded on demand
- **Caching**: Service worker for offline support
- **Compression**: Minified and gzipped assets

#### **Backend Optimization**
- **Database**: Connection pooling and query optimization
- **Caching**: Redis for session and result caching
- **Async Processing**: Celery for long-running tasks
- **File Handling**: Streaming uploads and downloads

#### **Scalability Features**
- **Horizontal Scaling**: Stateless API design
- **Load Balancing**: Ready for multiple instances
- **Database**: Read replicas and sharding ready
- **Storage**: Configurable cloud storage support

### 🔧 **Configuration Management**

#### **Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret

# External Services
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# File Storage
UPLOAD_FOLDER=/tmp/pdf_uploads
MAX_FILE_SIZE=104857600  # 100MB
```

#### **Configuration Classes**
```python
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    DATABASE_URL = os.environ.get('DATABASE_URL')
    REDIS_URL = os.environ.get('REDIS_URL')
    
class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    
class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    # Additional production settings
```

### 🧪 **Testing Strategy**

#### **Frontend Testing**
- **Unit Tests**: Component and service testing
- **Integration Tests**: Module interaction testing
- **E2E Tests**: User workflow testing
- **Performance Tests**: Load and stress testing

#### **Backend Testing**
- **Unit Tests**: Service and utility testing
- **API Tests**: Endpoint functionality testing
- **Integration Tests**: Database and external service testing
- **Load Tests**: Performance and scalability testing

### 📈 **Monitoring & Observability**

#### **Logging Strategy**
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Context Information**: User ID, request ID, operation type
- **Performance Metrics**: Response times, resource usage

#### **Metrics Collection**
- **Application Metrics**: Request rates, error rates, response times
- **Business Metrics**: User registrations, compression jobs, conversions
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Custom Metrics**: Feature usage, user satisfaction

This architecture provides a solid foundation for the current features while maintaining flexibility for future expansion and scaling.
