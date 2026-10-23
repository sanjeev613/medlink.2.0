class MedicineItem {
  final String rawText;
  final String? drugName;
  final String? dose;
  final String? unit;
  final String? frequencyCode;
  final String? frequencyHuman;
  final String? frequencyHumanTa;
  final int durationDays;
  final String foodTiming;
  final String? foodTimingTa;
  final double confidence;
  final String status; // 'ok' | 'needs_review' | 'rejected'
  final String? reason;
  final String? safetyWarningEn;
  final String? safetyWarningTa;
  final String? matchedDrug;
  final double? matchScore;

  MedicineItem({
    required this.rawText,
    this.drugName,
    this.dose,
    this.unit,
    this.frequencyCode,
    this.frequencyHuman,
    this.frequencyHumanTa,
    this.durationDays = 7,
    this.foodTiming = 'after_food',
    this.foodTimingTa,
    required this.confidence,
    this.status = 'ok',
    this.reason,
    this.safetyWarningEn,
    this.safetyWarningTa,
    this.matchedDrug,
    this.matchScore,
  });

  bool get isNeedsReview => status == 'needs_review';

  String localizedFrequency(String lang) {
    if (lang == 'ta' && frequencyHumanTa != null && frequencyHumanTa!.isNotEmpty) {
      return frequencyHumanTa!;
    }
    return frequencyHuman ?? frequencyCode ?? 'As prescribed';
  }

  String localizedFoodTiming(String lang) {
    if (lang == 'ta' && foodTimingTa != null && foodTimingTa!.isNotEmpty) {
      return foodTimingTa!;
    }
    switch (foodTiming) {
      case 'before_food':
        return 'Before food (Empty stomach)';
      case 'with_food':
        return 'With food';
      case 'bedtime':
        return 'At bedtime';
      case 'after_food':
      default:
        return 'After food';
    }
  }

  String localizedSafetyWarning(String lang) {
    if (lang == 'ta') {
      return safetyWarningTa ??
          '⚠️ இந்த மருந்தை பாதுகாப்பாக படிக்க முடியவில்லை. உட்கொள்ளும் முன் உங்கள் மருத்துவர் அல்லது மருந்தாளுநரிடம் உறுதிப்படுத்தவும்.';
    }
    return safetyWarningEn ??
        '⚠️ Could not read this medicine safely. Please confirm with your hospital or pharmacist before taking it.';
  }

  factory MedicineItem.fromJson(Map<String, dynamic> json) {
    return MedicineItem(
      rawText: json['raw_text'] ?? '',
      drugName: json['drug_name'],
      dose: json['dose'] != null ? json['dose'].toString() : null,
      unit: json['unit']?.toString() ?? 'mg',
      frequencyCode: json['frequency_code'],
      frequencyHuman: json['frequency_human'],
      frequencyHumanTa: json['frequency_human_ta'],
      durationDays: json['duration_days'] is num ? (json['duration_days'] as num).toInt() : 7,
      foodTiming: json['food_timing'] ?? 'after_food',
      foodTimingTa: json['food_timing_ta'],
      confidence: (json['confidence'] is num) ? (json['confidence'] as num).toDouble() : 0.0,
      status: json['status'] ?? 'ok',
      reason: json['reason'],
      safetyWarningEn: json['safety_warning_en'],
      safetyWarningTa: json['safety_warning_ta'],
      matchedDrug: json['matched_drug'],
      matchScore: (json['match_score'] is num) ? (json['match_score'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'raw_text': rawText,
      'drug_name': drugName,
      'dose': dose,
      'unit': unit,
      'frequency_code': frequencyCode,
      'frequency_human': frequencyHuman,
      'frequency_human_ta': frequencyHumanTa,
      'duration_days': durationDays,
      'food_timing': foodTiming,
      'food_timing_ta': foodTimingTa,
      'confidence': confidence,
      'status': status,
      'reason': reason,
      'safety_warning_en': safetyWarningEn,
      'safety_warning_ta': safetyWarningTa,
      'matched_drug': matchedDrug,
      'match_score': matchScore,
    };
  }
}

class FollowUpPlan {
  final String? date;
  final List<String> whatToCarry;
  final List<String> whatToCarryTa;
  final double confidence;
  final String status;

  FollowUpPlan({
    this.date,
    this.whatToCarry = const [],
    this.whatToCarryTa = const [],
    this.confidence = 0.9,
    this.status = 'ok',
  });

  List<String> localizedCarryList(String lang) {
    if (lang == 'ta' && whatToCarryTa.isNotEmpty) {
      return whatToCarryTa;
    }
    return whatToCarry;
  }

  factory FollowUpPlan.fromJson(Map<String, dynamic> json) {
    return FollowUpPlan(
      date: json['date'],
      whatToCarry: (json['what_to_carry'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      whatToCarryTa: (json['what_to_carry_ta'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      confidence: (json['confidence'] is num) ? (json['confidence'] as num).toDouble() : 0.9,
      status: json['status'] ?? 'ok',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'what_to_carry': whatToCarry,
      'what_to_carry_ta': whatToCarryTa,
      'confidence': confidence,
      'status': status,
    };
  }
}

class WarningSign {
  final String text;
  final String? textTa;
  final double confidence;

  WarningSign({
    required this.text,
    this.textTa,
    this.confidence = 0.95,
  });

  String localizedText(String lang) {
    if (lang == 'ta' && textTa != null && textTa!.isNotEmpty) {
      return textTa!;
    }
    return text;
  }

  factory WarningSign.fromJson(Map<String, dynamic> json) {
    return WarningSign(
      text: json['text'] ?? '',
      textTa: json['text_ta'],
      confidence: (json['confidence'] is num) ? (json['confidence'] as num).toDouble() : 0.95,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'text': text,
      'text_ta': textTa,
      'confidence': confidence,
    };
  }
}

class DoctorSignoff {
  final bool signed;
  final String? reviewedBy;
  final String? role;
  final String? registrationNo;
  final String? notes;
  final String? signedAt;

  DoctorSignoff({
    this.signed = false,
    this.reviewedBy,
    this.role,
    this.registrationNo,
    this.notes,
    this.signedAt,
  });

  factory DoctorSignoff.fromJson(Map<String, dynamic> json) {
    return DoctorSignoff(
      signed: json['signed'] == true,
      reviewedBy: json['reviewed_by'],
      role: json['role'],
      registrationNo: json['registration_no'],
      notes: json['notes'],
      signedAt: json['signed_at']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'signed': signed,
      'reviewed_by': reviewedBy,
      'role': role,
      'registration_no': registrationNo,
      'notes': notes,
      'signed_at': signedAt,
    };
  }
}

class MedicationPlan {
  final String summaryId;
  final String extractedAt;
  final String patientName;
  final String hospitalName;
  final String hospitalPhone;
  final List<MedicineItem> medicines;
  final FollowUpPlan followUp;
  final List<WarningSign> warningSigns;
  final String language; // 'en' | 'ta'
  final bool reviewNeeded;
  final int flaggedCount;
  final bool handwrittenDetected;
  final DoctorSignoff doctorSignoff;

  MedicationPlan({
    required this.summaryId,
    required this.extractedAt,
    this.patientName = 'Patient',
    this.hospitalName = 'Hospital',
    this.hospitalPhone = '+91 44 2829 0200',
    this.medicines = const [],
    required this.followUp,
    this.warningSigns = const [],
    this.language = 'en',
    this.reviewNeeded = false,
    this.flaggedCount = 0,
    this.handwrittenDetected = false,
    required this.doctorSignoff,
  });

  List<MedicineItem> get validMedicines => medicines.where((m) => m.status == 'ok').toList();
  List<MedicineItem> get flaggedMedicines => medicines.where((m) => m.status == 'needs_review').toList();

  factory MedicationPlan.fromJson(Map<String, dynamic> json) {
    return MedicationPlan(
      summaryId: json['summary_id'] ?? '',
      extractedAt: json['extracted_at'] ?? DateTime.now().toIso8601String(),
      patientName: json['patient_name'] ?? 'Patient',
      hospitalName: json['hospital_name'] ?? 'Hospital',
      hospitalPhone: json['hospital_phone'] ?? '+91 44 2829 0200',
      medicines: (json['medicines'] as List<dynamic>?)
              ?.map((e) => MedicineItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      followUp: json['follow_up'] != null
          ? FollowUpPlan.fromJson(json['follow_up'] as Map<String, dynamic>)
          : FollowUpPlan(),
      warningSigns: (json['warning_signs'] as List<dynamic>?)
              ?.map((e) => WarningSign.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      language: json['language'] ?? 'en',
      reviewNeeded: json['review_needed'] == true,
      flaggedCount: json['flagged_count'] is num ? (json['flagged_count'] as num).toInt() : 0,
      handwrittenDetected: json['handwritten_detected'] == true,
      doctorSignoff: json['doctor_signoff'] != null
          ? DoctorSignoff.fromJson(json['doctor_signoff'] as Map<String, dynamic>)
          : DoctorSignoff(),
    );
  }

  MedicationPlan copyWith({
    String? language,
    DoctorSignoff? doctorSignoff,
  }) {
    return MedicationPlan(
      summaryId: summaryId,
      extractedAt: extractedAt,
      patientName: patientName,
      hospitalName: hospitalName,
      hospitalPhone: hospitalPhone,
      medicines: medicines,
      followUp: followUp,
      warningSigns: warningSigns,
      language: language ?? this.language,
      reviewNeeded: reviewNeeded,
      flaggedCount: flaggedCount,
      handwrittenDetected: handwrittenDetected,
      doctorSignoff: doctorSignoff ?? this.doctorSignoff,
    );
  }
}
