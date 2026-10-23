import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/medication_plan.dart';
import '../../providers/discharge_provider.dart';
import '../../theme/app_theme.dart';
import 'doctor_signoff_sheet.dart';

class DischargeMainScreen extends StatefulWidget {
  const DischargeMainScreen({Key? key}) : super(key: key);

  @override
  State<DischargeMainScreen> createState() => _DischargeMainScreenState();
}

class _DischargeMainScreenState extends State<DischargeMainScreen> {
  int _currentTabIndex = 0; // 0: Home/Today, 1: Full Schedule, 2: Review Needed

  void _showTTSAudioPlayback(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF1E293B),
        duration: const Duration(seconds: 3),
        content: Row(
          children: [
            const Icon(Icons.volume_up, color: AppTheme.primaryColor),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Bhashini AI Text-to-Speech (TTS)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                  ),
                  Text(
                    message,
                    style: TextStyle(fontSize: 11, color: Colors.grey[300]),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openDoctorSignoff() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const DoctorSignoffSheet(),
    );
  }

  void _callHospital(String? phone) {
    final phoneNumber = phone ?? '+91 44 2829 0200';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: const [
            Icon(Icons.phone_in_talk, color: AppTheme.primaryColor),
            SizedBox(width: 8),
            Text('Quick Dial Hospital', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Dialing hospital desk to clarify flagged medication:', style: TextStyle(color: AppTheme.textSubtle, fontSize: 13)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.local_hospital, color: AppTheme.textDark, size: 20),
                  const SizedBox(width: 8),
                  Text(phoneNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Simulating telephone call to $phoneNumber...')),
              );
            },
            icon: const Icon(Icons.call, color: Colors.white, size: 18),
            label: const Text('Call Now', style: TextStyle(color: Colors.white)),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.safeGreen),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DischargeProvider>(context);
    final plan = provider.currentPlan;
    final isTamil = provider.isTamil;
    final lang = provider.currentLanguage;

    if (plan == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Medication Plan')),
        body: const Center(child: Text('No active discharge plan loaded.')),
      );
    }

    final flaggedMedicines = plan.flaggedMedicines;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              plan.patientName,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              plan.hospitalName,
              style: const TextStyle(fontSize: 11, color: AppTheme.textSubtle),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        actions: [
          // Audio TTS stub button
          IconButton(
            tooltip: isTamil ? 'குரல் மூலம் கேட்க (TTS)' : 'Listen via Audio TTS',
            icon: const Icon(Icons.volume_up_outlined, color: AppTheme.textDark),
            onPressed: () {
              final sampleSpeech = isTamil
                  ? 'எச்சரிக்கை: ${plan.warningSigns.isNotEmpty ? plan.warningSigns[0].localizedText("ta") : "மருத்துவர் ஆலோசனை"}. அடுத்த சந்திப்பு: ${plan.followUp.date ?? "நிர்ணயிக்கப்படவில்லை"}.'
                  : 'Warning: ${plan.warningSigns.isNotEmpty ? plan.warningSigns[0].localizedText("en") : "Consult doctor"}. Follow up on ${plan.followUp.date ?? "scheduled date"}.';
              _showTTSAudioPlayback(sampleSpeech);
            },
          ),
          // Language Switcher Toggle
          Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: provider.toggleLanguage,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isTamil ? const Color(0xFFEDE7F6) : const Color(0xFFE0F2FE),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isTamil ? const Color(0xFF673AB7) : AppTheme.primaryColor,
                    width: 1.5,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.translate,
                      size: 15,
                      color: isTamil ? const Color(0xFF673AB7) : AppTheme.primaryColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isTamil ? 'தமிழ்' : 'English',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isTamil ? const Color(0xFF673AB7) : AppTheme.primaryColor,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: _buildCurrentTabBody(plan, isTamil, lang),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTabIndex,
        onDestinationSelected: (idx) => setState(() => _currentTabIndex = idx),
        backgroundColor: Colors.white,
        elevation: 8,
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.today_outlined),
            selectedIcon: const Icon(Icons.today, color: AppTheme.primaryColor),
            label: isTamil ? 'இன்று' : 'Today / Home',
          ),
          NavigationDestination(
            icon: const Icon(Icons.calendar_month_outlined),
            selectedIcon: const Icon(Icons.calendar_month, color: AppTheme.primaryColor),
            label: isTamil ? 'முழு அட்டவணை' : 'Full Schedule',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: flaggedMedicines.isNotEmpty,
              label: Text('${flaggedMedicines.length}'),
              backgroundColor: AppTheme.warningRed,
              child: const Icon(Icons.warning_amber_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: flaggedMedicines.isNotEmpty,
              label: Text('${flaggedMedicines.length}'),
              backgroundColor: AppTheme.warningRed,
              child: const Icon(Icons.warning_amber, color: AppTheme.warningRed),
            ),
            label: isTamil ? 'சரிபார்ப்பு' : 'Review Needed',
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentTabBody(MedicationPlan plan, bool isTamil, String lang) {
    switch (_currentTabIndex) {
      case 0:
        return _buildHomeTodayScreen(plan, isTamil, lang);
      case 1:
        return _buildFullScheduleScreen(plan, isTamil, lang);
      case 2:
        return _buildReviewNeededScreen(plan, isTamil, lang);
      default:
        return _buildHomeTodayScreen(plan, isTamil, lang);
    }
  }

  // ==========================================================
  // SCREEN 3: HOME / TODAY
  // Warning signs and follow-up card on top WITHOUT SCROLLING!
  // ==========================================================
  Widget _buildHomeTodayScreen(MedicationPlan plan, bool isTamil, String lang) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. WARNING SIGNS (RED BANNER, TOP OF SCREEN - MANDATORY ACCEPTANCE CRITERIA)
          if (plan.warningSigns.isNotEmpty) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.warningRedBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.warningBorder, width: 1.5),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: AppTheme.warningRed,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.warning_rounded, color: Colors.white, size: 18),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          isTamil ? 'அவசர எச்சரிக்கை அறிகுறிகள்' : 'URGENT WARNING SIGNS',
                          style: const TextStyle(
                            color: AppTheme.warningRed,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        icon: const Icon(Icons.volume_up, size: 18, color: AppTheme.warningRed),
                        onPressed: () => _showTTSAudioPlayback(
                          plan.warningSigns.map((w) => w.localizedText(lang)).join(', '),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ...plan.warningSigns.map(
                    (w) => Padding(
                      padding: const EdgeInsets.only(bottom: 6.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('🚨 ', style: TextStyle(fontSize: 13)),
                          Expanded(
                            child: Text(
                              w.localizedText(lang),
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF991B1B),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // 2. PINNED FOLLOW-UP DATE & WHAT TO CARRY CHECKLIST (TOP PINNED CARD)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.event, color: AppTheme.primaryColor, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isTamil ? 'அடுத்த மருத்துவ சந்திப்பு (Follow-up)' : 'Next Follow-Up Appointment',
                            style: const TextStyle(fontSize: 12, color: AppTheme.textSubtle),
                          ),
                          Text(
                            plan.followUp.date ?? (isTamil ? 'மருத்துவரிடம் உறுதிப்படுத்தவும்' : 'Consult Hospital'),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textDark,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        isTamil ? 'உறுதி செய்யப்பட்டது' : 'Scheduled',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.safeGreen),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24, thickness: 0.8),
                Text(
                  isTamil ? 'கொண்டு செல்ல வேண்டியவை (Checklist):' : 'What to Carry with You:',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                ),
                const SizedBox(height: 8),
                ...plan.followUp.localizedCarryList(lang).map(
                  (item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3.0),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, size: 16, color: AppTheme.safeGreen),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            item,
                            style: const TextStyle(fontSize: 13, color: AppTheme.textDark),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // 3. DOCTOR / PHARMACIST ADVISORY SIGN-OFF BADGE
          _buildDoctorSignoffBanner(plan, isTamil),

          const SizedBox(height: 18),

          // 4. TODAY'S MEDICINE SCHEDULE HEADER
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                isTamil ? "இன்றைய மருந்துகள்" : "Today's Medication Doses",
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textDark),
              ),
              Text(
                '${plan.medicines.length} ${isTamil ? "மருந்துகள்" : "meds"}',
                style: const TextStyle(fontSize: 13, color: AppTheme.textSubtle),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // 5. MEDICINES LIST (Strict Rendering Rule: Flagged lines never show dose/time)
          ...plan.medicines.map((med) => _buildMedicineCard(med, isTamil, lang)),
        ],
      ),
    );
  }

  // ==========================================================
  // SCREEN 4: FULL SCHEDULE (DAY-BY-DAY CALENDAR VIEW)
  // ==========================================================
  Widget _buildFullScheduleScreen(MedicationPlan plan, bool isTamil, String lang) {
    final provider = Provider.of<DischargeProvider>(context);
    final selectedDay = provider.selectedDay;

    return Column(
      children: [
        // Day selector chips (Day 1 to 14)
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: SizedBox(
            height: 48,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 14,
              itemBuilder: (ctx, index) {
                final dayNum = index + 1;
                final isSelected = dayNum == selectedDay;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: Text(isTamil ? 'நாள் $dayNum' : 'Day $dayNum'),
                    selected: isSelected,
                    onSelected: (val) {
                      if (val) provider.setSelectedDay(dayNum);
                    },
                    selectedColor: AppTheme.primaryColor,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : AppTheme.textDark,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                );
              },
            ),
          ),
        ),
        const Divider(height: 1),

        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Day summary card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.access_time, color: AppTheme.primaryColor, size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isTamil ? 'அட்டவணை: நாள் $selectedDay' : 'Regimen Schedule: Day $selectedDay',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          Text(
                            isTamil ? 'உணவு மற்றும் நேரத்தின்படி ஒழுங்கமைக்கப்பட்டது' : 'Grouped by time-of-day and food timing',
                            style: const TextStyle(fontSize: 12, color: AppTheme.textSubtle),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Time of Day Blocks: Morning (காலை)
              _buildTimeOfDayBlock(
                title: isTamil ? 'காலை மருந்துகள்' : 'Morning Doses',
                icon: Icons.wb_sunny,
                iconColor: const Color(0xFFF59E0B),
                medicines: plan.medicines.where((m) =>
                    m.frequencyCode == 'OD' ||
                    m.frequencyCode == 'BD' ||
                    m.frequencyCode == 'TDS' ||
                    m.frequencyCode == 'QID').toList(),
                isTamil: isTamil,
                lang: lang,
              ),

              const SizedBox(height: 16),

              // Afternoon (மதியம்)
              _buildTimeOfDayBlock(
                title: isTamil ? 'மதிய மருந்துகள்' : 'Afternoon Doses',
                icon: Icons.sunny,
                iconColor: const Color(0xFFEF4444),
                medicines: plan.medicines.where((m) =>
                    m.frequencyCode == 'TDS' ||
                    m.frequencyCode == 'QID').toList(),
                isTamil: isTamil,
                lang: lang,
              ),

              const SizedBox(height: 16),

              // Night / Bedtime (இரவு)
              _buildTimeOfDayBlock(
                title: isTamil ? 'இரவு / படுக்கை முன் மருந்துகள்' : 'Night & Bedtime Doses',
                icon: Icons.nightlight_round,
                iconColor: const Color(0xFF6366F1),
                medicines: plan.medicines.where((m) =>
                    m.frequencyCode == 'BD' ||
                    m.frequencyCode == 'TDS' ||
                    m.frequencyCode == 'QID' ||
                    m.frequencyCode == 'HS').toList(),
                isTamil: isTamil,
                lang: lang,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================================
  // SCREEN 5: REVIEW NEEDED (FLAGGED MEDICINES TAB)
  // ==========================================================
  Widget _buildReviewNeededScreen(MedicationPlan plan, bool isTamil, String lang) {
    final flagged = plan.flaggedMedicines;

    if (flagged.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.safeGreenBg,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.verified, size: 64, color: AppTheme.safeGreen),
              ),
              const SizedBox(height: 20),
              Text(
                isTamil ? 'அனைத்து மருந்துகளும் சரிபார்க்கப்பட்டது!' : 'All Medications Safely Validated!',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                isTamil
                    ? 'எந்தவொரு சந்தேகத்திற்குரிய அல்லது படிக்க முடியாத மருந்துகளும் இல்லை.'
                    : 'No ambiguous, unrecognized, or out-of-range dosage was found in this discharge summary.',
                style: const TextStyle(fontSize: 13, color: AppTheme.textSubtle),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Alert Callout Header
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.warningRedBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.warningBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.error_outline, color: AppTheme.warningRed, size: 24),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      isTamil
                          ? '${flagged.length} மருந்து(கள்) பாதுகாப்பு மறுபரிசீலனை தேவை'
                          : '${flagged.length} Medication(s) Require Clinical Confirmation',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.warningRed,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                isTamil
                    ? 'கீழே உள்ள மருந்துகள் மருத்துவமனையின் அசல் குறிப்பில் தெளிவாக இல்லை அல்லது அனுமதிக்கப்பட்ட அளவுக்குள் இல்லை. நோயாளியின் பாதுகாப்பிற்காக இவை அட்டவணையில் இருந்து மறைக்கப்பட்டுள்ளன.'
                    : 'The items below had low OCR confidence, an unverified drug entity, or unit mismatch. For patient safety, their doses are never guessed.',
                style: const TextStyle(fontSize: 12, color: Color(0xFF7F1D1D), height: 1.4),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _callHospital(plan.hospitalPhone),
                  icon: const Icon(Icons.phone, color: Colors.white, size: 18),
                  label: Text(
                    isTamil ? 'மருத்துவமனையை அழைக்கவும்: ${plan.hospitalPhone}' : 'Call Hospital: ${plan.hospitalPhone}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.warningRed,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Flagged Items List with Raw text and Reason
        ...flagged.map(
          (med) => Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.warningBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.warningRedBg,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.block, color: AppTheme.warningRed, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            med.drugName ?? 'Unidentified Medication Line',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textDark,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEE2E2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Reason: ${med.reason ?? "Flagged for safety"}',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF991B1B)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(height: 20),
                Text(
                  isTamil ? 'அசல் மருத்துவ குறிப்பு (Raw OCR Text):' : 'Raw Text Extracted from Summary:',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSubtle),
                ),
                const SizedBox(height: 4),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Text(
                    med.rawText,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: Color(0xFF334155),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  med.localizedSafetyWarning(lang),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFB45309),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ==========================================================
  // HELPER WIDGETS
  // ==========================================================
  Widget _buildDoctorSignoffBanner(MedicationPlan plan, bool isTamil) {
    final signoff = plan.doctorSignoff;
    final isSigned = signoff.signed;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isSigned ? AppTheme.safeGreenBg : const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSigned ? AppTheme.safeGreenBorder : const Color(0xFFFDE68A),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isSigned ? Icons.verified : Icons.admin_panel_settings,
            color: isSigned ? AppTheme.safeGreen : const Color(0xFFD97706),
            size: 28,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isSigned
                      ? (isTamil ? 'மருத்துவர் சரிபார்த்து கையொப்பமிட்டார்' : 'Clinically Signed-Off')
                      : (isTamil ? 'மருத்துவர் சரிபார்ப்பு நிலுவையில் உள்ளது' : 'Doctor / Pharmacist Sign-Off Pending'),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: isSigned ? AppTheme.safeGreen : const Color(0xFF92400E),
                  ),
                ),
                Text(
                  isSigned
                      ? '${signoff.reviewedBy ?? "Doctor"} (${signoff.role ?? "Physician"}, Reg: ${signoff.registrationNo ?? "TN"})'
                      : (isTamil ? 'நோயாளியின் பயன்பாட்டிற்கு முன் மருத்துவ ஒப்புதல் தேவை' : 'Advisory review recommended before first dose'),
                  style: TextStyle(
                    fontSize: 11,
                    color: isSigned ? const Color(0xFF166534) : const Color(0xFF78350F),
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: _openDoctorSignoff,
            style: ElevatedButton.styleFrom(
              backgroundColor: isSigned ? AppTheme.safeGreen : const Color(0xFFD97706),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: Text(
              isSigned ? (isTamil ? 'விவரம்' : 'View') : (isTamil ? 'ஒப்புதல்' : 'Sign Off'),
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMedicineCard(MedicineItem med, bool isTamil, String lang) {
    final isFlagged = med.isNeedsReview;

    // Strict Rendering Rule: If flagged, NEVER show dose/time. Show refusal warning banner!
    if (isFlagged) {
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFFECACA), width: 1.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.warning_amber_rounded, color: AppTheme.warningRed, size: 22),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    med.drugName ?? 'Unidentified Medicine',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textDark),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    isTamil ? 'சரிபார்ப்பு தேவை' : 'Needs Review',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.warningRed),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              med.localizedSafetyWarning(lang),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF991B1B)),
            ),
            const SizedBox(height: 6),
            Text(
              '${isTamil ? "அசல் குறிப்பு" : "Raw OCR"}: "${med.rawText}" (${med.reason ?? "uncertain"})',
              style: const TextStyle(fontSize: 11, color: AppTheme.textSubtle, fontStyle: FontStyle.italic),
            ),
          ],
        ),
      );
    }

    // Normal OK Medicine Card
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.medication, color: AppTheme.primaryColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      med.drugName ?? 'Medicine',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textDark,
                      ),
                    ),
                    Text(
                      '${med.dose ?? ""} ${med.unit ?? "mg"} • ${med.localizedFrequency(lang)}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.volume_up, size: 18, color: AppTheme.textSubtle),
                onPressed: () {
                  final speech = '${med.drugName}, ${med.dose}${med.unit}. ${med.localizedFrequency(lang)}, ${med.localizedFoodTiming(lang)}.';
                  _showTTSAudioPlayback(speech);
                },
              ),
            ],
          ),
          const Divider(height: 20),
          Row(
            children: [
              // Food timing badge
              _badgeChip(
                icon: Icons.restaurant,
                text: med.localizedFoodTiming(lang),
                color: const Color(0xFF0284C7),
                bg: const Color(0xFFE0F2FE),
              ),
              const SizedBox(width: 8),
              // Duration countdown badge
              _badgeChip(
                icon: Icons.timelapse,
                text: '${med.durationDays} ${isTamil ? "நாட்கள் மீதம்" : "days left"}',
                color: const Color(0xFF059669),
                bg: const Color(0xFFD1FAE5),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimeOfDayBlock({
    required String title,
    required IconData icon,
    required Color iconColor,
    required List<MedicineItem> medicines,
    required bool isTamil,
    required String lang,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 22),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textDark),
              ),
              const Spacer(),
              Text(
                '${medicines.length} ${isTamil ? "மருந்துகள்" : "doses"}',
                style: const TextStyle(fontSize: 12, color: AppTheme.textSubtle),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (medicines.isEmpty)
            Text(
              isTamil ? 'இந்த நேரத்தில் மருந்துகள் இல்லை' : 'No scheduled medications for this window',
              style: const TextStyle(fontSize: 12, color: AppTheme.textSubtle, fontStyle: FontStyle.italic),
            )
          else
            ...medicines.map((m) {
              if (m.isNeedsReview) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6.0),
                  child: Text(
                    '⚠️ ${m.drugName ?? "Medicine"} - ${m.localizedSafetyWarning(lang)}',
                    style: const TextStyle(fontSize: 12, color: AppTheme.warningRed),
                  ),
                );
              }
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  children: [
                    const Icon(Icons.circle, size: 8, color: AppTheme.primaryColor),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${m.drugName} ${m.dose}${m.unit}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                    Text(
                      m.localizedFoodTiming(lang),
                      style: const TextStyle(fontSize: 11, color: AppTheme.textSubtle),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _badgeChip({
    required IconData icon,
    required String text,
    required Color color,
    required Color bg,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
          ),
        ],
      ),
    );
  }
}
