# Migration Guide

## Overview
This guide helps you understand the changes made to the ProjectConfiguration component and how to work with the new structure.

## What Changed?

### Before (Single File)
```jsx
// ProjectConfiguration.jsx (765 lines)
import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Select, Checkbox, ... } from "antd";
// ... 30+ imports
// ... 15+ state variables
// ... 5+ useEffect hooks
// ... 700+ lines of JSX

const ProjectConfiguration = () => {
  // All logic and UI in one place
};
```

### After (Modular Structure)
```jsx
// ProjectConfiguration.jsx (137 lines)
import React, { useState } from "react";
import { Row, Col } from "antd";
import { useProjectConfigData } from "./hooks/useProjectConfigData";
import { useProjectConfigSave } from "./hooks/useProjectConfigSave";
import ModuleSelectionCard from "./components/ModuleSelectionCard";
// ... other component imports

const ProjectConfiguration = () => {
  // Clean, organized, easy to read
};
```

## No Breaking Changes

✅ **The component interface remains exactly the same**
- Same import path: `import ProjectConfiguration from './ProjectConfig/ProjectConfiguration'`
- Same behavior and functionality
- No prop changes required
- No parent component modifications needed

## New File Structure

```
ProjectConfig/
├── ProjectConfiguration.jsx          # Main component (entry point)
├── components/                        # UI components
│   ├── AnimatedCard.jsx
│   ├── ModuleSelectionCard.jsx
│   ├── EnvelopeSetupCard.jsx
│   ├── EnvelopeMakingCriteriaCard.jsx
│   ├── ExtraProcessingCard.jsx
│   ├── BoxBreakingCard.jsx
│   ├── ConfigSummaryCard.jsx
│   ├── constants.js
│   └── index.js
├── hooks/                             # Custom hooks
│   ├── useProjectConfigData.js
│   └── useProjectConfigSave.js
└── Documentation files
```

## How to Work with the New Structure

### 1. Modifying UI Components

**Example: Change the Module Selection Card**

```jsx
// Edit: components/ModuleSelectionCard.jsx
import React from "react";
import { Card, Checkbox, Typography } from "antd";
import { ToolOutlined } from "@ant-design/icons";
import AnimatedCard from "./AnimatedCard";
import { cardStyle, iconStyle } from "./constants";

const ModuleSelectionCard = ({ mergedModules, enabledModules, setEnabledModules }) => {
  return (
    <AnimatedCard>
      <Card style={cardStyle} title={/* ... */}>
        {/* Your changes here */}
      </Card>
    </AnimatedCard>
  );
};

export default ModuleSelectionCard;
```

### 2. Modifying Data Fetching Logic

**Example: Add a new API call**

```jsx
// Edit: hooks/useProjectConfigData.js
export const useProjectConfigData = (token) => {
  const [newData, setNewData] = useState([]);
  
  // Add new useEffect for your API call
  useEffect(() => {
    API
      .get(`/YourNewEndpoint`)
      .then((res) => setNewData(res.data))
      .catch((err) => console.error("Failed to fetch", err));
  }, [token]);

  return {
    // ... existing returns
    newData, // Add to return object
  };
};
```

### 3. Modifying Save Logic

**Example: Add additional save operation**

```jsx
// Edit: hooks/useProjectConfigSave.js
export const useProjectConfigSave = (/* params */) => {
  const handleSave = async () => {
    try {
      // Existing save operations
      await API.post(`/ProjectConfigs`, projectConfigPayload);
      
      // Add your new save operation
      await API.post(`/YourNewEndpoint`, yourPayload);
      
      showToast("Configuration saved successfully!", "success");
    } catch (err) {
      console.error("Failed to save", err);
      showToast("Failed to save configuration", "error");
    }
  };

  return { handleSave };
};
```

### 4. Adding a New Configuration Card

**Step 1: Create the component**

```jsx
// Create: components/YourNewCard.jsx
import React from "react";
import { Card, Typography } from "antd";
import AnimatedCard from "./AnimatedCard";
import { cardStyle, iconStyle } from "./constants";

const YourNewCard = ({ yourProp, setYourProp }) => {
  return (
    <AnimatedCard>
      <Card style={cardStyle} title="Your New Configuration">
        {/* Your UI here */}
      </Card>
    </AnimatedCard>
  );
};

export default YourNewCard;
```

**Step 2: Add to main component**

```jsx
// Edit: ProjectConfiguration.jsx
import YourNewCard from "./components/YourNewCard";

const ProjectConfiguration = () => {
  const [yourState, setYourState] = useState(initialValue);
  
  return (
    <div style={{ padding: 16 }}>
      <Row gutter={16} align="top">
        <Col xs={24} md={16}>
          {/* Existing cards */}
          <YourNewCard yourProp={yourState} setYourProp={setYourState} />
        </Col>
      </Row>
    </div>
  );
};
```

### 5. Modifying Shared Constants

**Example: Change colors or styles**

```jsx
// Edit: components/constants.js
export const PRIMARY_COLOR = "#1677ff"; // Change this
export const SECONDARY_COLOR = "#52c41a"; // Add new constant

export const cardStyle = { 
  marginBottom: 16, 
  border: '1px solid #d9d9d9', 
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  // Add new styles
};
```

## Common Tasks

### Task: Add a new field to a card

1. Open the specific card component file
2. Add the new field to the JSX
3. If needed, add new props to the component
4. Update the parent component to pass the new props

### Task: Change animation behavior

1. Open `components/AnimatedCard.jsx`
2. Modify the framer-motion properties
3. All cards will automatically use the new animation

### Task: Add validation before save

1. Open `hooks/useProjectConfigSave.js`
2. Add validation logic in the `handleSave` function
3. Return early if validation fails

### Task: Add loading states

1. Add loading state in `hooks/useProjectConfigData.js`
2. Return loading state from the hook
3. Pass loading state to components
4. Show loading indicators in components

## Testing Strategy

### Unit Testing Components

```jsx
// Example: ModuleSelectionCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ModuleSelectionCard from './ModuleSelectionCard';

describe('ModuleSelectionCard', () => {
  it('renders module list', () => {
    const modules = [{ id: 1, name: 'Test Module', description: 'Test' }];
    render(
      <ModuleSelectionCard 
        mergedModules={modules}
        enabledModules={[]}
        setEnabledModules={jest.fn()}
      />
    );
    expect(screen.getByText('Test Module')).toBeInTheDocument();
  });
});
```

### Testing Custom Hooks

```jsx
// Example: useProjectConfigData.test.js
import { renderHook } from '@testing-library/react-hooks';
import { useProjectConfigData } from './useProjectConfigData';

describe('useProjectConfigData', () => {
  it('fetches data on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useProjectConfigData('test-token')
    );
    
    await waitForNextUpdate();
    
    expect(result.current.toolModules).toBeDefined();
  });
});
```

## Troubleshooting

### Issue: Component not rendering
**Solution**: Check that all required props are being passed from the parent component.

### Issue: State not updating
**Solution**: Verify that setter functions are correctly passed and called.

### Issue: API calls failing
**Solution**: Check the custom hooks and ensure the token is being passed correctly.

### Issue: Styles not applying
**Solution**: Ensure you're importing from `constants.js` and not defining inline styles.

## Best Practices

### 1. Keep Components Pure
```jsx
// ✅ Good: Pure component
const MyCard = ({ data, onChange }) => {
  return <Card>{/* Use props */}</Card>;
};

// ❌ Bad: Component with side effects
const MyCard = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    // API call inside component
  }, []);
  return <Card>{/* ... */}</Card>;
};
```

### 2. Use Custom Hooks for Logic
```jsx
// ✅ Good: Logic in custom hook
const useMyData = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  return data;
};

// ❌ Bad: Logic in component
const MyComponent = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  // ...
};
```

### 3. Centralize Constants
```jsx
// ✅ Good: Import from constants
import { PRIMARY_COLOR, cardStyle } from './constants';

// ❌ Bad: Inline values
const style = { color: '#1677ff', marginBottom: 16 };
```

### 4. Consistent Naming
```jsx
// ✅ Good: Clear, descriptive names
const EnvelopeSetupCard = ({ innerEnvelopes, setInnerEnvelopes }) => {};

// ❌ Bad: Unclear names
const Card2 = ({ data, setData }) => {};
```

## Performance Optimization

### Use React.memo for Pure Components
```jsx
import React, { memo } from 'react';

const ModuleSelectionCard = memo(({ mergedModules, enabledModules, setEnabledModules }) => {
  // Component code
});

export default ModuleSelectionCard;
```

### Use useCallback for Event Handlers
```jsx
const handleSave = useCallback(async () => {
  // Save logic
}, [dependencies]);
```

## Getting Help

- Check the `README.md` for component documentation
- Review `COMPONENT_TREE.md` for structure overview
- See `REFACTORING_SUMMARY.md` for detailed changes
- Look at existing components for examples

## Future Enhancements

Consider these improvements:
1. Add TypeScript for type safety
2. Implement error boundaries
3. Add comprehensive unit tests
4. Create Storybook stories
5. Add form validation
6. Implement optimistic updates
7. Add undo/redo functionality