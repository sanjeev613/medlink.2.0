import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/otp_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/discharge/discharge_capture_screen.dart';
import 'screens/discharge/discharge_main_screen.dart';
import 'providers/auth_provider.dart';
import 'providers/user_provider.dart';
import 'providers/discharge_provider.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MediLinkApp());
}

class MediLinkApp extends StatelessWidget {
  const MediLinkApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => DischargeProvider()),
      ],
      child: MaterialApp(
        title: 'MediLink AI - Discharge to Medication Plan',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.light,
        // Start directly into the Discharge Summary Plan MVP screen for instant review
        home: const DischargeCaptureScreen(),
        routes: {
          '/discharge': (_) => const DischargeCaptureScreen(),
          '/discharge/main': (_) => const DischargeMainScreen(),
          '/login': (_) => const LoginScreen(),
          '/otp': (_) => const OTPScreen(),
          '/home': (_) => const HomeScreen(),
        },
      ),
    );
  }
}
