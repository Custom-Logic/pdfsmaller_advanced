/**
 * Base Component Class
 * Provides common functionality for all Web Components
 * Implements shadow DOM, lifecycle management, state management, and utility methods
 */

export class BaseComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._isConnected = false;
        this._eventListeners = new Map();
        this._observers = new Set();
        this._state = {};
        this._props = {};
        this._renderScheduled = false;
    }

    // Lifecycle methods
    connectedCallback() {
        if (!this._isConnected) {
            this._isConnected = true;
            this.init();
            this.render();
            this.setupEventListeners();
            this.onConnected();
        }
    }

    disconnectedCallback() {
        this._isConnected = false;
        this.cleanup();
        this.onDisconnected();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.onAttributeChanged(name, oldValue, newValue);
            if (this._isConnected) {
                this.scheduleRender();
            }
        }
    }

    adoptedCallback() {
        this.onAdopted();
    }

    // Override these methods in subclasses
    init() {
        // Initialize component state and properties
    }

    render() {
        if (!this._isConnected) return;
        
        this._renderScheduled = false;
        this.shadowRoot.innerHTML = '';
        
        // Apply template
        const template = this.getTemplate();
        if (template) {
            this.shadowRoot.appendChild(this.createTemplate(template));
        }
        
        // Apply styles
        this.applyStyles();
        
        // Post-render hook
        this.onRendered();
    }

    scheduleRender() {
        if (!this._renderScheduled) {
            this._renderScheduled = true;
            requestAnimationFrame(() => this.render());
        }
    }

    getTemplate() {
        // Return HTML template string - override in subclasses
        return '<div class="base-component">Base Component</div>';
    }

    getStyles() {
        // Return CSS styles string - override in subclasses
        return `
            :host {
                display: block;
                box-sizing: border-box;
            }
            
            :host([hidden]) {
                display: none !important;
            }
            
            .base-component {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: var(--text-color, #333);
            }
        `;
    }

    setupEventListeners() {
        // Setup component event listeners - override in subclasses
    }

    cleanup() {
        // Cleanup resources, remove event listeners
        this.removeAllEventListeners();
        this.disconnectAllObservers();
    }

    onConnected() {
        // Called when component is connected to DOM - override in subclasses
    }

    onDisconnected() {
        // Called when component is disconnected from DOM - override in subclasses
    }

    onAttributeChanged(name, oldValue, newValue) {
        // Called when observed attribute changes - override in subclasses
        this.updateProp(name, newValue);
    }

    onAdopted() {
        // Called when component is moved to new document - override in subclasses
    }

    onRendered() {
        // Called after render completes - override in subclasses
    }

    // State management
    setState(newState, shouldRender = true) {
        const oldState = { ...this._state };
        this._state = { ...this._state, ...newState };
        this.onStateChanged(oldState, this._state);
        
        if (shouldRender && this._isConnected) {
            this.scheduleRender();
        }
        
        return this;
    }

    getState(key = null) {
        return key ? this._state[key] : { ...this._state };
    }

    onStateChanged(oldState, newState) {
        // Called when state changes - override in subclasses
    }

    // Props management
    updateProp(name, value) {
        const oldValue = this._props[name];
        this._props[name] = this.parsePropValue(value);
        this.onPropChanged(name, oldValue, this._props[name]);
        return this;
    }

    getProp(name, defaultValue = null) {
        return this._props.hasOwnProperty(name) ? this._props[name] : defaultValue;
    }

    parsePropValue(value) {
        // Try to parse various value types
        if (typeof value === 'string') {
            if (value === 'true') return true;
            if (value === 'false') return false;
            if (value === 'null') return null;
            if (value === 'undefined') return undefined;
            if (/^\d+$/.test(value)) return parseInt(value, 10);
            if (/^\d*\.\d+$/.test(value)) return parseFloat(value);
            
            // Try to parse as JSON
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        }
        return value;
    }

    onPropChanged(name, oldValue, newValue) {
        // Called when prop changes - override in subclasses
    }

    // Event handling
// Event handling
addEventListener(element, type, listener, options = false) {
    // Validate the target element
    let target;

    if (element === null || element === undefined) {
        target = this;
    } else if (typeof element === 'string') {
        // If string selector passed, find the element
        target = this.shadowRoot.querySelector(element);
        if (!target) {
            console.warn(`Element not found for selector: ${element}`);
            return this;
        }
    } else {
        target = element;
    }

    // Validate that target has addEventListener method
    if (!target || typeof target.addEventListener !== 'function') {
        console.warn('Invalid event target - missing addEventListener method:', target);
        return this;
    }

    try {
        target.addEventListener(type, listener, options);

        // Store reference for cleanup
        if (!this._eventListeners.has(target)) {
            this._eventListeners.set(target, []);
        }
        this._eventListeners.get(target).push({ type, listener, options });
    } catch (error) {
        console.error('Error adding event listener:', error);
    }

    return this;
}

removeEventListener(element, type, listener, options = false) {
    // Validate the target element
    let target;

    if (element === null || element === undefined) {
        target = this;
    } else if (typeof element === 'string') {
        target = this.shadowRoot.querySelector(element);
        if (!target) {
            console.warn(`Element not found for selector: ${element}`);
            return this;
        }
    } else {
        target = element;
    }

    // Validate that target has removeEventListener method
    if (!target || typeof target.removeEventListener !== 'function') {
        console.warn('Invalid event target - missing removeEventListener method:', target);
        return this;
    }

    try {
        target.removeEventListener(type, listener, options);

        // Remove from stored references
        if (this._eventListeners.has(target)) {
            const listeners = this._eventListeners.get(target);
            const index = listeners.findIndex(l =>
                l.type === type && l.listener === listener && l.options === options
            );
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    } catch (error) {
        console.error('Error removing event listener:', error);
    }

    return this;
}
    removeAllEventListeners() {
        for (const [target, listeners] of this._eventListeners) {
            listeners.forEach(({ type, listener, options }) => {
                target.removeEventListener(type, listener, options);
            });
        }
        this._eventListeners.clear();
        return this;
    }

    emit(eventName, detail = null, options = {}) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true,
            composed: true,
            ...options
        });
        return this.dispatchEvent(event);
    }

    // DOM utilities
    $(selector) {
        return this.shadowRoot.querySelector(selector);
    }

    $$(selector) {
        return Array.from(this.shadowRoot.querySelectorAll(selector));
    }

    findElement(selector) {
        return this.$(selector);
    }

    findElements(selector) {
        return this.$$(selector);
    }

    // Style utilities
    applyStyles() {
        const styles = this.getStyles();
        if (styles) {
            const styleElement = document.createElement('style');
            styleElement.textContent = styles;
            this.shadowRoot.appendChild(styleElement);
        }
    }

    // Observer utilities
    observeResize(callback) {
        if ('ResizeObserver' in window) {
            const observer = new ResizeObserver(callback);
            observer.observe(this);
            this._observers.add(observer);
            return observer;
        }
        return null;
    }

    observeIntersection(callback, options = {}) {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(callback, options);
            observer.observe(this);
            this._observers.add(observer);
            return observer;
        }
        return null;
    }

    observeMutation(callback, options = {}) {
        const observer = new MutationObserver(callback);
        observer.observe(this, {
            childList: true,
            subtree: true,
            ...options
        });
        this._observers.add(observer);
        return observer;
    }

    disconnectAllObservers() {
        for (const observer of this._observers) {
            observer.disconnect();
        }
        this._observers.clear();
        return this;
    }

    // Animation utilities
    animate(keyframes, options = {}) {
        if (this.animate) {
            return this.animate(keyframes, {
                duration: 300,
                easing: 'ease-out',
                ...options
            });
        }
        return null;
    }

    fadeIn(duration = 300) {
        return this.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    }

    fadeOut(duration = 300) {
        return this.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], { duration });
    }

    slideIn(direction = 'down', duration = 300) {
        const transforms = {
            down: ['translateY(-100%)', 'translateY(0)'],
            up: ['translateY(100%)', 'translateY(0)'],
            left: ['translateX(100%)', 'translateX(0)'],
            right: ['translateX(-100%)', 'translateX(0)']
        };

        return this.animate([
            { transform: transforms[direction][0], opacity: 0 },
            { transform: transforms[direction][1], opacity: 1 }
        ], { duration });
    }

    // Validation utilities
    validate() {
        // Override in subclasses to implement validation
        return { isValid: true, errors: [] };
    }

    showError(message) {
        this.emit('error', { message });
    }

    showWarning(message) {
        this.emit('warning', { message });
    }

    showSuccess(message) {
        this.emit('success', { message });
    }

    // Accessibility utilities
    setAriaLabel(label) {
        this.setAttribute('aria-label', label);
        return this;
    }

    setAriaDescribedBy(id) {
        this.setAttribute('aria-describedby', id);
        return this;
    }

    setRole(role) {
        this.setAttribute('role', role);
        return this;
    }

    announceToScreenReader(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.style.cssText = `
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        `;
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Template utilities
    createTemplate(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.cloneNode(true);
    }

    // CSS custom properties
    setCSSProperty(property, value) {
        this.style.setProperty(property, value);
        return this;
    }

    getCSSProperty(property) {
        return getComputedStyle(this).getPropertyValue(property);
    }

    // Focus management
    focus(options = {}) {
        super.focus(options);
        return this;
    }

    blur() {
        super.blur();
        return this;
    }

    // Error handling
    handleError(error, context = {}) {
        console.error(`Error in ${this.constructor.name}:`, error, context);
        this.emit('component-error', { error, context });
    }

    // Performance utilities
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${this.constructor.name}.${name}: ${end - start}ms`);
        return result;
    }

    // Component communication
    broadcast(eventName, detail = null) {
        // Emit event that bubbles up to document
        const event = new CustomEvent(`component:${eventName}`, {
            detail: { source: this, data: detail },
            bubbles: true,
            composed: true
        });
        document.dispatchEvent(event);
    }

    listen(eventName, callback) {
        // Listen for component broadcasts
        const handler = (event) => {
            if (event.detail.source !== this) {
                callback(event.detail.data, event.detail.source);
            }
        };
        document.addEventListener(`component:${eventName}`, handler);
        
        // Store for cleanup
        this.addEventListener(document, `component:${eventName}`, handler);
    }

    // Static utilities
    static define(tagName, componentClass) {
        if (!customElements.get(tagName)) {
            customElements.define(tagName, componentClass);
        }
    }

    static get observedAttributes() {
        return [];
    }
}