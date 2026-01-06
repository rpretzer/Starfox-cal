# Starfox Calendar - Web App

A modern React-based calendar application for managing team meetings, built with TypeScript, Vite, and Tailwind CSS.

## Features

- ✅ **Weekly View**: View meetings organized by day of the week
- ✅ **Conflicts View**: Automatically detect scheduling conflicts
- ✅ **Categories View**: Organize meetings by team/category
- ✅ **Bi-weekly Support**: Handle Week A and Week B schedules
- ✅ **Persistent Storage**: All data stored locally using IndexedDB
- ✅ **Fast & Lightweight**: Small bundle size (~100-200KB vs Flutter's 2-5MB)
- ✅ **Easy Deployment**: Static files, works perfectly with GitHub Pages

## Tech Stack

- **React 18** + **TypeScript** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first CSS framework
- **IndexedDB** (via `idb` library) - Client-side storage
- **date-fns** - Date utilities

## Development

### Prerequisites

- Node.js 18+ and npm

### Setup

1. **Install dependencies:**
   ```bash
   cd web-app
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

3. **Build for production:**
   ```bash
   npm run build
   ```

   Output will be in the `dist/` directory.

## Deployment to GitHub Pages

### Automatic Deployment (Recommended)

The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to `main` or `master`.

1. **Enable GitHub Pages:**
   - Go to your repository Settings → Pages
   - Source: Select "GitHub Actions"

2. **Push to main branch:**
   - The workflow will automatically build and deploy

3. **Configure custom domain (optional):**
   - In repository Settings → Pages, add your custom domain `calendar.rspmgmt.com`
   - Update your DNS records as needed

### Manual Deployment

1. **Build the project:**
   ```bash
   cd web-app
   npm run build
   ```

2. **Deploy the `dist/` folder:**
   - Use GitHub Pages, Netlify, Vercel, or any static hosting service
   - Point to the `dist/` directory

## Project Structure

```
web-app/
├── src/
│   ├── components/       # React components
│   │   ├── CalendarScreen.tsx
│   │   ├── WeeklyView.tsx
│   │   ├── ConflictsView.tsx
│   │   ├── CategoriesView.tsx
│   │   └── ...
│   ├── models/          # Default data models
│   ├── services/        # Storage service (IndexedDB)
│   ├── store/           # Zustand state management
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── dist/               # Build output (generated)
└── package.json
```

## Key Differences from Flutter Version

1. **Much smaller bundle size** - ~100-200KB vs 2-5MB
2. **Faster initial load** - No large WASM files to download
3. **No service worker complexity** - Simpler deployment
4. **Native browser APIs** - Better performance and debugging
5. **Easy to deploy** - Just static files, works anywhere

## Browser Support

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

See LICENSE file for details.

