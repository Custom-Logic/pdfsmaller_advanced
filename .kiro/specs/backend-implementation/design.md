# Design Document

## Overview

This design document outlines the architecture for implementing the missing backend functionality for the PDFSmaller application. The design builds upon the existing Flask-based compression service to add user authentication, subscription management, bulk processing, and enhanced security features. The architecture follows RESTful API principles and implements a modular, scalable design that can handle both free and premium user tiers.

## Architecture

### High-Level Architecture

The backend follows a layered architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Flask Routes)                 │
├─────────────────────────────────────────────────────────────┤
│                   Service Layer (Business Logic)            │
├─────────────────────────────────────────────────────────────┤
│                   Data Access Layer (Models/Repositories)   │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer (Database, Storage)  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: Flask with Blueprint organization
- **Database**: SQLite for development, PostgreSQL for production
- **ORM**: SQLAlchemy with Flask-SQLAlchemy
- **Authentication**: JWT tokens with Flask-JWT-Extended
- **Payment Processing**: Stripe integration
- **File Storage**: Local filesystem with configurable cloud storage support
- **Rate Limiting**: Flask-Limiter with Redis backend
- **Task Queue**: Celery for background processing (bulk operations)
- **Security**: Werkzeug security utilities, input validation

## Components and Interfaces

### 1. Authentication Module

**Components:**
- `AuthService`: Handles user registration, login, token management
- `UserModel`: SQLAlchemy model for user data
- `AuthRoutes`: API endpoints for authentication operations

**Key Methods:**
```python
class AuthService:
    def register_user(email, password, name) -> User
    def authenticate_user(email, password) -> str  # Returns JWT token
    def verify_token(token) -> User
    def refresh_token(token) -> str
```

**Security Features:**
- Password hashing using Werkzeug's pbkdf2:sha256
- JWT tokens with configurable expiration
- Rate limiting on authentication endpoints
- Email validation and sanitization

### 2. Subscription Management Module

**Components:**
- `SubscriptionService`: Business logic for subscription operations
- `SubscriptionModel`: Database model for subscription data
- `PlanModel`: Database model for subscription plans
- `StripeService`: Integration with Stripe payment processing

**Key Methods:**
```python
class SubscriptionService:
    def create_subscription(user_id, plan_id, payment_method) -> Subscription
    def cancel_subscription(subscription_id) -> bool
    def check_usage_limits(user_id, operation_type) -> bool
    def get_user_subscription(user_id) -> Subscription
```

**Plan Tiers:**
- **Free**: 10 compressions/day, single file only, basic compression
- **Premium**: 500 compressions/day, bulk processing, advanced compression
- **Pro**: Unlimited compressions, priority processing, API access

### 3. Enhanced Compression Module

**Components:**
- `BulkCompressionService`: Handles multiple file processing
- `CompressionJobModel`: Tracks compression job status
- `FileManager`: Manages file storage and cleanup

**Key Methods:**
```python
class BulkCompressionService:
    def create_bulk_job(user_id, files, settings) -> CompressionJob
    def process_bulk_job(job_id) -> None  # Async processing
    def get_job_status(job_id) -> JobStatus
    def download_bulk_result(job_id) -> str  # Returns zip file path
```

**Processing Flow:**
1. Validate user permissions and usage limits
2. Create compression job record
3. Queue files for background processing
4. Process files asynchronously with progress updates
5. Create downloadable archive
6. Schedule cleanup after retention period

### 4. Database Schema

**Users Table:**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Subscriptions Table:**
```sql
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    plan_id INTEGER REFERENCES plans(id),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Compression Jobs Table:**
```sql
CREATE TABLE compression_jobs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    job_type VARCHAR(50) NOT NULL,  -- 'single' or 'bulk'
    status VARCHAR(50) NOT NULL,    -- 'pending', 'processing', 'completed', 'failed'
    settings JSON,
    file_count INTEGER DEFAULT 1,
    completed_count INTEGER DEFAULT 0,
    result_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

### 5. API Endpoints Design

**Authentication Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh JWT token

**Compression Endpoints:**
- `POST /api/compress/single` - Single file compression (existing, enhanced)
- `POST /api/compress/bulk` - Bulk file compression (new)
- `GET /api/compress/jobs/{job_id}` - Get job status (new)
- `GET /api/compress/download/{job_id}` - Download results (new)

**Subscription Endpoints:**
- `GET /api/subscriptions` - Get user subscription info
- `POST /api/subscriptions/create` - Create new subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `GET /api/subscriptions/usage` - Get usage statistics

## Data Models

### User Model
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    subscription = db.relationship('Subscription', backref='user', uselist=False)
    compression_jobs = db.relationship('CompressionJob', backref='user')
```

### Subscription Model
```python
class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('plan.id'), nullable=False)
    stripe_subscription_id = db.Column(db.String(255))
    status = db.Column(db.String(50), nullable=False)
    current_period_start = db.Column(db.DateTime)
    current_period_end = db.Column(db.DateTime)
```

### Compression Job Model
```python
class CompressionJob(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    job_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    settings = db.Column(db.JSON)
    file_count = db.Column(db.Integer, default=1)
    completed_count = db.Column(db.Integer, default=0)
    result_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

## Error Handling

### Error Response Format
```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid file format",
        "details": {
            "field": "file",
            "allowed_types": ["pdf"]
        }
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789"
}
```

### Error Categories
- **Authentication Errors**: 401 Unauthorized, 403 Forbidden
- **Validation Errors**: 400 Bad Request with detailed field errors
- **Rate Limiting**: 429 Too Many Requests with retry headers
- **Server Errors**: 500 Internal Server Error with sanitized messages
- **Not Found**: 404 Not Found for missing resources

### Error Handling Strategy
1. **Input Validation**: Comprehensive validation at API boundaries
2. **Exception Handling**: Centralized exception handlers with logging
3. **Graceful Degradation**: Fallback mechanisms for non-critical failures
4. **User-Friendly Messages**: Clear, actionable error messages
5. **Security**: No sensitive information in error responses

## Testing Strategy

### Unit Testing
- **Models**: Test database operations, validations, relationships
- **Services**: Test business logic, edge cases, error conditions
- **Utilities**: Test helper functions, security utilities

### Integration Testing
- **API Endpoints**: Test complete request/response cycles
- **Database Operations**: Test transactions, constraints, migrations
- **External Services**: Test Stripe integration, file operations

### Performance Testing
- **Load Testing**: Test compression performance under load
- **Concurrency**: Test multiple simultaneous operations
- **Memory Usage**: Test file handling and cleanup

### Security Testing
- **Authentication**: Test token validation, session management
- **Authorization**: Test access controls, permission checks
- **Input Validation**: Test malicious input handling
- **File Security**: Test file type validation, malware scanning

## Security Considerations

### Authentication Security
- JWT tokens with short expiration times (15 minutes access, 7 days refresh)
- Secure password hashing with salt
- Rate limiting on authentication endpoints
- Account lockout after failed attempts

### File Security
- Strict file type validation using magic numbers
- File size limits based on user tier
- Virus scanning for uploaded files
- Secure temporary file handling with automatic cleanup

### API Security
- CORS configuration for allowed origins
- Request size limits
- Rate limiting per user and IP
- Input sanitization and validation
- SQL injection prevention through ORM

### Data Protection
- Encryption at rest for sensitive data
- Secure database connections
- Regular security audits
- GDPR compliance for user data handling