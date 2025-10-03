# Component Tree Structure

## Visual Hierarchy

```
ProjectConfiguration (Main Container)
│
├── Custom Hooks
│   ├── useProjectConfigData()
│   │   ├── Fetches: Modules
│   │   ├── Fetches: Envelope Types
│   │   ├── Fetches: Extra Types
│   │   ├── Fetches: Fields
│   │   └── Returns: mergedModules, extraTypeSelection, etc.
│   │
│   └── useProjectConfigSave()
│       └── Handles: Save configuration logic
│
├── Left Column (Col xs={24} md={16})
│   │
│   ├── ModuleSelectionCard
│   │   └── AnimatedCard
│   │       └── Card
│   │           └── Checkbox.Group
│   │               └── Module checkboxes
│   │
│   ├── EnvelopeSetupCard
│   │   └── AnimatedCard
│   │       └── Card
│   │           ├── Inner Envelopes Select
│   │           └── Outer Envelopes Select
│   │
│   ├── EnvelopeMakingCriteriaCard
│   │   └── AnimatedCard
│   │       └── Card
│   │           └── Fields Select (multiple)
│   │
│   └── ExtraProcessingCard
│       └── AnimatedCard
│           └── Card
│               └── For each Extra Type:
│                   ├── Inner Envelope Select
│                   ├── Outer Envelope Select
│                   ├── Radio Group (Fixed/Range/Percentage)
│                   └── InputNumber (based on selection)
│
└── Right Column (Col xs={24} md={8})
    │
    ├── BoxBreakingCard
    │   └── AnimatedCard
    │       └── Card
    │           ├── Capacity Checkbox (always enabled)
    │           └── Fields Select (multiple)
    │
    └── ConfigSummaryCard
        └── AnimatedCard
            └── Card
                ├── Summary List
                │   ├── Enabled Modules count
                │   ├── Envelope Setup status
                │   ├── Box Breaking status
                │   └── Extra Processing status
                └── Save Button
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ProjectConfiguration                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         useProjectConfigData Hook                   │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  API Calls:                                   │  │    │
│  │  │  • GET /Modules                               │  │    │
│  │  │  • GET /EnvelopeTypes                         │  │    │
│  │  │  • GET /ExtraTypes                            │  │    │
│  │  │  • GET /Fields                                │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  │                      ↓                              │    │
│  │  Returns: toolModules, envelopeOptions,            │    │
│  │           extraTypes, fields, mergedModules        │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Component State                        │    │
│  │  • enabledModules                                   │    │
│  │  • innerEnvelopes / outerEnvelopes                  │    │
│  │  • selectedBoxFields / selectedEnvelopeFields       │    │
│  │  • extraProcessingConfig                            │    │
│  │  • boxBreakingCriteria                              │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Child Components (Cards)                  │    │
│  │  Receive props and render UI                        │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         useProjectConfigSave Hook                   │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  On Save:                                     │  │    │
│  │  │  • POST /ProjectConfigs                       │  │    │
│  │  │  • POST /ExtrasConfigurations (multiple)      │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Props Flow Diagram

```
ProjectConfiguration
    │
    ├─→ ModuleSelectionCard
    │   ├─ mergedModules (from hook)
    │   ├─ enabledModules (state)
    │   └─ setEnabledModules (setter)
    │
    ├─→ EnvelopeSetupCard
    │   ├─ isEnabled (function)
    │   ├─ innerEnvelopes (state)
    │   ├─ setInnerEnvelopes (setter)
    │   ├─ outerEnvelopes (state)
    │   ├─ setOuterEnvelopes (setter)
    │   └─ envelopeOptions (from hook)
    │
    ├─→ EnvelopeMakingCriteriaCard
    │   ├─ isEnabled (function)
    │   ├─ fields (from hook)
    │   ├─ selectedEnvelopeFields (state)
    │   └─ setSelectedEnvelopeFields (setter)
    │
    ├─→ ExtraProcessingCard
    │   ├─ isEnabled (function)
    │   ├─ extraTypes (from hook)
    │   ├─ extraTypeSelection (from hook)
    │   ├─ setExtraTypeSelection (from hook)
    │   ├─ extraProcessingConfig (state)
    │   ├─ setExtraProcessingConfig (setter)
    │   └─ envelopeOptions (from hook)
    │
    ├─→ BoxBreakingCard
    │   ├─ isEnabled (function)
    │   ├─ boxBreakingCriteria (state)
    │   ├─ setBoxBreakingCriteria (setter)
    │   ├─ fields (from hook)
    │   ├─ selectedBoxFields (state)
    │   └─ setSelectedBoxFields (setter)
    │
    └─→ ConfigSummaryCard
        ├─ enabledModules (state)
        ├─ envelopeConfigured (computed)
        ├─ boxConfigured (computed)
        ├─ extraConfigured (computed)
        ├─ handleSave (from hook)
        └─ projectId (from store)
```

## File Dependencies

```
ProjectConfiguration.jsx
    │
    ├── Imports from Ant Design
    │   └── Row, Col
    │
    ├── Imports from hooks
    │   ├── useToast (../hooks/useToast)
    │   ├── useStore (../stores/ProjectData)
    │   ├── useProjectConfigData (./hooks/useProjectConfigData)
    │   └── useProjectConfigSave (./hooks/useProjectConfigSave)
    │
    ├── Imports from components
    │   ├── ModuleSelectionCard
    │   ├── EnvelopeSetupCard
    │   ├── EnvelopeMakingCriteriaCard
    │   ├── ExtraProcessingCard
    │   ├── BoxBreakingCard
    │   └── ConfigSummaryCard
    │
    └── Imports from constants
        └── EXTRA_ALIAS_NAME

Each Card Component
    │
    ├── Imports from Ant Design
    │   └── Card, Select, Typography, etc.
    │
    ├── Imports from @ant-design/icons
    │   └── Specific icons
    │
    ├── Imports from local
    │   ├── AnimatedCard
    │   └── constants (PRIMARY_COLOR, cardStyle, iconStyle)
    │
    └── Exports default component

Custom Hooks
    │
    ├── useProjectConfigData
    │   ├── Imports: useState, useEffect, useMemo
    │   ├── Imports: API (../../hooks/api)
    │   └── Imports: constants
    │
    └── useProjectConfigSave
        └── Imports: API (../../hooks/api)
```

## State Management Overview

### Local State (in ProjectConfiguration)
- `enabledModules` - Array of enabled module names
- `boxBreakingCriteria` - Array of box breaking criteria
- `innerEnvelopes` - Array of selected inner envelopes
- `outerEnvelopes` - Array of selected outer envelopes
- `extraProcessingConfig` - Object with extra type configurations
- `selectedEnvelopeFields` - Array of selected envelope fields
- `selectedBoxFields` - Array of selected box fields

### Hook State (in useProjectConfigData)
- `toolModules` - Raw module data from API
- `envelopeOptions` - Available envelope types
- `extraTypes` - Extra type configurations
- `fields` - Available fields
- `extraTypeSelection` - Selected mode for each extra type

### Global State (from Zustand store)
- `projectId` - Current project identifier

### Computed Values
- `mergedModules` - Processed module list (useMemo)
- `envelopeConfigured` - Boolean flag
- `boxConfigured` - Boolean flag
- `extraConfigured` - Boolean flag