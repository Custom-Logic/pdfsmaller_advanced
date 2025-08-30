/**
 * Standard Service Base Class
 * All services must extend this class and implement the standard interface
 */

export class StandardService extends EventTarget {
    constructor() {
        super();
        this.isInitialized = false;
        this.isProcessing = false;
        this.lastError = null;
    }
    
    async init() {
        // Service initialization logic
        this.isInitialized = true;
        this.emitServiceReady();
    }
    
    // Standard event emission methods
    emitProgress(percentage, message, data = {}) {
        this.dispatchEvent(new CustomEvent('progress', {
            detail: {
                percentage,
                message,
                data,
                timestamp: Date.now(),
                service: this.constructor.name
            }
        }));
    }
    
    emitComplete(result, message = 'Operation completed') {
        this.isProcessing = false;
        this.dispatchEvent(new CustomEvent('complete', {
            detail: {
                result,
                message,
                timestamp: Date.now(),
                service: this.constructor.name
            }
        }));
    }
    
    emitError(error, context = {}) {
        this.isProcessing = false;
        this.lastError = error;
        this.dispatchEvent(new CustomEvent('error', {
            detail: {
                error: error.message || error,
                context,
                timestamp: Date.now(),
                service: this.constructor.name
            }
        }));
    }
    
    emitStatusChange(status, data = {}) {
        this.dispatchEvent(new CustomEvent('statusChanged', {
            detail: {
                status,
                data,
                timestamp: Date.now(),
                service: this.constructor.name
            }
        }));
    }
    
    emitServiceReady() {
        this.dispatchEvent(new CustomEvent('serviceReady', {
            detail: {
                service: this.constructor.name,
                timestamp: Date.now()
            }
        }));
    }
}