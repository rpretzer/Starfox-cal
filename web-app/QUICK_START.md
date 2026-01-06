# Quick Start Guide

## Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd web-app
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 3. Build for Production
```bash
npm run build
```

The built files will be in the `dist/` folder, ready to deploy!

## What's Different from Flutter?

✅ **Much faster** - No large WASM files to download  
✅ **Smaller bundle** - ~100-200KB vs 2-5MB  
✅ **Easier to debug** - Use browser DevTools  
✅ **Simple deployment** - Just static files  
✅ **No service worker issues** - Works reliably  

## Project Structure

- `src/components/` - React UI components
- `src/services/` - Storage service (IndexedDB)
- `src/store/` - State management (Zustand)
- `src/types/` - TypeScript definitions
- `src/models/` - Default data

## Next Steps

1. **Test locally**: `npm run dev`
2. **Build**: `npm run build`
3. **Deploy**: Push to GitHub, workflow will auto-deploy
4. **Visit**: https://calendar.rspmgmt.com

That's it! 🎉

