# Router Service Design

## 1. Purpose

The `RouterService` is responsible for managing the application's client-side routing. It will handle navigation between different views, update the browser's history, and provide a mechanism for components to trigger navigation and receive route parameters.

## 2. API Requirements

```javascript
class RouterService extends StandardService {
    /**
     * Initializes the router with a set of routes.
     * @param {Array<object>} routes - An array of route definitions.
     * Each route object should have a `path` and a `component` property.
     */
    constructor(routes) {}

    /**
     * Starts the router, listening for hash changes and handling the initial route.
     */
    async init() {}

    /**
     * Navigates to a specific path.
     * @param {string} path - The path to navigate to (e.g., '/home', '/user/123').
     * @param {boolean} replace - If true, replaces the current history entry instead of pushing a new one.
     */
    navigate(path, replace = false) {}

    /**
     * Returns the current route's path, parameters, and query.
     * @returns {object} The current route information.
     */
    getCurrentRoute() {}

    /**
     * Registers a new route.
     * @param {string} path - The route's path.
     * @param {string} component - The name of the component to render for this route.
     */
    addRoute(path, component) {}
}
```

## 3. Event Interface

The `RouterService` will emit the following events:

-   **`routeChanged`**: Fired when the route changes. The event detail will contain the new route information (path, params, query).
    ```javascript
    this.dispatchEvent(new CustomEvent('routeChanged', {
        detail: {
            path: '/user/123',
            params: { id: '123' },
            query: {}
        }
    }));
    ```
-   **`routeNotFound`**: Fired when a route is not found. The event detail will contain the path that was not found.
    ```javascript
    this.dispatchEvent(new CustomEvent('routeNotFound', {
        detail: {
            path: '/invalid-route'
        }
    }));
    ```

## 4. Implementation Details

-   The `RouterService` will use the `window.location.hash` property to manage routes.
-   It will listen for the `hashchange` event on the `window` object.
-   The service will maintain a list of route definitions, including the path and the component to be rendered.
-   When a route changes, the `RouterService` will identify the matching route, extract any parameters, and emit a `routeChanged` event. The `MainController` will listen for this event and handle the rendering of the appropriate component.
-   The router will support dynamic route segments (e.g., `/:id`) and query parameters.

## 5. Testing Strategy

-   **Unit Tests:**
    -   Test the route matching logic with various paths and patterns.
    -   Test the parameter extraction logic.
    -   Test the `navigate` method and its effect on `window.location.hash`.
    -   Test the `routeChanged` and `routeNotFound` event emissions.
-   **Integration Tests:**
    -   Test the integration of the `RouterService` with the `MainController`.
    -   Test the end-to-end navigation flow, from a component triggering a navigation event to the correct view being rendered.
