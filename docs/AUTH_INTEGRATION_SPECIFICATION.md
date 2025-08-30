# Authentication Integration Specification

## 1. Purpose

To define how the application's UI should react to changes in the user's authentication state (i.e., logging in and logging out), ensuring a consistent and decoupled integration between the authentication service and UI components.

## 2. Core Rule

UI components (like the Navbar or AuthPanel) **must not** directly check for an auth token or manage authentication state. They must be "dumb" components that render a specific state based on data passed to them or in response to application-wide events.

## 3. Event Contract

### 3.1. Event: `authStateChanged`

- **Source:** The `AuthManager` service is the **only** part of the application permitted to emit this event.
- **Trigger:** This event must be fired whenever the user's authentication state changes, specifically after a successful login, logout, or session validation/invalidation.
- **Payload (`event.detail`):** The payload must contain the complete, current authentication context.
  ```json
  {
    "isAuthenticated": true,
    "user": {
      "id": "user_abc123",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "plan": "premium"
    }
  }
  ```
  *In the case of logout, `isAuthenticated` would be `false` and `user` would be `null`.*

## 4. Orchestrator & Component Duty

### 4.1. Orchestrator (`MainController`/`MainIntegration`)

- **Responsibility:** The central controller must listen for the `authStateChanged` event from the `AuthManager`.
- **Action:** Upon receiving the event, the controller is responsible for re-rendering or updating all relevant parts of the UI. This includes:
    1.  Calling public methods on the `<auth-panel>` to update its view (e.g., `authPanel.setAuthState(isAuthenticated, user)`).
    2.  Showing or hiding navigation elements (e.g., "Profile" and "Subscription" tabs).
    3.  Updating the main header to display the user's name/avatar or a "Login" button.

### 4.2. UI Components (`Navbar`, `AuthPanel`)

- **Responsibility:** Components should be designed to be controlled externally.
- **Example:** The `<auth-panel>` should have a public method like `setAuthState(isAuthenticated, user)` which, when called by the controller, triggers a re-render to show either the login form or the user profile view.

## 5. Specific Fixes Required

- **Problem:** The `AuthManager` service correctly emits an `auth_state_changed` event (`statusChanged` with type `auth_state_changed`), but no other module in the application is listening for it. This is why the UI does not update after a user logs in or out.
- **Solution:**
    1.  In `main-integration.js` (or the designated controller), an event listener for `authStateChanged` must be established.
    2.  This listener's handler function will execute the UI update logic described in section 4.1.

- **Example Implementation:**
  ```javascript
  // In AuthManager.js (already correctly implemented)
  this.emitStatusChange('auth_state_changed', {
      isAuthenticated: this.isAuthenticated,
      user: this.currentUser
  });

  // In main-integration.js (this is the missing piece)
  setupEventListeners() {
      // ... other listeners
      authManager.addEventListener('statusChanged', (event) => {
          if (event.detail.status === 'auth_state_changed') {
              this.handleAuthStateChange(event.detail);
          }
      });
  }

  handleAuthStateChange(detail) {
      const { isAuthenticated, user } = detail;
      this.isAuthenticated = isAuthenticated;
      this.currentUser = user;

      // 1. Update the AuthPanel component
      const authPanel = this.components.get('auth');
      if (authPanel) {
          authPanel.setAuthState(isAuthenticated, user);
      }

      // 2. Update the main navigation tabs
      this.updateNavigationTabs(isAuthenticated);

      // 3. Update any other UI elements
      // ...
  }
  ```
