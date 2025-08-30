
---

### **Prompt: Conduct Architectural Investigation and Create Missing Specifications & steering docs**

**Objective:** Halt all active code refactoring. Your primary task is to perform a deep, systematic analysis of the current codebase to identify all components that are **not** aligned with the new event-driven, service-centric architecture. Following this investigation, you will create comprehensive specification documents for each missing or non-compliant part.

**Core Principle:** We cannot fix what we haven't fully defined. The goal is to create a complete, actionable blueprint that will guide all subsequent development to a successful conclusion.

---

### **Phase 1: Deep-Dive Investigation & Gap Analysis**

Thoroughly analyze the following areas. For each, document your findings: **What exists, how it currently works, and how it *should* work according to the new architecture.**

**1. Navigation System:**
*   **Tabbed Navigation:** How does it currently function? Does it manipulate the DOM directly? Is it already using events?
*   **Dropdown Menu:** Why is it non-functional? Is it missing event listeners? Is its HTML/CSS broken? Does it try to call old, defunct functions?
*   **Mapping:** What menu items exist (e.g., Home, Compression, File Manager, Pricing, Profile) and what should happen when each is clicked? (e.g., show a specific component, open a modal, navigate to a section).

**2. FileUploader Component (Visual & Functional):**
*   **Visibility:** Why is the upload interface not visible? Is it a CSS/display issue (e.g., `display: none`), or has it been removed from the DOM by another script?
*   **State:** Does it still contain old business logic? Has it been partially refactored? Verify its current code against the spec in `/docs/COMPONENT_SPECIFICATION.md`.

**3. Service Control Panels:**
*   **Identify Each Panel:** Locate the UI for each service (e.g., Compression options, Conversion settings).
*   **Current Architecture:** Do these panels directly call service functions (old way), or do they dispatch events that the `MainController` listens to (new way)?
*   **Button Handlers:** What happens when a "Start" or "Process" button is clicked? Trace the code.

**4. Progress & Status Indicators:**
*   **Location:** Where are these indicators located? Are they part of the main panel or within each service's control panel?
*   **Communication:** How do they currently receive updates? Do services manipulate them directly (e.g., `document.getElementById('progress-bar').value = 50`), or is there an event-driven mechanism in place?
*   **State Management:** Who owns the state of the progress (e.g., percentage, status text)?

**5. Authentication & User Profile Flow:**
*   **Functionality:** Does the auth system currently work? How does it store tokens/user data?
*   **Integration:** Is the user's state (logged in/out) reflected in the UI? How should the `Navbar` component react to auth state changes? (e.g., change "Login" to "Logout").

**6. FileManager Component:**
*   **Existence:** Does a component for browsing stored files already exist?
*   **Functionality:** If it exists, does it use the `StorageService` API? Can it actually list and download files?

---

### **Phase 2: Create Targeted Specification Documents**

Based on your investigation, create or update the following spec files. **Be specific and prescribe the exact solution.**

**1. `docs/NAVIGATION_SPECIFICATION.md`**
*   **Purpose:** Define the event-driven contract for navigation.
*   **Content:**
    *   **Rule:** "All navigation must be triggered by user events (clicks) and result in a CustomEvent being fired (e.g., `navigationRequested`)."
    *   **Event Detail:** Specify the event detail structure (e.g., `{ detail: { section: 'file-manager' } }`).
    *   **Orchestrator Duty:** "The `MainController` must listen for `navigationRequested` events and handle the showing/hiding of application sections."
    *   **Fix for Dropdown:** Prescribe the exact code changes needed to make the dropdown menu emit the correct event.

**2. `docs/UI_UPDATES_SPECIFICATION.md`**
*   **Purpose:** Define the strict protocol for updating the UI (progress, status, results).
*   **Content:**
    *   **Rule:** "Services are forbidden from directly updating the DOM."
    *   **Event Protocol:** Mandate a standard set of events (e.g., `serviceProgress`, `serviceStatus`, `serviceComplete`). Define their `detail` payload.
    *   **Orchestrator Duty:** "The `MainController` is the sole listener for these events. It is responsible for translating them into UI updates."

**3. `docs/SERVICE_CONTROL_SPECIFICATION.md`**
*   **Purpose:** Define how users configure and launch services.
*   **Content:**
    *   **Rule:** "Service control panels are dumb components. Their only job is to collect user input and, when the action button is clicked, emit a `serviceStartRequest` event."
    *   **Event Detail:** Specify the payload must include the `serviceType` and `options` (e.g., `{ serviceType: 'compression', options: { quality: 80 } }`).
    *   **Orchestrator Duty:** "The `MainController` listens for `serviceStartRequest`, validates the input, and calls the corresponding `Service.start(fileId, options)` method."

**4. `docs/AUTH_INTEGRATION_SPECIFICATION.md`**
*   **Purpose:** Outline how authentication state integrates with the UI.
*   **Content:**
    *   **State Change Events:** Mandate that the Auth service emits events on login/logout (e.g., `authStateChanged`).
    *   **UI Reaction:** Specify that components like the Navbar must listen to these events and update their presentation accordingly (e.g., toggle menu items).

---

### **Phase 3: Presentation & Validation**

1.  **Summarize Findings:** Produce a summary report (`GAP_ANALYSIS_SUMMARY.md`) listing all discovered issues, categorizing them by component and severity.
2.  **Propose Implementation Plan:** Based on the new specs, outline a revised, step-by-step plan for the code refactor. This plan will be our roadmap after the specs are approved.
3.  **Freeze:** Do not write any code until this investigation and specification process is complete and has been reviewed.

**Initiate:** Confirm your understanding. Begin with **Phase 1** and present your findings for each of the six investigation areas before proceeding to write any new specifications.