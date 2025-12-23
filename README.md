# Starfox Calendar

A cross-platform meeting calendar application for the Starfox team, built with Flutter.

## Features

- **Weekly View**: View meetings organized by day of the week
- **Conflicts View**: Identify scheduling conflicts automatically
- **Categories View**: Organize meetings by team/category
- **Drag & Drop**: Easily reschedule meetings by dragging them between days
- **Bi-weekly Support**: Handle Week A and Week B schedules
- **Persistent Storage**: All data is stored locally using Hive

## Project Structure

```
lib/
├── main.dart                 # Application entry point
├── models/                   # Data models
│   ├── meeting.dart
│   └── category.dart
├── screens/                  # Screen widgets
│   ├── calendar_screen.dart
│   ├── meeting_detail_screen.dart
│   └── weekly_view.dart
├── widgets/                  # Reusable widgets
│   ├── calendar_header.dart
│   ├── categories_view.dart
│   ├── conflicts_view.dart
│   ├── day_column.dart
│   ├── meeting_card.dart
│   └── representation_strategy_card.dart
├── services/                 # Business logic
│   └── storage_service.dart
└── utils/                    # Utilities
    ├── constants.dart
    ├── datetime_utils.dart
    └── theme.dart
```

## Setup Instructions

### Prerequisites

- Flutter SDK (>=3.0.0)
- Dart SDK (>=3.0.0)

### Installation

1. **Install dependencies:**
   ```bash
   flutter pub get
   ```

2. **Generate Hive adapters:**
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```
   
   Or use the provided script:
   ```bash
   ./generate_hive_adapters.sh
   ```

3. **Run the app:**
   ```bash
   flutter run
   ```

## Dependencies

### Core Dependencies
- `provider` - State management
- `hive` & `hive_flutter` - Local storage
- `intl` - Internationalization and date formatting

### Development Dependencies
- `flutter_lints` - Linting rules
- `hive_generator` - Code generation for Hive adapters
- `build_runner` - Code generation tool

## Usage

### Adding a Meeting
1. Tap the floating action button (+)
2. Fill in the meeting details
3. Select the day(s), time, and frequency
4. Save the meeting

### Editing a Meeting
1. Tap on any meeting card
2. Modify the details
3. Save changes

### Viewing Conflicts
1. Switch to the "Conflicts" view using the header controls
2. Review any scheduling conflicts
3. Conflicts are automatically detected when meetings overlap

### Switching Week Types
- Use the "Week A" / "Week B" toggle in the header to filter bi-weekly meetings

## Code Generation

The project uses Hive for local storage, which requires code generation for type adapters. After making changes to model classes annotated with `@HiveType`, run:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

## Cross-Platform Support

This app is designed to run on:
- ✅ **Android** - Native mobile app
- ✅ **iOS** - Native mobile app  
- ✅ **Web** - Runs in modern browsers (Chrome, Firefox, Safari, Edge)

All dependencies are cross-platform compatible:
- `hive_flutter` - Uses IndexedDB on web, native storage on mobile
- `path_provider` - Works on all platforms
- `provider` - Platform-agnostic state management
- `intl` - Cross-platform date formatting

The UI is responsive and adapts to different screen sizes:
- Mobile (< 600px): Horizontal scrolling week view
- Desktop/Tablet (≥ 600px): Full week view side-by-side

## Building for Production

### Android
```bash
flutter build apk --release
# or for app bundle:
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

### Web
```bash
flutter build web --release
```

The web build will be in `build/web/` and can be deployed to any static hosting service.

## License

See LICENSE file for details.

