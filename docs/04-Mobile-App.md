# Quest Mobile App - Capacitor Setup

Quest is configured for iOS and Android deployment using Capacitor. The mobile app loads the Quest web app from your deployed Vercel server, providing native capabilities through Capacitor plugins.

## Architecture

The mobile app uses a **live server** approach:
- **Production**: App loads from `https://quest-manas-pradhans-projects.vercel.app`
- **Development**: App loads from `http://localhost:3000`

This approach allows full functionality including API routes, server components, and authentication without requiring a static export.

## Prerequisites

### iOS Development
- macOS with Xcode 14+
- Apple Developer account (for device testing/App Store)
- CocoaPods installed: `sudo gem install cocoapods`

### Android Development
- Android Studio
- Java 17+ (required by Android Gradle plugin)
- Android SDK

## Quick Start

### Development

1. Start the Next.js dev server:
   ```bash
   npm run dev
   ```

2. Open in simulator/emulator:
   ```bash
   # iOS
   npm run ios

   # Android (requires Java 17+)
   npm run android
   ```

### Syncing Changes

After installing new Capacitor plugins or updating capacitor.config.ts:
```bash
npm run cap:sync
```

## Project Structure

```
quest/
├── ios/                    # iOS Xcode project
│   └── App/
│       ├── App/
│       │   └── Info.plist  # iOS permissions & URL schemes
│       └── Podfile         # iOS dependencies
├── android/                # Android Studio project
│   └── app/
│       └── src/main/
│           └── AndroidManifest.xml  # Android permissions
├── capacitor.config.ts     # Capacitor configuration
└── src/
    ├── lib/
    │   ├── mobile-auth.ts      # Token storage for mobile
    │   └── api-client.ts       # HTTP client with auth
    ├── hooks/
    │   └── use-platform.ts     # Platform detection
    └── components/
        └── mobile/
            ├── file-picker.tsx     # Native file/image picker
            └── mobile-layout.tsx   # Safe areas & keyboard
```

## Capacitor Plugins Installed

| Plugin | Purpose |
|--------|---------|
| @capacitor/core | Core Capacitor functionality |
| @capacitor/ios | iOS platform support |
| @capacitor/android | Android platform support |
| @capacitor/app | App lifecycle events |
| @capacitor/camera | Photo capture & gallery access |
| @capacitor/filesystem | File system access |
| @capacitor/haptics | Haptic feedback |
| @capacitor/keyboard | Keyboard events & control |
| @capacitor/preferences | Secure key-value storage |
| @capacitor/splash-screen | Splash screen control |
| @capacitor/status-bar | Status bar styling |

## Native Features

### File Upload (Mobile)
The `AttachmentUpload` component automatically detects the platform:
- **Web**: Uses standard file input
- **Mobile**: Shows dropdown with "Take Photo" and "Choose from Gallery" options

### Token Storage
Use `mobileAuth` from `@/lib/mobile-auth` for secure token storage:
```typescript
import { mobileAuth } from '@/lib/mobile-auth';

// Store token
await mobileAuth.setToken(token);

// Get token
const token = await mobileAuth.getToken();

// Clear on logout
await mobileAuth.clearToken();
```

### Platform Detection
```typescript
import { usePlatform } from '@/hooks/use-platform';

function MyComponent() {
  const { isNative, isIOS, isAndroid, isWeb } = usePlatform();

  if (isNative) {
    // Mobile-specific code
  }
}
```

## iOS Configuration

### Info.plist Permissions
The following are already configured:
- `NSCameraUsageDescription` - Camera access for attachments
- `NSPhotoLibraryUsageDescription` - Photo library access
- `NSPhotoLibraryAddUsageDescription` - Save photos permission
- `CFBundleURLTypes` - Deep linking with `quest://` scheme

### Building for iOS
```bash
# Open in Xcode
npm run ios

# Or build directly
cd ios/App && pod install && open App.xcworkspace
```

## Android Configuration

### AndroidManifest.xml Permissions
The following are already configured:
- `INTERNET` - Network access
- `CAMERA` - Camera access
- `READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES` - Gallery access
- Deep linking with `quest://` scheme

### Building for Android
```bash
# Open in Android Studio
npm run android
```

**Note**: Android requires Java 17+. Set `JAVA_HOME` appropriately.

## Deep Linking

The app is configured to handle `quest://` URLs for:
- OAuth callbacks: `quest://oauth/callback`
- Direct navigation: `quest://workspace/my-workspace/project/PROJ-1`

## App Store Deployment

### iOS (App Store Connect)
1. Create app in App Store Connect
2. Configure signing in Xcode
3. Archive and upload via Xcode
4. Required assets:
   - App icons (1024x1024 + various sizes)
   - Screenshots (6.7", 6.5", 5.5" iPhones)
   - Privacy policy URL
   - App description

### Android (Play Store)
1. Create app in Play Console
2. Generate signed APK/AAB
3. Required assets:
   - App icons (512x512)
   - Feature graphic (1024x500)
   - Screenshots (phone + tablet)
   - Privacy policy URL

## Troubleshooting

### iOS Simulator not loading
Ensure Next.js dev server is running on port 3000.

### Android Gradle errors
Ensure Java 17+ is installed and `JAVA_HOME` is set correctly.

### Camera not working in simulator
Camera requires a physical device for testing.

### Network errors in Android emulator
Android emulator uses `10.0.2.2` for localhost. The Capacitor config handles this, but if issues occur, update `capacitor.config.ts`.

## Environment Variables

For mobile builds, ensure `NEXT_PUBLIC_API_URL` is set if using a different API endpoint:
```bash
NEXT_PUBLIC_API_URL=https://your-api-url.com
```
