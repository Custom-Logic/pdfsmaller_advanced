# Technology Stack

## Backend Stack

- **Framework**: Flask 2.3.3 with Flask extensions
  - Flask-SQLAlchemy for ORM
  - Flask-Migrate for database migrations
  - Flask-JWT-Extended for authentication
  - Flask-CORS for cross-origin requests
  - Flask-Limiter for rate limiting and cost control
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Task Queue**: Celery with Redis broker for background processing
- **WSGI Server**: Gunicorn for production deployment
- **Authentication**: JWT tokens with Stripe integration for payments and subscriptions
- **Analytics**: Integration points for Segment/Amplitude tracking

## Frontend Stack

- **Client**: Modern Vanilla JavaScript with ES6+ modules, Web Components, and modern APIs
- **Module System**: ES6 modules for better code organization and maintainability
- **PDF Processing**: PDF-lib for intelligent preview and analysis before server processing
- **Modern JavaScript Features**: Async/await, Fetch API, Web Workers, File API, Drag & Drop API
- **Styling**: Modern CSS with CSS Grid, Flexbox, Custom Properties, and responsive design
- **Analytics**: Client-side tracking for user behavior and conversion metrics
- **Security**: Content Security Policy, Subresource Integrity, secure communication protocols

## Infrastructure & Scalability

- **Containerization**: Docker with multi-service docker-compose setup
- **Reverse Proxy**: Nginx for production deployments and load balancing
- **Caching/Queue**: Redis for both caching and Celery task queue
- **File Processing**: Ghostscript for server-side PDF compression
- **Health Monitoring**: Built-in health checks for all services
- **Cost Monitoring**: Real-time alerts and quotas to prevent cost spiral
- **Rate Limiting**: Per-user and per-IP limits to prevent abuse

## Development Tools

- **Testing**: pytest with Flask testing extensions
- **Environment**: python-dotenv for configuration management
- **Database**: Alembic for schema migrations
- **Process Management**: Celery beat for scheduled tasks and cleanup
- **Monitoring**: Application performance monitoring and error tracking

## Security & Intelligence Architecture

- **Intelligent Preview**: Client-side analysis and preview generation using modern JavaScript APIs
- **Secure Processing**: End-to-end encrypted file transfer to secure server processing
- **Data Handling**: Automatic file deletion, encrypted storage, comprehensive audit logging
- **Smart Optimization**: AI-powered compression recommendations based on file analysis
- **Compliance**: GDPR/HIPAA/SOC2 considerations built into data flow design

## Common Commands

### Development Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Set up database
python manage_db.py

# Run development server with analytics tracking
FLASK_ENV=development python app.py

# Run Celery worker (separate terminal)
celery -A celery_worker.celery worker --loglevel=info --concurrency=2

# Run Celery beat scheduler (separate terminal)
celery -A celery_worker.celery beat --loglevel=info
```

### Docker Operations
```bash
# Start all services for development
docker-compose up -d

# Start with production profile (includes nginx and monitoring)
docker-compose --profile production up -d

# View logs for specific service
docker-compose logs -f pdf-compression
docker-compose logs -f celery_worker

# Rebuild after changes
docker-compose build --no-cache

# Scale workers for load testing
docker-compose up -d --scale celery_worker=3
```

### Database Management
```bash
# Create migration
flask db migrate -m "description"

# Apply migrations
flask db upgrade

# Reset database (development only)
python manage_db.py --reset

# Backup database (production)
python manage_db.py --backup
```

### Testing & Quality Assurance
```bash
# Run all tests
pytest

# Run with coverage reporting
pytest --cov=src --cov-report=html

# Run specific test categories
pytest tests/test_compression.py  # Core functionality
pytest tests/test_privacy.py     # Privacy compliance
pytest tests/test_performance.py # Performance benchmarks

# Load testing for server-side processing
pytest tests/load/test_bulk_processing.py
```

### Monitoring & Analytics
```bash
# Monitor Celery queue status
celery -A celery_worker.celery inspect active

# Check Redis memory usage
redis-cli info memory

# Monitor application metrics
python scripts/health_check.py

# Generate usage analytics report
python scripts/analytics_report.py --period=weekly
```

### API Development
```bash
# Generate API documentation
python scripts/generate_api_docs.py

# Test API endpoints
pytest tests/api/test_compression_api.py

# Validate API rate limits
python scripts/test_rate_limits.py
```