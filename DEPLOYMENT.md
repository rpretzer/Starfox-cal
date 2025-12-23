# Deployment Guide - GitHub Pages

## ✅ Setup Complete

The project is now ready for GitHub Pages deployment. Here's what has been configured:

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

## 🚀 Enabling GitHub Pages

To enable GitHub Pages for your repository:

1. **Go to your GitHub repository**: https://github.com/rpretzer/Starfox-cal

2. **Navigate to Settings** → **Pages**

3. **Configure the source**:
   - Source: Select **"GitHub Actions"**
   - (The workflow will handle the deployment automatically)

4. **Push your changes**:
   ```bash
   git add .
   git commit -m "Setup Flutter and GitHub Pages deployment"
   git push origin main
   ```

5. **Wait for the workflow to complete**:
   - Go to **Actions** tab in your repository
   - Watch the "Deploy to GitHub Pages" workflow run
   - Once complete, your app will be available at:
     `https://rpretzer.github.io/Starfox-cal/`

## 📝 Important Notes

### Base URL
The app is configured to use `/Starfox-cal/` as the base path. If you change the repository name, update:
- `.github/workflows/deploy_web.yml` (line with `--base-href`)
- `web/index.html` (base href tag)

### Manual Build (if needed)
If you need to build manually:
```bash
export PATH="$HOME/flutter/bin:$PATH"
cd /home/rpretzer/Starfox-cal
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter build web --release --base-href "/Starfox-cal/"
```

### Local Testing
To test the web build locally:
```bash
cd build/web
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## 🔧 Troubleshooting

### If the workflow fails:
1. Check the Actions tab for error messages
2. Ensure GitHub Pages is enabled in repository settings
3. Verify the base-href matches your repository name

### If the app doesn't load:
1. Check browser console for errors
2. Verify the base-href is correct
3. Clear browser cache and try again

## 📦 Build Artifacts

The web build is located in `build/web/` and contains:
- `index.html` - Main entry point
- `flutter.js` - Flutter web runtime
- `main.dart.js` - Compiled Dart code
- `assets/` - App assets
- `canvaskit/` - Flutter rendering engine

