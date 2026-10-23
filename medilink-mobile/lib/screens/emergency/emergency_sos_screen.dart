import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class EmergencySosScreen extends StatefulWidget {
  const EmergencySosScreen({Key? key}) : super(key: key);

  @override
  State<EmergencySosScreen> createState() => _EmergencySosScreenState();
}

class _EmergencySosScreenState extends State<EmergencySosScreen> {
  bool _isOffline = false;
  bool _isLoading = false;
  Map<String, dynamic>? _activeIncident;
  Timer? _pollingTimer;

  final String _backendUrl = 'http://localhost:5000/api/emergency';

  @override
  void initState() {
    super.initState();
    _fetchLatestIncident();
    _pollingTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!_isOffline) _fetchLatestIncident();
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchLatestIncident() async {
    try {
      final res = await http.get(Uri.parse('$_backendUrl/incidents'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['incidents'] != null && (data['incidents'] as List).isNotEmpty) {
          if (mounted) {
            setState(() {
              _activeIncident = data['incidents'][0];
            });
          }
        }
      }
    } catch (e) {
      // offline or unreachable
    }
  }

  Future<void> _activateSOS() async {
    setState(() => _isLoading = true);

    if (_isOffline) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.amber,
          content: Text('⚠️ Request saved offline. Please call 112 directly!'),
        ),
      );
      return;
    }

    try {
      final res = await http.post(
        Uri.parse('$_backendUrl/sos'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'latitude': 13.0067,
          'longitude': 80.2036,
          'address': 'Anna Salai near Guindy Flyover, Chennai',
          'emergencyType': 'Accident',
          'severeBleeding': true,
          'breathingDifficulty': true,
          'consciousness': 'Pain Responsive',
          'patientInfo': {
            'name': 'Karthik Ramanathan',
            'bloodGroup': 'O+',
            'allergies': ['Penicillin', 'Sulfa Drugs']
          }
        }),
      );

      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _activeIncident = data['incident'];
          _isLoading = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: Colors.red[700],
              content: Text('🚨 Emergency SOS Activated: Incident ${data['incident']['incidentId']} Created!'),
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Connection Notice: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = _activeIncident?['status'] ?? 'SOS_ACTIVATED';
    final ambEta = _activeIncident?['ambulance']?['etaMinutes'] ?? 8;
    final selectedHospital = _activeIncident?['hospitalMatching']?['selectedHospital']?['name'] ?? 'Apollo Speciality Hospital';

    return Scaffold(
      appBar: AppBar(
        title: const Text('MediLink AI 2.0 — SOS Portal'),
        backgroundColor: const Color(0xFFB71C1C),
        actions: [
          IconButton(
            icon: Icon(_isOffline ? Icons.wifi_off : Icons.wifi),
            tooltip: 'Toggle Network Mode',
            onPressed: () {
              setState(() => _isOffline = !_isOffline);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(_isOffline ? 'Low-Network Mode Activated' : 'Online Mode Reconnected'),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // SFIC 2026 Header
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E3A8A),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: const [
                  Text('🏆', style: TextStyle(fontSize: 20)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'SFIC 2026: Swasth & Samavesh Bharat\nPre-Hospital Medical Readiness Network',
                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Low Network Warning if offline
            if (_isOffline)
              Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.amber.shade900,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.amber.shade400),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '⚠️ Emergency request not delivered. Call emergency services.',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 10),
                    ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.phone),
                      label: const Text('Call 112 (National Emergency)'),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                    ),
                  ],
                ),
              ),

            // Big One-Tap SOS Button
            GestureDetector(
              onTap: _isLoading ? null : _activateSOS,
              child: Container(
                width: 170,
                height: 170,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const RadialGradient(
                    colors: [Color(0xFFEF4444), Color(0xFFB71C1C)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.red.withOpacity(0.5),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                  border: Border.all(color: Colors.white, width: 4),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.emergency, color: Colors.white, size: 52),
                    const SizedBox(height: 6),
                    Text(
                      _isLoading ? 'DISPATCHING...' : 'ONE-TAP SOS',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 15,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'One-Tap broadcast sends GPS, Blood Group & Allergies to ER',
              style: TextStyle(color: Colors.grey, fontSize: 12),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // Incident Status Card
            Card(
              elevation: 3,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'ID: ${_activeIncident?['incidentId'] ?? 'INC-2026-CH01'}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.red.shade100,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.red),
                          ),
                          child: Text(
                            status,
                            style: TextStyle(
                              color: Colors.red.shade900,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Receiving Hospital:', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        Text(
                          selectedHospital,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Ambulance ETA:', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        Text(
                          '~$ambEta mins',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue, fontSize: 14),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Hospital Pre-Arrival Team:', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        Text(
                          _activeIncident?['medicalTeam']?['teamReady'] == true ? 'READY ✓' : 'PREPARING...',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _activeIncident?['medicalTeam']?['teamReady'] == true ? Colors.green : Colors.orange,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
