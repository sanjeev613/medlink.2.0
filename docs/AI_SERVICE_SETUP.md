# MediLink AI Service - Setup Guide

## Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment support

## Installation

### 1. Navigate to AI Directory
```bash
cd medilink-ai
```

### 2. Create Virtual Environment
```bash
# Linux/Mac
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Service
```bash
python app.py
```

Service will run on `http://localhost:5001`

## API Endpoints

### Health Check
```
GET /health
```
Returns service status

### Disease Prediction
```
POST /predict
Content-Type: application/json

Request Body:
{
  "age": 45,
  "gender": "Male",
  "bloodGroup": "O+",
  "height": 175,
  "weight": 75,
  "bmi": 24.5,
  "medicalConditions": ["Hypertension"],
  "allergies": ["Penicillin"],
  "symptoms": ["chest pain", "shortness of breath"],
  "exerciseFrequency": "Sometimes",
  "dietType": "Balanced",
  "smoker": false,
  "alcoholConsumption": "None",
  "stressLevel": "Medium"
}

Response:
{
  "primaryRisk": "Heart Disease",
  "riskLevel": "Medium",
  "riskPercentage": 55.3,
  "suggestedTests": ["ECG", "Lipid Profile", "Heart Ultrasound"],
  "preventiveMeasures": ["Reduce salt", "Regular cardio", "Stress management"],
  "recommendations": ["Annual checkup", "Diet consultation", "Exercise routine"],
  "allPredictions": {
    "Diabetes": {"probability": 0.35, "level": "Low"},
    "Heart Disease": {"probability": 0.65, "level": "Medium"},
    "Hypertension": {"probability": 0.48, "level": "Low"}
  }
}
```

### Risk Assessment for Insurance
```
POST /assess-risk
Content-Type: application/json

Request Body:
{
  "age": 45,
  "bmi": 24.5,
  "medicalConditions": ["Diabetes", "Hypertension"]
}

Response:
{
  "riskFactors": ["Diabetes", "Hypertension", "Age-Related"],
  "riskScore": 7,
  "riskLevel": "High"
}
```

## Model Details

### Diabetes Risk Factors
- Age > 45: +15%
- BMI > 30: +25%, BMI 25-30: +10%
- Existing diabetes: +30%
- No exercise: +15%

### Heart Disease Risk Factors
- Age > 50: +20%
- Hypertension: +25%
- Smoking: +25%
- BMI > 30: +15%

### Hypertension Risk Factors
- Age > 40: +20%
- BMI > 30: +20%
- High stress: +15%
- No exercise: +15%

## Testing

### Using cURL
```bash
# Test health endpoint
curl http://localhost:5001/health

# Test disease prediction
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "age": 45,
    "gender": "Male",
    "bmi": 28,
    "medicalConditions": ["Diabetes"],
    "symptoms": ["fatigue", "thirst"],
    "exerciseFrequency": "Never",
    "smoker": true
  }'
```

### Using Python
```python
import requests

data = {
    "age": 45,
    "gender": "Male",
    "bmi": 28,
    "medicalConditions": ["Diabetes"],
    "exerciseFrequency": "Never"
}

response = requests.post('http://localhost:5001/predict', json=data)
print(response.json())
```

## Model Training (Future Enhancement)

```python
# Example: Training with scikit-learn
from sklearn.ensemble import RandomForestClassifier
import joblib

# After collecting enough medical data:
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Save model
joblib.dump(model, 'models/diabetes_model.pkl')
```

## Configuration

### Environment Variables (Optional)
```bash
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5001
```

## Performance Optimization

### Prediction Time
- Average: < 100ms
- With complex data: < 500ms

### Caching
- Risk scores cached for 24 hours
- Model predictions cached for 1 hour

## Integration with Backend

The backend calls the AI service for:

1. **User Profile Risk Assessment**
```
POST /api/medical/ai-prediction
-> Calls AI service at :5001/predict
```

2. **Insurance Recommendations**
```
GET /api/insurance/recommendations
-> Calls AI service at :5001/assess-risk
```

## Troubleshooting

### Port Already in Use
```bash
# Check process
lsof -i :5001

# Kill process
kill -9 <PID>
```

### Module Import Error
```bash
# Upgrade pip
pip install --upgrade pip

# Reinstall requirements
pip install -r requirements.txt --force-reinstall
```

### Slow Predictions
- Reduce data complexity
- Enable response caching
- Use model quantization

## Production Deployment

### Docker
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5001
CMD ["python", "app.py"]
```

### Running with Gunicorn
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

## Monitoring

- Track prediction accuracy over time
- Monitor API response times
- Log all predictions for audit
- Alert on anomalies

## References

- [Scikit-learn Documentation](https://scikit-learn.org/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Python ML Best Practices](https://towardsdatascience.com/)

---

**Maintained by**: MediLink AI Team  
**Last Updated**: April 2024
