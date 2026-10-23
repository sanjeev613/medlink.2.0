import 'package:flutter/material.dart';

class UserProvider extends ChangeNotifier {
  Map<String, dynamic>? _userProfile;
  bool _isLoading = false;
  String _error = '';

  Map<String, dynamic>? get userProfile => _userProfile;
  bool get isLoading => _isLoading;
  String get error => _error;

  Future<void> fetchUserProfile() async {
    try {
      _isLoading = true;
      _error = '';
      notifyListeners();

      // Simulate API call
      await Future.delayed(const Duration(seconds: 1));

      _userProfile = {
        'firstName': 'Rajesh',
        'lastName': 'Kumar',
        'bloodGroup': 'O+',
        'bmi': 23.5,
        'medicalConditions': ['None'],
        'walletBalance': 5000,
      };

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    try {
      _isLoading = true;
      notifyListeners();

      // Simulate API call
      await Future.delayed(const Duration(seconds: 1));

      _userProfile = {...?_userProfile, ...data};
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }
}
