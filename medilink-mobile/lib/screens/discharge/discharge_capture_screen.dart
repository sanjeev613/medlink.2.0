import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../providers/discharge_provider.dart';
import '../../theme/app_theme.dart';
import 'discharge_processing_screen.dart';
import 'discharge_main_screen.dart';

class DischargeCaptureScreen extends StatefulWidget {
  const DischargeCaptureScreen({Key? key}) : super(key: key);

  @override
  State<DischargeCaptureScreen> createState() => _DischargeCaptureScreenState();
}

class _DischargeCaptureScreenState extends State<DischargeCaptureScreen> {
  final ImagePicker _picker = ImagePicker();
  String? _selectedImageBase64;
  String? _selectedDocId;

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 88,
      );

      if (image != null) {
        final bytes = await image.readAsBytes();
        setState(() {
          _selectedImageBase64 = base64Encode(bytes);
          _selectedDocId = null;
        });
        _startProcessing();
      }
    } catch (e) {
      debugPrint('Image picker exception: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e')),
      );
    }
  }

  void _selectTestDocument(String docId) {
    setState(() {
      _selectedDocId = docId;
      _selectedImageBase64 = null;
    });
    _startProcessing();
  }

  void _startProcessing() async {
    final provider = Provider.of<DischargeProvider>(context, listen: false);

    // Navigate to processing loading screen
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DischargeProcessingScreen(
          imageBase64: _selectedImageBase64,
          testDocId: _selectedDocId,
        ),
      ),
    ).then((_) {
      // If handwriting notice was triggered
      if (provider.handwrittenNotice != null) {
        _showHandwritingRefusalDialog(
          provider.handwrittenNotice!,
          provider.hospitalPhone ?? '+91 44 2829 0200',
        );
      } else if (provider.currentPlan != null) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const DischargeMainScreen()),
        );
      }
    });
  }

  void _showHandwritingRefusalDialog(String message, String hospitalPhone) {
    final provider = Provider.of<DischargeProvider>(context, listen: false);
    final isTamil = provider.isTamil;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.cautionOrangeBg,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.edit_off, color: AppTheme.cautionOrange, size: 28),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                isTamil ? 'கையெழுத்து கண்டறியப்பட்டது' : 'Handwriting Detected',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.cautionOrangeBg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.cautionBorder),
              ),
              child: Text(
                message,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFB78103),
                  height: 1.4,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              isTamil
                  ? 'பாதுகாப்பு விதி: நோயாளி பாதுகாப்பிற்காக கையெழுத்தில் உள்ள மருந்துகளை யூகித்து அட்டவணை தயாரிப்பது தடை செய்யப்பட்டுள்ளது.'
                  : 'Safety Policy: For patient safety, handwriting is never guessed. Please consult the dispensing pharmacist or call your hospital.',
              style: const TextStyle(fontSize: 12, color: AppTheme.textSubtle),
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              provider.clearHandwrittenNotice();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Calling Hospital: $hospitalPhone')),
              );
            },
            icon: const Icon(Icons.phone, color: AppTheme.primaryColor),
            label: Text(
              isTamil ? 'மருத்துவமனைக்கு அழைக்கவும்' : 'Call Hospital',
              style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              provider.clearHandwrittenNotice();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.textDark,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(
              isTamil ? 'சரி' : 'Understood',
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DischargeProvider>(context);
    final isTamil = provider.isTamil;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.receipt_long, color: AppTheme.primaryColor, size: 22),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                isTamil ? 'டிஸ்சார்ஜ் மருந்து திட்டம்' : 'Discharge → Medication Plan',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
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
                      size: 16,
                      color: isTamil ? const Color(0xFF673AB7) : AppTheme.primaryColor,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isTamil ? 'தமிழ் (TA)' : 'English (EN)',
                      style: TextStyle(
                        fontSize: 12,
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Hero Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E88E5), Color(0xFF1565C0)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF1E88E5).withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.document_scanner, color: Colors.white, size: 28),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isTamil ? 'மருத்துவமனை டிஸ்சார்ஜ் அறிக்கை' : 'Hospital Discharge Summary',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              isTamil ? 'AI-ஆல் சரிபார்க்கப்பட்ட மருந்து அட்டவணை' : 'AI-Validated Patient Dosing & Schedule',
                              style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isTamil
                        ? 'மருத்துவமனையில் வழங்கப்பட்ட அச்சிடப்பட்ட டிஸ்சார்ஜ் சுருக்கத்தை புகைப்படம் எடுக்கவும். இந்திய மருந்து பாதுகாப்பு விதிகளின்படி மருந்தளவு சரிபார்க்கப்படும்.'
                        : 'Capture a printed hospital summary. The clinical engine extracts dosing, verifies against 170+ Indian medications, and never guesses an uncertain dose.',
                    style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13, height: 1.4),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Scan / Upload Action Buttons
            Text(
              isTamil ? '1. புகைப்படம் எடுக்கவும் / பதிவேற்றவும்' : '1. Capture or Upload Summary',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _actionButton(
                    icon: Icons.camera_alt,
                    label: isTamil ? 'கேமரா' : 'Camera Scan',
                    sub: isTamil ? 'நேரடி படம்' : 'Auto-deskew',
                    color: AppTheme.primaryColor,
                    onTap: () => _pickImage(ImageSource.camera),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _actionButton(
                    icon: Icons.photo_library,
                    label: isTamil ? 'கேலரி' : 'Gallery Upload',
                    sub: isTamil ? 'சேமித்த படம்' : 'JPG / PNG',
                    color: const Color(0xFF00897B),
                    onTap: () => _pickImage(ImageSource.gallery),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),

            // Instant Test Documents Section (Acceptance Criteria)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isTamil ? '2. மாதிரி அறிக்கைகள் (டெமோ சோதனைகள்)' : '2. Acceptance Test Scenarios (5 Docs)',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.safeGreenBg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isTamil ? '1-கிளிக் பரிசோதனை' : '1-Tap Testing',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.safeGreen),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              isTamil
                  ? 'கீழே உள்ள 5 மாதிரி மருத்துவ அறிக்கைகளில் ஏதேனும் ஒன்றை தேர்ந்தெடுத்து சோதிக்கவும்:'
                  : 'Test clear dosing, ambiguous doses, unit errors, unrecognized drugs, and handwritten refusal:',
              style: const TextStyle(fontSize: 12, color: AppTheme.textSubtle),
            ),
            const SizedBox(height: 12),

            // 5 Test Scenario Cards
            _testDocCard(
              id: 'doc-1-cardiology',
              title: isTamil ? '1. இதய சிகிச்சை டிஸ்சார்ஜ் (முழுதும் தெளிவானது)' : '1. Cardiology Post-PTCA (Clear - All OK)',
              subtitle: 'Apollo Greams Rd • Aspirin, Clopidogrel, Atorvastatin, Metoprolol, Pantoprazole',
              tag: '100% OK',
              tagColor: AppTheme.safeGreen,
              tagBg: AppTheme.safeGreenBg,
              icon: Icons.favorite,
              onTap: () => _selectTestDocument('doc-1-cardiology'),
            ),
            _testDocCard(
              id: 'doc-2-diabetes-ambiguous',
              title: isTamil ? '2. சர்க்கரை & ரத்த அழுத்தம் (மங்கலான மருந்து அளவு)' : '2. Diabetes & HTN (Deliberately Blurry/Ambiguous Dose)',
              subtitle: 'Fortis Malar • Amlodipine dose ink-smudged → Triggers needs_review & dose masking',
              tag: 'Dose Masked',
              tagColor: AppTheme.cautionOrange,
              tagBg: AppTheme.cautionOrangeBg,
              icon: Icons.water_drop,
              onTap: () => _selectTestDocument('doc-2-diabetes-ambiguous'),
            ),
            _testDocCard(
              id: 'doc-3-orthopedic-unit-mismatch',
              title: isTamil ? '3. முழங்கால் அறுவை சிகிச்சை (அளவீடு பிழை: 40g)' : '3. Knee Surgery (Unit Mismatch: 40g Pantoprazole)',
              subtitle: 'MIOT Hospital • Pantoprazole 40g instead of 40mg → Triggers unit_mismatch refusal',
              tag: 'Unit Mismatch',
              tagColor: AppTheme.warningRed,
              tagBg: AppTheme.warningRedBg,
              icon: Icons.personal_injury,
              onTap: () => _selectTestDocument('doc-3-orthopedic-unit-mismatch'),
            ),
            _testDocCard(
              id: 'doc-4-asthma-unrecognized',
              title: isTamil ? '4. ஆஸ்துமா சிகிச்சை (அங்கீகரிக்கப்படாத மருந்து)' : '4. Pulmonology Asthma (Unrecognized Drug Line)',
              subtitle: 'Kauvery Hospital • Pulmo-Mystifex-Z 800mg not in DB → Triggers unrecognized_drug_name',
              tag: 'Unrecognized Drug',
              tagColor: const Color(0xFF7B1FA2),
              tagBg: const Color(0xFFF3E5F5),
              icon: Icons.air,
              onTap: () => _selectTestDocument('doc-4-asthma-unrecognized'),
            ),
            _testDocCard(
              id: 'doc-5-handwritten-refusal',
              title: isTamil ? '5. மருத்துவரின் கையெழுத்து குறிப்பு (மறுப்பு சோதனை)' : '5. Handwritten Prescription (Refusal Policy Trigger)',
              subtitle: 'Govt Hospital • Pure cursive handwriting → Refuses extraction & directs to pharmacist',
              tag: 'Handwriting Refused',
              tagColor: const Color(0xFFC2185B),
              tagBg: const Color(0xFFFCE4EC),
              icon: Icons.draw,
              onTap: () => _selectTestDocument('doc-5-handwritten-refusal'),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _actionButton({
    required IconData icon,
    required String label,
    required String sub,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.08),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color),
            ),
            Text(
              sub,
              style: const TextStyle(fontSize: 11, color: AppTheme.textSubtle),
            ),
          ],
        ),
      ),
    );
  }

  Widget _testDocCard({
    required String id,
    required String title,
    required String subtitle,
    required String tag,
    required Color tagColor,
    required Color tagBg,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: tagBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: tagColor, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textDark,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: tagBg,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            tag,
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: tagColor),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSubtle, height: 1.3),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.arrow_forward_ios, size: 14, color: AppTheme.textSubtle),
            ],
          ),
        ),
      ),
    );
  }
}
