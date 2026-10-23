import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/discharge_provider.dart';
import '../../theme/app_theme.dart';

class DischargeProcessingScreen extends StatefulWidget {
  final String? imageBase64;
  final String? testDocId;

  const DischargeProcessingScreen({
    Key? key,
    this.imageBase64,
    this.testDocId,
  }) : super(key: key);

  @override
  State<DischargeProcessingScreen> createState() => _DischargeProcessingScreenState();
}

class _DischargeProcessingScreenState extends State<DischargeProcessingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  int _step = 0;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();

    _runPipeline();
  }

  void _runPipeline() async {
    final provider = Provider.of<DischargeProvider>(context, listen: false);

    // Step progression animation
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _step = 1);
    });
    Future.delayed(const Duration(milliseconds: 900), () {
      if (mounted) setState(() => _step = 2);
    });
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) setState(() => _step = 3);
    });

    await provider.processDischargeDocument(
      imageBase64: widget.imageBase64,
      testDocId: widget.testDocId,
    );

    if (mounted) {
      Navigator.pop(context);
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DischargeProvider>(context);
    final isTamil = provider.isTamil;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Pulse / Scanner animation
              Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    RotationTransition(
                      turns: _animController,
                      child: Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: SweepGradient(
                            colors: [
                              AppTheme.primaryColor.withOpacity(0.0),
                              AppTheme.primaryColor.withOpacity(0.4),
                              AppTheme.primaryColor,
                            ],
                          ),
                        ),
                      ),
                    ),
                    Container(
                      width: 116,
                      height: 116,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.biotech,
                          size: 52,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 36),

              Text(
                isTamil ? 'மருத்துவ அறிக்கையை பகுப்பாய்வு செய்கிறது...' : 'Analyzing Discharge Summary...',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 8),

              Text(
                isTamil
                    ? 'AI பார்வை மற்றும் இந்திய மருந்தியல் தரவுத்தளத்தின் மூலம் துல்லியமாக சரிபார்க்கப்படுகிறது'
                    : 'Vision OCR extraction & clinical safety gating in progress',
                style: const TextStyle(fontSize: 13, color: AppTheme.textSubtle),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 36),

              // Checklist steps
              _pipelineStep(
                title: isTamil ? 'மருத்துவ சுருக்கெழுத்துக்கள் விரிவாக்கம் (OD, BD, TDS, HS)' : 'Expanding clinical shorthand (OD, BD, TDS, HS, SOS)',
                isActive: _step >= 0,
                isDone: _step > 0,
              ),
              const SizedBox(height: 14),
              _pipelineStep(
                title: isTamil ? 'கையெழுத்து / அச்சு வகை சோதனை' : 'Handwriting vs. printed typography verification',
                isActive: _step >= 1,
                isDone: _step > 1,
              ),
              const SizedBox(height: 14),
              _pipelineStep(
                title: isTamil ? '170+ இந்திய மருந்து தரவுத்தளத்தில் அளவுகள் சரிபார்ப்பு' : 'Cross-checking with 170+ Indian Drug DB (min/max range)',
                isActive: _step >= 2,
                isDone: _step > 2,
              ),
              const SizedBox(height: 14),
              _pipelineStep(
                title: isTamil ? 'பாதுகாப்பற்ற மருந்தளவுகளை மறைத்தல் & தமிழ் அட்டவணை உருவாக்கம்' : 'Enforcing zero-guess dose masking & bilingual schedule',
                isActive: _step >= 3,
                isDone: false,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _pipelineStep({
    required String title,
    required bool isActive,
    required bool isDone,
  }) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isDone
                ? AppTheme.safeGreen
                : (isActive ? AppTheme.primaryColor : Colors.grey[200]),
          ),
          child: Center(
            child: isDone
                ? const Icon(Icons.check, size: 14, color: Colors.white)
                : (isActive
                    ? const SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const SizedBox()),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
              color: isActive ? AppTheme.textDark : AppTheme.textSubtle,
            ),
          ),
        ),
      ],
    );
  }
}
