# Extract organize-dashboard feature from pages layer

## Context

The Organize page (`src/pages/discovery/organize/`) contains a rules engine, data-transformation hook, domain types, and 6 tightly-coupled UI components that constitute business logic. In FSD, the pages layer should only compose lower layers — not define domain logic. This plan extracts all of it into `src/features/organize-dashboard/`.

---

## Source files being moved

| Current location | Destination |
|---|---|
| `pages/discovery/organize/rules.tsx` | `features/organize-dashboard/lib/rules.tsx` + `features/organize-dashboard/model/types.ts` |
| `pages/discovery/organize/useDashboardData.ts` | `features/organize-dashboard/lib/useDashboardData.ts` + types into `model/types.ts` |
| `pages/discovery/organize/components/DashboardBanner.tsx` | `features/organize-dashboard/ui/DashboardBanner.tsx` |
| `pages/discovery/organize/components/StatCard.tsx` | `features/organize-dashboard/ui/StatCard.tsx` |
| `pages/discovery/organize/components/QuickStatsStrip.tsx` | `features/organize-dashboard/ui/QuickStatsStrip.tsx` |
| `pages/discovery/organize/components/AttentionCard.tsx` | `features/organize-dashboard/ui/AttentionCard.tsx` |
| `pages/discovery/organize/components/AttentionGrid.tsx` | `features/organize-dashboard/ui/AttentionGrid.tsx` |
| `pages/discovery/organize/components/ActivityFeed.tsx` | `features/organize-dashboard/ui/ActivityFeed.tsx` |
| `pages/discovery/organize/components/index.ts` | `features/organize-dashboard/ui/index.ts` |

---

## Step-by-step implementation

### Step 1: Create `src/features/organize-dashboard/model/types.ts`

Consolidate all type/interface definitions from `rules.tsx` (lines 20-58) and `useDashboardData.ts` (lines 13-41) into one file. Keep the same imports from `@/entities/*` and `@tinkersaur/ui`.

**Types to extract from `rules.tsx`:**
- `EntityData` (lines 20-25)
- `RuleResultItem` (lines 27-32)
- `DashboardRuleResult` (lines 34-37)
- `DashboardRule` (lines 39-50)
- `StatConfig` (lines 52-58)

**Types to extract from `useDashboardData.ts`:**
- `EntityType` (line 13)
- `ActivityAction` (line 14)
- `ActivityItem` (lines 16-22)
- `RuleEvaluation` (lines 24-28)
- `StatEvaluation` (lines 30-34)
- `DashboardData` (lines 36-41)

**Imports needed:**
```ts
import type { ReactNode } from 'react';
import type { Persona } from '@/entities/persona';
import type { UserGoal } from '@/entities/user-goal';
import type { Feedback } from '@/entities/feedback';
import type { Outcome } from '@/entities/outcome';
import type { TagColor } from '@tinkersaur/ui';
```

### Step 2: Create `src/features/organize-dashboard/lib/rules.tsx`

Move `DASHBOARD_RULES` and `STAT_CONFIGS` from `pages/discovery/organize/rules.tsx`. Update type imports to point to `../model/types` instead of local definitions.

**Keep the same external imports:**
```ts
import { FEEDBACK_TYPE_CONFIG, FEEDBACK_TAG_COLORS, isUnlinkedFeedback } from '@/entities/feedback';
import { getDaysSinceUpdate, filterStalePersonas } from '@/entities/persona';
import { filterWeakEvidenceUserGoals } from '@/entities/user-goal';
import { filterUnlinkedOutcomes } from '@/entities/outcome';
import { PersonaIcon, UseCaseIcon, FeedbackIcon, OutcomeIcon } from '@/shared/ui';
```

**Change type imports to:**
```ts
import type { DashboardRule, DashboardRuleResult, StatConfig, EntityData } from '../model/types';
```

**Exports:** `DASHBOARD_RULES`, `STAT_CONFIGS` (same as before), and `MAX_PREVIEW_ITEMS` constant.

### Step 3: Create `src/features/organize-dashboard/lib/useDashboardData.ts`

Move `useDashboardData` hook and `getAction` helper from `pages/discovery/organize/useDashboardData.ts`.

**Change imports to:**
```ts
import type {
  EntityData,
  DashboardRule,
  DashboardRuleResult,
  RuleResultItem,
  StatConfig,
  ActivityItem,
  ActivityAction,
  RuleEvaluation,
  StatEvaluation,
  DashboardData,
} from '../model/types';
import { DASHBOARD_RULES, STAT_CONFIGS } from './rules';
```

Keep `useMemo` import from React. Keep constants `ONE_MINUTE_MS`, `SEVEN_DAYS_MS`, `MAX_ACTIVITY_ITEMS`.

### Step 4: Move UI components

Move all 6 component files from `pages/discovery/organize/components/` to `features/organize-dashboard/ui/`. Update internal imports:

**`QuickStatsStrip.tsx`** — change:
```ts
// FROM
import type { StatEvaluation } from '../useDashboardData';
// TO
import type { StatEvaluation } from '../model/types';
```

**`AttentionCard.tsx`** — change:
```ts
// FROM
import type { RuleResultItem } from '../rules';
// TO
import type { RuleResultItem } from '../model/types';
```

**`AttentionGrid.tsx`** — change:
```ts
// FROM
import type { RuleEvaluation } from '../useDashboardData';
// TO
import type { RuleEvaluation } from '../model/types';
```

**`ActivityFeed.tsx`** — change:
```ts
// FROM
import type { ActivityItem, EntityType, ActivityAction } from '../useDashboardData';
// TO
import type { ActivityItem, EntityType, ActivityAction } from '../model/types';
```

**`DashboardBanner.tsx`** and **`StatCard.tsx`** — no import changes needed (they only import from `react-router`, `react-icons`, and `@/shared/ui`).

### Step 5: Create `src/features/organize-dashboard/ui/index.ts`

Same barrel export as the old `components/index.ts`:
```ts
export { DashboardBanner } from './DashboardBanner';
export { StatCard } from './StatCard';
export { QuickStatsStrip } from './QuickStatsStrip';
export { AttentionCard } from './AttentionCard';
export { AttentionGrid } from './AttentionGrid';
export { ActivityFeed } from './ActivityFeed';
```

### Step 6: Create `src/features/organize-dashboard/index.ts`

Public API barrel:
```ts
// Types
export type {
  EntityData,
  DashboardRule,
  RuleResultItem,
  DashboardRuleResult,
  StatConfig,
  EntityType,
  ActivityAction,
  ActivityItem,
  RuleEvaluation,
  StatEvaluation,
  DashboardData,
} from './model/types';

// Logic
export { DASHBOARD_RULES, STAT_CONFIGS } from './lib/rules';
export { useDashboardData } from './lib/useDashboardData';

// UI
export {
  DashboardBanner,
  QuickStatsStrip,
  AttentionGrid,
  ActivityFeed,
  StatCard,
  AttentionCard,
} from './ui';
```

### Step 7: Update `src/pages/discovery/organize/page.tsx`

Replace the two local imports:
```ts
// FROM
import { useDashboardData } from './useDashboardData';
import {
  DashboardBanner,
  QuickStatsStrip,
  AttentionGrid,
  ActivityFeed,
} from './components';

// TO
import {
  useDashboardData,
  DashboardBanner,
  QuickStatsStrip,
  AttentionGrid,
  ActivityFeed,
} from '@/features/organize-dashboard';
```

No other changes to `page.tsx` — the hook signature and component props are unchanged.

### Step 8: Delete old files

- `src/pages/discovery/organize/rules.tsx`
- `src/pages/discovery/organize/useDashboardData.ts`
- `src/pages/discovery/organize/components/` (entire directory: 7 files)

---

## Verification

1. `npx tsc --noEmit` — no type errors
2. Dev server → navigate to `/discovery/organize` — dashboard renders identically (banner, stats strip, attention cards, activity feed)
3. Verify no remaining imports reference the deleted paths: `grep -r "organize/rules\|organize/useDashboardData\|organize/components" src/`
