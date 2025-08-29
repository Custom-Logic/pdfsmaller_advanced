# PDFSmaller Frontend Components

This document describes the new frontend components that have been added to the PDFSmaller application.

## New Components

### 1. AuthPanel (`auth-panel.js`)
Handles user authentication including login, registration, and user profile display.

**Features:**
- Login/Registration forms
- User profile display with avatar
- Social authentication (Google)
- Profile editing and subscription management

**Usage:**
```html
<auth-panel id="authPanel"></auth-panel>
```

**Events:**
- `auth:login` - User login attempt
- `auth:register` - User registration attempt
- `auth:logout` - User logout
- `auth:edit-profile` - Edit profile request
- `auth:manage-subscription` - Manage subscription request

### 2. ProfilePanel (`profile-panel.js`)
Displays and allows editing of user profile information.

**Features:**
- View user profile information
- Edit profile details
- Change password
- View subscription status
- Usage statistics

**Usage:**
```html
<profile-panel id="profilePanel"></profile-panel>
```

**Events:**
- `profile:update` - Profile update request
- `profile:manage-subscription` - Manage subscription request

### 3. SubscriptionPanel (`subscription-panel.js`)
Manages subscription plans, billing, and usage statistics.

**Features:**
- View current subscription
- Browse available plans
- Usage statistics and limits
- Billing information
- Plan management

**Usage:**
```html
<subscription-panel id="subscriptionPanel"></subscription-panel>
```

**Events:**
- `subscription:upgrade` - Upgrade subscription request
- `subscription:select-plan` - Plan selection
- `subscription:change-plan` - Change plan request
- `subscription:cancel` - Cancel subscription request

### 4. EnhancedSettingsPanel (`enhanced-settings-panel.js`)
Comprehensive settings management with multiple tabs.

**Features:**
- Compression settings
- User preferences
- Account settings
- Tabbed interface

**Usage:**
```html
<enhanced-settings-panel id="settingsPanel"></enhanced-settings-panel>
```

**Events:**
- `settings:save` - Save settings request
- `settings:change` - Settings changed
- `settings:edit-profile` - Edit profile request
- `settings:manage-subscription` - Manage subscription request

## Integration

### MainIntegration (`main-integration.js`)
Orchestrates all components and handles the overall application state.

**Features:**
- Component lifecycle management
- Authentication state management
- Event handling and routing
- API integration
- Navigation management

**Usage:**
```javascript
import MainIntegration from './main-integration.js';

const integration = new MainIntegration();
await integration.init();
```

## Navigation

The application now includes new tabs:
- **Profile** - User profile management (visible when authenticated)
- **Settings** - Application settings
- **Subscription** - Subscription management (visible when authenticated)

## Authentication Flow

1. **Guest State**: Users see login/register options
2. **Authenticated State**: Users see profile and subscription tabs
3. **Profile Management**: Users can edit their profile and manage settings
4. **Subscription Management**: Users can view and manage their subscription

## Event System

All components use a custom event system for communication:
- Events are prefixed with the component name (e.g., `auth:login`)
- Events include relevant data in the `detail` property
- Components can listen for events using `addEventListener`

## Styling

Components include their own CSS with:
- Responsive design
- Modern UI elements
- Consistent styling with the main application
- Dark/light theme support

## Browser Support

Components use modern web standards:
- ES6+ JavaScript
- Web Components
- Shadow DOM
- CSS Grid and Flexbox

## Development

To add new components:
1. Extend the `BaseComponent` class
2. Implement required methods (`getTemplate`, `getStyles`, `setupEventListeners`)
3. Register the component with `customElements.define`
4. Add to the main integration
5. Update navigation and HTML structure

## Testing

Components can be tested individually or as part of the integrated application. Each component emits events that can be captured for testing purposes.
