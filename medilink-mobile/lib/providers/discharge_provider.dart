import 'package:flutter/material.dart';
import '../models/medication_plan.dart';
import '../services/discharge_api_service.dart';

class DischargeProvider with ChangeNotifier {
  MedicationPlan? _currentPlan;
  String _currentLanguage = 'en'; // 'en' | 'ta'
  bool _isLoading = false;
  String _loadingStep = '';
  String? _errorMessage;
  String? _handwrittenNotice;
  String? _hospitalPhone;
  int _selectedDay = 1;
  List<Map<String, dynamic>> _testSamples = [];

  MedicationPlan? get currentPlan => _currentPlan;
  String get currentLanguage => _currentLanguage;
  bool get isLoading => _isLoading;
  String get loadingStep => _loadingStep;
  String? get errorMessage => _errorMessage;
  String? get handwrittenNotice => _handwrittenNotice;
  String? get hospitalPhone => _hospitalPhone;
  int get selectedDay => _selectedDay;
  List<Map<String, dynamic>> get testSamples => _testSamples;

  bool get isTamil => _currentLanguage == 'ta';

  DischargeProvider() {
    fetchTestSamples();
  }

  void setLanguage(String lang) {
    if (_currentLanguage != lang) {
      _currentLanguage = lang;
      if (_currentPlan != null) {
        _currentPlan = _currentPlan!.copyWith(language: lang);
      }
      notifyListeners();
    }
  }

  void toggleLanguage() {
    setLanguage(_currentLanguage == 'en' ? 'ta' : 'en');
  }

  void setSelectedDay(int day) {
    _selectedDay = day;
    notifyListeners();
  }

  Future<void> fetchTestSamples() async {
    try {
      _testSamples = await DischargeApiService.getTestSamples();
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching test samples: $e');
    }
  }

  Future<bool> processDischargeDocument({
    String? imageBase64,
    String? testDocId,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _handwrittenNotice = null;
    _loadingStep = isTamil ? 'மருத்துவ குறிப்புகளை படித்து பிரித்தெடுக்கிறது...' : 'Extracting clinical shorthand with Vision AI...';
    notifyListeners();

    try {
      await Future.delayed(const Duration(milliseconds: 600));
      _loadingStep = isTamil ? 'இந்திய மருந்து தரவுத்தளத்தில் அளவுகள் சரிபார்க்கப்படுகிறது...' : 'Validating dosages against Indian Drug Database...';
      notifyListeners();

      final result = await DischargeApiService.extractDischargeSummary(
        imageBase64: imageBase64,
        testDocId: testDocId,
        language: _currentLanguage,
      );

      await Future.delayed(const Duration(milliseconds: 500));

      if (result['handwritten_detected'] == true) {
        _handwrittenNotice = isTamil
            ? (result['message_ta'] ?? "⚠️ இது கையெழுத்தில் எழுதப்பட்டதாக தெரிகிறது — எங்களால் பாதுகாப்பாக படிக்க முடியவில்லை. மருந்துகளை உறுதிப்படுத்த உங்கள் மருந்தாளுநரிடம் கேட்கவும்.")
            : (result['message'] ?? "This looks handwritten — we can't safely read it yet. Please ask your pharmacist to confirm the medicines");
        _hospitalPhone = result['hospital_phone'] ?? '+91 44 2829 0200';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      if (result['success'] == true && result['data'] != null) {
        _currentPlan = MedicationPlan.fromJson(result['data']);
        _hospitalPhone = _currentPlan?.hospitalPhone;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = result['message'] ?? 'Failed to parse discharge summary safely.';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'An error occurred during extraction: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signoffAdvisory({
    required String doctorName,
    required String role,
    required String registrationNo,
    required String notes,
  }) async {
    if (_currentPlan == null) return false;

    final success = await DischargeApiService.submitDoctorSignoff(
      summaryId: _currentPlan!.summaryId,
      doctorName: doctorName,
      role: role,
      registrationNo: registrationNo,
      notes: notes,
    );

    if (success) {
      final updatedSignoff = DoctorSignoff(
        signed: true,
        reviewedBy: doctorName,
        role: role,
        registrationNo: registrationNo,
        notes: notes,
        signedAt: DateTime.now().toIso8601String(),
      );
      _currentPlan = _currentPlan!.copyWith(doctorSignoff: updatedSignoff);
      notifyListeners();
    }
    return success;
  }

  void clearHandwrittenNotice() {
    _handwrittenNotice = null;
    notifyListeners();
  }

  void reset() {
    _currentPlan = null;
    _errorMessage = null;
    _handwrittenNotice = null;
    _isLoading = false;
    notifyListeners();
  }
}
