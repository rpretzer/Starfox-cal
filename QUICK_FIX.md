# Quick Fix for 404 Errors

## The Problem
Your custom domain `calendar.rspmgmt.com` is set up, but files are returning 404 because GitHub Pages hasn't deployed the files yet.

## Solution: Verify and Trigger Deployment

### Step 1: Check GitHub Pages Status
1. Go to: https://github.com/rpretzer/Starfox-cal/settings/pages
2. Verify:
   - ✅ **Source** is set to **"GitHub Actions"** (not "Deploy from a branch")
   - ✅ **Custom domain** shows `calendar.rspmgmt.com`
   - ✅ Status shows **"Published"** with green checkmark

### Step 2: Check if Workflow Has Run
1. Go to: https://github.com/rpretzer/Starfox-cal/actions
2. Look for **"Deploy to GitHub Pages"** workflow
3. Check the latest run:
   - ✅ Green checkmark = Success (files should be deployed)
   - ❌ Red X = Failed (check error messages)
   - ⏳ Yellow circle = In progress (wait for completion)

### Step 3: Trigger Manual Deployment (If Needed)
If the workflow hasn't run or failed:

1. Go to: https://github.com/rpretzer/Starfox-cal/actions/workflows/deploy_web.yml
2. Click the **"Run workflow"** dropdown button (top right)
3. Select **"main"** branch
4. Click **"Run workflow"**
5. Wait 2-5 minutes for it to complete
6. Check the Actions tab to see progress

### Step 4: Verify Files Are Deployed
After the workflow completes successfully:

1. Visit: `https://calendar.rspmgmt.com/Starfox-cal/flutter.js`
   - Should load (not 404)
   - Should see JavaScript code

2. Visit: `https://calendar.rspmgmt.com/Starfox-cal/`
   - Should load the app
   - Open browser console (F12) - should see initialization logs

### Step 5: If Still Getting 404s

**Check the base path:**
- If your custom domain points to the root (`calendar.rspmgmt.com/`), you might need to access:
  - `https://calendar.rspmgmt.com/Starfox-cal/` (with `/Starfox-cal/` path)
- Or if it points to a subdirectory, verify the path matches

**Wait a few minutes:**
- GitHub Pages can take 1-2 minutes to update after deployment
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito/private browsing mode

## Expected Result

After successful deployment, these URLs should work:
- ✅ `https://calendar.rspmgmt.com/Starfox-cal/` - Main app
- ✅ `https://calendar.rspmgmt.com/Starfox-cal/flutter.js` - Flutter runtime
- ✅ `https://calendar.rspmgmt.com/Starfox-cal/main.dart.js` - App code
- ✅ `https://calendar.rspmgmt.com/Starfox-cal/index.html` - HTML file

## Still Having Issues?

If files still return 404 after verifying the above:
1. Check the GitHub Actions workflow logs for errors
2. Verify the custom domain DNS is correctly pointing to GitHub Pages
3. Ensure GitHub Pages is enabled in repository settings

