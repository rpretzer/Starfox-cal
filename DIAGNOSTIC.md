# Diagnostic Guide for 404 Errors

## Current Issue
Files are returning 404 errors even though:
- ✅ GitHub Pages is enabled
- ✅ Workflow is completing successfully
- ✅ DNS is configured correctly

## Root Cause Analysis

The 404 errors suggest a **path mismatch** between:
1. Where files are deployed
2. Where the browser expects them

## Critical Check: Base Href vs. Actual URL

### Scenario A: Custom Domain at Root
If `calendar.rspmgmt.com` serves at the **root** (`/`):
- **Current base-href**: `/Starfox-cal/`
- **Files expected at**: `calendar.rspmgmt.com/Starfox-cal/flutter.js`
- **Files actually at**: `calendar.rspmgmt.com/flutter.js` ❌
- **Fix**: Change base-href to `/` in workflow

### Scenario B: Custom Domain at Subdirectory
If `calendar.rspmgmt.com` serves at `/Starfox-cal/`:
- **Current base-href**: `/Starfox-cal/` ✅
- **Files expected at**: `calendar.rspmgmt.com/Starfox-cal/flutter.js` ✅
- **Files actually at**: `calendar.rspmgmt.com/Starfox-cal/flutter.js` ✅
- **Status**: Should work (if files are deployed)

## How to Determine Your Setup

### Step 1: Check GitHub Pages Settings
1. Go to: https://github.com/rpretzer/Starfox-cal/settings/pages
2. Check **Custom domain** field:
   - If it shows: `calendar.rspmgmt.com` → Serves at root
   - If it shows: `calendar.rspmgmt.com/Starfox-cal/` → Serves at subdirectory

### Step 2: Test Direct File Access
Try accessing these URLs directly:

**Test Root Path:**
- `https://calendar.rspmgmt.com/flutter.js`
- `https://calendar.rspmgmt.com/index.html`

**Test Subdirectory Path:**
- `https://calendar.rspmgmt.com/Starfox-cal/flutter.js`
- `https://calendar.rspmgmt.com/Starfox-cal/index.html`

**Which one works?** That tells you where files are actually deployed.

### Step 3: Check Browser Console
Open browser console (F12) and check:
1. **Network tab**: See what URLs are being requested
2. **Console tab**: See error messages
3. **Application tab** → **Service Workers**: Check if service worker is registered

## Solutions

### Solution 1: If Files Are at Root
If `calendar.rspmgmt.com/flutter.js` works but `calendar.rspmgmt.com/Starfox-cal/flutter.js` doesn't:

**Update `.github/workflows/deploy_web.yml`:**
```yaml
- name: Build web
  run: flutter build web --release --base-href "/"
```

### Solution 2: If Files Are at Subdirectory
If `calendar.rspmgmt.com/Starfox-cal/flutter.js` works:

**Keep current base-href** (`/Starfox-cal/`) and verify:
1. Files are actually deployed (check GitHub Actions logs)
2. No caching issues (try incognito mode)
3. Service worker isn't blocking (clear service workers)

### Solution 3: Verify Deployment
Check if files are actually deployed:

1. **Check GitHub Actions**:
   - Go to: https://github.com/rpretzer/Starfox-cal/actions
   - Open latest "Deploy to GitHub Pages" run
   - Check "Verify build output" step
   - Should see ✅ for all files

2. **Check GitHub Pages**:
   - Go to: https://github.com/rpretzer/Starfox-cal/settings/pages
   - Check deployment status
   - Should show "Published" with green checkmark

3. **Check Actual Deployment**:
   - Visit: `https://rpretzer.github.io/Starfox-cal/flutter.js`
   - If this works, files are deployed correctly
   - If this doesn't work, deployment failed

## Common Issues

### Issue: Service Worker Caching
**Symptom**: Old version cached, new files not loading
**Fix**: 
1. Open browser DevTools (F12)
2. Application tab → Service Workers → Unregister
3. Application tab → Clear storage → Clear site data
4. Hard refresh (Ctrl+Shift+R)

### Issue: Base Href Mismatch
**Symptom**: 404s for all assets
**Fix**: Match base-href to actual URL structure (see Solutions above)

### Issue: Files Not Deployed
**Symptom**: 404s even on GitHub Pages URL
**Fix**: 
1. Check workflow logs for errors
2. Verify "Upload artifact" step succeeded
3. Re-run workflow if needed

## Next Steps

1. **Determine your URL structure** (Step 1-2 above)
2. **Apply the correct solution** (Solution 1 or 2)
3. **Verify deployment** (Solution 3)
4. **Test in incognito mode** (bypasses cache)
5. **Check browser console** for specific errors

## Quick Test Commands

```bash
# Test if files are at root
curl -I https://calendar.rspmgmt.com/flutter.js

# Test if files are at subdirectory
curl -I https://calendar.rspmgmt.com/Starfox-cal/flutter.js

# Test GitHub Pages URL
curl -I https://rpretzer.github.io/Starfox-cal/flutter.js
```

The HTTP status code will tell you:
- `200 OK` = File exists
- `404 Not Found` = File doesn't exist at that path
- `301/302` = Redirect (check Location header)

