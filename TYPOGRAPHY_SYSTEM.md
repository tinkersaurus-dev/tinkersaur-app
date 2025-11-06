# Typography System Documentation

## Overview

The Tinkersaur application includes a comprehensive typography theming system that works alongside the existing color theming. This system provides consistent, accessible, and scalable typography across the entire application with full dark mode support.

## Architecture

The typography system follows the same architectural pattern as the color theming:

- **CSS Variables** defined in `:root` for light mode and `[data-theme="dark"]` for dark mode
- **Tailwind CSS v4 integration** via the `@theme` directive
- **TypeScript types** for type-safe usage
- **Utility functions** for easy consumption in React components

## Typography Tokens

### Font Size Scale

Font sizes follow a consistent scale from xs to 6xl:

| Token | Size | Use Case |
|-------|------|----------|
| `--font-size-xs` | 12px | Caption text, metadata |
| `--font-size-sm` | 13px | Labels, small buttons |
| `--font-size-base` | 14px | Body text (default) |
| `--font-size-lg` | 16px | Large body text |
| `--font-size-xl` | 18px | Subheadings |
| `--font-size-2xl` | 20px | Small headings (h4) |
| `--font-size-3xl` | 24px | Medium headings (h3) |
| `--font-size-4xl` | 30px | Large headings (h2) |
| `--font-size-5xl` | 36px | Extra large headings (h1) |
| `--font-size-6xl` | 48px | Display text |

### Line Heights

Line heights provide appropriate spacing for different text densities:

| Token | Value | Use Case |
|-------|-------|----------|
| `--line-height-none` | 1 | Compact display text |
| `--line-height-tight` | 1.25 | Headings and titles |
| `--line-height-snug` | 1.375 | Subheadings |
| `--line-height-normal` | 1.5 | Body text (default) |
| `--line-height-relaxed` | 1.625 | Long-form content |
| `--line-height-loose` | 2 | Special emphasis |

### Font Weights

Font weights using Nunito Sans variable font capabilities:

| Token | Value | Use Case |
|-------|-------|----------|
| `--font-weight-light` | 300 | Light emphasis |
| `--font-weight-normal` | 400 | Body text (default) |
| `--font-weight-medium` | 500 | Labels, buttons |
| `--font-weight-semibold` | 600 | Subheadings, important UI |
| `--font-weight-bold` | 700 | Headings |
| `--font-weight-extrabold` | 800 | Display text |

### Letter Spacing

Letter spacing tokens for different text styles:

| Token | Value | Use Case |
|-------|-------|----------|
| `--letter-spacing-tighter` | -0.05em | Display text compression |
| `--letter-spacing-tight` | -0.025em | Headings |
| `--letter-spacing-normal` | 0em | Body text (default) |
| `--letter-spacing-wide` | 0.025em | Slightly open spacing |
| `--letter-spacing-wider` | 0.05em | Open spacing |
| `--letter-spacing-widest` | 0.1em | Overlines, uppercase labels |

## Typography Presets

### Headings (h1-h6)

Each heading level includes font-size, line-height, weight, and letter-spacing:

```css
/* Heading 1 - 36px, bold, tight spacing */
--typography-h1-size
--typography-h1-line-height
--typography-h1-weight
--typography-h1-letter-spacing

/* Heading 2 - 30px, bold, tight spacing */
--typography-h2-size
--typography-h2-line-height
--typography-h2-weight
--typography-h2-letter-spacing

/* ... h3 through h6 follow the same pattern */
```

### Body Text

Three body text variants for different contexts:

```css
/* Body Large - 16px, normal weight, relaxed line height */
--typography-body-lg-size
--typography-body-lg-line-height
--typography-body-lg-weight
--typography-body-lg-letter-spacing

/* Body Base - 14px, normal weight, normal line height (default) */
--typography-body-base-size
--typography-body-base-line-height
--typography-body-base-weight
--typography-body-base-letter-spacing

/* Body Small - 13px, normal weight, normal line height */
--typography-body-sm-size
--typography-body-sm-line-height
--typography-body-sm-weight
--typography-body-sm-letter-spacing
```

### UI Elements

Specialized presets for UI components:

```css
/* Label - 13px, medium weight, for form labels */
--typography-label-size
--typography-label-line-height
--typography-label-weight
--typography-label-letter-spacing

/* Caption - 12px, normal weight, for help text */
--typography-caption-size
--typography-caption-line-height
--typography-caption-weight
--typography-caption-letter-spacing

/* Overline - 12px, semibold, wider spacing, for section labels */
--typography-overline-size
--typography-overline-line-height
--typography-overline-weight
--typography-overline-letter-spacing

/* Button - 14px, medium weight, for button text */
--typography-button-size
--typography-button-line-height
--typography-button-weight
--typography-button-letter-spacing
```

### Display Typography

Large, prominent text for hero sections:

```css
/* Display Large - 48px, extrabold, tighter spacing */
--typography-display-lg-size
--typography-display-lg-line-height
--typography-display-lg-weight
--typography-display-lg-letter-spacing

/* Display Medium - 36px, bold, tight spacing */
--typography-display-md-size
--typography-display-md-line-height
--typography-display-md-weight
--typography-display-md-letter-spacing
```

## Usage Examples

### Using Individual Tokens

```tsx
// Using individual font size tokens
<div className="text-[var(--font-size-lg)]">
  Large text
</div>

// Combining multiple tokens
<div className="text-[var(--font-size-base)] leading-[var(--line-height-relaxed)] font-[var(--font-weight-medium)]">
  Custom styled text
</div>
```

### Using Typography Presets

```tsx
// Using a heading preset
<h1 className="text-[var(--typography-h1-size)] leading-[var(--typography-h1-line-height)] font-[var(--typography-h1-weight)] tracking-[var(--typography-h1-letter-spacing)]">
  Page Title
</h1>

// Using body text preset
<p className="text-[var(--typography-body-base-size)] leading-[var(--typography-body-base-line-height)]">
  This is body text using the default preset.
</p>
```

### Using TypeScript Helper Functions

```tsx
import { getTypographyClasses, buildTypographyClasses } from '~/core/theme/typography';

// Apply a complete preset
<div className={getTypographyClasses('h1')}>
  Heading with all typography properties
</div>

// Build custom typography
<div className={buildTypographyClasses({
  size: 'lg',
  weight: 'bold',
  lineHeight: 'tight'
})}>
  Custom typography combination
</div>
```

### Using Inline Styles

```tsx
import { getTypographyStyles } from '~/core/theme/typography';

<div style={getTypographyStyles('h2')}>
  Heading with inline styles
</div>
```

## Dark Mode

The typography system includes automatic dark mode adjustments:

### Letter Spacing Adjustments

In dark mode, certain letter spacing values are slightly increased for better readability on dark backgrounds:

```css
[data-theme="dark"] {
  --letter-spacing-normal: 0.01em;    /* from 0em */
  --letter-spacing-wide: 0.035em;     /* from 0.025em */
  --letter-spacing-wider: 0.06em;     /* from 0.05em */
}
```

These subtle adjustments improve text legibility in dark mode without requiring manual overrides.

## Component Integration

### Updated Components

The following core components have been updated to use typography tokens:

- **Button** - Uses `--typography-button-*` tokens for text sizing
- **Input/TextArea** - Uses `--typography-body-base-*` for consistent input text
- **Modal** - Title uses `--typography-h5-*`, buttons use `--typography-button-*`
- **Card** - Title uses `--typography-h6-*`
- **Tag** - Uses `--typography-caption-*` for compact sizing

### Component Example

Here's how the Button component uses typography tokens:

```tsx
const sizeStyles = {
  small: 'text-[var(--font-size-sm)] leading-[var(--line-height-normal)] font-[var(--font-weight-medium)]',
  medium: 'text-[var(--typography-button-size)] leading-[var(--typography-button-line-height)] font-[var(--typography-button-weight)]',
  large: 'text-[var(--font-size-lg)] leading-[var(--line-height-normal)] font-[var(--font-weight-medium)]',
};
```

## Best Practices

### 1. Use Presets When Possible

Prefer typography presets over individual tokens for consistency:

```tsx
// Good - uses preset
<h1 className={getTypographyClasses('h1')}>Title</h1>

// Less ideal - manual token combination
<h1 className="text-[var(--font-size-5xl)] font-[var(--font-weight-bold)]">Title</h1>
```

### 2. Semantic HTML

Use appropriate HTML elements with typography presets:

```tsx
// Good - semantic HTML with appropriate styling
<h2 className="text-[var(--typography-h2-size)] ...">Section Title</h2>

// Avoid - div used as heading
<div className="text-[var(--typography-h2-size)] ...">Section Title</div>
```

### 3. Consistent Body Text

Use body presets for all paragraph content:

```tsx
<p className="text-[var(--typography-body-base-size)] leading-[var(--typography-body-base-line-height)]">
  Standard paragraph text
</p>
```

### 4. UI Elements

Use specialized UI presets for form labels, captions, etc.:

```tsx
<label className="text-[var(--typography-label-size)] font-[var(--typography-label-weight)]">
  Form Label
</label>

<span className="text-[var(--typography-caption-size)] text-[var(--text-muted)]">
  Help text
</span>
```

## Testing

### Visual Testing

Visit `/demo` to see all typography styles:

- Font size scale demonstration
- Heading hierarchy (h1-h6)
- Body text variants
- UI element typography
- Display typography
- Font weights
- Line heights
- Letter spacing
- Dark mode comparison

### Theme Switching

Toggle between light and dark modes using the theme switcher to verify:

- Letter spacing adjustments apply correctly
- All typography remains readable
- No layout shifts occur

## Accessibility Considerations

1. **Minimum Font Sizes**: The smallest font size (`--font-size-xs`: 12px) meets WCAG 2.1 requirements
2. **Line Height**: Default line heights provide sufficient spacing for readability
3. **Contrast**: Typography tokens work with color system to maintain proper contrast ratios
4. **Scalability**: All tokens use px values that scale appropriately with browser zoom

## File Locations

- **CSS Variables**: `app/app.css` (lines 134-247 for :root, 305-308 for dark mode)
- **Tailwind Integration**: `app/app.css` (lines 70-104 in @theme block)
- **TypeScript Types**: `app/core/theme/typography.types.ts`
- **Utility Functions**: `app/core/theme/typography.ts`
- **Demo**: `app/routes/demo.tsx` (Typography System section)
- **Component Updates**:
  - `app/core/components/ui/Button/Button.tsx`
  - `app/core/components/ui/Input/Input.tsx`
  - `app/core/components/ui/Modal/Modal.tsx`
  - `app/core/components/ui/Card/Card.tsx`
  - `app/core/components/ui/Tag/Tag.tsx`

## Future Enhancements

Potential additions to the typography system:

1. **Responsive Typography**: Add breakpoint-specific font sizes
2. **Additional Presets**: Code blocks, blockquotes, etc.
3. **Font Family Tokens**: Support for multiple font families
4. **Custom Tailwind Utilities**: Shorthand classes like `typography-h1`
5. **Theme Variants**: Alternative typography scales for different contexts
