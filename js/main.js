/**
 * PDFSmaller - Main Application Entry Point
 * Modern ES6+ JavaScript with modular architecture and dynamic imports
 */

class PDFSmallerApp {
  constructor() {
    this.app = null;
    this.isInitialized = false;
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  async init() {
    try {
      // Initialize error handling first
      this.setupGlobalErrorHandling();
            
      // Show loading indicator
      this.showLoadingIndicator();
            
      // Load core modules with dynamic imports for code splitting
      await this.loadCoreModules();
            
      // Initialize main application
      const { App } = await this.loadModule('./modules/app.js');
      this.app = new App();
      await this.app.init();
            
      // Initialize main integration for new components
      const { default: MainIntegration } = await this.loadModule('./main-integration.js');
      this.mainIntegration = new MainIntegration();
      await this.mainIntegration.init();

      // Load integration test in development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        await this.loadModule('./utils/integration-test.js');
      }
            
      // Hide loading indicator
      this.hideLoadingIndicator();
            
      this.isInitialized = true;
            
      if (__DEV__) {
        console.log('PDFSmaller application initialized successfully');
        console.log('Loaded modules:', Array.from(this.loadedModules.keys()));
      }
    } catch (error) {
      this.hideLoadingIndicator();
      const { ErrorHandler } = await this.loadModule('./utils/error-handler.js');
      ErrorHandler.handleError(error, { context: 'Application initialization' });
    }
  }

  async loadCoreModules() {
    // Preload critical modules in parallel
    const coreModules = [
      './utils/error-handler.js',
      './modules/app.js',
      './services/analytics-service.js'
    ];

    await Promise.all(
      coreModules.map(module => this.loadModule(module))
    );
  }

  async loadModule(modulePath) {
    // Check if module is already loaded
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath);
    }

    // Check if module is currently being loaded
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }

    // Load module with dynamic import
    const loadingPromise = this.dynamicImport(modulePath);
    this.loadingPromises.set(modulePath, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(modulePath, module);
      this.loadingPromises.delete(modulePath);
      return module;
    } catch (error) {
      this.loadingPromises.delete(modulePath);
      throw new Error(`Failed to load module ${modulePath}: ${error.message}`);
    }
  }

  async dynamicImport(modulePath) {
    try {
      return await import(modulePath);
    } catch (error) {
      // Fallback for development/testing environments
      if (__DEV__) {
        console.warn(`Dynamic import failed for ${modulePath}, attempting fallback`);
      }
      throw error;
    }
  }

  // Lazy loading utility for feature modules
  async loadFeatureModule(featureName) {
    const moduleMap = {
      'compression': './modules/compression-flow.js',
      'upload': './modules/upload-manager.js',
      'auth': './modules/auth-manager.js',
      'preview': './modules/preview-generator.js'
    };

    const modulePath = moduleMap[featureName];
    if (!modulePath) {
      throw new Error(`Unknown feature module: ${featureName}`);
    }

    return this.loadModule(modulePath);
  }

  // Component lazy loading
  async loadComponent(componentName) {
    const componentMap = {
      'file-uploader': './components/file-uploader.js',
      'progress-tracker': './components/progress-tracker.js',
      'results-display': './components/results-display.js',
      'settings-panel': './components/settings-panel.js'
    };

    const componentPath = componentMap[componentName];
    if (!componentPath) {
      throw new Error(`Unknown component: ${componentName}`);
    }

    return this.loadModule(componentPath);
  }

  // Service lazy loading
  async loadService(serviceName) {
    const serviceMap = {
      'api': './services/api-client.js',
      'security': './services/security-service.js',
      'analytics': './services/analytics-service.js',
      'storage': './services/storage-service.js'
    };

    const servicePath = serviceMap[serviceName];
    if (!servicePath) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    return this.loadModule(servicePath);
  }

  setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', async (event) => {
      try {
        const { ErrorHandler } = await this.loadModule('./utils/error-handler.js');
        ErrorHandler.handleError(event.reason, { context: 'Unhandled promise rejection' });
      } catch (loadError) {
        console.error('Failed to load error handler:', loadError);
        console.error('Original error:', event.reason);
      }
    });

    // Handle global JavaScript errors
    window.addEventListener('error', async (event) => {
      try {
        const { ErrorHandler } = await this.loadModule('./utils/error-handler.js');
        ErrorHandler.handleError(event.error, { 
          context: 'Global error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      } catch (loadError) {
        console.error('Failed to load error handler:', loadError);
        console.error('Original error:', event.error);
      }
    });
  }

  showLoadingIndicator() {
    // Create minimal loading indicator
    const loader = document.createElement('div');
    loader.id = 'app-loader';
    loader.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="text-align: center;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid #3182ce;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 16px;
                    "></div>
                    <div style="color: #4a5568; font-size: 14px;">Loading PDFSmaller...</div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    document.body.appendChild(loader);
  }

  hideLoadingIndicator() {
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.remove();
    }
  }

  // Public API for external module loading
  getLoadedModules() {
    return Array.from(this.loadedModules.keys());
  }

  isModuleLoaded(modulePath) {
    return this.loadedModules.has(modulePath);
  }

  // Performance monitoring
  getPerformanceMetrics() {
    return {
      loadedModules: this.loadedModules.size,
      isInitialized: this.isInitialized,
      loadTime: performance.now()
    };
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const pdfSmallerApp = new PDFSmallerApp();
  await pdfSmallerApp.init();
    
  // Make app instance globally available for debugging and external access
  window.PDFSmallerApp = pdfSmallerApp;
});

// Hot Module Replacement support for development
if (import.meta.hot) {
  import.meta.hot.accept('./modules/app.js', async (newModule) => {
    if (window.PDFSmallerApp?.app) {
      console.log('Hot reloading app module...');
      await window.PDFSmallerApp.app.destroy?.();
      window.PDFSmallerApp.app = new newModule.App();
      await window.PDFSmallerApp.app.init();
    }
  });
}

// Export for potential external access and testing
export { PDFSmallerApp };