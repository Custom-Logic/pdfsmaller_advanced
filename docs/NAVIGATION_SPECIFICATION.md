# Navigation Specification

## 1. Purpose

To define a standardized, event-driven contract for all application navigation, ensuring that navigation components are decoupled from the content they control.

## 2. Core Rule

All navigation actions initiated by the user (e.g., clicks on menu items, tabs, or buttons) **must not** directly manipulate the DOM or call methods on other components to show/hide content. Instead, they **must** result in a `CustomEvent` being dispatched to announce the user's intent.

## 3. Event Contract

### 3.1. Main Navigation Events

- **Event Name:** `navigationRequested`
- **Trigger:** A click on any primary navigation element (e.g., side menu links, header links).
- **Payload (`event.detail`):** The event's `detail` object must contain the target destination.
  ```json
  {
    "section": "file-manager"
  }
  ```
- **Example `section` values:** `home`, `compress`, `file-manager`, `pricing`, `settings`, `profile`.

### 3.2. Tab Navigation Events

- **Event Name:** `tab-changed`
- **Note:** This is already correctly implemented in `js/modules/tab-navigation.js` and should be considered the standard.
- **Payload (`event.detail`):**
  ```json
  {
    "tab": "compress",
    "previousTab": "settings"
  }
  ```

## 4. Orchestrator Duty (`MainController`/`MainIntegration`)

The central application controller is the **sole listener** for navigation events. Its responsibilities are:

1.  **Listen** for `navigationRequested` and `tab-changed` events.
2.  **Interpret** the event payload (e.g., `event.detail.section`).
3.  **Orchestrate** the UI changes. This includes, but is not limited to:
    *   Calling the `switchTab()` method on the Tab Navigation service.
    *   Opening or closing modal dialogs (e.g., File Manager).
    *   Updating the visual state of navigation components.

## 5. Specific Fixes Required

### 5.1. Main Dropdown/Side Menu

- **Problem:** The main side menu (controlled by the hamburger icon) is non-functional for navigation. It currently only contains an auth panel.
- **Solution:**
    1.  The `<nav class="nav-menu-content">` element must be populated with navigation links (e.g., `<a>` or `<button>` tags).
    2.  Each link must have a `data-section` attribute corresponding to its destination (e.g., `data-section="file-manager"`).
    3.  A single event listener must be attached to the menu container. On click, it will check for a `data-section` attribute on the event target.
    4.  If the attribute is found, it will dispatch the `navigationRequested` event with the appropriate detail.

- **Example Implementation:**
  ```html
  <!-- In index.html -->
  <div class="nav-menu-content">
      <a href="#" class="nav-link" data-section="compress">Compress</a>
      <a href="#" class="nav-link" data-section="files">Files</a>
      <a href="#" class="nav-link" data-section="settings">Settings</a>
      <hr>
      <auth-panel id="navAuthPanel"></auth-panel>
  </div>
  ```
  ```javascript
  // In main-integration.js or similar
  const navMenu = document.querySelector('.nav-menu-content');
  navMenu.addEventListener('click', (event) => {
      const target = event.target.closest('[data-section]');
      if (!target) return;

      event.preventDefault();
      const section = target.dataset.section;

      // Dispatch the standard navigation event
      document.dispatchEvent(new CustomEvent('navigationRequested', {
          detail: { section },
          bubbles: true,
          composed: true
      }));

      // Close the menu
      document.querySelector('.nav-menu').classList.remove('active');
  });
  ```
