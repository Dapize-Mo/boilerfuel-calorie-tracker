# BoilerFuel Design System

> **Modern • Clean • Accessible**  
> Design system documentation for the redesigned BoilerFuel calorie tracking app

---

## 🎨 Color System

### Theme Colors (CSS Variables)

Our color system uses CSS variables for seamless light/dark mode transitions:

```css
/* Light Mode */
--color-bg-primary: 248 250 252;      /* slate-50 - Main background */
--color-bg-secondary: 255 255 255;    /* white - Cards */
--color-bg-tertiary: 241 245 249;     /* slate-100 - Inputs */
--color-text-primary: 15 23 42;       /* slate-900 - Headings */
--color-text-secondary: 51 65 85;     /* slate-700 - Body text */
--color-accent-primary: 234 179 8;    /* yellow-500 - CTAs */

/* Dark Mode */
--color-bg-primary: 10 10 10;         /* near-black */
--color-bg-secondary: 23 23 23;       /* neutral-900 */
--color-bg-tertiary: 38 38 38;        /* neutral-800 */
--color-text-primary: 250 250 250;    /* neutral-50 */
--color-text-secondary: 163 163 163;  /* neutral-400 */
--color-accent-primary: 250 204 21;   /* yellow-400 */
```

### Usage in Tailwind

```jsx
// Background
<div className="bg-theme-bg-primary" />
<div className="bg-theme-card-bg" />

// Text
<p className="text-theme-text-primary" />
<p className="text-theme-text-secondary" />

// Borders
<div className="border-theme-border-primary" />

// Accent
<button className="bg-theme-accent" />
```

### Semantic Colors

- **Success**: `green-500` (#22C55E) - Goal completion, positive actions
- **Error**: `red-500` (#EF4444) - Warnings, deletions
- **Info**: `blue-500` (#3B82F6) - Information, tips
- **Warning**: `yellow-500` (#EAB308) - Cautions, near-limits

### Gradients

```css
/* Warm (Primary Actions) */
.gradient-warm: from-primary-500 to-secondary-500

/* Cool (Information) */
.gradient-cool: from-blue-500 to-purple-500

/* Success */
.gradient-success: from-green-500 to-emerald-500
```

---

## 📐 Typography

### Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

### Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| Display | 5xl-6xl (48-60px) | 700-800 | 1.1 | Hero headings |
| H1 | 4xl (36px) | 700 | 1.2 | Page titles |
| H2 | 2xl (24px) | 600 | 1.3 | Section headers |
| H3 | xl (20px) | 600 | 1.4 | Card titles |
| Body | base (16px) | 400 | 1.6 | Body text |
| Small | sm (14px) | 400 | 1.5 | Captions, meta |
| Tiny | xs (12px) | 500 | 1.4 | Labels, badges |

### Examples

```jsx
{/* Display */}
<h1 className="text-5xl font-bold text-theme-text-primary">Today</h1>

{/* Section Header */}
<h2 className="text-2xl font-semibold text-theme-text-primary">Recent Meals</h2>

{/* Card Title */}
<h3 className="text-xl font-semibold">Daily Summary</h3>

{/* Body Text */}
<p className="text-base text-theme-text-secondary">Track your nutrition...</p>
```

---

## 📏 Spacing

### 8-Point Grid System

All spacing uses multiples of 4px (0.25rem):

| Token | Value | Usage |
|-------|-------|-------|
| 1 | 4px | Tight margins |
| 2 | 8px | Icon gaps |
| 3 | 12px | Text spacing |
| 4 | 16px | Default gap |
| 6 | 24px | Card padding |
| 8 | 32px | Section spacing |
| 12 | 48px | Large gaps |
| 16 | 64px | Hero spacing |

### Layout Containers

```jsx
/* Page Container */
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />

/* Card Padding */
<div className="p-6 lg:p-8" />

/* Section Spacing */
<div className="space-y-8" />
```

---

## 🎯 Components

### Cards

```jsx
/* Standard Card */
<div className="bg-theme-card-bg border border-theme-card-border rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-shadow">
  {/* Content */}
</div>

/* Bento Grid Item */
<div className="lg:col-span-2 lg:row-span-2 bg-theme-card-bg border border-theme-card-border rounded-3xl p-8">
  {/* Large card content */}
</div>
```

### Buttons

```jsx
/* Primary Button */
<button className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
  Click Me
</button>

/* Secondary Button */
<button className="px-6 py-3 bg-theme-bg-tertiary border border-theme-border-primary rounded-xl hover:bg-theme-bg-hover transition-colors">
  Cancel
</button>

/* Icon Button */
<button className="p-2 hover:bg-theme-bg-hover rounded-lg transition-colors">
  <IconComponent className="w-5 h-5" />
</button>
```

### Inputs

```jsx
/* Text Input */
<input 
  type="text"
  className="px-4 py-2 bg-theme-card-bg border border-theme-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-theme-accent"
/>

/* Date Picker */
<input 
  type="date"
  className="px-4 py-2 bg-theme-card-bg border border-theme-card-border rounded-xl text-theme-text-primary"
/>
```

### Progress Indicators

```jsx
import ProgressRing from '../components/ProgressRing';

<ProgressRing 
  value={150}
  max={200}
  size={140}
  strokeWidth={10}
  color="stroke-red-500"
  label="Protein"
  unit="g"
/>
```

### Toast Notifications

```jsx
import { useToast } from '../components/ToastContainer';

const toast = useToast();

toast.success('Meal logged successfully!');
toast.error('Failed to save changes');
toast.info('Tip: Use voice input for faster logging');
toast.warning('You\'re near your calorie goal');
```

### Bottom Sheets (Mobile Modals)

```jsx
import BottomSheet from '../components/BottomSheet';

<BottomSheet 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)} 
  title="Quick Log Meal"
  size="md" // 'sm' | 'md' | 'lg' | 'full'
>
  {/* Sheet content */}
</BottomSheet>
```

### Command Palette

```jsx
import CommandPalette from '../components/CommandPalette';

{/* Add to _app.js - triggers with Cmd/Ctrl+K */}
<CommandPalette />
```

---

## 🎬 Animations

### Framer Motion Patterns

```jsx
import { motion } from 'framer-motion';

/* Fade In */
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

/* Slide Up */
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
  Content
</motion.div>

/* Scale In */
<motion.div
  initial={{ scale: 0.95, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ type: 'spring', damping: 25 }}
>
  Content
</motion.div>

/* Hover Scale */
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click Me
</motion.button>
```

### Tailwind Animations

```jsx
/* Fade In */
<div className="animate-fade-in" />

/* Slide Up */
<div className="animate-slide-up" />

/* Bounce (Subtle) */
<div className="animate-bounce-subtle" />

/* Floating */
<div className="animate-floating" />

/* Shimmer (Loading) */
<div className="relative overflow-hidden animate-shimmer" />

/* Spin (Loading) */
<div className="animate-spin" />
```

### Celebration Effects

```jsx
import confetti from 'canvas-confetti';

// Goal completion celebration
confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
});
```

---

## 📱 Responsive Design

### Breakpoints

```javascript
sm: 640px   // Large phones
md: 768px   // Tablets
lg: 1024px  // Laptops
xl: 1280px  // Desktops
2xl: 1536px // Large displays
```

### Mobile-First Approach

```jsx
{/* Mobile: Stack vertically, Desktop: 4 columns */}
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  {/* Cards */}
</div>

{/* Hide on mobile, show on desktop */}
<div className="hidden lg:block">Desktop Only</div>

{/* Show on mobile, hide on desktop */}
<div className="lg:hidden">Mobile Only</div>

{/* Responsive text size */}
<h1 className="text-4xl lg:text-5xl">Heading</h1>
```

### Mobile Navigation

- **< 768px**: Bottom navigation bar (5 icons)
- **≥ 768px**: Sidebar navigation (always visible)

```jsx
import BottomNav from '../components/BottomNav';

{/* Automatically hidden on desktop */}
<BottomNav />
```

---

## ♿ Accessibility

### Focus States

All interactive elements have visible focus indicators:

```jsx
<button className="focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2">
  Click Me
</button>
```

### Keyboard Navigation

- **Tab**: Navigate between elements
- **Enter**: Activate buttons/links
- **Escape**: Close modals/sheets
- **Cmd/Ctrl+K**: Open command palette
- **Arrow Keys**: Navigate command palette

### ARIA Labels

```jsx
{/* Icon-only button */}
<button aria-label="Delete meal">
  <TrashIcon />
</button>

{/* Progress indicator */}
<div role="progressbar" aria-valuenow={75} aria-valuemin={0} aria-valuemax={100}>
  {/* Progress bar */}
</div>

{/* Modal */}
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Modal Title</h2>
</div>
```

### Reduced Motion

Respects user's `prefers-reduced-motion` setting:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Color Contrast

- **AAA Standard**: 7:1 for normal text
- **AA Standard**: 4.5:1 for large text (18px+)
- All text meets WCAG guidelines in both light and dark modes

---

## 🎯 Layout Patterns

### Bento Grid (Dashboard)

```jsx
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  {/* Large card: 2x2 */}
  <div className="lg:col-span-2 lg:row-span-2">
    {/* Daily Summary */}
  </div>
  
  {/* Small cards: 1x1 */}
  <div>{/* Protein ring */}</div>
  <div>{/* Carbs ring */}</div>
  <div>{/* Fats ring */}</div>
  <div>{/* Water tracker */}</div>
</div>
```

### Two-Column Content

```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div>{/* Recent Meals */}</div>
  <div>{/* Recent Activities */}</div>
</div>
```

### Quick Actions Grid

```jsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <button>{/* Log Meal */}</button>
  <button>{/* Voice Log */}</button>
  <button>{/* Quick Workout */}</button>
  <button>{/* Browse Menu */}</button>
</div>
```

---

## 🌓 Dark Mode

### Implementation

Dark mode is managed via `ThemeContext` and uses the `dark` class on the `<html>` element:

```jsx
import { useTheme } from '../utils/ThemeContext';

const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark' | 'system'
```

### Testing

Always test components in both light and dark modes:

```bash
# Toggle via theme button in UI
# or via browser DevTools: document.documentElement.classList.toggle('dark')
```

---

## 🚀 Performance

### Optimization Techniques

1. **React.memo()** - Prevent unnecessary re-renders
2. **useMemo()** - Memoize expensive calculations
3. **useCallback()** - Stable function references
4. **Code Splitting** - Dynamic imports for heavy components
5. **Image Optimization** - Use next/image for photos

### Example

```jsx
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => {
    return expensiveOperation(data);
  }, [data]);
  
  const handleClick = useCallback(() => {
    doSomething(processedData);
  }, [processedData]);
  
  return <div onClick={handleClick}>{/* ... */}</div>;
});
```

---

## 📦 Component Library

### Created Components

- ✅ **BottomSheet** - Mobile-first modal
- ✅ **CommandPalette** - Cmd+K universal search
- ✅ **ToastContainer** - Notifications system
- ✅ **BottomNav** - Mobile bottom navigation
- ✅ **ProgressRing** - Circular progress indicator
- ✅ **VoiceInput** - Speech recognition UI
- ✅ **EmptyState** - Placeholder with CTA
- ✅ **WaterTracker** - (Existing, integrated)
- ✅ **StreakTracker** - (Existing, integrated)

### Usage Pattern

```jsx
// Import at top of file
import ComponentName from '../components/ComponentName';

// Use in JSX
<ComponentName 
  prop1="value1"
  prop2={value2}
  onAction={() => handleAction()}
/>
```

---

## 🛠️ Development Workflow

### Running the App

```bash
cd frontend
npm install
npm run dev
# Opens on http://localhost:3000
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## 📚 Resources

### Design Inspiration

- [Linear](https://linear.app) - Clean, fast interface
- [Notion](https://notion.so) - Flexible layouts
- [Arc](https://arc.net) - Modern aesthetic

### Documentation

- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Headless UI](https://headlessui.com/)

### Accessibility

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

**Last Updated**: February 12, 2026  
**Version**: 2.0.0  
**Maintained by**: BoilerFuel Team
