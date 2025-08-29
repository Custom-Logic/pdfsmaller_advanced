/**
 * DOM Helper Utility
 * Provides DOM manipulation and query utilities
 */

export class DOMHelper {
    // Element selection
    static $(selector, context = document) {
        return context.querySelector(selector);
    }

    static $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    static getElementById(id) {
        return document.getElementById(id);
    }

    static getElementsByClassName(className, context = document) {
        return Array.from(context.getElementsByClassName(className));
    }

    // Element creation
    static createElement(tagName, attributes = {}, textContent = '') {
        const element = document.createElement(tagName);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className' || key === 'class') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else if (key in element) {
                element[key] = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Set text content if provided
        if (textContent) {
            element.textContent = textContent;
        }
        
        return element;
    }

    static createElementFromHTML(htmlString) {
        const template = document.createElement('template');
        template.innerHTML = htmlString.trim();
        return template.content.firstChild;
    }

    static createFragment(htmlString) {
        const template = document.createElement('template');
        template.innerHTML = htmlString.trim();
        return template.content;
    }

    // Class manipulation
    static addClass(element, ...classNames) {
        if (element && element.classList) {
            element.classList.add(...classNames);
        }
        return element;
    }

    static removeClass(element, ...classNames) {
        if (element && element.classList) {
            element.classList.remove(...classNames);
        }
        return element;
    }

    static toggleClass(element, className, force) {
        if (element && element.classList) {
            return element.classList.toggle(className, force);
        }
        return false;
    }

    static hasClass(element, className) {
        return element && element.classList && element.classList.contains(className);
    }

    // Attribute manipulation
    static setAttribute(element, name, value) {
        if (element) {
            element.setAttribute(name, value);
        }
        return element;
    }

    static getAttribute(element, name) {
        return element ? element.getAttribute(name) : null;
    }

    static removeAttribute(element, name) {
        if (element) {
            element.removeAttribute(name);
        }
        return element;
    }

    static hasAttribute(element, name) {
        return element ? element.hasAttribute(name) : false;
    }

    // Data attributes
    static setData(element, key, value) {
        if (element) {
            element.dataset[key] = value;
        }
        return element;
    }

    static getData(element, key) {
        return element ? element.dataset[key] : null;
    }

    static removeData(element, key) {
        if (element && element.dataset) {
            delete element.dataset[key];
        }
        return element;
    }

    // Style manipulation
    static setStyle(element, property, value) {
        if (element && element.style) {
            element.style[property] = value;
        }
        return element;
    }

    static setStyles(element, styles) {
        if (element && element.style) {
            Object.entries(styles).forEach(([property, value]) => {
                element.style[property] = value;
            });
        }
        return element;
    }

    static getStyle(element, property) {
        if (!element) return null;
        return window.getComputedStyle(element)[property];
    }

    static getStyles(element, properties) {
        if (!element) return {};
        const computedStyle = window.getComputedStyle(element);
        const result = {};
        properties.forEach(property => {
            result[property] = computedStyle[property];
        });
        return result;
    }

    // Element visibility
    static show(element, display = 'block') {
        if (element) {
            element.style.display = display;
        }
        return element;
    }

    static hide(element) {
        if (element) {
            element.style.display = 'none';
        }
        return element;
    }

    static toggle(element, display = 'block') {
        if (element) {
            const isHidden = element.style.display === 'none' || 
                           this.getStyle(element, 'display') === 'none';
            element.style.display = isHidden ? display : 'none';
        }
        return element;
    }

    static isVisible(element) {
        if (!element) return false;
        return element.offsetWidth > 0 && element.offsetHeight > 0;
    }

    // Element positioning and dimensions
    static getPosition(element) {
        if (!element) return { top: 0, left: 0 };
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset
        };
    }

    static getOffset(element) {
        if (!element) return { top: 0, left: 0 };
        return {
            top: element.offsetTop,
            left: element.offsetLeft
        };
    }

    static getDimensions(element) {
        if (!element) return { width: 0, height: 0 };
        return {
            width: element.offsetWidth,
            height: element.offsetHeight
        };
    }

    static getViewportDimensions() {
        return {
            width: window.innerWidth || document.documentElement.clientWidth,
            height: window.innerHeight || document.documentElement.clientHeight
        };
    }

    // Element insertion and removal
    static append(parent, child) {
        if (parent && child) {
            parent.appendChild(child);
        }
        return parent;
    }

    static prepend(parent, child) {
        if (parent && child) {
            parent.insertBefore(child, parent.firstChild);
        }
        return parent;
    }

    static insertBefore(newElement, referenceElement) {
        if (newElement && referenceElement && referenceElement.parentNode) {
            referenceElement.parentNode.insertBefore(newElement, referenceElement);
        }
        return newElement;
    }

    static insertAfter(newElement, referenceElement) {
        if (newElement && referenceElement && referenceElement.parentNode) {
            referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
        }
        return newElement;
    }

    static remove(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
        return element;
    }

    static empty(element) {
        if (element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
        return element;
    }

    // Event handling
    static on(element, eventType, handler, options = false) {
        if (element && typeof handler === 'function') {
            element.addEventListener(eventType, handler, options);
        }
        return element;
    }

    static off(element, eventType, handler, options = false) {
        if (element && typeof handler === 'function') {
            element.removeEventListener(eventType, handler, options);
        }
        return element;
    }

    static once(element, eventType, handler, options = false) {
        if (element && typeof handler === 'function') {
            const onceHandler = (event) => {
                handler(event);
                element.removeEventListener(eventType, onceHandler, options);
            };
            element.addEventListener(eventType, onceHandler, options);
        }
        return element;
    }

    static trigger(element, eventType, detail = null) {
        if (element) {
            const event = new CustomEvent(eventType, { detail, bubbles: true });
            element.dispatchEvent(event);
        }
        return element;
    }

    // Form utilities
    static getFormData(form) {
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes, multiple selects)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }

    static setFormData(form, data) {
        if (!form || !data) return;
        
        Object.entries(data).forEach(([key, value]) => {
            const element = form.elements[key];
            if (element) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = Boolean(value);
                } else {
                    element.value = value;
                }
            }
        });
    }

    static resetForm(form) {
        if (form && typeof form.reset === 'function') {
            form.reset();
        }
        return form;
    }

    static validateForm(form) {
        if (!form) return false;
        return form.checkValidity();
    }

    // Animation utilities
    static fadeIn(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = progress.toString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    static fadeOut(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            const start = performance.now();
            const startOpacity = parseFloat(this.getStyle(element, 'opacity')) || 1;
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = (startOpacity * (1 - progress)).toString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    static slideDown(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            element.style.overflow = 'hidden';
            element.style.height = '0';
            element.style.display = 'block';
            
            const targetHeight = element.scrollHeight;
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.height = (targetHeight * progress) + 'px';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.height = '';
                    element.style.overflow = '';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    static slideUp(element, duration = 300) {
        if (!element) return Promise.resolve();
        
        return new Promise(resolve => {
            const startHeight = element.offsetHeight;
            element.style.overflow = 'hidden';
            element.style.height = startHeight + 'px';
            
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.height = (startHeight * (1 - progress)) + 'px';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    element.style.height = '';
                    element.style.overflow = '';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    // Utility methods
    static isElement(obj) {
        return obj instanceof Element || obj instanceof HTMLDocument;
    }

    static closest(element, selector) {
        if (!element || !element.closest) return null;
        return element.closest(selector);
    }

    static matches(element, selector) {
        if (!element || !element.matches) return false;
        return element.matches(selector);
    }

    static siblings(element) {
        if (!element || !element.parentNode) return [];
        return Array.from(element.parentNode.children).filter(child => child !== element);
    }

    static next(element) {
        return element ? element.nextElementSibling : null;
    }

    static prev(element) {
        return element ? element.previousElementSibling : null;
    }

    static parent(element) {
        return element ? element.parentElement : null;
    }

    static children(element) {
        return element ? Array.from(element.children) : [];
    }

    // Scroll utilities
    static scrollTo(element, options = {}) {
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', ...options });
        }
    }

    static scrollToTop(smooth = true) {
        window.scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    static getScrollPosition() {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop
        };
    }

    // Ready state
    static ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    // Debounce utility for DOM events
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // Throttle utility for DOM events
    static throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}