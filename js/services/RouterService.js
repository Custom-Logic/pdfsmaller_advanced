// services/router-service.js
import { StandardService } from './standard-service.js';

/**
 * RouterService manages client-side routing using HTML5 History API
 * Emits events for route changes and handles parameter extraction
 */
export class RouterService extends StandardService {
    constructor(routes = []) {
        super();
        this.routes = routes;
        this.currentRoute = null;
        this.isInitialized = false;
    }

    /**
     * Initializes the router with routes and starts listening for popstate events
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        try {
            // Set up popstate listener for browser back/forward
            window.addEventListener('popstate', this.handlePopState.bind(this));
            
            // Handle initial route
            await this.handleRouteChange(window.location.pathname);
            
            this.isInitialized = true;
            this.emitServiceReady();
            this.emitStatusChange('ready', { message: 'Router service initialized' });
            
        } catch (error) {
            this.emitError(error, { operation: 'init' });
            throw error;
        }
    }

    /**
     * Handles popstate events (browser back/forward)
     */
    async handlePopState(event) {
        const path = window.location.pathname;
        await this.matchAndEmitRoute(path);
    }

    /**
     * Handles route changes
     */
    async handleRouteChange(path) {
        await this.matchAndEmitRoute(path);
    }

    /**
     * Matches a path to a route definition and emits appropriate events
     */
    async matchAndEmitRoute(path) {
        try {
            this.emitStatusChange('processing', { operation: 'routeMatching', path });
            
            const matchedRoute = this.findMatchingRoute(path);
            
            if (matchedRoute) {
                const { route, params, query } = matchedRoute;
                this.currentRoute = { path, params, query, component: route.component };
                
                this.emitProgress(100, 'Route matched successfully');
                this.dispatchEvent(new CustomEvent('routeChanged', {
                    detail: this.currentRoute
                }));
                
                this.emitComplete(this.currentRoute, 'Navigation complete');
            } else {
                this.dispatchEvent(new CustomEvent('routeNotFound', {
                    detail: { path }
                }));
                
                this.emitError(new Error(`Route not found: ${path}`), { path });
            }
            
        } catch (error) {
            this.emitError(error, { operation: 'matchAndEmitRoute', path });
        }
    }

    /**
     * Finds a matching route for the given path
     */
    findMatchingRoute(path) {
        // Split path and remove empty segments
        const pathSegments = path.split('/').filter(segment => segment !== '');
        
        for (const route of this.routes) {
            const routeSegments = route.path.split('/').filter(segment => segment !== '');
            
            if (routeSegments.length !== pathSegments.length) {
                continue;
            }
            
            const params = {};
            let isMatch = true;
            
            for (let i = 0; i < routeSegments.length; i++) {
                const routeSegment = routeSegments[i];
                const pathSegment = pathSegments[i];
                
                if (routeSegment.startsWith(':')) {
                    // Dynamic segment - extract parameter
                    const paramName = routeSegment.substring(1);
                    params[paramName] = decodeURIComponent(pathSegment);
                } else if (routeSegment !== pathSegment) {
                    // Static segment doesn't match
                    isMatch = false;
                    break;
                }
            }
            
            if (isMatch) {
                // Extract query parameters from search string
                const query = this.extractQueryParameters(window.location.search);
                return { route, params, query };
            }
        }
        
        return null;
    }

    /**
     * Extracts query parameters from search string
     */
    extractQueryParameters(search) {
        const query = {};
        
        if (search) {
            const params = new URLSearchParams(search);
            for (const [key, value] of params.entries()) {
                query[key] = value;
            }
        }
        
        return query;
    }

    /**
     * Navigates to a specific path
     */
    navigate(path, replace = false) {
        try {
            this.emitStatusChange('navigating', { path, replace });
            
            // Ensure path starts with slash
            const normalizedPath = path.startsWith('/') ? path : `/${path}`;
            
            if (replace) {
                window.history.replaceState({}, '', normalizedPath);
            } else {
                window.history.pushState({}, '', normalizedPath);
            }
            
            // Trigger route change handling
            this.handleRouteChange(normalizedPath);
            
        } catch (error) {
            this.emitError(error, { operation: 'navigate', path, replace });
        }
    }

    /**
     * Returns the current route information
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Registers a new route
     */
    addRoute(path, component) {
        this.routes.push({ path, component });
        this.emitStatusChange('routeAdded', { path, component });
    }

    /**
     * Cleans up the router service
     */
    async cleanup() {
        window.removeEventListener('popstate', this.handlePopState.bind(this));
        this.isInitialized = false;
        this.emitStatusChange('stopped', { message: 'Router service stopped' });
    }
}

export default RouterService;