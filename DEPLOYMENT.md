# Deployment Guide

## ✅ Setup Complete

The project is now ready for deployment. Here's what has been configured:

### 1. Flutter Installation
- Flutter SDK installed at `~/flutter`
- Version: 3.38.5 (stable channel)
- Web support enabled

### 2. Project Build
- ✅ Dependencies installed
- ✅ Hive adapters generated
- ✅ Web build successful (`build/web/`)

### 3. GitHub Actions Workflow
- Created `.github/workflows/deploy_web.yml`
- Automatically builds and deploys on push to `main` branch
- Uses GitHub Pages for hosting

## 🚀 Deployment Options

### Option 1: GitHub Pages (Automatic)

The GitHub Actions workflow automatically deploys to GitHub Pages:

1. **Go to your GitHub repository**: https://github.com/rpretzer/Starfox-cal

2. **Navigate to Settings** → **Pages**

3. **Configure the source**:
   - Source: Select **"GitHub Actions"**
   - (The workflow will handle the deployment automatically)

4. **Push your changes**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

5. **Wait for the workflow to complete**:
   - Go to **Actions** tab in your repository
   - Watch the "Deploy to GitHub Pages" workflow run
   - Once complete, your app will be available at:
     `https://rpretzer.github.io/Starfox-cal/`

### Option 2: Custom Domain (Manual Deployment)

If you're deploying to a custom domain like `calendar.rspmgmt.com/Starfox-cal/`, you need to manually deploy the files:

1. **Build the web app**:
   ```bash
   export PATH="$HOME/flutter/bin:$PATH"
   cd /home/rpretzer/Starfox-cal
   flutter pub get
   flutter pub run build_runner build --delete-conflicting-outputs
   flutter build web --release --base-href "/Starfox-cal/"
   ```

2. **Deploy all files from `build/web/`** to your web server:
   - Copy ALL files and folders from `build/web/` to `/Starfox-cal/` on your web server
   - Required files:
     - `index.html`
     - `flutter.js`
     - `main.dart.js`
     - `flutter_service_worker.js`
     - `flutter_bootstrap.js`
     - `manifest.json`
     - `version.json`
     - `assets/` (entire folder)
     - `canvaskit/` (entire folder)

3. **Verify file permissions**:
   - Ensure all files are readable by the web server
   - Ensure the web server can serve `.js`, `.wasm`, `.json`, and other file types

4. **Test the deployment**:
   - Visit `https://calendar.rspmgmt.com/Starfox-cal/`
   - Open browser console (F12) and check for errors
   - Verify `flutter.js` loads: `https://calendar.rspmgmt.com/Starfox-cal/flutter.js`

## 📝 Important Notes

### Base URL
The app is configured to use `/Starfox-cal/` as the base path. If you change the repository name or deployment path, update:
- `.github/workflows/deploy_web.yml` (line with `--base-href`)
- `web/index.html` (base href tag)
- Rebuild the app with the new base-href

### File Structure
After building, the `build/web/` directory should contain:
```
build/web/
├── index.html
├── flutter.js
├── main.dart.js
├── flutter_service_worker.js
├── flutter_bootstrap.js
├── manifest.json
├── version.json
├── assets/
│   ├── AssetManifest.bin
│   ├── AssetManifest.bin.json
│   ├── FontManifest.json
│   └── ...
└── canvaskit/
    ├── canvaskit.js
    ├── canvaskit.wasm
    └── ...
```

### Web Server Configuration

Your web server must:
1. Serve files from the `/Starfox-cal/` directory
2. Support MIME types for:
   - `.js` → `application/javascript`
   - `.wasm` → `application/wasm`
   - `.json` → `application/json`
   - `.bin` → `application/octet-stream`
3. Enable CORS if needed
4. Support service workers (HTTPS recommended)

## 🔧 Troubleshooting

### If files return 404:
1. **Verify files are deployed**: Check that all files from `build/web/` are on the server
2. **Check file paths**: Ensure files are in `/Starfox-cal/` directory (not root)
3. **Verify web server config**: Check that the server is configured to serve from the correct directory
4. **Check file permissions**: Ensure web server can read all files

### If the workflow fails:
1. Check the Actions tab for error messages
2. Ensure GitHub Pages is enabled in repository settings
3. Verify the base-href matches your repository name

### If the app doesn't load:
1. Check browser console (F12) for errors
2. Verify the base-href is correct
3. Clear browser cache and try again
4. Check network tab to see which files are failing to load

## 📦 Build Artifacts

The web build is located in `build/web/` and contains:
- `index.html` - Main entry point
- `flutter.js` - Flutter web runtime
- `main.dart.js` - Compiled Dart code
- `assets/` - App assets
- `canvaskit/` - Flutter rendering engine

## 🚨 Current Issue

If you're seeing 404 errors for `flutter.js` and other files:
- **The files are not deployed to your web server**
- You need to copy all files from `build/web/` to your web server at `/Starfox-cal/`
- Or set up automatic deployment from GitHub Pages to your custom domain
