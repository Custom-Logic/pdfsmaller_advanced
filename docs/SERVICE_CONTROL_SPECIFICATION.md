# Service Control Specification

## 1. Purpose

To define the standard architectural pattern for how user interactions in the UI initiate actions in the various backend services (e.g., Compression, Conversion, OCR).

## 2. Core Rule

Service control panels (e.g., `compression-controls`, `conversion-controls`) are **"dumb" components**. Their only job is to collect user input (e.g., quality settings, target format) and, when the primary action button is clicked, emit a single, standardized `serviceStartRequest` event. They must not contain business logic or call services directly.

## 3. Event Contract

### 3.1. Event: `serviceStartRequest`

- **Trigger:** A click on the primary action button of any service control panel (e.g., "Start Compression", "Convert to Word").
- **Payload (`event.detail`):** The payload must be a structured object containing all the information the controller needs to start the correct service with the correct parameters.
  ```json
  {
    "serviceType": "compression",
    "options": {
      "compressionLevel": "high",
      "imageQuality": 80
    },
    "fileIds": ["file_12345", "file_67890"]
  }
  ```

- **Payload Fields:**
    - `serviceType` (required, string): The identifier for the service to be called (e.g., `compression`, `conversion`, `ocr`, `ai`).
    - `options` (required, object): A key-value map of the settings collected from the UI control panel.
    - `fileIds` (optional, array): An array of file IDs from the `StorageService` that the operation should be performed on. This may not be present if the service doesn't require a file.

## 4. Orchestrator Duty (`MainController`/`MainIntegration`)

The central application controller is the **sole listener** for `serviceStartRequest` events. Its responsibilities are:

1.  **Listen** for the `serviceStartRequest` event.
2.  **Validate** the payload. For example, check if the requested `serviceType` exists and if the required `fileIds` are present.
3.  **Retrieve** the relevant service instance from a service registry (e.g., `this.services.get(event.detail.serviceType)`).
4.  **Retrieve** the necessary files from the `StorageService` using the provided `fileIds`.
5.  **Call** the appropriate method on the service instance, passing the files and options (e.g., `compressionService.compressFile(file, options)`).
6.  **Manage** the UI state, such as disabling the control panel's button while the service is processing.

## 5. Specific Fixes Required

### 5.1. Compression Control Panel

- **Problem:** The core "Compress" tab lacks a dedicated, event-driven control panel. The action button is currently part of the monolithic `<bulk-uploader>` component and uses a direct callback (`onBatchStart`).
- **Solution:**
    1.  A new `<compression-controls>` component must be created.
    2.  This component will contain the UI for compression settings (e.g., level, quality) and a "Start Compression" button.
    3.  The `<bulk-uploader>` component must be refactored to remove its "Start Batch Compression" button. Its only job is to handle file selection and emit `fileUploaded` events.
    4.  When the "Start Compression" button in `<compression-controls>` is clicked, it must gather the settings and dispatch a `serviceStartRequest` event with `serviceType: 'compression'`. The `MainController` will be responsible for getting the list of currently selected files to pass to the service.
