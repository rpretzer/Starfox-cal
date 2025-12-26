# Deployment Guide

## ✅ GitHub Pages is Your Web Server

**GitHub Pages IS a web server** - it's a free static hosting service provided by GitHub. You don't need to set up a separate web server!

## 🚀 How It Works

1. **GitHub Actions builds your app** when you push to `main`
2. **GitHub Pages hosts the files** automatically
3. **Your app is available** at `https://rpretzer.github.io/Starfox-cal/`

## 📋 Setup Steps

### Step 1: Enable GitHub Pages

1. Go to your repository: https://github.com/rpretzer/Starfox-cal
2. Click **Settings** → **Pages**
3. Under **Source**, select **"GitHub Actions"**
4. Save the settings

### Step 2: Verify Deployment

1. Push any commit to `main` branch (or trigger manually)
2. Go to **Actions** tab in your repository
3. Wait for "Deploy to GitHub Pages" workflow to complete
4. Your app will be live at: `https://rpretzer.github.io/Starfox-cal/`

## 🌐 Custom Domain Setup (Optional)

If you want to use `calendar.rspmgmt.com` instead of `rpretzer.github.io`, you have two options:

### Option A: Point Custom Domain to GitHub Pages (Recommended)

1. **In GitHub repository Settings → Pages**:
   - Add your custom domain: `calendar.rspmgmt.com`
   - GitHub will provide DNS records to add

2. **Update your DNS** (at your domain registrar):
   - Add the CNAME or A records GitHub provides
   - Wait for DNS propagation (can take up to 48 hours)

3. **GitHub Pages will automatically serve your app** at the custom domain

### Option B: Manual Deployment to Custom Server

If you have your own web server at `calendar.rspmgmt.com`:

1. **Build the app**:
   ```bash
   flutter pub get
   flutter pub run build_runner build --delete-conflicting-outputs
   flutter build web --release --base-href "/Starfox-cal/"
   ```

2. **Copy files from `build/web/`** to your web server at `/Starfox-cal/`

3. **Ensure your web server** can serve the files

## ✅ Current Status

Your GitHub Actions workflow is already configured to:
- ✅ Build the Flutter web app
- ✅ Deploy to GitHub Pages automatically
- ✅ Use the correct base path (`/Starfox-cal/`)

**You just need to enable GitHub Pages in your repository settings!**

## 🔍 Verify It's Working

After enabling GitHub Pages and the workflow completes:

1. Visit: `https://rpretzer.github.io/Starfox-cal/`
2. The app should load (no 404 errors)
3. Check browser console (F12) - should see initialization logs

## 🚨 Troubleshooting

### If you see 404 errors:
- **Check GitHub Actions**: Go to Actions tab, verify the workflow completed successfully
- **Check GitHub Pages**: Settings → Pages, verify it's enabled and using "GitHub Actions"
- **Wait a few minutes**: GitHub Pages can take 1-2 minutes to update after deployment

### If using custom domain:
- **DNS propagation**: Can take up to 48 hours
- **HTTPS**: GitHub Pages provides free SSL certificates for custom domains
- **Verify DNS**: Use `dig` or online DNS checker to verify records

## 📝 Summary

- ✅ **No separate web server needed** - GitHub Pages is your web server
- ✅ **Automatic deployment** - GitHub Actions handles everything
- ✅ **Free hosting** - GitHub Pages is free for public repositories
- ✅ **Just enable it** - Go to Settings → Pages → Select "GitHub Actions"

Once enabled, every push to `main` will automatically deploy your app!
