# Project Structure

## Root Directory Layout

```
├── frontend/                    # Modern vanilla JavaScript application
│   ├── index.html              # Main SPA with intelligent processing
│   ├── js/                     # Modular JavaScript code
│   │   ├── modules/            # ES6 modules for features
│   │   ├── components/         # Reusable UI components
│   │   ├── services/           # API and business logic
│   │   └── utils/              # Utility functions
│   ├── css/                    # Modern CSS with custom properties
│   └── assets/                 # Images, icons, and other assets
├── pdf_smaller_backend/        # Flask backend application
└── .kiro/                      # Kiro IDE configuration
```

## Backend Structure (`pdf_smaller_backend/`)

### Core Application Files
```
├── app.py                      # Application entry point
├── celery_worker.py           # Celery worker configuration
├── celery_beat.py             # Celery beat scheduler
├── manage_db.py               # Database management utilities
├── gunicorn_conf.py           # Gunicorn WSGI server config
└── requirements.txt           # Python dependencies
```

### Source Code Organization (`src/`)
```
src/
├── main/                      # Application factory and core setup
├── config/                    # Configuration management
├── database/                  # Database connection and setup
├── models/                    # SQLAlchemy database models
├── routes/                    # Flask route handlers (API endpoints)
├── services/                  # Business logic and service layer
├── tasks/                     # Celery background tasks
├── utils/                     # Utility functions and helpers
└── celery_app.py             # Celery application configuration
```

### Infrastructure Files
```
├── dockerfile                 # Container build configuration
├── docker_compose.yml         # Multi-service orchestration
├── docker-compose.dev.yml     # Development environment
├── nginx.conf                 # Reverse proxy configuration
└── .env.example              # Environment variables template
```

### Documentation
```
├── README.md                  # Project overview
├── CONFIG.md                  # Configuration guide
├── DATABASE_SETUP.md          # Database setup instructions
├── DEPLOYMENT.md              # Deployment guide
└── CELERY_SETUP.md           # Celery configuration guide
```

## Architectural Patterns

### Flask Application Factory
- Main app creation in `src/main/main.py`
- Configuration loaded from `src/config/`
- Blueprints registered for route organization
- Analytics integration points for tracking user behavior

### Service Layer Pattern
- Business logic separated into `src/services/`
- Routes handle HTTP concerns only
- Services contain core application logic
- Privacy-first processing decisions implemented at service layer

### Background Task Processing
- Celery tasks in `src/tasks/`
- Redis as message broker
- Separate worker processes for scalability
- Cost monitoring and rate limiting built into task execution
- Automatic cleanup tasks for privacy compliance

### Database Layer
- SQLAlchemy models in `src/models/`
- Database utilities in `src/database/`
- Alembic migrations for schema changes
- User analytics and conversion tracking models

### Intelligence & Security Architecture
- Intelligent preview system using modern JavaScript APIs
- Secure server-side processing with end-to-end encryption
- Smart compression recommendations based on file analysis
- Automatic file cleanup and comprehensive audit logging
- User consent management for processing and data handling

## File Naming Conventions

- **Python files**: snake_case (e.g., `compression_service.py`)
- **Classes**: PascalCase (e.g., `CompressionService`)
- **Functions/variables**: snake_case (e.g., `compress_pdf`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Configuration files**: lowercase with extensions (e.g., `docker-compose.yml`)

## Import Organization

1. Standard library imports
2. Third-party library imports
3. Local application imports
4. Relative imports (if necessary)

## Testing Structure

```
tests/
├── unit/                      # Unit tests for individual components
│   ├── services/             # Service layer tests
│   ├── models/               # Database model tests
│   └── utils/                # Utility function tests
├── integration/               # Integration tests for API endpoints
│   ├── api/                  # REST API endpoint tests
│   ├── auth/                 # Authentication flow tests
│   └── payments/             # Stripe integration tests
├── performance/               # Performance and load tests
│   ├── compression/          # Compression speed benchmarks
│   └── scalability/          # Multi-user load tests
├── privacy/                   # Privacy compliance tests
│   ├── client_side/          # Client-side processing validation
│   └── data_handling/        # Data retention and cleanup tests
├── fixtures/                  # Test data and fixtures
│   ├── sample_pdfs/          # Test PDF files of various types
│   └── user_scenarios/       # User persona test data
└── conftest.py               # Pytest configuration and shared fixtures
```

## Key Development Principles

### Security & Intelligence by Design
- Intelligent preview and analysis before secure server processing
- End-to-end encryption for all file transfers
- Automatic file cleanup and secure deletion protocols
- Smart compression recommendations based on file characteristics
- Clear user consent flows and transparent data handling
- Comprehensive audit trails for compliance requirements

### Performance & Scalability
- Monitor and optimize compression algorithms for speed
- Implement proper rate limiting and cost controls
- Design for horizontal scaling of Celery workers
- Cache frequently accessed data and results

### User Experience Focus
- Prioritize simplicity and clarity in UI/UX decisions
- A/B test conversion flows and feature adoption
- Implement comprehensive analytics for user behavior tracking
- Design for the three key personas (Privacy-Conscious, Business User, Occasional User)

### Business Metrics Integration
- Track conversion funnel metrics at code level
- Implement feature flags for gradual rollouts
- Monitor key OKRs through application telemetry
- Build cost monitoring into all resource-intensive operations