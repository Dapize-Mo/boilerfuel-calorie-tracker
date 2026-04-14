# Sync Feature Manual Testing Guide

## Test Scenario: Sync Between Two Browsers

This document provides step-by-step instructions to manually verify the sync feature works correctly after the fixes.

### Prerequisites
- Frontend dev server running on http://localhost:3000
- Two browser windows/tabs open

---

## Manual Test Steps

### Step 1: Open First Browser (Device A)
1. Open http://localhost:3000 in Browser Window 1
2. Navigate to the profile page: click Settings/Profile button
3. Look for "Device Sync" section

### Step 2: Create Sync Pair on Device A
1. Click "Create Sync Code" button
2. A sync code and secret key will appear
3. A QR code will also be displayed
4. **Record these values** for use on Device B

### Step 3: Add Test Data on Device A
1. Go to the home/tracker page
2. Add a test meal:
   - Example: "Test Breakfast" with ~300 calories
   - Wait 3 seconds for sync debounce
3. Verify in browser console:
   - Should see `[MealContext] Background push starting...`
   - Should see `[MealContext] Background push result: { pushed: true, ... }`

### Step 4: Open Second Browser (Device B)
1. Open http://localhost:3000 in Browser Window 2 (or different browser entirely)
2. Navigate to profile page

### Step 5: Join Sync Pair on Device B
1. Click "Join Existing" button
2. Enter the sync code from Device A
3. Enter the secret key from Device A
4. Click "Join"
5. **Expected result**: 
   - Device B should show "Paired and synced!"
   - Connected Devices section should show both Device A and Device B

### Step 6: Verify Data Transmitted from A to B
1. On Device B's home page, check the meals
2. **Expected**: The "Test Breakfast" meal added on Device A should appear
3. Check browser console for:
   - `[MealContext] doPull result: { changed: true, ... }`
   - Confirms data was pulled from server

### Step 7: Add Data on Device B
1. On Device B, add another meal:
   - Example: "Test Lunch" with ~600 calories
2. Wait 3 seconds for sync
3. Verify in console: `[MealContext] Background push result: { pushed: true, pulled: true, ... }`
   - The `pulled: true` means Device B pulled Device A's data before pushing

### Step 8: Verify Data Transmitted from B to A
1. Switch to Device A window
2. The page should auto-sync within 30 seconds (or click refresh)
3. **Expected**: "Test Lunch" meal from Device B should appear
4. Check console:
   - `[MealContext] doPull result: { changed: true, ... }`

---

## What the Fixes Enable

### Before Fixes
- Sync would get stuck returning "no changes"
- Device clocks going out of sync would break synchronization
- Type mismatches could cause API errors

### After Fixes
- Server timestamp is used as source of truth (prevents clock skew)
- Timestamps are safely compared (no type errors)
- Both devices receive each other's updates correctly
- Deduplication prevents duplicate meals

---

## Console Inspection Checklist

### Look for these successful patterns:

✅ **On Device A (Pusher):**
```
[MealContext] Background push starting...
[MealContext] Background push result: { pushed: true, ... }
[sync/pushData] Server had changes - decrypted keys: [...]
```

✅ **On Device B (Receiver):**
```
[MealContext] doPull result: { changed: true, ... }
[sync/pullData] Received: meals, goals, ...
```

✅ **No "no changes" loops:**
- Should NOT see: `[sync/pullData] Up to date — no new changes` repeatedly
- Each pull should either get new data or show updated timestamp

---

## Troubleshooting

### Issue: "Sync code not found"
- Make sure sync code is correctly entered on Device B
- Try creating a new code on Device A

### Issue: Device B not receiving meals from Device A
- Check browser console for errors
- Verify sync credentials are stored (check localStorage in DevTools)
- Try refreshing Device B page

### Issue: Meals appear then disappear
- This is the localStorage quota issue, not related to the fixes
- The merge logic protects against data loss (backups preserved)

---

## Technical Verification of Fixes

### Fix #1: Server Timestamp Used
**Location**: `frontend/utils/sync.js` line 186
```javascript
const { token, updated_at: serverTs } = await res.json();
localStorage.setItem(SYNC_LAST_PULL_KEY, String(serverTs || createdAt));
```
**Verification**: SYNC_LAST_PULL_KEY should contain server's timestamp, not client's

### Fix #2: Safe Timestamp Comparison
**Location**: `frontend/pages/api/sync.js` line 101-102
```javascript
const serverTs = Number.parseInt(String(row.updated_at), 10);
if (Number.isFinite(sinceNum) && Number.isFinite(serverTs) && sinceNum >= serverTs)
```
**Verification**: No type conversion errors in API responses

---

## Test Success Criteria

✅ All criteria must pass for sync to be considered working:

1. Device A can create a sync pair
2. Device B can join using A's code/secret
3. Meals from A appear on B after joining
4. Meals added on B appear on A
5. No "sync token not found" errors
6. No infinite "no changes" loops
7. Both devices show as "Connected" in the UI
8. Console logs show successful push/pull cycles

