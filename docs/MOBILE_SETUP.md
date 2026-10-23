# MediLink Mobile App - Setup Guide

## Prerequisites
- Flutter SDK 3.0+
- Dart SDK 2.19+
- Android SDK or Xcode (for iOS)
- Visual Studio Code or Android Studio
- A device or emulator

## Installation

### 1. Install Flutter
[Download Flutter](https://flutter.dev/docs/get-started/install)

Verify installation:
```bash
flutter doctor
```

### 2. Clone Project
```bash
cd medilink-mobile
```

### 3. Get Dependencies
```bash
flutter pub get
```

### 4. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project "MediLink"
3. Add Android and iOS apps
4. Download configuration files

#### Android
1. Place `google-services.json` in `android/app/`
2. Update `android/build.gradle`

#### iOS
1. Place `GoogleService-Info.plist` in `ios/Runner/`
2. Run `pod install` in `ios/` directory

### 5. Configuration

Create `lib/config/app_config.dart`:
```dart
class AppConfig {
  static const String apiUrl = 'http://localhost:5000';
  static const String aiServiceUrl = 'http://localhost:5001';
  static const String firebaseProjectId = 'your-project-id';
}
```

### 6. Run Application

```bash
# Run on connected device/emulator
flutter run

# Run in release mode
flutter run --release

# Run on specific device
flutter devices
flutter run -d <device_id>
```

## Project Structure

```
medilink-mobile/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── screens/
│   │   ├── auth/                    # Authentication screens
│   │   ├── home/                    # Home and dashboard
│   │   ├── medical/                 # Medical records
│   │   ├── sos/                     # Emergency SOS
│   │   └── wallet/                  # Wallet management
│   ├── providers/                   # State management
│   ├── models/                      # Data models
│   ├── services/                    # API services
│   ├── widgets/                     # Reusable widgets
│   └── theme/                       # App theming
├── assets/
│   ├── images/
│   ├── icons/
│   └── animations/
├── pubspec.yaml                     # Dependencies
└── README.md
```

## Key Screens

### 1. Splash Screen
- App initialization
- Theme loading
- User session check

### 2. Login Screen
```
- Aadhaar Number input (12 digits)
- Phone Number input (10 digits)
- Send OTP button
```

### 3. OTP Verification
```
- 6-digit OTP input
- Resend OTP option
- Demo OTP display (development)
```

### 4. Home Screen
```
- Emergency SOS Button (prominent red)
- Health Summary Card
- Quick Action Grid
- Recent Activity Feed
```

### 5. Medical Records
```
- View medical history
- Upload lab reports
- Manage prescriptions
- Add medical conditions
```

### 6. SOS Emergency
```
- Activate emergency
- Real-time status tracking
- Hospital and ambulance info
- Cancel emergency option
```

### 7. Wallet
```
- Display balance
- Payment history
- Government credit info
- QR payment scanning
```

## State Management (Provider)

### AuthProvider
```dart
class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  String _token = '';
  
  Future<bool> sendOTP(String aadhaar, String phone) async { ... }
  Future<bool> verifyOTP(String otp) async { ... }
}
```

### UserProvider
```dart
class UserProvider extends ChangeNotifier {
  Map<String, dynamic>? _userProfile;
  
  Future<void> fetchUserProfile() async { ... }
  Future<void> updateProfile(Map data) async { ... }
}
```

## API Integration

### Service Layer
```dart
// lib/services/api_service.dart
class ApiService {
  static const String _baseUrl = '${AppConfig.apiUrl}/api';
  
  Future<Response> sendOTP(String aadhaar, String phone) async {
    return await http.post(
      Uri.parse('$_baseUrl/auth/send-otp'),
      body: jsonEncode({...}),
      headers: {...}
    );
  }
}
```

## Testing

### Unit Tests
```bash
flutter test
```

### Integration Tests
```bash
flutter drive --target=test_driver/app.dart
```

### Manual Testing Checklist
- [ ] Login/OTP flow
- [ ] Medical records upload
- [ ] AI prediction
- [ ] SOS activation
- [ ] Wallet payment
- [ ] Location tracking
- [ ] Notifications
- [ ] Offline mode

## Building for Release

### Android APK
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Android App Bundle
```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

### iOS
```bash
flutter build ios --release
# Open in Xcode for further configuration
```

## Debugging

### Enable Debug Mode
```bash
flutter run -v  # Verbose logging
```

### Hot Reload
```
Press 'r' during flutter run to hot reload
Press 'R' for full restart
```

### DevTools
```bash
flutter pub global activate devtools
devtools
```

## Common Issues

### Error: Android SDK not found
```bash
flutter config --android-sdk /path/to/android/sdk
```

### Error: Build failed
```bash
flutter clean
flutter pub get
flutter pub upgrade
```

### Error: Firebase not initializing
1. Check google-services.json placement
2. Verify Firebase project settings
3. Check internet connectivity

## Localization (i18n)

Supported languages: English, Tamil

```dart
// lib/l10n/app_en.arb
{
  "welcome": "Welcome to MediLink"
}

// lib/l10n/app_ta.arb
{
  "welcome": "MediLink க்கு வரவேற்கிறோம்"
}
```

Switch languages:
```dart
Locale newLocale = Locale('ta'); // Tamil
Locale newLocale = Locale('en'); // English
```

## Performance Tips

✅ Use const constructors  
✅ Implement lazy loading  
✅ Cache API responses  
✅ Minimize widget rebuilds  
✅ Use appropriate splash screens  

## Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Dart Documentation](https://dart.dev/guides)
- [Provider Package](https://pub.dev/packages/provider)
- [HTTP Package](https://pub.dev/packages/http)

---

**Maintained by**: MediLink Mobile Team  
**Last Updated**: April 2024
