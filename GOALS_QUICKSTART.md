# Goals & Caching Quick Start

## What's New?

### 🎯 Goal Setting & Tracking
Set daily targets and watch your progress in real-time with visual progress bars!

### 💾 Enhanced Data Persistence
All your data is now automatically saved and persists across sessions:
- ✅ Meal logs (foods you've eaten)
- ✅ Activity logs (workouts you've completed)
- ✅ Personal goals (your daily targets)
- ✅ User preferences (show/hide settings)

## Quick Demo

### Step 1: Set Your Goals
```
1. Open Dashboard
2. Scroll to "Daily Goals" section
3. Click "Edit Goals"
4. Enter your targets:
   - Calories: 2500
   - Protein: 180g
   - Carbs: 300g
   - Fats: 80g
   - Activity: 45 min
5. Click "Save Goals"
```

### Step 2: Track Your Progress
```
1. Log some meals (click the green + buttons)
2. Log some activities (visit Gym Dashboard)
3. Watch progress bars fill up in real-time
4. See percentage indicators (e.g., "75%")
5. Get achievement badges when you hit 100%!
```

### Step 3: Toggle Visibility
```
1. Check/uncheck "Show progress" in Daily Goals section
2. Progress bars appear/disappear instantly
3. Preference is saved automatically
```

## Visual Features

### Progress Bars
- **Yellow/Orange/Blue**: In progress (< 100%)
- **Green**: Goal achieved! (≥ 100%)
- **Mini bars**: Under each stat in Daily Totals
- **Full bars**: In Daily Goals section
- **Special widget**: Activity progress in Gym block

### Goal Cards
Each goal card shows:
- Target value (e.g., "2000" or "150g")
- Current value in parentheses (e.g., "(1500)")
- Full-width progress bar
- Color changes when goal is reached

### Achievement Indicators
When you hit a goal:
- Progress bar turns green
- "🎉 Goal achieved!" message appears
- Visual celebration in Gym block

## Data Persistence Details

### What Gets Saved?
| Data Type | Cookie Name | Example |
|-----------|-------------|---------|
| Meals | `boilerfuel_logs_v1` | `[{id: 123, foodId: 456, servings: 1.5, timestamp: "..."}]` |
| Activities | `boilerfuel_activity_logs_v1` | `[{id: 789, activityId: 101, duration: 30, timestamp: "..."}]` |
| Goals | `boilerfuel_goals_v1` | `{calories: 2000, protein: 150, ...}` |
| Preferences | `boilerfuel_user_prefs_v1` | `{showGoals: true}` |

### Cookie Lifespan
- **Duration**: 30 days
- **Auto-refresh**: Every time you update data
- **Privacy**: 100% local, never sent to server

### Testing Persistence
1. Log some meals and activities
2. Set custom goals
3. Close the browser completely
4. Reopen and navigate to dashboard
5. ✅ All your data is still there!

## Default Goals
If you haven't set goals yet, these defaults apply:
- **Calories**: 2000
- **Protein**: 150g
- **Carbs**: 250g
- **Fats**: 65g
- **Activity**: 30 min

## Tips & Tricks

### Realistic Goals
- Base calories on your TDEE (Total Daily Energy Expenditure)
- Protein: 0.7-1g per lb of body weight
- Adjust based on fitness goals (cut/maintain/bulk)

### Activity Goals
- Start small (15-20 min) if you're new to tracking
- Increase gradually as you build habits
- Mix cardio and strength training

### Data Management
- Use "Clear all logs" to reset everything
- Goals persist even if you clear logs
- Export important data before clearing (copy from browser dev tools)

## Browser DevTools (Advanced)
To view your stored data:
1. Press F12 to open DevTools
2. Go to "Application" or "Storage" tab
3. Navigate to "Cookies" → select your domain
4. Find cookies starting with `boilerfuel_`
5. Click to view JSON data

## Troubleshooting

### Goals not saving?
- Check browser allows cookies
- Ensure you clicked "Save Goals"
- Try clearing cache and setting again

### Progress bars not showing?
- Verify "Show progress" checkbox is enabled
- Log at least one meal or activity
- Refresh the page

### Data disappeared?
- Check cookie settings in browser
- Verify 30-day expiration hasn't passed
- Ensure not in private/incognito mode

## Coming Soon
Future enhancements we're considering:
- Weekly/monthly goal summaries
- Streak tracking (consecutive days)
- Goal templates (bulking, cutting, etc.)
- Charts and visualizations
- Data export to CSV/JSON

## Feedback
Have ideas for improving goals and tracking? Let us know!
