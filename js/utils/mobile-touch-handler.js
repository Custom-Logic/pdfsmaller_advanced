/**
 * Mobile Touch Handler Utility
 * Provides enhanced touch interactions for mobile devices
 */

export class MobileTouchHandler {
    constructor() {
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.longPressTimer = null;
        this.longPressDelay = 500; // ms
        this.tapThreshold = 10; // px
        this.swipeThreshold = 50; // px
        
        this.init();
    }

    init() {
        // Detect if device supports touch
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (this.isTouchDevice) {
            this.setupTouchEnhancements();
            this.setupHapticFeedback();
            this.setupTouchOptimizations();
        }
    }

    setupTouchEnhancements() {
        // Add touch-friendly classes to body
        document.body.classList.add('touch-device');
        
        // Enhance button interactions
        this.enhanceButtonTouches();
        
        // Enhance upload area touches
        this.enhanceUploadAreaTouches();
        
        // Enhance tab navigation touches
        this.enhanceTabTouches();
    }

    enhanceButtonTouches() {
        document.addEventListener('touchstart', (e) => {
            const button = e.target.closest('.btn, .tab-button, .toggle-option');
            if (button) {
                this.handleTouchStart(e, button);
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            const button = e.target.closest('.btn, .tab-button, .toggle-option');
            if (button) {
                this.handleTouchEnd(e, button);
            }
        }, { passive: false });

        document.addEventListener('touchcancel', (e) => {
            const button = e.target.closest('.btn, .tab-button, .toggle-option');
            if (button) {
                this.handleTouchCancel(e, button);
            }
        });
    }

    enhanceUploadAreaTouches() {
        const uploadAreas = document.querySelectorAll('.upload-area');
        
        uploadAreas.forEach(area => {
            // Add touch feedback for upload areas
            area.addEventListener('touchstart', (e) => {
                area.classList.add('touch-active');
                this.provideTouchFeedback('light');
            }, { passive: true });

            area.addEventListener('touchend', (e) => {
                area.classList.remove('touch-active');
                
                // Simulate click for file input
                const fileInput = area.querySelector('.file-input');
                if (fileInput && !e.defaultPrevented) {
                    setTimeout(() => fileInput.click(), 100);
                }
            }, { passive: true });

            area.addEventListener('touchcancel', (e) => {
                area.classList.remove('touch-active');
            });
        });
    }

    enhanceTabTouches() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                this.touchStartTime = Date.now();
                this.touchStartPos = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
                
                button.classList.add('touch-active');
                this.provideTouchFeedback('light');
            }, { passive: true });

            button.addEventListener('touchmove', (e) => {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - this.touchStartPos.x);
                const deltaY = Math.abs(touch.clientY - this.touchStartPos.y);
                
                // If moved too far, cancel the touch
                if (deltaX > this.tapThreshold || deltaY > this.tapThreshold) {
                    button.classList.remove('touch-active');
                }
            }, { passive: true });

            button.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - this.touchStartTime;
                const touch = e.changedTouches[0];
                const deltaX = Math.abs(touch.clientX - this.touchStartPos.x);
                const deltaY = Math.abs(touch.clientY - this.touchStartPos.y);
                
                button.classList.remove('touch-active');
                
                // Only trigger if it was a quick tap within threshold
                if (touchDuration < 300 && deltaX < this.tapThreshold && deltaY < this.tapThreshold) {
                    this.provideTouchFeedback('medium');
                    // Let the normal click handler take over
                }
            }, { passive: true });
        });
    }

    handleTouchStart(e, element) {
        this.touchStartTime = Date.now();
        this.touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        
        element.classList.add('touch-active');
        
        // Start long press timer for certain elements
        if (element.classList.contains('file-action-btn')) {
            this.longPressTimer = setTimeout(() => {
                this.handleLongPress(element);
            }, this.longPressDelay);
        }
        
        this.provideTouchFeedback('light');
    }

    handleTouchEnd(e, element) {
        const touchDuration = Date.now() - this.touchStartTime;
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - this.touchStartPos.x);
        const deltaY = Math.abs(touch.clientY - this.touchStartPos.y);
        
        element.classList.remove('touch-active');
        
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Determine if this was a valid tap
        const isValidTap = touchDuration < 300 && 
                          deltaX < this.tapThreshold && 
                          deltaY < this.tapThreshold;
        
        if (isValidTap) {
            this.provideTouchFeedback('medium');
            
            // Add visual feedback
            this.addTapRipple(element, touch.clientX, touch.clientY);
        }
    }

    handleTouchCancel(e, element) {
        element.classList.remove('touch-active');
        
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    handleLongPress(element) {
        this.provideTouchFeedback('heavy');
        element.classList.add('long-pressed');
        
        // Dispatch custom long press event
        const longPressEvent = new CustomEvent('longpress', {
            bubbles: true,
            detail: { element }
        });
        element.dispatchEvent(longPressEvent);
        
        setTimeout(() => {
            element.classList.remove('long-pressed');
        }, 200);
    }

    addTapRipple(element, x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'tap-ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const left = x - rect.left - size / 2;
        const top = y - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${left}px;
            top: ${top}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            z-index: 1000;
        `;
        
        // Ensure element has relative positioning
        const originalPosition = element.style.position;
        if (!originalPosition || originalPosition === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
            
            // Restore original position if we changed it
            if (!originalPosition) {
                element.style.position = '';
            }
        }, 600);
    }

    setupHapticFeedback() {
        // Check if haptic feedback is available
        this.hasHaptics = 'vibrate' in navigator;
        
        if (this.hasHaptics) {
            // Add CSS for haptic feedback indication
            const style = document.createElement('style');
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                
                .touch-active {
                    transform: scale(0.98);
                    transition: transform 0.1s ease-out;
                }
                
                .long-pressed {
                    transform: scale(1.02);
                    transition: transform 0.2s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
    }

    provideTouchFeedback(intensity = 'light') {
        if (!this.hasHaptics) return;
        
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [50],
            success: [10, 50, 10],
            error: [100, 50, 100]
        };
        
        const pattern = patterns[intensity] || patterns.light;
        navigator.vibrate(pattern);
    }

    setupTouchOptimizations() {
        // Prevent double-tap zoom on buttons
        const preventDoubleTapZoom = (e) => {
            const element = e.target.closest('.btn, .tab-button, .toggle-option, .upload-area');
            if (element) {
                e.preventDefault();
            }
        };
        
        document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
        
        // Optimize scroll behavior for mobile
        this.optimizeScrolling();
        
        // Add momentum scrolling for iOS
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // Prevent pull-to-refresh on upload areas
        const uploadAreas = document.querySelectorAll('.upload-area');
        uploadAreas.forEach(area => {
            area.addEventListener('touchstart', (e) => {
                if (window.scrollY === 0) {
                    e.preventDefault();
                }
            }, { passive: false });
        });
    }

    optimizeScrolling() {
        // Smooth scrolling for tab navigation
        const tabContainer = document.querySelector('.tab-nav-container');
        if (tabContainer) {
            tabContainer.style.scrollBehavior = 'smooth';
            
            // Add scroll snap for better UX
            tabContainer.style.scrollSnapType = 'x mandatory';
            
            const tabButtons = tabContainer.querySelectorAll('.tab-button');
            tabButtons.forEach(button => {
                button.style.scrollSnapAlign = 'start';
            });
        }
    }

    // Utility methods for external use
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    static addTouchClass(element) {
        if (MobileTouchHandler.isTouchDevice()) {
            element.classList.add('touch-optimized');
        }
    }

    static optimizeForTouch(element) {
        if (!MobileTouchHandler.isTouchDevice()) return;
        
        // Ensure minimum touch target size
        const rect = element.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
            element.style.minWidth = '44px';
            element.style.minHeight = '44px';
        }
        
        // Add touch-friendly padding if needed
        const computedStyle = getComputedStyle(element);
        const padding = parseInt(computedStyle.padding);
        if (padding < 8) {
            element.style.padding = '8px';
        }
    }

    // Swipe gesture detection
    detectSwipe(element, callback) {
        let startX, startY, startTime;
        
        element.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        }, { passive: true });
        
        element.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const endTime = Date.now();
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;
            
            // Check if it's a swipe (fast movement)
            if (deltaTime < 300 && Math.abs(deltaX) > this.swipeThreshold) {
                const direction = deltaX > 0 ? 'right' : 'left';
                callback(direction, { deltaX, deltaY, deltaTime });
            }
        }, { passive: true });
    }

    // Pinch zoom detection for upload areas
    detectPinch(element, callback) {
        let initialDistance = 0;
        
        element.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
            }
        }, { passive: true });
        
        element.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scale = currentDistance / initialDistance;
                callback(scale);
            }
        }, { passive: true });
    }

    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new MobileTouchHandler();
    });
} else {
    new MobileTouchHandler();
}