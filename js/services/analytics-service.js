/**
 * Analytics Service
 * Handles user behavior tracking and analytics integration
 */

export class AnalyticsService {
    constructor() {
        this.isInitialized = false;
        this.sessionId = null;
        this.userId = null;
        this.events = [];
        this.batchSize = 10;
        this.flushInterval = 30000; // 30 seconds
        this.flushTimer = null;
    }

    async init() {
        try {
            // Generate session ID
            this.sessionId = this.generateSessionId();
            
            // Initialize tracking
            this.initializeTracking();
            
            // Start batch flushing
            this.startBatchFlushing();
            
            this.isInitialized = true;
            
            // Track initialization
            this.trackEvent('analytics_initialized', {
                sessionId: this.sessionId,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.warn('Analytics initialization failed:', error);
        }
    }

    initializeTracking() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('page_visibility_changed', {
                hidden: document.hidden,
                timestamp: Date.now()
            });
        });

        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.flushEvents(true); // Synchronous flush
        });

        // Track errors
        window.addEventListener('error', (event) => {
            this.trackEvent('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: Date.now()
            });
        });

        // Track performance metrics
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.trackPerformanceMetrics();
                }, 1000);
            });
        }
    }

    trackEvent(eventName, properties = {}) {
        if (!this.isInitialized) {
            console.warn('Analytics not initialized');
            return;
        }

        const event = {
            name: eventName,
            properties: {
                ...properties,
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                referrer: document.referrer
            }
        };

        // Add to batch
        this.events.push(event);

        // Flush if batch is full
        if (this.events.length >= this.batchSize) {
            this.flushEvents();
        }

        // Send to Google Analytics if available
        this.sendToGoogleAnalytics(eventName, properties);
    }

    trackPageView(page, title) {
        this.trackEvent('page_view', {
            page: page || window.location.pathname,
            title: title || document.title,
            timestamp: Date.now()
        });

        // Send to Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('config', 'G-PQQ5LXLKWJ', {
                page_title: title,
                page_location: window.location.href
            });
        }
    }

    trackUserAction(action, element, properties = {}) {
        this.trackEvent('user_action', {
            action,
            element: element?.tagName || 'unknown',
            elementId: element?.id || null,
            elementClass: element?.className || null,
            ...properties
        });
    }

    trackConversion(conversionType, value = null, properties = {}) {
        this.trackEvent('conversion', {
            type: conversionType,
            value,
            ...properties
        });

        // Send to Google Analytics as conversion
        if (typeof gtag !== 'undefined') {
            gtag('event', 'conversion', {
                send_to: 'G-PQQ5LXLKWJ',
                value: value,
                currency: 'USD',
                transaction_id: this.generateTransactionId()
            });
        }
    }

    trackFileProcessing(eventType, fileData, processingData = {}) {
        this.trackEvent(`file_${eventType}`, {
            fileSize: fileData.size,
            fileType: fileData.type,
            fileName: fileData.name ? this.hashFileName(fileData.name) : null,
            ...processingData
        });
    }

    trackPerformanceMetrics() {
        if (!('performance' in window)) return;

        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.trackEvent('performance_metrics', {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                firstPaint: this.getFirstPaint(),
                firstContentfulPaint: this.getFirstContentfulPaint(),
                largestContentfulPaint: this.getLargestContentfulPaint()
            });
        }
    }

    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : null;
    }

    getLargestContentfulPaint() {
        return new Promise((resolve) => {
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    resolve(lastEntry ? lastEntry.startTime : null);
                });
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
                
                // Timeout after 10 seconds
                setTimeout(() => resolve(null), 10000);
            } else {
                resolve(null);
            }
        });
    }

    sendToGoogleAnalytics(eventName, properties) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                custom_parameter_1: properties.sessionId,
                custom_parameter_2: properties.userId,
                ...properties
            });
        }

        // Send to Google Tag Manager if available
        if (typeof dataLayer !== 'undefined') {
            dataLayer.push({
                event: eventName,
                eventCategory: 'PDFSmaller',
                eventAction: eventName,
                eventLabel: properties.label || null,
                eventValue: properties.value || null,
                customDimensions: properties
            });
        }
    }

    async flushEvents(synchronous = false) {
        if (this.events.length === 0) return;

        const eventsToSend = [...this.events];
        this.events = [];

        try {
            const payload = {
                events: eventsToSend,
                sessionId: this.sessionId,
                timestamp: Date.now()
            };

            if (synchronous) {
                // Use sendBeacon for synchronous sending (e.g., on page unload)
                if ('sendBeacon' in navigator) {
                    navigator.sendBeacon('/api/v1/analytics', JSON.stringify(payload));
                }
            } else {
                // Use fetch for asynchronous sending
                await fetch('/api/v1/analytics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }
        } catch (error) {
            console.warn('Failed to send analytics events:', error);
            // Re-add events to queue for retry
            this.events.unshift(...eventsToSend);
        }
    }

    startBatchFlushing() {
        this.flushTimer = setInterval(() => {
            this.flushEvents();
        }, this.flushInterval);
    }

    stopBatchFlushing() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    setUserId(userId) {
        this.userId = userId;
        this.trackEvent('user_identified', { userId });
    }

    clearUserId() {
        this.userId = null;
        this.trackEvent('user_logged_out');
    }

    // Utility methods
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateTransactionId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    hashFileName(fileName) {
        // Simple hash to anonymize file names while preserving extension
        const extension = fileName.split('.').pop();
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const hash = this.simpleHash(nameWithoutExt);
        return `${hash}.${extension}`;
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // A/B Testing support
    getVariant(testName, variants) {
        const userId = this.userId || this.sessionId;
        const hash = this.simpleHash(testName + userId);
        const variantIndex = hash % variants.length;
        const variant = variants[variantIndex];
        
        this.trackEvent('ab_test_variant', {
            testName,
            variant,
            userId
        });
        
        return variant;
    }

    // Feature flag support
    isFeatureEnabled(featureName, defaultValue = false) {
        // In a real implementation, this would check with a feature flag service
        // For now, return default value
        return defaultValue;
    }

    // Cleanup
    destroy() {
        this.stopBatchFlushing();
        this.flushEvents(true);
        this.isInitialized = false;
    }
}