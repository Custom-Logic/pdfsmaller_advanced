# Event System Implementation Plan

Based on the main integration code and the architecture direction, I'll implement a centralized event system with namespaced event types that will work seamlessly with your existing architecture.

## Event Types Implementation

```javascript
// events/event-types.js
export const EventTypes = {
    // Authentication events
    AUTH: {
        LOGIN_REQUEST: 'auth:login-request',
        LOGIN_SUCCESS: 'auth:login-success',
        LOGIN_FAILURE: 'auth:login-failure',
        LOGOUT_REQUEST: 'auth:logout-request',
        LOGOUT_SUCCESS: 'auth:logout-success',
        REGISTER_REQUEST: 'auth:register-request',
        REGISTER_SUCCESS: 'auth:register-success',
        REGISTER_FAILURE: 'auth:register-failure',
        TOKEN_VALIDATION: 'auth:token-validation',
        STATE_CHANGED: 'auth:state-changed'
    },
    
    // User profile events
    PROFILE: {
        UPDATE_REQUEST: 'profile:update-request',
        UPDATE_SUCCESS: 'profile:update-success',
        UPDATE_FAILURE: 'profile:update-failure',
        LOAD_REQUEST: 'profile:load-request',
        LOAD_SUCCESS: 'profile:load-success',
        LOAD_FAILURE: 'profile:load-failure'
    },
    
    // Subscription events
    SUBSCRIPTION: {
        PLANS_LOAD_REQUEST: 'subscription:plans-load-request',
        PLANS_LOAD_SUCCESS: 'subscription:plans-load-success',
        PLANS_LOAD_FAILURE: 'subscription:plans-load-failure',
        UPGRADE_REQUEST: 'subscription:upgrade-request',
        UPGRADE_SUCCESS: 'subscription:upgrade-success',
        UPGRADE_FAILURE: 'subscription:upgrade-failure',
        CANCEL_REQUEST: 'subscription:cancel-request',
        CANCEL_SUCCESS: 'subscription:cancel-success',
        CANCEL_FAILURE: 'subscription:cancel-failure',
        CHANGE_PLAN_REQUEST: 'subscription:change-plan-request',
        CHANGE_PLAN_SUCCESS: 'subscription:change-plan-success',
        CHANGE_PLAN_FAILURE: 'subscription:change-plan-failure'
    },
    
    // Settings events
    SETTINGS: {
        LOAD_REQUEST: 'settings:load-request',
        LOAD_SUCCESS: 'settings:load-success',
        LOAD_FAILURE: 'settings:load-failure',
        SAVE_REQUEST: 'settings:save-request',
        SAVE_SUCCESS: 'settings:save-success',
        SAVE_FAILURE: 'settings:save-failure',
        CHANGE: 'settings:change'
    },
    
    // File operations events
    FILES: {
        UPLOAD_REQUEST: 'files:upload-request',
        UPLOAD_PROGRESS: 'files:upload-progress',
        UPLOAD_SUCCESS: 'files:upload-success',
        UPLOAD_FAILURE: 'files:upload-failure',
        DOWNLOAD_REQUEST: 'files:download-request',
        DOWNLOAD_SUCCESS: 'files:download-success',
        DOWNLOAD_FAILURE: 'files:download-failure',
        DELETE_REQUEST: 'files:delete-request',
        DELETE_SUCCESS: 'files:delete-success',
        DELETE_FAILURE: 'files:delete-failure',
        LIST_REQUEST: 'files:list-request',
        LIST_SUCCESS: 'files:list-success',
        LIST_FAILURE: 'files:list-failure',
        CLEAR_REQUEST: 'files:clear-request',
        CLEAR_SUCCESS: 'files:clear-success',
        CLEAR_FAILURE: 'files:clear-failure'
    },
    
    // Processing events
    PROCESSING: {
        START: 'processing:start',
        PROGRESS: 'processing:progress',
        COMPLETE: 'processing:complete',
        ERROR: 'processing:error',
        CANCEL: 'processing:cancel'
    },
    
    // Navigation events
    NAVIGATION: {
        TAB_CHANGE: 'navigation:tab-change',
        ROUTE_CHANGE: 'navigation:route-change',
        MODAL_OPEN: 'navigation:modal-open',
        MODAL_CLOSE: 'navigation:modal-close'
    },
    
    // UI events
    UI: {
        NOTIFICATION_SHOW: 'ui:notification-show',
        NOTIFICATION_HIDE: 'ui:notification-hide',
        STATE_UPDATE: 'ui:state-update',
        ERROR: 'ui:error',
        LOADING_START: 'ui:loading-start',
        LOADING_END: 'ui:loading-end'
    },
    
    // Application state events
    APP: {
        INIT_START: 'app:init-start',
        INIT_COMPLETE: 'app:init-complete',
        AUTH_STATE_CHANGE: 'app:auth-state-change',
        ONLINE_STATUS_CHANGE: 'app:online-status-change',
        SERVICE_READY: 'app:service-ready'
    }
};

// Event factory for creating consistent events
export class EventFactory {
    static createEvent(type, detail = {}, options = {}) {
        const eventId = this.generateEventId();
        const timestamp = Date.now();
        
        return new CustomEvent(type, {
            detail: {
                ...detail,
                eventId,
                timestamp,
                type
            },
            bubbles: options.bubbles !== false,
            cancelable: options.cancelable !== false
        });
    }
    
    static generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Event bus for centralized event handling
export class EventBus {
    constructor() {
        this.listeners = new Map();
        this.history = [];
        this.maxHistorySize = 100;
    }
    
    on(eventType, callback, options = {}) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        
        const listener = {
            callback,
            once: options.once || false
        };
        
        this.listeners.get(eventType).add(listener);
        
        // Return unsubscribe function
        return () => this.off(eventType, listener);
    }
    
    off(eventType, listener) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).delete(listener);
            
            // Clean up empty sets
            if (this.listeners.get(eventType).size === 0) {
                this.listeners.delete(eventType);
            }
        }
    }
    
    once(eventType, callback) {
        return this.on(eventType, callback, { once: true });
    }
    
    emit(eventType, detail = {}, options = {}) {
        const event = EventFactory.createEvent(eventType, detail, options);
        
        // Add to history
        this.history.push({
            type: eventType,
            detail: event.detail,
            timestamp: event.detail.timestamp
        });
        
        // Trim history if needed
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
        
        // Notify listeners
        if (this.listeners.has(eventType)) {
            const listeners = Array.from(this.listeners.get(eventType));
            
            for (const listener of listeners) {
                try {
                    listener.callback(event);
                    
                    // Remove if it's a once listener
                    if (listener.once) {
                        this.off(eventType, listener);
                    }
                } catch (error) {
                    console.error(`Error in event listener for ${eventType}:`, error);
                }
            }
        }
        
        // Also notify wildcard listeners
        if (this.listeners.has('*')) {
            const wildcardListeners = Array.from(this.listeners.get('*'));
            
            for (const listener of wildcardListeners) {
                try {
                    listener.callback(event);
                } catch (error) {
                    console.error(`Error in wildcard event listener:`, error);
                }
            }
        }
        
        return event;
    }
    
    clearHistory() {
        this.history = [];
    }
    
    getHistory(filter = null) {
        if (!filter) {
            return this.history;
        }
        
        return this.history.filter(entry => {
            if (typeof filter === 'string') {
                return entry.type === filter;
            } else if (filter instanceof RegExp) {
                return filter.test(entry.type);
            } else if (typeof filter === 'function') {
                return filter(entry);
            }
            return false;
        });
    }
}

// Create global event bus instance
export const globalEventBus = new EventBus();
```

## Integration with MainIntegration

Now let's update the MainIntegration to use the new event system:

```javascript
// main-integration.js (partial update)
import { 
    EventTypes, 
    globalEventBus,
    EventFactory 
} from './events/event-types.js';

// ... existing imports ...

export class MainIntegration {
    constructor() {
        // ... existing code ...
        this.eventBus = globalEventBus;
        this.setupGlobalEventListeners();
    }

    setupGlobalEventListeners() {
        // Authentication events
        this.eventBus.on(EventTypes.AUTH.LOGIN_REQUEST, this.handleLogin.bind(this));
        this.eventBus.on(EventTypes.AUTH.REGISTER_REQUEST, this.handleRegister.bind(this));
        this.eventBus.on(EventTypes.AUTH.LOGOUT_REQUEST, this.handleLogout.bind(this));
        
        // Profile events
        this.eventBus.on(EventTypes.PROFILE.UPDATE_REQUEST, this.handleProfileUpdate.bind(this));
        
        // Subscription events
        this.eventBus.on(EventTypes.SUBSCRIPTION.UPGRADE_REQUEST, this.handleSubscriptionUpgrade.bind(this));
        this.eventBus.on(EventTypes.SUBSCRIPTION.CANCEL_REQUEST, this.handleSubscriptionCancel.bind(this));
        
        // Settings events
        this.eventBus.on(EventTypes.SETTINGS.SAVE_REQUEST, this.handleSettingsSave.bind(this));
        this.eventBus.on(EventTypes.SETTINGS.LOAD_REQUEST, this.handleSettingsLoadRequested.bind(this));
        
        // File events
        this.eventBus.on(EventTypes.FILES.LIST_REQUEST, this.handleRequestFileList.bind(this));
        this.eventBus.on(EventTypes.FILES.DOWNLOAD_REQUEST, this.handleFileDownload.bind(this));
        this.eventBus.on(EventTypes.FILES.DELETE_REQUEST, this.handleFileDelete.bind(this));
        this.eventBus.on(EventTypes.FILES.CLEAR_REQUEST, this.handleClearAllFiles.bind(this));
        
        // Navigation events
        this.eventBus.on(EventTypes.NAVIGATION.TAB_CHANGE, this.handleTabChange.bind(this));
        this.eventBus.on(EventTypes.NAVIGATION.ROUTE_CHANGE, this.handleRouteChange.bind(this));
        
        // UI events
        this.eventBus.on(EventTypes.UI.NOTIFICATION_SHOW, this.showNotification.bind(this));
        
        // App events
        this.eventBus.on(EventTypes.APP.AUTH_STATE_CHANGE, this.handleAuthStateChange.bind(this));
    }

    // Update event emission throughout the class
    async handleLogin(event) {
        try {
            const { email, password } = event.detail;
            const response = await this.apiClient.login(email, password);

            if (response.success) {
                this.currentUser = response.user;
                this.isAuthenticated = true;
                this.storageService.setItem('auth_token', response.tokens.access_token);
                
                // Emit success event
                this.eventBus.emit(EventTypes.AUTH.LOGIN_SUCCESS, {
                    user: this.currentUser,
                    tokens: response.tokens
                });
                
                // Emit auth state change
                this.eventBus.emit(EventTypes.APP.AUTH_STATE_CHANGE, {
                    isAuthenticated: true,
                    user: this.currentUser
                });
                
                this.updateUI();
                this.showNotification('Login successful!', 'success');
                this.switchTab('profile');
            }
        } catch (error) {
            // Emit failure event
            this.eventBus.emit(EventTypes.AUTH.LOGIN_FAILURE, {
                error: error.message,
                email: event.detail.email
            });
            this.handleError(error);
        }
    }

    // Update all other methods to use event bus...
    
    showNotification(message, type = 'info') {
        // Use event bus instead of custom emit
        this.eventBus.emit(EventTypes.UI.NOTIFICATION_SHOW, { 
            message, 
            type 
        });
    }
    
    // ... rest of the class implementation
}
```

## Component Integration Example

Here's how components would integrate with the event system:

```javascript
// Example component using the event system
import { EventTypes, globalEventBus } from '../events/event-types.js';

export class AuthPanel extends HTMLElement {
    constructor() {
        super();
        this.eventBus = globalEventBus;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for auth state changes
        this.eventBus.on(EventTypes.APP.AUTH_STATE_CHANGE, (event) => {
            this.handleAuthStateChange(event.detail);
        });
        
        // Listen for login results
        this.eventBus.on(EventTypes.AUTH.LOGIN_SUCCESS, (event) => {
            this.handleLoginSuccess(event.detail);
        });
        
        this.eventBus.on(EventTypes.AUTH.LOGIN_FAILURE, (event) => {
            this.handleLoginFailure(event.detail);
        });
    }
    
    handleLoginSubmit(email, password) {
        // Emit login request
        this.eventBus.emit(EventTypes.AUTH.LOGIN_REQUEST, {
            email,
            password
        });
    }
    
    handleAuthStateChange(detail) {
        this.isAuthenticated = detail.isAuthenticated;
        this.currentUser = detail.user;
        this.render();
    }
    
    // ... rest of component implementation
}
```

## Service Integration Example

```javascript
// Example service using the event system
import { EventTypes, globalEventBus } from '../events/event-types.js';
import { BaseService } from './base-service.js';

export class StorageService extends BaseService {
    constructor() {
        super();
        this.eventBus = globalEventBus;
    }
    
    async saveFile(id, blob, metadata = {}) {
        const jobId = this.createJobId();
        this.trackJob(jobId, { id, type: 'save' });
        
        try {
            this.updateJobProgress(jobId, 10, 'Starting file save...');
            
            // Implementation details...
            await this.performSave(id, blob, metadata);
            
            this.updateJobProgress(jobId, 100, 'File saved successfully');
            this.completeJob(jobId, { id, metadata });
            
            // Emit success event
            this.eventBus.emit(EventTypes.FILES.UPLOAD_SUCCESS, {
                fileId: id,
                metadata
            });
            
            return id;
        } catch (error) {
            this.failJob(jobId, error);
            
            // Emit failure event
            this.eventBus.emit(EventTypes.FILES.UPLOAD_FAILURE, {
                fileId: id,
                error: error.message
            });
            
            throw error;
        }
    }
    
    // ... rest of service implementation
}
```

## Performance Optimization

To ensure the event system is performant, we can add some optimizations:

```javascript
// events/performance-optimized-event-bus.js
export class PerformanceOptimizedEventBus extends EventBus {
    constructor() {
        super();
        this.debouncedEvents = new Map();
        this.throttledEvents = new Map();
    }
    
    emit(eventType, detail = {}, options = {}) {
        // Check if this event type should be debounced
        if (options.debounce) {
            return this.emitDebounced(eventType, detail, options);
        }
        
        // Check if this event type should be throttled
        if (options.throttle) {
            return this.emitThrottled(eventType, detail, options);
        }
        
        // Normal emission
        return super.emit(eventType, detail, options);
    }
    
    emitDebounced(eventType, detail, options) {
        const { delay = 100, leading = false } = options.debounce;
        
        if (!this.debouncedEvents.has(eventType)) {
            this.debouncedEvents.set(eventType, {
                timeoutId: null,
                lastArgs: null
            });
        }
        
        const debounceInfo = this.debouncedEvents.get(eventType);
        debounceInfo.lastArgs = { detail, options };
        
        if (leading && !debounceInfo.timeoutId) {
            super.emit(eventType, detail, options);
        }
        
        clearTimeout(debounceInfo.timeoutId);
        debounceInfo.timeoutId = setTimeout(() => {
            if (!leading) {
                super.emit(eventType, debounceInfo.lastArgs.detail, debounceInfo.lastArgs.options);
            }
            debounceInfo.timeoutId = null;
        }, delay);
    }
    
    emitThrottled(eventType, detail, options) {
        const { delay = 100, leading = true } = options.throttle;
        
        if (!this.throttledEvents.has(eventType)) {
            this.throttledEvents.set(eventType, {
                lastEmitted: 0,
                pendingArgs: null
            });
        }
        
        const throttleInfo = this.throttledEvents.get(eventType);
        const now = Date.now();
        
        if (now - throttleInfo.lastEmitted >= delay) {
            // Can emit immediately
            throttleInfo.lastEmitted = now;
            super.emit(eventType, detail, options);
        } else {
            // Schedule for later
            throttleInfo.pendingArgs = { detail, options };
            
            if (!throttleInfo.timeoutId) {
                throttleInfo.timeoutId = setTimeout(() => {
                    throttleInfo.lastEmitted = Date.now();
                    super.emit(eventType, throttleInfo.pendingArgs.detail, throttleInfo.pendingArgs.options);
                    throttleInfo.timeoutId = null;
                    throttleInfo.pendingArgs = null;
                }, delay - (now - throttleInfo.lastEmitted));
            }
        }
    }
    
    // Override to clean up timers
    off(eventType, listener) {
        super.off(eventType, listener);
        
        // Clean up debounce/throttle timers if no listeners left
        if (!this.listeners.has(eventType)) {
            if (this.debouncedEvents.has(eventType)) {
                clearTimeout(this.debouncedEvents.get(eventType).timeoutId);
                this.debouncedEvents.delete(eventType);
            }
            
            if (this.throttledEvents.has(eventType)) {
                clearTimeout(this.throttledEvents.get(eventType).timeoutId);
                this.throttledEvents.delete(eventType);
            }
        }
    }
}

// Replace the global event bus with the optimized version
export const globalEventBus = new PerformanceOptimizedEventBus();
```

## Implementation Plan

1. **Create Event System Files**: 
   - Create `events/event-types.js` with the EventTypes, EventFactory, and EventBus
   - Create `events/performance-optimized-event-bus.js` for the optimized version

2. **Update MainIntegration**:
   - Replace custom event handling with the global event bus
   - Update all event emissions to use the new EventTypes

3. **Update Components**:
   - Modify all components to use the event bus instead of direct DOM events
   - Ensure components listen for the appropriate events

4. **Update Services**:
   - Modify services to emit events through the event bus
   - Ensure services follow the standardized event patterns

5. **Testing and Validation**:
   - Test event flow between all components and services
   - Verify performance with many simultaneous events
   - Ensure error handling works correctly

6. **Documentation**:
   - Document the event system for developers
   - Create examples of common event patterns

This implementation provides a centralized, performant event system that follows your architecture's event-driven, service-centric approach while maintaining compatibility with your existing codebase.