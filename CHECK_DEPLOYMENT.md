# Deployment Status Check

## Quick Verification Steps

### 1. Check if GitHub Pages is Enabled
1. Go to: https://github.com/rpretzer/Starfox-cal/settings/pages
2. Verify:
   - ✅ Source is set to "GitHub Actions"
   - ✅ Custom domain shows: `calendar.rspmgmt.com`
   - ✅ Status shows "Published" (green checkmark)

### 2. Check if Workflow Has Run
1. Go to: https://github.com/rpretzer/Starfox-cal/actions
2. Look for "Deploy to GitHub Pages" workflow
3. Verify:
   - ✅ Latest run shows green checkmark (success)
   - ✅ Both "build" and "deploy" jobs completed
   - ✅ No red X marks (errors)

### 3. Test the Deployment
1. Visit: `https://calendar.rspmgmt.com/Starfox-cal/`
2. Open browser console (F12)
3. Check:
   - Does `index.html` load? (should see page)
   - Does `flutter.js` load? (check Network tab)
   - Any 404 errors?

### 4. If Files Are Missing (404 errors)

**Option A: Trigger Manual Deployment**
1. Go to: https://github.com/rpretzer/Starfox-cal/actions/workflows/deploy_web.yml
2. Click "Run workflow" button
3. Select "main" branch
4. Click "Run workflow"
5. Wait for it to complete (2-5 minutes)

**Option B: Verify Base Path**
- If your custom domain points to root (`calendar.rspmgmt.com/`), you may need to:
  - Change base-href to `/` instead of `/Starfox-cal/`
  - Or access via `calendar.rspmgmt.com/Starfox-cal/` if that's the intended path

### 5. DNS Verification
If custom domain isn't working:
1. In GitHub Settings → Pages → Custom domain
2. Verify DNS records match what GitHub shows
3. DNS propagation can take up to 48 hours

## Expected File Structure on GitHub Pages

When deployed, these files should be accessible:
- `https://calendar.rspmgmt.com/Starfox-cal/flutter.js`
- `https://calendar.rspmgmt.com/Starfox-cal/main.dart.js`
- `https://calendar.rspmgmt.com/Starfox-cal/index.html`
- `https://calendar.rspmgmt.com/Starfox-cal/assets/...`
- `https://calendar.rspmgmt.com/Starfox-cal/canvaskit/...`

## Common Issues

### Issue: 404 for all files
**Solution**: GitHub Pages not deployed or workflow failed
- Check Actions tab for errors
- Ensure GitHub Pages is enabled
- Trigger manual workflow run

### Issue: Domain works but files 404
**Solution**: Base path mismatch
- Verify custom domain points to correct path
- Check if base-href matches actual URL structure

### Issue: Workflow runs but files don't appear
**Solution**: Wait a few minutes
- GitHub Pages can take 1-2 minutes to update
- Clear browser cache
- Try incognito/private browsing mode

