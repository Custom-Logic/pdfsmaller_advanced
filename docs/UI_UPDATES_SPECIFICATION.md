# UI Updates Specification

## 1. Purpose

To define a strict, one-way communication protocol for services to report state changes (e.g., progress, status, completion) to the UI without having direct knowledge of or access to DOM elements.

## 2. Core Rule

Services are **strictly forbidden** from directly updating the DOM. A service (e.g., `CompressionService`) must never contain code like `document.getElementById(...)` or `document.querySelector(...)`. All communication from a service to the UI must be done by emitting events.

## 3. Event Protocol

Services must use a standard set of events to report their state. The `StandardService` base class provides helper methods (`emitProgress`, `emitComplete`, `emitError`) for this purpose.

### 3.1. `serviceProgress`

- **Trigger:** During a long-running operation to provide an update on its progress.
- **Payload (`event.detail`):**
  ```json
  {
    "service": "CompressionService",
    "percentage": 45,
    "message": "Optimizing images...",
    "timestamp": 1678886400000
  }
  ```

### 3.2. `serviceStatus`

- **Trigger:** When the status of a service or operation changes (e.g., initializing, analyzing, finalizing).
- **Payload (`event.detail`):**
  ```json
  {
    "service": "FileProcessingService",
    "status": "analyzing",
    "message": "Analyzing file for optimal compression...",
    "timestamp": 1678886400000
  }
  ```

### 3.3. `serviceComplete`

- **Trigger:** When an operation finishes successfully.
- **Payload (`event.detail`):**
  ```json
  {
    "service": "CompressionService",
    "result": {
      "originalSize": 5242880,
      "compressedSize": 1048576,
      "reductionPercent": 80
    },
    "message": "Compression successful",
    "timestamp": 1678886400000
  }
  ```

### 3.4. `serviceError`

- **Trigger:** When an operation fails.
- **Payload (`event.detail`):**
  ```json
  {
    "service": "CompressionService",
    "error": "Invalid PDF structure",
    "context": { "operation": "compressFile" },
    "timestamp": 1678886400000
  }
  ```

## 4. Orchestrator Duty (`MainController`/`MainIntegration`)

The central application controller (or a dedicated integration module like `progress-results-integration.js`) is the **sole listener** for these service events. Its responsibilities are:

1.  **Listen** for `serviceProgress`, `serviceStatus`, `serviceComplete`, and `serviceError` events emitted from any service.
2.  **Identify** the relevant UI component(s) that need to be updated (e.g., `progress-tracker`, `results-display`).
3.  **Translate** the event payload into a format the UI component understands.
4.  **Call** the public methods on the UI component to pass the new data and trigger a re-render (e.g., `progressTracker.updateProgress(event.detail)`).

## 5. Example Flow

1.  `CompressionService` starts processing a file.
2.  `CompressionService` emits: `this.emitProgress(50, 'Compressing images...');`
3.  `MainIntegration` is listening and its `handleServiceProgress` method is invoked.
4.  `MainIntegration` finds the `<progress-tracker>` component in the DOM.
5.  `MainIntegration` calls: `progressTracker.updateProgress({ percentage: 50, message: 'Compressing images...' });`
6.  The `<progress-tracker>` component receives the new data and updates its own DOM to show the 50% progress bar and new message.
