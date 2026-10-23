import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/discharge_provider.dart';
import '../../theme/app_theme.dart';

class DoctorSignoffSheet extends StatefulWidget {
  const DoctorSignoffSheet({Key? key}) : super(key: key);

  @override
  State<DoctorSignoffSheet> createState() => _DoctorSignoffSheetState();
}

class _DoctorSignoffSheetState extends State<DoctorSignoffSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController(text: 'Dr. S. Karthikeyan, MD, DM');
  final _regNoController = TextEditingController(text: 'TN-MC-88341');
  final _notesController = TextEditingController(
    text: 'All discharge medications and dosages clinically reviewed. Confirmed safe for patient administration.',
  );
  String _selectedRole = 'Doctor';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _regNoController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submitSignoff() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    final provider = Provider.of<DischargeProvider>(context, listen: false);

    await provider.signoffAdvisory(
      doctorName: _nameController.text.trim(),
      role: _selectedRole,
      registrationNo: _regNoController.text.trim(),
      notes: _notesController.text.trim(),
    );

    setState(() => _isSubmitting = false);

    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppTheme.safeGreen,
          content: Row(
            children: [
              const Icon(Icons.verified, color: Colors.white),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  provider.isTamil
                      ? 'மருத்துவர் சரிபார்ப்பு & ஒப்புதல் பதிவு செய்யப்பட்டது!'
                      : 'Clinical Advisory Sign-off recorded successfully!',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DischargeProvider>(context);
    final isTamil = provider.isTamil;

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 48,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.safeGreenBg,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.verified_user, color: AppTheme.safeGreen, size: 28),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isTamil ? 'மருத்துவர் / மருந்தாளுநர் சரிபார்ப்பு' : 'Clinical Advisory Sign-Off',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textDark,
                          ),
                        ),
                        Text(
                          isTamil
                              ? 'நோயாளியின் பயன்பாட்டிற்கு முன் மருத்துவ நிபுணர் ஒப்புதல்'
                              : 'Mandatory clinical review before real-patient administration',
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSubtle),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              // Role selector
              Text(
                isTamil ? 'மருத்துவ பங்கு (Role)' : 'Professional Role',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textDark),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _roleChip('Doctor', isTamil ? 'மருத்துவர்' : 'Doctor'),
                  const SizedBox(width: 8),
                  _roleChip('Clinical Pharmacist', isTamil ? 'மருந்தாளுநர்' : 'Pharmacist'),
                  const SizedBox(width: 8),
                  _roleChip('Chief Medical Officer', 'CMO'),
                ],
              ),
              const SizedBox(height: 16),
              // Doctor Name
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: isTamil ? 'மருத்துவர் பெயர்' : 'Reviewer Full Name',
                  prefixIcon: const Icon(Icons.person_outline),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              // Registration / Council No
              TextFormField(
                controller: _regNoController,
                decoration: InputDecoration(
                  labelText: isTamil ? 'மருத்துவ கவுன்சில் பதிவு எண்' : 'Medical Council / Pharmacy Reg. No.',
                  prefixIcon: const Icon(Icons.badge_outlined),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              // Clinical Advisory Notes
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: isTamil ? 'மருத்துவ குறிப்புகள் & ஆலோசனைகள்' : 'Clinical Advisory / Patient Counselling Notes',
                  prefixIcon: const Icon(Icons.note_alt_outlined),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submitSignoff,
                  icon: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.check_circle_outline, color: Colors.white),
                  label: Text(
                    isTamil ? 'சரிபார்த்து ஒப்புதல் அளி' : 'Verify & Sign-Off Regimen',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.safeGreen,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _roleChip(String value, String label) {
    final isSelected = _selectedRole == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (val) {
        if (val) setState(() => _selectedRole = value);
      },
      selectedColor: AppTheme.safeGreenBg,
      labelStyle: TextStyle(
        color: isSelected ? AppTheme.safeGreen : AppTheme.textSubtle,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontSize: 12,
      ),
      side: BorderSide(
        color: isSelected ? AppTheme.safeGreen : Colors.grey[300]!,
      ),
    );
  }
}
