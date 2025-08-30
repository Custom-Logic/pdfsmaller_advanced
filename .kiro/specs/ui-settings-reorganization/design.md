# Design Document

## Overview

This design will reorganize the PDFSmaller application's UI to separate compression settings from the compression workflow, eliminate problematic dark backgrounds, fix text visibility issues, and implement proper hamburger menu functionality. The solution focuses on creating a cleaner separation of concerns between configuration (Settings tab) and execution (Compress tab), while ensuring all UI elements have proper contrast and visibility.

## Architecture

### Settings Reorganization Architecture

The current architecture mixes compression settings within the compression workflow. The new architecture will separate these concerns:

1. **Settings Tab**: Dedicated configuration interface for all compression-related preferences
2. **Compress Tab**: Streamlined workflow focused on file upload and processing
3. **State Management**: Centralized settings state that persists across tabs and sessions
4. **Component Communication**: Clean data flow between settings configuration and compression execution

### Visual Design System Improvements

The design will address visibility issues through:

1. **Background Standardization**: Remove all dark overlays and dark backgrounds from components
2. **Contrast Enhancement**: Ensure all text meets WCAG AA contrast requirements
3. **Consistent Theming**: Apply unified color scheme across all components
4. **Responsive Navigation**: Implement proper hamburger menu for all devices

## Components and Interfaces

### Settings Tab Interface

The Settings tab will contain all compression-related configuration options:

```html
<div class="settings-container">
  <div class="settings-header">
    <h2 class="settings-title">Compression Settings</h2>
    <p class="settings-description">Configure your PDF compression preferences</p>
  </div>
  
  <div class="settings-content">
    <div class="settings-section">
      <h3 class="section-title">Processing Mode</h3>
      <div class="mode-toggle-container">
        <button class="mode-option active" data-mode="single">
          <span class="mode-label">Single File</span>
          <span class="mode-description">Process one file at a time</span>
        </button>
        <button class="mode-option" data-mode="bulk">
          <span class="mode-label">Bulk Processing</span>
          <span class="mode-description">Process multiple files</span>
          <span class="pro-badge">PRO</span>
        </button>
      </div>
    </div>
    
    <div class="settings-section">
      <h3 class="section-title">Compression Level</h3>
      <select class="settings-select" id="compressionLevel">
        <option value="low">Low (Best Quality)</option>
        <option value="medium" selected>Medium (Balanced)</option>
        <option value="high">High (Smaller Size)</option>
        <option value="maximum">Maximum (Smallest Size)</option>
      </select>
      <p class="setting-help">Higher compression reduces file size but may affect quality</p>
    </div>
    
    <div class="settings-section">
      <h3 class="section-title">Image Quality</h3>
      <div class="slider-container">
        <input type="range" class="quality-slider" id="imageQuality" 
               min="10" max="100" value="70" step="5">
        <div class="slider-labels">
          <span class="slider-min">10%</span>
          <span class="slider-value" id="qualityValue">70%</span>
          <span class="slider-max">100%</span>
        </div>
      </div>
      <p class="setting-help">Adjust image compression quality (higher = better quality, larger size)</p>
    </div>
    
    <div class="settings-section">
      <h3 class="section-title">Processing Options</h3>
      <label class="checkbox-container">
        <input type="checkbox" class="checkbox-input" id="useServerProcessing">
        <span class="checkbox-custom"></span>
        <span class="checkbox-label">Use Server Processing</span>
        <span class="pro-badge">PRO</span>
      </label>
      <p class="setting-help">Enable server-side processing for better compression results</p>
    </div>
    
    <div class="settings-actions">
      <button class="btn btn-primary" id="saveSettings">Save Settings</button>
      <button class="btn btn-secondary" id="resetSettings">Reset to Defaults</button>
    </div>
  </div>
</div>
```

### Streamlined Compress Tab Interface

The Compress tab will focus solely on the upload and processing workflow:

```html
<div class="compress-container">
  <div class="compress-header">
    <h2 class="compress-title">Compress PDF Files</h2>
    <p class="compress-description">Upload your PDF files to reduce their size</p>
    <div class="current-settings-summary">
      <span class="settings-info">Current: Medium compression, 70% image quality</span>
      <button class="settings-link" onclick="switchToSettings()">Change Settings</button>
    </div>
  </div>
  
  <div class="upload-section">
    <div class="upload-area" id="uploadArea">
      <div class="upload-icon">
        <svg class="upload-svg" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      </div>
      <div class="upload-content">
        <h3 class="upload-title">Drop your PDF files here</h3>
        <p class="upload-subtitle">or click to browse and select files</p>
        <p class="upload-limits">Maximum file size: 50MB per file</p>
      </div>
      <input type="file" class="upload-input" accept=".pdf" multiple>
    </div>
  </div>
  
  <div class="processing-section" id="processingSection" style="display: none;">
    <!-- Progress tracking and results will be shown here -->
  </div>
</div>
```

### Hamburger Menu Implementation

The hamburger menu will provide proper mobile navigation:

```html
<header class="app-header">
  <div class="header-content">
    <div class="header-left">
      <button class="hamburger-menu" id="hamburgerMenu" aria-label="Toggle navigation">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
      <div class="logo">
        <h1 class="logo-text">PDFSmaller</h1>
      </div>
    </div>
    
    <nav class="desktop-nav">
      <div class="tab-navigation">
        <button class="tab-button active" data-tab="compress">Compress</button>
        <button class="tab-button" data-tab="convert">Convert</button>
        <button class="tab-button" data-tab="ocr">OCR</button>
        <button class="tab-button" data-tab="ai-tools">AI Tools</button>
        <button class="tab-button" data-tab="settings">Settings</button>
        <button class="tab-button" data-tab="pricing">Pricing</button>
      </div>
    </nav>
  </div>
  
  <div class="mobile-nav" id="mobileNav">
    <div class="mobile-nav-content">
      <button class="mobile-nav-item" data-tab="compress">
        <span class="nav-icon">📄</span>
        <span class="nav-label">Compress</span>
      </button>
      <button class="mobile-nav-item" data-tab="convert">
        <span class="nav-icon">🔄</span>
        <span class="nav-label">Convert</span>
      </button>
      <button class="mobile-nav-item" data-tab="ocr">
        <span class="nav-icon">👁️</span>
        <span class="nav-label">OCR</span>
      </button>
      <button class="mobile-nav-item" data-tab="ai-tools">
        <span class="nav-icon">🤖</span>
        <span class="nav-label">AI Tools</span>
      </button>
      <button class="mobile-nav-item" data-tab="settings">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">Settings</span>
      </button>
      <button class="mobile-nav-item" data-tab="pricing">
        <span class="nav-icon">💰</span>
        <span class="nav-label">Pricing</span>
      </button>
    </div>
  </div>
</header>
```

## Data Models

### Settings State Management

```javascript
const SettingsState = {
  compressionSettings: {
    processingMode: 'single', // 'single' | 'bulk'
    compressionLevel: 'medium', // 'low' | 'medium' | 'high' | 'maximum'
    imageQuality: 70, // 10-100
    useServerProcessing: false
  },
  
  // Methods for state management
  saveSettings() {
    localStorage.setItem('pdfsmaller-settings', JSON.stringify(this.compressionSettings));
  },
  
  loadSettings() {
    const saved = localStorage.getItem('pdfsmaller-settings');
    if (saved) {
      this.compressionSettings = { ...this.compressionSettings, ...JSON.parse(saved) };
    }
  },
  
  resetToDefaults() {
    this.compressionSettings = {
      processingMode: 'single',
      compressionLevel: 'medium',
      imageQuality: 70,
      useServerProcessing: false
    };
    this.saveSettings();
  }
};
```

### Navigation State Management

```javascript
const NavigationState = {
  activeTab: 'compress',
  mobileMenuOpen: false,
  
  switchTab(tabName) {
    this.activeTab = tabName;
    this.closeMobileMenu();
    this.updateUI();
  },
  
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.updateMobileMenuUI();
  },
  
  closeMobileMenu() {
    this.mobileMenuOpen = false;
    this.updateMobileMenuUI();
  }
};
```

## Error Handling

### Settings Validation

```javascript
class SettingsValidator {
  static validateCompressionLevel(level) {
    const validLevels = ['low', 'medium', 'high', 'maximum'];
    if (!validLevels.includes(level)) {
      throw new Error('Invalid compression level');
    }
  }
  
  static validateImageQuality(quality) {
    const numQuality = parseInt(quality);
    if (isNaN(numQuality) || numQuality < 10 || numQuality > 100) {
      throw new Error('Image quality must be between 10 and 100');
    }
  }
  
  static validateSettings(settings) {
    this.validateCompressionLevel(settings.compressionLevel);
    this.validateImageQuality(settings.imageQuality);
    
    if (typeof settings.useServerProcessing !== 'boolean') {
      throw new Error('Server processing setting must be boolean');
    }
  }
}
```

### User Feedback for Settings

```html
<div class="settings-feedback" id="settingsFeedback">
  <div class="feedback-success" style="display: none;">
    <span class="feedback-icon">✅</span>
    <span class="feedback-message">Settings saved successfully</span>
  </div>
  <div class="feedback-error" style="display: none;">
    <span class="feedback-icon">❌</span>
    <span class="feedback-message">Error saving settings</span>
  </div>
</div>
```

## Testing Strategy

### Settings Functionality Testing

1. **Settings Persistence**: Verify settings save and load correctly
2. **Tab Communication**: Test that settings apply to compression operations
3. **Validation**: Test input validation and error handling
4. **Default Values**: Verify reset functionality works correctly

### UI Visibility Testing

1. **Contrast Testing**: Verify all text meets WCAG AA standards
2. **Background Testing**: Ensure no dark overlays interfere with content
3. **Cross-browser Testing**: Test visibility across different browsers
4. **Device Testing**: Test on various screen sizes and devices

### Navigation Testing

1. **Hamburger Menu**: Test open/close functionality
2. **Tab Switching**: Verify smooth transitions between tabs
3. **Mobile Responsiveness**: Test navigation on mobile devices
4. **Keyboard Navigation**: Test accessibility with keyboard-only navigation

## CSS Design System

### Color Palette (Fixed Contrast)

```css
:root {
  /* Background Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  
  /* Text Colors (High Contrast) */
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  --text-muted: #94a3b8;
  
  /* Brand Colors */
  --brand-primary: #3b82f6;
  --brand-secondary: #1e40af;
  --brand-accent: #06b6d4;
  
  /* Interactive Colors */
  --interactive-hover: #f1f5f9;
  --interactive-active: #e2e8f0;
  --interactive-focus: #3b82f6;
  
  /* Status Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Border Colors */
  --border-light: #e2e8f0;
  --border-medium: #cbd5e1;
  --border-dark: #94a3b8;
}
```

### Component Styling (No Dark Backgrounds)

```css
/* Settings Container */
.settings-container {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;
}

/* Upload Area (Light Theme) */
.upload-area {
  background: var(--bg-secondary);
  border: 2px dashed var(--border-medium);
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  background: var(--interactive-hover);
  border-color: var(--brand-primary);
}

.upload-area.dragover {
  background: var(--bg-tertiary);
  border-color: var(--brand-primary);
  transform: scale(1.02);
}

/* Text Visibility */
.upload-title {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.upload-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.upload-limits {
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

/* Hamburger Menu */
.hamburger-menu {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.hamburger-menu:hover {
  background: var(--interactive-hover);
}

.hamburger-line {
  display: block;
  width: 24px;
  height: 3px;
  background: var(--text-primary);
  margin: 4px 0;
  transition: all 0.3s ease;
  border-radius: 2px;
}

/* Mobile Navigation */
.mobile-nav {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.mobile-nav.open {
  display: block;
}

.mobile-nav-content {
  background: var(--bg-primary);
  width: 280px;
  height: 100%;
  padding: 2rem 1rem;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.mobile-nav.open .mobile-nav-content {
  transform: translateX(0);
}

/* Responsive Behavior */
@media (max-width: 768px) {
  .hamburger-menu {
    display: block;
  }
  
  .desktop-nav {
    display: none;
  }
  
  .settings-container {
    margin: 1rem;
    padding: 1.5rem;
  }
}
```

## Implementation Approach

### Phase 1: Settings Reorganization
1. Create new Settings tab component
2. Move compression settings from Compress tab to Settings tab
3. Implement settings state management and persistence
4. Update Compress tab to show settings summary with link to Settings

### Phase 2: Background and Contrast Fixes
1. Remove all dark backgrounds from components
2. Update color palette for proper contrast
3. Fix text visibility issues throughout the application
4. Test contrast ratios against WCAG standards

### Phase 3: Hamburger Menu Implementation
1. Create hamburger menu component
2. Implement mobile navigation overlay
3. Add responsive behavior for desktop/mobile
4. Test navigation functionality across devices

### Phase 4: Integration and Testing
1. Integrate all components with existing application
2. Test settings persistence and application
3. Verify responsive behavior and accessibility
4. Conduct cross-browser and device testing

This design provides a comprehensive solution for reorganizing the settings, fixing visibility issues, and implementing proper mobile navigation while maintaining the application's functionality and improving user experience.