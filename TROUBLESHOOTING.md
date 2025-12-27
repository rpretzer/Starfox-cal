# Troubleshooting 404 Errors

## Current Issue
Files are returning 404 errors:
- `flutter.js` - 404
- `manifest.json` - 404

This means **the files are not deployed to GitHub Pages yet**.

## Root Cause
The GitHub Actions workflow needs to run and deploy the files. The workflow is configured but may not have run yet.

## Solution Steps

### Step 1: Verify GitHub Pages is Enabled
1. Go to: https://github.com/rpretzer/Starfox-cal/settings/pages
2. Check:
   - **Source**: Must be **"GitHub Actions"** (NOT "Deploy from a branch")
   - **Custom domain**: Should show `calendar.rspmgmt.com`
   - **Status**: Should show "Published" with green checkmark

### Step 2: Check Workflow Status
1. Go to: https://github.com/rpretzer/Starfox-cal/actions
2. Look for **"Deploy to GitHub Pages"** workflow
3. Check the latest run:
   - ✅ **Green checkmark** = Success (files should be deployed)
   - ❌ **Red X** = Failed (check error messages)
   - ⏳ **Yellow circle** = In progress (wait)
   - ⚪ **No runs** = Workflow hasn't run yet

### Step 3: Trigger Manual Deployment
If workflow hasn't run or shows errors:

1. Go to: https://github.com/rpretzer/Starfox-cal/actions/workflows/deploy_web.yml
2. Click **"Run workflow"** button (top right)
3. Select **"main"** branch
4. Click **"Run workflow"**
5. **Wait 2-5 minutes** for completion
6. Check the Actions tab to see progress

### Step 4: Verify Deployment
After workflow completes successfully:

1. **Test the files directly**:
   - `https://calendar.rspmgmt.com/Starfox-cal/flutter.js` - Should load (not 404)
   - `https://calendar.rspmgmt.com/Starfox-cal/manifest.json` - Should load (not 404)
   - `https://calendar.rspmgmt.com/Starfox-cal/index.html` - Should load

2. **Test the app**:
   - `https://calendar.rspmgmt.com/Starfox-cal/` - App should load
   - Open browser console (F12) - Should see initialization logs

### Step 5: If Still Getting 404s

**Check the base path:**
- Current setup uses base-href: `/Starfox-cal/`
- This means files are at: `calendar.rspmgmt.com/Starfox-cal/`
- If your custom domain points to root, you might need to change base-href to `/`

**Wait for propagation:**
- GitHub Pages can take 1-2 minutes to update
- DNS changes can take up to 48 hours
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito/private browsing

**Check DNS configuration:**
- Verify `calendar.rspmgmt.com` DNS points to GitHub Pages
- In GitHub Settings → Pages, check the DNS records shown
- Ensure they match your domain registrar settings

## Expected File URLs After Deployment

Once deployed, these should all work:
- ✅ `https://calendar.rspmgmt.com/Starfox-cal/`
- ✅ `https://calendar.rspmgmt.com/Starfox-cal/flutter.js`
- ✅ `https://calendar.rspmgmt.com/Starfox-cal/main.dart.js`
- ✅ `https://calendar.rspmgmt.com/Starfox-cal/manifest.json`
- ✅ `https://calendar.rspmgmt.com/Starfox-cal/index.html`
- ✅ `https://calendar.rspmgmt.com/Starfox-cal/assets/...`
- ✅ `https://calendar.rspmgmt.com/Starfox-cal/canvaskit/...`

## Common Issues

### Issue: "Source" is set to "Deploy from a branch"
**Fix**: Change to "GitHub Actions" in Settings → Pages

### Issue: Workflow shows errors
**Fix**: Click on the failed workflow run, check error messages, fix issues, re-run

### Issue: Workflow hasn't run
**Fix**: Trigger manually via Actions → Deploy to GitHub Pages → Run workflow

### Issue: Files deployed but still 404
**Fix**: 
- Wait 1-2 minutes for GitHub Pages to update
- Clear browser cache
- Check if base-href matches your URL structure

## Next Steps

1. **Verify GitHub Pages is enabled** (Step 1)
2. **Check workflow status** (Step 2)
3. **Trigger deployment if needed** (Step 3)
4. **Test after deployment** (Step 4)

The workflow is already configured correctly - it just needs to run!


