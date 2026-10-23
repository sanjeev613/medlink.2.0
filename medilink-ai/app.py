from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import warnings

warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Initialize models
models = {
    'diabetes': None,
    'heart_disease': None,
    'hypertension': None
}

scalers = {}

# Initialize or load models
def initialize_models():
    """Initialize disease prediction models"""
    # In production: Load pre-trained models from joblib files
    # For now, we'll create dummy models that will be trained on data
    pass

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'AI Service Running'})

@app.route('/predict', methods=['POST'])
def predict():
    """
    AI Disease Prediction Endpoint
    
    Expected input:
    {
        'age': int,
        'gender': str,
        'bloodGroup': str,
        'height': float (cm),
        'weight': float (kg),
        'bmi': float,
        'medicalConditions': list,
        'symptoms': list,
        'exerciseFrequency': str,
        'dietType': str,
        'smoker': bool,
        'alcoholConsumption': str,
        'stressLevel': str
    }
    """
    try:
        data = request.get_json()
        
        # Extract and validate data
        age = data.get('age', 0)
        gender = data.get('gender', 'Male')
        height = data.get('height', 170)
        weight = data.get('weight', 70)
        bmi = weight / ((height / 100) ** 2)
        
        # Encode categorical variables
        gender_encoded = 1 if gender == 'Female' else 0
        
        # Prepare feature vector
        features = np.array([[
            age,
            gender_encoded,
            bmi,
            calculate_risk_score(data),
            len(data.get('medicalConditions', [])),
            len(data.get('symptoms', []))
        ]])
        
        # Run predictions
        predictions = predict_diseases(features, data)
        
        return jsonify({
            'primaryRisk': predictions['primary_risk'],
            'riskLevel': predictions['risk_level'],
            'riskPercentage': predictions['risk_percentage'],
            'suggestedTests': predictions['suggested_tests'],
            'preventiveMeasures': predictions['preventive_measures'],
            'recommendations': predictions['recommendations'],
            'allPredictions': predictions['all_predictions']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/assess-risk', methods=['POST'])
def assess_risk():
    """
    Assess user risk profile for insurance recommendations
    """
    try:
        data = request.get_json()
        
        risk_factors = []
        risk_score = 0
        
        age = data.get('age', 0)
        if age > 50:
            risk_factors.append('Age-Related')
            risk_score += 2
        
        bmi = data.get('bmi', 0)
        if bmi > 30:
            risk_factors.append('Obesity')
            risk_score += 2
        elif bmi > 25:
            risk_factors.append('Overweight')
            risk_score += 1
        
        conditions = data.get('medicalConditions', [])
        if 'Diabetes' in conditions:
            risk_factors.append('Diabetes')
            risk_score += 3
        if 'Hypertension' in conditions:
            risk_factors.append('Hypertension')
            risk_score += 2
        if 'Heart Disease' in conditions:
            risk_factors.append('Heart-Related')
            risk_score += 3
        
        risk_level = 'Low' if risk_score < 3 else ('Medium' if risk_score < 6 else 'High')
        
        return jsonify({
            'riskFactors': risk_factors,
            'riskScore': risk_score,
            'riskLevel': risk_level
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

def calculate_risk_score(data):
    """Calculate risk score based on user data"""
    score = 0
    
    # Lifestyle factors
    exercise = data.get('exerciseFrequency', 'Never')
    if exercise == 'Never':
        score += 2
    elif exercise in ['Rarely', 'Sometimes']:
        score += 1
    
    diet = data.get('dietType', 'Regular')
    if diet == 'High Fast Food':
        score += 2
    
    if data.get('smoker', False):
        score += 3
    
    alcohol = data.get('alcoholConsumption', 'None')
    if alcohol in ['Heavy', 'Moderate']:
        score += 1
    
    stress = data.get('stressLevel', 'Low')
    if stress == 'High':
        score += 1
    
    return score

def predict_diseases(features, user_data):
    """Predict diseases based on user data"""
    
    # Simulate predictions based on risk factors
    risk_score = calculate_risk_score(user_data)
    conditions = user_data.get('medicalConditions', [])
    symptoms = user_data.get('symptoms', [])
    
    predictions = {
        'primary_risk': 'No Significant Risk',
        'risk_level': 'Low',
        'risk_percentage': 10,
        'suggested_tests': [],
        'preventive_measures': [],
        'recommendations': [],
        'all_predictions': {}
    }
    
    # Diabetes prediction
    diabetes_risk = check_diabetes_risk(user_data)
    if diabetes_risk > 0.6:
        predictions['all_predictions']['Diabetes'] = {'probability': diabetes_risk, 'level': 'High'}
        if predictions['risk_percentage'] < diabetes_risk * 100:
            predictions['primary_risk'] = 'Diabetes'
            predictions['risk_percentage'] = diabetes_risk * 100
            predictions['suggested_tests'].extend(['Fasting Blood Sugar', 'HbA1c Test', 'Glucose Tolerance Test'])
            predictions['preventive_measures'].extend(['Regular Exercise', 'Balanced Diet', 'Weight Management'])
    else:
        predictions['all_predictions']['Diabetes'] = {'probability': diabetes_risk, 'level': 'Low'}
    
    # Heart Disease prediction
    heart_risk = check_heart_disease_risk(user_data)
    if heart_risk > 0.6:
        predictions['all_predictions']['Heart Disease'] = {'probability': heart_risk, 'level': 'High'}
        if heart_risk * 100 > predictions['risk_percentage']:
            predictions['primary_risk'] = 'Heart Disease'
            predictions['risk_percentage'] = heart_risk * 100
            predictions['suggested_tests'].extend(['ECG', 'Lipid Profile', 'Stress Test'])
            predictions['preventive_measures'].extend(['Reduce Salt', 'Cardio Exercise', 'Stress Management'])
    else:
        predictions['all_predictions']['Heart Disease'] = {'probability': heart_risk, 'level': 'Low'}
    
    # Hypertension prediction
    hypertension_risk = check_hypertension_risk(user_data)
    if hypertension_risk > 0.6:
        predictions['all_predictions']['Hypertension'] = {'probability': hypertension_risk, 'level': 'High'}
        if hypertension_risk * 100 > predictions['risk_percentage']:
            predictions['primary_risk'] = 'Hypertension'
            predictions['risk_percentage'] = hypertension_risk * 100
            predictions['suggested_tests'].extend(['BP Monitoring', '24-hr Ambulatory BP'])
            predictions['preventive_measures'].extend(['Reduce Sodium', 'Regular Exercise', 'Stress Reduction'])
    else:
        predictions['all_predictions']['Hypertension'] = {'probability': hypertension_risk, 'level': 'Low'}
    
    # Update risk level
    if predictions['risk_percentage'] > 70:
        predictions['risk_level'] = 'High'
    elif predictions['risk_percentage'] > 40:
        predictions['risk_level'] = 'Medium'
    else:
        predictions['risk_level'] = 'Low'
    
    # Add general recommendations
    predictions['recommendations'] = [
        'Maintain regular health checkups',
        'Follow a balanced diet',
        'Exercise regularly (150 minutes/week)',
        'Avoid smoking and excessive alcohol',
        'Manage stress through meditation or yoga',
        'Stay hydrated and maintain healthy weight'
    ]
    
    return predictions

def check_diabetes_risk(user_data):
    """Calculate diabetes risk probability"""
    risk = 0.1  # Base risk
    
    age = user_data.get('age', 0)
    if age > 45:
        risk += 0.15
    
    bmi = user_data.get('bmi', 22)
    if bmi > 30:
        risk += 0.25
    elif bmi > 25:
        risk += 0.1
    
    if 'Diabetes' in user_data.get('medicalConditions', []):
        risk += 0.3
    
    if user_data.get('exerciseFrequency') == 'Never':
        risk += 0.15
    
    return min(risk, 0.95)

def check_heart_disease_risk(user_data):
    """Calculate heart disease risk probability"""
    risk = 0.1  # Base risk
    
    age = user_data.get('age', 0)
    gender = user_data.get('gender', 'Male')
    if age > 50 or (gender == 'Female' and age > 60):
        risk += 0.2
    
    if 'Hypertension' in user_data.get('medicalConditions', []):
        risk += 0.25
    
    if 'Heart Disease' in user_data.get('medicalConditions', []):
        risk += 0.3
    
    if user_data.get('smoker', False):
        risk += 0.25
    
    bmi = user_data.get('bmi', 22)
    if bmi > 30:
        risk += 0.15
    
    return min(risk, 0.95)

def check_hypertension_risk(user_data):
    """Calculate hypertension risk probability"""
    risk = 0.1  # Base risk
    
    age = user_data.get('age', 0)
    if age > 40:
        risk += 0.2
    
    bmi = user_data.get('bmi', 22)
    if bmi > 30:
        risk += 0.2
    
    stress = user_data.get('stressLevel', 'Low')
    if stress == 'High':
        risk += 0.15
    
    if 'Hypertension' in user_data.get('medicalConditions', []):
        risk += 0.35
    
    if user_data.get('exerciseFrequency') == 'Never':
        risk += 0.15
    
    return min(risk, 0.95)

@app.route('/predict-advanced', methods=['POST'])
def predict_advanced():
    """
    Advanced Predictive Healthcare Endpoint
    Predicts Diabetes, Heart, Hypertension, Kidney Disease, Health Score, and returns explanations/recommendations.
    """
    try:
        data = request.get_json() or {}
        bp = data.get('bp', '120/80')
        sugar = float(data.get('sugar', 100))
        bmi = float(data.get('bmi', 22))
        hr = float(data.get('hr', 75))
        cholesterol = float(data.get('cholesterol', 180))
        stress = data.get('stress', 'Low')
        smoking = bool(data.get('smoking', False))
        sleep = float(data.get('sleep', 7))
        exercise = data.get('exercise', 'Sometimes')

        # Parse BP
        sys_bp = 120
        try:
            sys_bp = int(bp.split('/')[0])
        except:
            pass

        # Calculate scores
        dia_risk = min(0.95, max(0.05, (sugar - 70) / 150.0 + (bmi - 20) * 0.02))
        heart_risk = min(0.95, max(0.05, (cholesterol - 150) / 200.0 + (1 if smoking else 0) * 0.3 + (hr - 60) * 0.005))
        hyper_risk = min(0.95, max(0.05, (sys_bp - 90) / 100.0 + (1 if stress == 'High' else 0) * 0.15))
        kidney_risk = min(0.95, max(0.05, (dia_risk * 0.4) + (hyper_risk * 0.4) + (bmi - 20) * 0.01))

        # Overall Health Score (out of 100)
        health_score = int(100 - (dia_risk * 25 + heart_risk * 25 + hyper_risk * 25 + kidney_risk * 25))

        return jsonify({
            'success': True,
            'healthScore': health_score,
            'diabetesRisk': round(dia_risk * 100, 1),
            'heartRisk': round(heart_risk * 100, 1),
            'hypertensionRisk': round(hyper_risk * 100, 1),
            'kidneyRisk': round(kidney_risk * 100, 1),
            'aiExplanation': f"Overall health score is {health_score}/100. Key risks identified: Diabetes risk is {round(dia_risk * 100, 1)}% due to glucose values, and Heart risk is {round(heart_risk * 100, 1)}% reflecting lifestyle indicators.",
            'recommendations': [
                "Reduce daily sodium intake below 2,000 mg to lower hypertension risk.",
                "Incorporate 30 minutes of aerobic exercise daily.",
                "Ensure consistent 7-8 hours of sleep to reduce cortisol levels."
            ]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/ocr-prescription', methods=['POST'])
def ocr_prescription():
    """
    Simulated OCR Prescription Scanner
    Extracts medicine list, dosage, frequency, duration, and doctor's name.
    """
    try:
        # Mock OCR logic on uploaded prescription
        # We can extract text if provided or return default robust mock medicines
        data = request.get_json() or {}
        text = data.get('text', '')

        # Standard simulated extraction
        medicines = [
            {'name': 'Paracetamol 650mg', 'dosage': '1 tablet', 'frequency': 'Thrice a day', 'duration': '5 days'},
            {'name': 'Pantocid 40mg', 'dosage': '1 tablet', 'frequency': 'Before breakfast', 'duration': '7 days'},
            {'name': 'Amoxicillin 500mg', 'dosage': '1 capsule', 'frequency': 'Twice a day', 'duration': '5 days'}
        ]
        
        return jsonify({
            'success': True,
            'doctor': 'Dr. K. Sharma',
            'medicines': medicines,
            'rawText': text or "Rx\nDr. K. Sharma\nParacetamol 650mg TDS x 5 days\nPantocid 40mg OD AC x 7 days\nAmoxicillin 500mg BD x 5 days"
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/analyze-document', methods=['POST'])
def analyze_document():
    """
    AI Doctor Copilot / Clinical Assistant Document Analyzer
    """
    try:
        data = request.get_json() or {}
        doc_name = data.get('docName', 'Report.pdf')
        content = data.get('content', '')

        # Simulated intelligent clinical analysis
        findings = [
            "Creatinine levels slightly elevated at 1.4 mg/dL (Normal: 0.6 - 1.2 mg/dL).",
            "Fasting blood glucose is 134 mg/dL indicating impaired glucose tolerance.",
            "eGFR is 58 mL/min/1.73m², placing the patient in Stage 3a Chronic Kidney Disease range."
        ]
        abnormal = [
            {'parameter': 'Serum Creatinine', 'value': '1.4 mg/dL', 'range': '0.6 - 1.2 mg/dL', 'severity': 'High'},
            {'parameter': 'Fasting Blood Sugar', 'value': '134 mg/dL', 'range': '70 - 100 mg/dL', 'severity': 'Medium'}
        ]
        
        return jsonify({
            'success': True,
            'summary': f"Clinical review of {doc_name} reveals elevated renal biomarkers and borderline glycemic values.",
            'findings': findings,
            'abnormalValues': abnormal,
            'suggestedDiagnoses': ["Early Nephropathy", "Prediabetes"],
            'recommendedTests': ["HbA1c", "Urine Albumin-to-Creatinine Ratio (UACR)", "Renal Ultrasound"],
            'highRiskAlerts': ["eGFR is below 60. Monitor renal function closely. Avoid NSAIDs."]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/detect-fraud', methods=['POST'])
def detect_fraud():
    """
    AI Insurance Fraud & Duplicate Claim Detection
    """
    try:
        data = request.get_json() or {}
        claim_amount = float(data.get('amount', 5000))
        purpose = data.get('purpose', '')
        patient_id = data.get('patientId', 'P-1234')

        # Run simulated rules
        flags = []
        fraud_score = 15 # baseline

        if claim_amount > 20000:
            flags.append("High claim amount for routine consultation/treatment.")
            fraud_score += 25
        if 'duplicate' in purpose.lower() or 're-submit' in purpose.lower():
            flags.append("Possible duplicate insurance claim detected.")
            fraud_score += 40
        if claim_amount == 2400 and purpose == 'X-Ray + Lab Tests':
            flags.append("Exact duplicate bill detected (matching previous transaction TX004).")
            fraud_score += 55

        risk_level = 'Low' if fraud_score < 30 else ('Medium' if fraud_score < 60 else 'High')

        return jsonify({
            'success': True,
            'fraudScore': min(100, fraud_score),
            'riskLevel': risk_level,
            'reason': flags if flags else ["No anomalies detected. Routine usage pattern."],
            'suggestedReview': "Flag for manual audit" if risk_level in ['Medium', 'High'] else "Auto-approve"
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    initialize_models()
    app.run(host='0.0.0.0', port=5001, debug=True)
