# Starfox Calendar

A modern web-based meeting calendar application for the Starfox team.

## 🌐 Web Application

The web app is built with **React + TypeScript + Vite** and deployed to GitHub Pages at [calendar.rspmgmt.com](https://calendar.rspmgmt.com).

### Quick Start (Web App)

```bash
cd web-app
npm install
npm run dev
```

Visit http://localhost:5173

See [web-app/README.md](web-app/README.md) for full documentation.

## 📱 Mobile Apps (Flutter)

The Flutter codebase is maintained in the `lib/` directory for Android and iOS mobile apps.

### Mobile Development

```bash
flutter pub get
flutter run
```

## Features

- ✅ **Weekly View**: View meetings organized by day of the week
- ✅ **Conflicts View**: Automatically detect scheduling conflicts
- ✅ **Categories View**: Organize meetings by team/category
- ✅ **Bi-weekly Support**: Handle Week A and Week B schedules
- ✅ **Persistent Storage**: All data stored locally (IndexedDB on web, Hive on mobile)

## Project Structure

```
├── web-app/          # React web application (primary)
│   ├── src/          # React components and logic
│   └── package.json  # Node.js dependencies
├── lib/              # Flutter mobile app code
│   ├── models/       # Data models
│   ├── screens/      # UI screens
│   └── services/     # Business logic
└── .github/          # GitHub Actions workflows
```

## Deployment

The web app automatically deploys to GitHub Pages via GitHub Actions when you push to `main`.

See [web-app/DEPLOYMENT.md](web-app/DEPLOYMENT.md) for deployment details.

## License

See LICENSE file for details.
