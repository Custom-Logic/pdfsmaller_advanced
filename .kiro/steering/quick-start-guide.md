# Quick Start Guide for Developers

## 🚀 **Get Started in 10 Minutes**

This guide will get you up and running with the PDFSmaller project quickly.

### **Prerequisites Check**
```bash
# Check if you have the required software
python --version          # Should be 3.9+
node --version           # Should be 16+
git --version            # Any recent version
```

### **1. Clone and Setup (2 minutes)**
```bash
# Clone the repository
git clone <your-repo-url>
cd pdfsmaller

# Check the project structure
ls -la
```

### **2. Backend Setup (3 minutes)**
```bash
cd pdf_smaller_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your configuration
```

### **3. Frontend Setup (2 minutes)**
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### **4. Database Setup (2 minutes)**
```bash
cd ../pdf_smaller_backend

# Set environment variables
export FLASK_ENV=development
export DATABASE_URL=sqlite:///dev.db  # Use SQLite for development

# Initialize database
flask db upgrade

# Start backend server
flask run
```

### **5. Verify Setup (1 minute)**
```bash
# Check if backend is running
curl http://localhost:5000/health

# Check if frontend is running
# Open http://localhost:3000 in your browser
```

## 🛠️ **Development Commands**

### **Backend Development**
```bash
cd pdf_smaller_backend

# Run with auto-reload
flask run --debug

# Run tests
pytest tests/ -v

# Check code quality
flake8 src/ --max-line-length=88
black --check src/
mypy src/

# Database operations
flask db migrate -m "Description"
flask db upgrade
flask db downgrade
```

### **Frontend Development**
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
npm run test:watch

# Lint code
npm run lint
npm run lint:fix
```

### **Full Stack Development**
```bash
# Terminal 1: Backend
cd pdf_smaller_backend
flask run

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Redis (if needed)
redis-server

# Terminal 4: Celery (if needed)
cd pdf_smaller_backend
celery -A src.celery_app worker --loglevel=info
```

## 📁 **Project Structure Quick Reference**

```
pdfsmaller/
├── frontend/                    # JavaScript frontend
│   ├── js/                     # ES6 modules
│   │   ├── components/         # UI components
│   │   ├── services/           # API and business logic
│   │   ├── modules/            # Feature modules
│   │   └── utils/              # Utility functions
│   ├── static/                 # CSS and assets
│   └── index.html              # Main application
├── pdf_smaller_backend/        # Python Flask backend
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   ├── models/             # Database models
│   │   └── utils/              # Utilities
│   └── requirements.txt        # Python dependencies
└── .kiro/                      # Project documentation
    └── steering/               # Development guides
```

## 🔧 **Common Development Tasks**

### **Adding a New API Endpoint**
```python
# 1. Create route in src/routes/
from flask import Blueprint, request, jsonify

new_bp = Blueprint('new', __name__)

@new_bp.route('/new-endpoint', methods=['POST'])
def new_endpoint():
    data = request.get_json()
    # Your logic here
    return jsonify({'success': True})

# 2. Register in src/main/main.py
from src.routes import new_bp
app.register_blueprint(new_bp, url_prefix='/api/new')
```

### **Adding a New Frontend Component**
```javascript
// 1. Create component in js/components/
export class NewComponent extends BaseComponent {
    constructor() {
        super();
        this.init();
    }
    
    init() {
        // Component initialization
    }
}

// 2. Import in your module
import { NewComponent } from '../components/new-component.js';
```

### **Database Model Changes**
```python
# 1. Modify model in src/models/
class NewModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)

# 2. Create and run migration
flask db migrate -m "Add new model"
flask db upgrade
```

## 🧪 **Testing Quick Start**

### **Backend Testing**
```bash
cd pdf_smaller_backend

# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_auth.py -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Run specific test
pytest tests/test_auth.py::TestAuthService::test_register_user -v
```

### **Frontend Testing**
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=compression-flow.test.js
```

## 🐛 **Debugging Tips**

### **Backend Debugging**
```python
# Add debug logging
import logging
logger = logging.getLogger(__name__)

def your_function():
    logger.debug("Entering function")
    logger.info("Processing data")
    logger.error("Error occurred", exc_info=True)

# Use Flask debugger
if app.debug:
    import pdb; pdb.set_trace()
```

### **Frontend Debugging**
```javascript
// Add debug logging
if (__DEV__) {
    console.log('Debug info:', data);
    console.trace('Function call stack');
}

// Use browser dev tools
debugger; // Breakpoint in code
```

### **Database Debugging**
```python
# Enable SQL logging
app.config['SQLALCHEMY_ECHO'] = True

# Query debugging
from sqlalchemy import text
result = db.session.execute(text("SELECT * FROM users"))
print(result.fetchall())
```

## 📚 **Next Steps**

### **For New Developers**
1. **Read the Documentation**:
   - Start with `project-overview.md`
   - Review `technical-architecture.md`
   - Understand `development-workflow.md`

2. **Explore the Codebase**:
   - Look at existing components
   - Understand the API structure
   - Review the database models

3. **Start with Simple Tasks**:
   - Fix a small bug
   - Add a simple feature
   - Write a test

### **For Experienced Developers**
1. **Review the Architecture**:
   - Understand the design decisions
   - Identify improvement opportunities
   - Plan refactoring tasks

2. **Focus on Phase 2**:
   - Start with bulk processing optimization
   - Implement error handling improvements
   - Work on performance optimization

3. **Plan Future Phases**:
   - Research document conversion libraries
   - Investigate OCR solutions
   - Plan cloud integration strategy

## 🆘 **Getting Help**

### **When You're Stuck**
1. **Check the Documentation**: Look in `.kiro/steering/`
2. **Review Similar Code**: Look at existing implementations
3. **Check Tests**: Tests often show how to use the code
4. **Ask Questions**: Use your team's communication channels

### **Common Issues**
- **Import Errors**: Check module paths and ES6 syntax
- **Database Issues**: Verify connection strings and migrations
- **Frontend Build Issues**: Clear node_modules and reinstall
- **Backend Startup Issues**: Check environment variables and dependencies

### **Useful Resources**
- [Flask Documentation](https://flask.palletsprojects.com/)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PDF Processing Libraries](https://pypi.org/search/?q=pdf)

## 🎯 **Your First Task**

Ready to start? Here's a simple first task:

**Task**: Add a health check endpoint to the backend

```python
# In src/routes/health_routes.py
from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    })
```

**Steps**:
1. Create the file above
2. Register the blueprint in `main.py`
3. Test with `curl http://localhost:5000/health`
4. Write a test for the endpoint

This will help you understand the project structure and get comfortable with the development workflow.

---

**Happy Coding! 🚀**

Remember: Start small, test often, and don't hesitate to ask for help when you need it.
