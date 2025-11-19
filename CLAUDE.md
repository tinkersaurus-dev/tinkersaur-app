# Claude AI Coding Guidelines

This document outlines coding standards and best practices for working with this codebase when using Claude AI or other AI assistants.

## React Hooks - Dependency Management

### Critical Rule: NEVER Disable `exhaustive-deps` Warnings

**The `react-hooks/exhaustive-deps` ESLint rule must NEVER be disabled.** This includes:

- ❌ `// eslint-disable react-hooks/exhaustive-deps`
- ❌ `// eslint-disable-next-line react-hooks/exhaustive-deps`
- ❌ `/* eslint-disable react-hooks/exhaustive-deps */`

Disabling this rule can lead to:
- **Stale closures** - Functions capturing outdated values
- **Missed updates** - Effects not re-running when they should
- **Subtle bugs** - Hard-to-debug issues that only appear in specific scenarios
- **Memory leaks** - Cleanup functions not being called properly

### Why This Rule Exists

React's exhaustive-deps rule ensures that all values used inside `useEffect`, `useCallback`, and `useMemo` hooks are properly declared as dependencies. This guarantees:

1. Effects re-run when their dependencies change
2. Memoized values are recalculated when inputs change
3. No stale closures capture outdated values
4. Cleanup functions work correctly

### Proper Solutions for Dependency Warnings

#### 1. **Zustand Store Functions** (Most Common in This Codebase)

When using Zustand store selectors, the returned functions are stable and should be included in dependency arrays:

```typescript
// ✅ CORRECT
export function useChanges(featureId: string | undefined) {
  const fetchChangesByFeature = useSolutionManagementEntityStore(
    (state) => state.fetchChangesByFeature
  );

  useEffect(() => {
    if (featureId) {
      fetchChangesByFeature(featureId);
    }
  }, [featureId, fetchChangesByFeature]); // Include the store function
}
```

```typescript
// ❌ INCORRECT - DO NOT DO THIS
useEffect(() => {
  if (featureId) {
    fetchChangesByFeature(featureId);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [featureId]); // Missing fetchChangesByFeature
```

#### 2. **Component Functions in useCallback/useMemo**

Functions defined in component bodies should be wrapped in `useCallback`:

```typescript
// ✅ CORRECT
const buildTreeData = useCallback((parentId?: string): TreeNode[] => {
  // Function body that uses designWorks and solutionId
  return designWorks.filter(dw => dw.solutionId === solutionId);
}, [designWorks, solutionId]); // Declare all dependencies

const treeData = useMemo(() => buildTreeData(), [buildTreeData]);
```

```typescript
// ❌ INCORRECT - DO NOT DO THIS
const buildTreeData = (parentId?: string): TreeNode[] => {
  return designWorks.filter(dw => dw.solutionId === solutionId);
};

// eslint-disable-next-line react-hooks/exhaustive-deps
const treeData = useMemo(() => buildTreeData(), [designWorks, solutionId]);
```

#### 3. **Extract Static Functions**

If a function doesn't use any component state or props, move it outside the component:

```typescript
// ✅ CORRECT - Move pure functions outside
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

function MyComponent({ items }: Props) {
  const total = useMemo(() => calculateTotal(items), [items]);
}
```

#### 4. **Use useCallback for Event Handlers**

Wrap event handlers that are used in dependency arrays:

```typescript
// ✅ CORRECT
const handleSubmit = useCallback(async (data: FormData) => {
  await submitForm(data);
}, [submitForm]);

useEffect(() => {
  // Effect that needs handleSubmit
}, [handleSubmit]);
```

#### 5. **Stable References from Props**

If props contain functions, ensure they're memoized in the parent component:

```typescript
// In parent component
const handleChange = useCallback((value: string) => {
  setValue(value);
}, []);

// In child component - now safe to use in dependencies
useEffect(() => {
  handleChange(someValue);
}, [someValue, handleChange]);
```

### Common Patterns in This Codebase

#### Data Fetching Hooks

All data fetching hooks follow this pattern:

```typescript
export function useFeatures(solutionId: string | undefined) {
  const allFeatures = useSolutionManagementEntityStore((state) => state.features);
  const fetchFeaturesBySolution = useSolutionManagementEntityStore(
    (state) => state.fetchFeaturesBySolution
  );

  useEffect(() => {
    if (solutionId) {
      fetchFeaturesBySolution(solutionId);
    }
  }, [solutionId, fetchFeaturesBySolution]); // Both dependencies required

  return { features: allFeatures, loading, error };
}
```

#### Tree Building Functions

Complex functions should use `useCallback`:

```typescript
const buildTree = useCallback((parentId?: string) => {
  // Complex logic using state values
  return processData(data, solutionId);
}, [data, solutionId]);

const tree = useMemo(() => buildTree(), [buildTree]);
```

### Debugging Dependency Issues

If you encounter dependency warnings:

1. **Read the warning carefully** - It tells you exactly what's missing
2. **Understand why it's needed** - Don't just disable it
3. **Choose the right fix**:
   - Add to dependency array (most common)
   - Wrap in `useCallback` (for functions)
   - Move outside component (for pure functions)
   - Use refs for values that shouldn't trigger re-renders

### When You Think You Need to Disable

If you believe disabling the rule is necessary:

1. **Stop** - It's almost never necessary
2. **Review** the patterns above
3. **Ask** for a code review
4. **Refactor** to follow proper patterns

### Additional Resources

- [React Hooks Rules](https://react.dev/reference/react/hooks#rules-of-hooks)
- [Zustand Best Practices](https://github.com/pmndrs/zustand#best-practices)
- [Exhaustive Deps Rule](https://github.com/facebook/react/issues/14920)

---

## Summary

**NEVER disable `react-hooks/exhaustive-deps`.** Always fix dependency issues properly using the patterns outlined above. This ensures code reliability, maintainability, and prevents subtle bugs.
