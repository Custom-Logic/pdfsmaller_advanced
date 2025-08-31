/**
 * Service Progress Integration
 * Connects service progress events to progress trackers
 */

export class ServiceProgressIntegration {
    constructor() {
        this.services = new Map();
        this.progressTrackers = new Map();
        this.activeOperations = new Map();
    }

    init() {
        this.setupProgressTrackers();
        this.setupServiceListeners();
    }

    setupProgressTrackers() {
        const tabs = ['compress', 'convert', 'ocr', 'ai'];
        
        tabs.forEach(tab => {
            const tracker = document.getElementById(`${tab}ProgressTracker`) || 
                           document.getElementById('progressTracker');
            const progressCard = document.getElementById(`${tab}ProgressCard`) || 
                               document.getElementById('progressCard');
            const resultsCard = document.getElementById(`${tab}ResultsCard`) || 
                              document.getElementById('resultsCard');
            const resultsDisplay = document.getElementById(`${tab}ResultsDisplay`) || 
                                 document.getElementById('resultsDisplay');

            if (tracker) {
                this.progressTrackers.set(tab, {
                    tracker,
                    progressCard,
                    resultsCard,
                    resultsDisplay
                });
            }
        });
    }

    setupServiceListeners() {
        // Listen for service events on document
        document.addEventListener('serviceProgress', (event) => {
            this.handleServiceProgress(event);
        });

        document.addEventListener('serviceComplete', (event) => {
            this.handleServiceComplete(event);
        });

        document.addEventListener('serviceError', (event) => {
            this.handleServiceError(event);
        });

        document.addEventListener('serviceStatusChange', (event) => {
            this.handleServiceStatus(event);
        });
    }

    handleServiceProgress(event) {
        const { serviceType, percentage, message, operation } = event.detail;
        const tabName = this.getTabFromServiceType(serviceType);
        
        if (tabName) {
            this.updateProgress(tabName, percentage, message);
        }
    }

    handleServiceComplete(event) {
        const { serviceType, result, message } = event.detail;
        const tabName = this.getTabFromServiceType(serviceType);
        
        if (tabName) {
            this.completeProgress(tabName, result);
        }
    }

    handleServiceError(event) {
        const { serviceType, error } = event.detail;
        const tabName = this.getTabFromServiceType(serviceType);
        
        if (tabName) {
            this.showError(tabName, error);
        }
    }

    handleServiceStatus(event) {
        const { serviceType, status, data } = event.detail;
        const tabName = this.getTabFromServiceType(serviceType);
        
        if (status === 'processing' && tabName) {
            this.startProgress(tabName, `Starting ${serviceType}...`);
        }
    }

    getTabFromServiceType(serviceType) {
        const mapping = {
            'compression': 'compress',
            'conversion': 'convert',
            'ocr': 'ocr',
            'ai': 'ai'
        };
        return mapping[serviceType] || serviceType;
    }

    startProgress(tab, message) {
        const components = this.progressTrackers.get(tab);
        if (!components) return;

        const { tracker, progressCard } = components;
        
        if (progressCard) {
            progressCard.style.display = 'block';
        }
        
        if (tracker) {
            tracker.updateProgress({
                percentage: 0,
                message: message,
                operation: tab
            });
        }
    }

    updateProgress(tab, percentage, message) {
        const components = this.progressTrackers.get(tab);
        if (!components) return;

        const { tracker } = components;
        
        if (tracker) {
            tracker.updateProgress({
                percentage: percentage,
                message: message,
                operation: tab
            });
        }
    }

    completeProgress(tab, results) {
        const components = this.progressTrackers.get(tab);
        if (!components) return;

        const { tracker, progressCard, resultsCard, resultsDisplay } = components;

        // Update progress to 100%
        if (tracker) {
            tracker.updateProgress({
                percentage: 100,
                message: 'Process completed successfully!',
                operation: tab
            });

            // Hide progress after delay
            setTimeout(() => {
                if (progressCard) progressCard.style.display = 'none';
                tracker.reset();
            }, 2000);
        }

        // Show results
        if (resultsDisplay && resultsCard && results) {
            resultsCard.style.display = 'block';
            resultsDisplay.showResults(results);
        }
    }

    showError(tab, error) {
        const components = this.progressTrackers.get(tab);
        if (!components) return;

        const { tracker, progressCard } = components;

        if (tracker) {
            tracker.updateProgress({
                percentage: 0,
                message: `Error: ${error.message || error}`,
                operation: tab
            });

            setTimeout(() => {
                if (progressCard) progressCard.style.display = 'none';
                tracker.reset();
            }, 3000);
        }
    }

    registerService(serviceType, serviceInstance) {
        this.services.set(serviceType, serviceInstance);
        
        // If service has existing listeners, ensure they're connected
        if (serviceInstance.addEventListener) {
            serviceInstance.addEventListener('progress', (event) => {
                document.dispatchEvent(new CustomEvent('serviceProgress', {
                    detail: {
                        serviceType,
                        ...event.detail
                    }
                }));
            });

            serviceInstance.addEventListener('complete', (event) => {
                document.dispatchEvent(new CustomEvent('serviceComplete', {
                    detail: {
                        serviceType,
                        ...event.detail
                    }
                }));
            });

            serviceInstance.addEventListener('error', (event) => {
                document.dispatchEvent(new CustomEvent('serviceError', {
                    detail: {
                        serviceType,
                        ...event.detail
                    }
                }));
            });
        }
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.serviceProgressIntegration = new ServiceProgressIntegration();
        window.serviceProgressIntegration.init();
    });
} else {
    window.serviceProgressIntegration = new ServiceProgressIntegration();
    window.serviceProgressIntegration.init();
}