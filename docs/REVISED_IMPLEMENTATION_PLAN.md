# Revised Implementation Plan

## 1. Objective

To refactor the application to be fully compliant with the new event-driven, service-centric architecture defined in the `docs/` specifications. This plan prioritizes fixing the most critical architectural gaps first to create a stable foundation for future development.

**Guiding Principle:** All work must adhere strictly to the specifications. No new features are to be added. The focus is exclusively on architectural alignment.

--- 

## 2. Development Phases

### Phase 1: Foundational Integration (Fixing the "Glue")

*Goal: Make the application react to state changes correctly. This is the highest priority.* 

1.  **Implement Auth State Handling:**
    *   **Task:** In `js/main-integration.js`, add the event listener for the `authStateChanged` event emitted by the `AuthManager`.
    *   **Spec:** `docs/AUTH_INTEGRATION_SPECIFICATION.md`
    *   **Acceptance Criteria:** When a user logs in, the main navigation updates to show "Profile"/"Logout", and the auth panel switches to the profile view. When they log out, the UI reverts to the guest state.

2.  **Implement File Management Flow:**
    *   **Task:** In `js/main-integration.js`, implement the handlers for events dispatched by the `<file-manager>` component (`requestFileList`, `fileDownloadRequested`, `fileDeleteRequested`). These handlers will call the appropriate methods on the `StorageService` and update the file manager with the results.
    *   **Spec:** `docs/COMPONENT_SPECIFICATION.md` (for FileManager) & `docs/SERVICE_SPECIFICATION.md` (for StorageService).
    *   **Acceptance Criteria:** The "Files" tab correctly lists all files from the `StorageService`. Users can successfully download and delete files.

### Phase 2: Uploader & Compression Workflow Refactor

*Goal: Fix the broken file upload process and align the core compression feature with the standard architecture.*

1.  **Fix and Clean Up Uploaders:**
    *   **Task A:** Delete the duplicate file: `js/components/file-uploader-refactored.js`.
    *   **Task B:** In `static/css/components-modern.css`, remove the `display: none;` rule from the `file-uploader` selector.
    *   **Acceptance Criteria:** The file uploader component is now visible on the "Convert", "OCR", and "AI Tools" tabs.

2.  **Create Compression Controls:**
    *   **Task:** Create a new component, `<compression-controls>`, as specified in `docs/SERVICE_CONTROL_SPECIFICATION.md`. This will include the UI for settings and a "Start Compression" button.
    *   **Acceptance Criteria:** The new component is created and ready for integration.

3.  **Refactor the Compression Tab:**
    *   **Task A:** Replace the monolithic `<bulk-uploader>` on the "Compress" tab with a standard `<file-uploader>` (with the `multiple` attribute) and the new `<compression-controls>` component.
    *   **Task B:** In `js/main-integration.js`, implement the `serviceStartRequest` event listener. When it receives a request with `serviceType: 'compression'`, it should get the files and call the `FileProcessingService`.
    *   **Spec:** `docs/SERVICE_CONTROL_SPECIFICATION.md`
    *   **Acceptance Criteria:** The compression tab now uses the standardized components. Clicking "Start Compression" successfully initiates the compression service, and progress is displayed correctly via the (already functional) progress tracking system.

### Phase 3: Navigation Refactor

*Goal: Make all navigation fully event-driven.*

1.  **Implement Main Navigation:**
    *   **Task:** In `index.html`, populate the side-menu (`<nav class="nav-menu-content">`) with the primary navigation links.
    *   **Task:** In `js/main-integration.js`, add the event listener for the `navigationRequested` event as specified.
    *   **Spec:** `docs/NAVIGATION_SPECIFICATION.md`
    *   **Acceptance Criteria:** Clicking links in the side menu correctly switches tabs or opens modals as defined, and the hamburger menu no longer uses direct DOM manipulation.

--- 

## 3. Validation

- After each phase, a full regression test of the affected features must be performed.
- All new code must be written in accordance with the `DEVELOPMENT_RULES.md`.
- No work on the next phase should begin until the current phase is complete and validated.
