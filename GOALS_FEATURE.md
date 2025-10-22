# Goals & Progress Tracking Feature

## Overview
The dashboard now includes comprehensive goal-setting and progress tracking functionality. All data is persisted locally using browser cookies, ensuring privacy and fast performance.

## Features

### 1. Daily Goals
Users can set personalized daily targets for:
- **Calories** (default: 2000)
- **Protein** (default: 150g)
- **Carbs** (default: 250g)
- **Fats** (default: 65g)
- **Activity Minutes** (default: 30 min)

### 2. Progress Tracking
- **Visual Progress Bars**: Real-time progress bars show current values vs. goals
- **Percentage Indicators**: Clear percentage display (e.g., "75%")
- **Color Coding**: 
  - Yellow/Blue bars = in progress
  - Green bars = goal achieved (≥100%)
- **Toggle Visibility**: Users can show/hide progress displays via checkbox

### 3. Data Persistence (Caching)
All user data is automatically saved to browser cookies:
- **Meals Log** (`boilerfuel_logs_v1`)
- **Activity Log** (`boilerfuel_activity_logs_v1`)
- **Goals** (`boilerfuel_goals_v1`)
- **User Preferences** (`boilerfuel_user_prefs_v1`)

Data persists for 30 days and survives page refreshes, browser restarts, and tab closures.

### 4. Goal Management UI
- **Edit Button**: Opens inline form to modify goals
- **Inline Form**: Clean, responsive form with 5 input fields
- **Save/Cancel**: Commit or discard changes
- **Real-time Updates**: Progress bars update instantly when goals change

## Usage

### Setting Goals
1. Navigate to the Dashboard
2. Scroll to the "Daily Goals" section below "Daily Totals"
3. Click "Edit Goals" button
4. Enter your target values for each metric
5. Click "Save Goals" to persist changes

### Viewing Progress
1. Toggle "Show progress" checkbox to enable/disable visual indicators
2. Progress bars appear in:
   - Daily Totals section (Calories In, Protein, Carbs)
   - Daily Goals section (all 5 metrics)
   - Gym block (Activity Minutes with special display)

### Progress Indicators
- **Daily Totals Stats**: Mini progress bars under each stat card
- **Goals Section**: Full width progress bars with current/goal values
- **Gym Block**: Dedicated activity goal widget with achievement badge

## Data Structure

### Goals Cookie Format
```json
{
  "calories": 2000,
  "protein": 150,
  "carbs": 250,
  "fats": 65,
  "activityMinutes": 30
}
```

### User Preferences Format
```json
{
  "showGoals": true
}
```

## Default Values
If no goals are set or the cookie is corrupted/expired:
- Calories: 2000
- Protein: 150g
- Carbs: 250g
- Fats: 65g
- Activity Minutes: 30 min

## Technical Details

### Cookie Management
- **Max Age**: 30 days
- **Path**: `/` (site-wide)
- **SameSite**: Lax (CSRF protection)
- **Encoding**: URL-encoded JSON

### Components
- `StatCard`: Displays current values with optional progress bars
- `GoalCard`: Shows goal targets with current progress
- Goals form: Inline editing interface with validation

### State Management
- Goals stored in React state + cookies
- User preferences synced on change
- Automatic cookie write on every update

## Browser Compatibility
Works in all modern browsers that support:
- ES6+ JavaScript
- Cookies
- CSS Grid/Flexbox
- CSS custom properties

## Privacy
- **100% Client-Side**: No server-side storage
- **Local Only**: Data never leaves the user's device
- **No Tracking**: No analytics or user identification
- **Clear Data**: Use "Clear all logs" button to reset everything

## Future Enhancements
Potential additions:
- Weekly/monthly goal summaries
- Streak tracking (consecutive days meeting goals)
- Goal history/charts
- Custom goal templates (bulking, cutting, maintenance)
- Export/import goals and logs
