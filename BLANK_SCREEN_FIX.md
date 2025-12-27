# Blank Screen Troubleshooting

## Issue
App loads but shows a blank/white screen with no content.

## Quick Checks

### 1. Check Browser Console (F12)
**Most Important**: Open browser DevTools (F12) and check:
- **Console tab**: Look for red error messages
- **Network tab**: Check if any files failed to load (red entries)
- **Application tab** → **Service Workers**: Check if service worker is registered

### 2. Clear Browser Cache
1. Open DevTools (F12)
2. **Application tab** → **Storage** → **Clear site data**
3. **Application tab** → **Service Workers** → **Unregister** (if any)
4. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### 3. Check if New Build is Deployed
The workflow was updated to use base-href `/` instead of `/Starfox-cal/`. Verify:
1. Go to: https://github.com/rpretzer/Starfox-cal/actions
2. Check latest workflow run completed successfully
3. Wait 1-2 minutes after deployment for GitHub Pages to update

### 4. Test Direct File Access
Verify files are accessible:
- `https://calendar.rspmgmt.com/flutter.js` - Should load (not 404)
- `https://calendar.rspmgmt.com/main.dart.js` - Should load (not 404)
- `https://calendar.rspmgmt.com/index.html` - Should show HTML

## Common Causes

### Cause 1: Old Build Still Cached
**Symptom**: Blank screen, no console errors
**Fix**: Clear browser cache (see step 2 above)

### Cause 2: Service Worker Conflict
**Symptom**: Blank screen, old service worker registered
**Fix**: 
1. Open DevTools (F12)
2. Application tab → Service Workers
3. Click "Unregister" for any service workers
4. Clear site data
5. Refresh page

### Cause 3: JavaScript Error
**Symptom**: Console shows red errors
**Fix**: Check console errors and report them

### Cause 4: Initialization Timeout
**Symptom**: Stuck on "Initializing..." screen
**Fix**: 
- Check browser console for errors
- Check if IndexedDB is blocked (Settings → Privacy → Site settings)
- Try incognito/private browsing mode

### Cause 5: Wrong Base Href
**Symptom**: Files load but app doesn't initialize
**Fix**: 
- Verify workflow built with base-href `/`
- Check built index.html has `<base href="/">`
- Clear cache and retry

## Diagnostic Steps

### Step 1: Check Console Logs
Open browser console (F12) and look for:
- `[AppInit]` messages - Shows initialization progress
- `[StorageService]` messages - Shows storage initialization
- Any red error messages

### Step 2: Check Network Tab
1. Open DevTools (F12) → Network tab
2. Refresh page
3. Check for:
   - Failed requests (red entries)
   - Missing files (404 errors)
   - Slow loading files

### Step 3: Check Application Tab
1. Open DevTools (F12) → Application tab
2. Check:
   - **Service Workers**: Should be unregistered or working
   - **Storage** → **IndexedDB**: Should have Hive databases
   - **Local Storage**: Check for any stored data

### Step 4: Test in Incognito Mode
1. Open incognito/private browsing window
2. Navigate to `https://calendar.rspmgmt.com/`
3. If it works in incognito, it's a cache issue

## Expected Behavior

### Normal Initialization Flow
1. **Loading screen** appears immediately (white background, spinner, "Initializing...")
2. Console shows: `[AppInit] Starting initialization...`
3. Console shows: `[AppInit] Step 1: Initializing Hive...`
4. Console shows: `[AppInit] Step 2: Registering adapters...`
5. Console shows: `[AppInit] Step 3: Initializing storage service...`
6. Console shows: `[StorageService] Opening Hive boxes...`
7. **App loads** and shows calendar

### If Stuck
- After 5 seconds: Should show timeout message
- After 30 seconds: Should show error screen with details

## Still Not Working?

1. **Check browser console** (F12) - This is the most important step
2. **Take a screenshot** of the console errors
3. **Check the Network tab** for failed requests
4. **Try a different browser** (Chrome, Firefox, Safari)
5. **Check if JavaScript is enabled** in browser settings

## Recent Changes

The following improvements were made:
- ✅ Added timeout to prevent infinite hanging
- ✅ Better error messages in console
- ✅ 5-second fallback if initialization takes too long
- ✅ Always show something on screen (never completely blank)
- ✅ Fixed base-href from `/Starfox-cal/` to `/`

## Next Steps

1. **Clear browser cache** (most common fix)
2. **Check browser console** for errors
3. **Wait for new deployment** to complete (if workflow just ran)
4. **Try incognito mode** to rule out cache issues

