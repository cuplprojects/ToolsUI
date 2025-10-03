# Project Configuration Module

This module has been refactored into smaller, reusable components for better maintainability and code organization.

## Structure

```
ProjectConfig/
├── components/              # UI Components
│   ├── AnimatedCard.jsx            # Reusable animated card wrapper with framer-motion
│   ├── ModuleSelectionCard.jsx     # Module selection interface
│   ├── EnvelopeSetupCard.jsx       # Envelope configuration (inner/outer)
│   ├── EnvelopeMakingCriteriaCard.jsx  # Envelope making criteria
│   ├── ExtraProcessingCard.jsx     # Extra processing configuration
│   ├── BoxBreakingCard.jsx         # Box breaking criteria
│   ├── ConfigSummaryCard.jsx       # Configuration summary and save button
│   ├── constants.js                # Shared constants (colors, styles, module names)
│   └── index.js                    # Component exports
│
├── hooks/                   # Custom Hooks
│   ├── useProjectConfigData.js     # Data fetching logic (API calls)
│   └── useProjectConfigSave.js     # Save configuration logic
│
└── ProjectConfiguration.jsx        # Main component (orchestrates all sub-components)
```

## Components

### AnimatedCard
A reusable wrapper component that provides consistent animation effects using framer-motion.

**Props:** 
- `children` - React nodes to be wrapped

### ModuleSelectionCard
Displays available modules with checkboxes for selection.

**Props:**
- `mergedModules` - Array of module objects
- `enabledModules` - Array of enabled module names
- `setEnabledModules` - State setter function

### EnvelopeSetupCard
Configures inner and outer envelope types.

**Props:**
- `isEnabled` - Function to check if a module is enabled
- `innerEnvelopes` - Selected inner envelopes
- `setInnerEnvelopes` - State setter
- `outerEnvelopes` - Selected outer envelopes
- `setOuterEnvelopes` - State setter
- `envelopeOptions` - Available envelope options

### EnvelopeMakingCriteriaCard
Defines criteria for envelope serial numbering.

**Props:**
- `isEnabled` - Function to check if a module is enabled
- `fields` - Available fields
- `selectedEnvelopeFields` - Selected fields
- `setSelectedEnvelopeFields` - State setter

### ExtraProcessingCard
Configures extra packet calculations with different modes (Fixed, Range, Percentage).

**Props:**
- `isEnabled` - Function to check if a module is enabled
- `extraTypes` - Array of extra types
- `extraTypeSelection` - Selected mode for each type
- `setExtraTypeSelection` - State setter
- `extraProcessingConfig` - Configuration for each type
- `setExtraProcessingConfig` - State setter
- `envelopeOptions` - Available envelope options

### BoxBreakingCard
Defines box breaking criteria including capacity and field-based breaking.

**Props:**
- `isEnabled` - Function to check if a module is enabled
- `boxBreakingCriteria` - Selected criteria
- `setBoxBreakingCriteria` - State setter
- `fields` - Available fields
- `selectedBoxFields` - Selected fields
- `setSelectedBoxFields` - State setter

### ConfigSummaryCard
Displays configuration summary and provides save functionality.

**Props:**
- `enabledModules` - Array of enabled modules
- `envelopeConfigured` - Boolean flag
- `boxConfigured` - Boolean flag
- `extraConfigured` - Boolean flag
- `handleSave` - Save handler function
- `projectId` - Current project ID

## Custom Hooks

### useProjectConfigData
Handles all data fetching operations (modules, envelopes, fields, extra types).

**Returns:**
- `toolModules` - Raw module data
- `envelopeOptions` - Available envelopes
- `extraTypes` - Extra type configurations
- `fields` - Available fields
- `mergedModules` - Processed module list
- `extraTypeSelection` - Extra type mode selection
- `setExtraTypeSelection` - State setter

### useProjectConfigSave
Handles the save operation for project configuration.

**Parameters:**
- All necessary state values and configuration data

**Returns:**
- `handleSave` - Function to save configuration

## Constants

Shared constants are defined in `components/constants.js`:
- `PRIMARY_COLOR` - Primary theme color
- `EXTRA_ALIAS_NAME` - Display name for extra configuration
- `NODAL_MODULE` - Nodal module identifier
- `UNIVERSITY_MODULE` - University module identifier
- `cardStyle` - Consistent card styling
- `iconStyle` - Consistent icon styling

## Benefits of This Structure

1. **Separation of Concerns**: Each component handles a specific part of the configuration
2. **Reusability**: Components can be reused or tested independently
3. **Maintainability**: Easier to locate and fix bugs
4. **Readability**: Smaller files are easier to understand
5. **Testability**: Individual components can be unit tested
6. **Performance**: Potential for better optimization with React.memo
7. **Scalability**: Easy to add new configuration sections

## Usage Example

```jsx
import ProjectConfiguration from './ProjectConfig/ProjectConfiguration';

function App() {
  return <ProjectConfiguration />;
}
```

## Future Improvements

- Add PropTypes or TypeScript for type safety
- Implement React.memo for performance optimization
- Add unit tests for each component
- Create Storybook stories for component documentation
- Add error boundaries for better error handling