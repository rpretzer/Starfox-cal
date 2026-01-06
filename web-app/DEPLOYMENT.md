# Deployment Guide for GitHub Pages

This guide will help you deploy the Starfox Calendar web app to GitHub Pages at `calendar.rspmgmt.com`.

## Prerequisites

- GitHub repository: `rpretzer/Starfox-cal`
- Custom domain: `calendar.rspmgmt.com`
- DNS access to configure the domain

## Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/rpretzer/Starfox-cal
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. This enables the automatic deployment workflow

## Step 2: Configure Custom Domain

1. In the same **Pages** settings, scroll to **Custom domain**
2. Enter: `calendar.rspmgmt.com`
3. Check **Enforce HTTPS** (recommended)
4. Click **Save**

## Step 3: Configure DNS

Add the following DNS records for `calendar.rspmgmt.com`:

### Option A: CNAME Record (Recommended)
```
Type: CNAME
Name: calendar
Value: rpretzer.github.io
TTL: 3600 (or default)
```

### Option B: A Records
If CNAME doesn't work, use A records:
```
Type: A
Name: calendar
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

## Step 4: Trigger Deployment

The GitHub Actions workflow will automatically run when you:
- Push to `main` or `master` branch
- Or manually trigger it: **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**

## Step 5: Verify Deployment

1. Wait 1-2 minutes for DNS propagation
2. Visit `https://calendar.rspmgmt.com`
3. The app should load (no blank screen!)

## Troubleshooting

### App doesn't load / Blank screen

1. **Check browser console** (F12):
   - Look for errors in Console tab
   - Check Network tab for failed requests

2. **Verify build succeeded**:
   - Go to **Actions** tab
   - Check latest workflow run completed successfully

3. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or use incognito/private browsing mode

### 404 Errors

- Verify the workflow built successfully
- Check that `dist/` folder contains files
- Ensure base path in `vite.config.ts` is set to `/`

### DNS Issues

- Wait 24-48 hours for DNS propagation
- Use `dig calendar.rspmgmt.com` or `nslookup calendar.rspmgmt.com` to verify
- Check DNS records are correct

## Manual Deployment (Alternative)

If GitHub Actions doesn't work:

1. **Build locally:**
   ```bash
   cd web-app
   npm install
   npm run build
   ```

2. **Deploy `dist/` folder:**
   - Use GitHub Desktop or git to push `dist/` to `gh-pages` branch
   - Or use a tool like `gh-pages` npm package

## Updating the App

Simply push changes to `main` branch - the workflow will automatically rebuild and redeploy!

## Benefits Over Flutter Web

✅ **Small bundle** - 100-200KB vs 2-5MB  
✅ **Fast load** - No WASM files  
✅ **Simple deployment** - Just static files  
✅ **No service worker issues**  
✅ **Better browser compatibility**  
✅ **Easier debugging** - Native browser DevTools

