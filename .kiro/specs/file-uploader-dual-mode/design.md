# File Uploader Dual-Mode Enhancement Design

## Overview

This design document outlines the enhancement of the existing FileUploader component to support dual-mode operation (single file vs. batch files) through an integrated toggle switch. The enhancement maintains full backward compatibility while adding new functionality that allows users to switch between upload modes seamlessly.

## Architecture

### Component Structure Enhancement

The existing FileUploader component will be enhanced with the following architectural additions:

```
FileUploader (Enhanced)
├── Toggle Control System
│   ├── Toggle Switch UI Component
│   ├── Mode State Management
│   └── Mode Transition Logic
├── Adaptive UI Rendering
│   ├── Mode-Specific Templates
│   ├── Dynamic Instruction Updates
│   └── Conditional Element Display
├── File Handling Adaptation
│   ├── Single Mode File Processor
│   ├── Batch Mode File Processor
│   └── Mode Transition File Handler
└── Session Preference Management
    ├── Mode Memory System
    ├── Local Storage Integration
    └── Default Mode Resolution
```

### State Management Enhancement

The component's state will be extended to include mode-related properties:

```javascript
// Enhanced State Structure
{
  // Existing state properties
  isDragOver: boolean,
  isProcessing: boolean,
  error: string | null,
  files: File[],
  
  // New mode-related state
  currentMode: 'single' | 'batch',
  isToggleDisabled: boolean,
  modeTransitioning: boolean,
  sessionPreference: 'single' | 'batch' | null
}
```

## Components and Interfaces

### 1. Toggle Switch Component

**Purpose**: Provides the UI control for switching between single and batch modes.

**Interface**:
```javascript
class ModeToggle {
  constructor(initialMode, disabled, onModeChange)
  render(): string
  setMode(mode: 'single' | 'batch'): void
  getMode(): 'single' | 'batch'
  setDisabled(disabled: boolean): void
  animate(): void
}
```

**Visual Design**:
- Modern toggle switch with clear ON/OFF states
- Labels: "Single File" (OFF) and "Batch Files" (ON)
- Smooth animation between states
- Accessible focus indicators
- Disabled state styling

### 2. Mode Manager

**Purpose**: Handles mode transitions, state management, and business logic.

**Interface**:
```javascript
class ModeManager {
  constructor(component, defaultMode)
  switchMode(newMode: 'single' | 'batch'): void
  getCurrentMode(): 'single' | 'batch'
  handleModeTransition(oldMode, newMode): void
  adaptFilesForMode(files: File[], mode): File[]
  savePreference(mode): void
  loadPreference(): 'single' | 'batch' | null
}
```

**Responsibilities**:
- Mode state transitions
- File list adaptation during mode changes
- Session preference management
- Event emission for mode changes

### 3. Adaptive UI Renderer

**Purpose**: Renders mode-specific UI elements and updates instructions.

**Interface**:
```javascript
class AdaptiveRenderer {
  constructor(component)
  renderModeSpecificContent(mode): string
  updateInstructions(mode): string
  updateAriaLabels(mode): void
  animateTransition(fromMode, toMode): void
}
```

**Mode-Specific Rendering**:

**Single File Mode**:
- Upload area shows single file icon
- Instructions: "Drop your PDF here or click to browse"
- File input without `multiple` attribute
- Single file display in file list

**Batch Files Mode**:
- Upload area shows multiple files icon
- Instructions: "Drop your files here or click to browse"
- File input with `multiple` attribute
- Multi-file display with batch controls

### 4. Session Preference Manager

**Purpose**: Manages user mode preferences across the session.

**Interface**:
```javascript
class SessionPreferenceManager {
  static savePreference(mode: 'single' | 'batch'): void
  static loadPreference(): 'single' | 'batch' | null
  static clearPreference(): void
  static isPreferenceEnabled(): boolean
}
```

## Data Models

### Enhanced Component Props

```javascript
// New attributes for the enhanced component
{
  // Existing props
  accept: string,
  multiple: boolean,
  'max-size': string,
  disabled: boolean,
  
  // New props for dual-mode
  'default-mode': 'single' | 'batch',
  'remember-preference': boolean,
  'toggle-disabled': boolean,
  'show-mode-labels': boolean
}
```

### Mode Configuration Object

```javascript
const ModeConfig = {
  single: {
    multiple: false,
    maxFiles: 1,
    icon: 'single-file-icon',
    instructions: 'Drop your PDF here or click to browse',
    ariaLabel: 'Single file upload area',
    fileListClass: 'single-file-list'
  },
  batch: {
    multiple: true,
    maxFiles: Infinity,
    icon: 'batch-files-icon',
    instructions: 'Drop your files here or click to browse',
    ariaLabel: 'Multiple files upload area',
    fileListClass: 'batch-file-list'
  }
};
```

### Event Data Structures

```javascript
// Mode change event
{
  type: 'mode-changed',
  detail: {
    oldMode: 'single' | 'batch',
    newMode: 'single' | 'batch',
    filesAffected: number,
    timestamp: Date
  }
}

// Files adapted event (when files are modified due to mode change)
{
  type: 'files-adapted',
  detail: {
    originalFiles: File[],
    adaptedFiles: File[],
    mode: 'single' | 'batch',
    reason: 'mode-switch'
  }
}
```

## Error Handling

### Mode Transition Errors

1. **Invalid Mode Error**: When an invalid mode is specified
   - Fallback to default mode
   - Log warning and continue operation

2. **File Adaptation Error**: When files cannot be adapted to new mode
   - Preserve as many files as possible
   - Emit warning event with details

3. **Preference Storage Error**: When session preference cannot be saved/loaded
   - Continue without preference memory
   - Log error for debugging

### Accessibility Error Handling

1. **Screen Reader Compatibility**: Ensure all mode changes are announced
2. **Keyboard Navigation**: Provide fallback for keyboard-only users
3. **High Contrast Mode**: Ensure toggle visibility in all contrast modes

## Testing Strategy

### Unit Tests

1. **Mode Toggle Functionality**
   ```javascript
   describe('Mode Toggle', () => {
     test('should switch from single to batch mode')
     test('should switch from batch to single mode')
     test('should emit mode-changed event')
     test('should update UI elements correctly')
   })
   ```

2. **File Adaptation Logic**
   ```javascript
   describe('File Adaptation', () => {
     test('should keep only first file when switching to single mode')
     test('should preserve all files when switching to batch mode')
     test('should handle empty file list during mode switch')
   })
   ```

3. **Session Preference Management**
   ```javascript
   describe('Session Preferences', () => {
     test('should save mode preference to session storage')
     test('should load saved preference on component init')
     test('should handle missing preference gracefully')
   })
   ```

### Integration Tests

1. **Component Lifecycle**
   - Test mode initialization with different default modes
   - Test mode persistence across component re-renders
   - Test interaction with existing file upload functionality

2. **Event Integration**
   - Test event emission during mode changes
   - Test parent component event handling
   - Test event data structure consistency

3. **Accessibility Testing**
   - Test keyboard navigation of toggle
   - Test screen reader announcements
   - Test focus management during mode transitions

### Visual Regression Tests

1. **Toggle Appearance**
   - Test toggle in both states
   - Test toggle animations
   - Test disabled state appearance

2. **Mode-Specific UI**
   - Test single mode upload area
   - Test batch mode upload area
   - Test transition animations

## Implementation Phases

### Phase 1: Core Toggle Infrastructure
- Add toggle switch UI component
- Implement basic mode state management
- Add mode change event emission

### Phase 2: Adaptive UI Rendering
- Implement mode-specific template rendering
- Add instruction updates for each mode
- Implement smooth transition animations

### Phase 3: File Handling Adaptation
- Add file list adaptation logic
- Implement mode-specific file processing
- Add file validation for each mode

### Phase 4: Session Preference Management
- Add session storage integration
- Implement preference loading/saving
- Add preference-based initialization

### Phase 5: Accessibility and Polish
- Add comprehensive keyboard support
- Implement screen reader compatibility
- Add visual polish and animations

## Backward Compatibility Strategy

### Attribute Compatibility
- Existing `multiple` attribute sets initial toggle state
- All existing attributes continue to work unchanged
- New attributes are optional with sensible defaults

### API Compatibility
- All existing methods remain unchanged
- New methods are additive only
- Event names and structures remain consistent

### Behavioral Compatibility
- Default behavior matches current single-file mode
- Existing file handling logic preserved
- No breaking changes to parent component integration

## Performance Considerations

### Rendering Optimization
- Use conditional rendering to avoid unnecessary DOM updates
- Implement efficient state diffing for mode changes
- Minimize reflows during mode transitions

### Memory Management
- Clean up event listeners during mode transitions
- Avoid memory leaks in session preference storage
- Optimize file list updates for large batch operations

### Animation Performance
- Use CSS transforms for smooth animations
- Implement requestAnimationFrame for complex transitions
- Provide reduced motion alternatives for accessibility

This design provides a comprehensive enhancement to the FileUploader component that adds dual-mode functionality while maintaining full backward compatibility and ensuring excellent user experience across all interaction methods.