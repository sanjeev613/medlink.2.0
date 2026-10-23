# MediLink - Quick Setup Guide

## 🚀 5-Minute Quick Start

### Option 1: Docker Compose (Easiest)

```bash
# Navigate to project root
cd medilink-ai

# Start all services
docker-compose up --build

# Services will be available at:
# - Backend: http://localhost:5000
# - AI Service: http://localhost:5001
# - Dashboard: http://localhost:5173
```

### Option 2: Manual Setup

```bash
# Terminal 1 - Backend
cd medilink-backend
npm install
cp .env.example .env
npm run dev

# Terminal 2 - AI Service
cd medilink-ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Terminal 3 - Hospital Dashboard
cd medilink-hospital-dashboard
npm install
npm run dev

# Terminal 4 - Mobile App
cd medilink-mobile
flutter pub get
flutter run
```

## 📦 What's Included

✅ **Complete Backend API** (Node.js + Express)
- User authentication
- Medical records management
- Emergency SOS system
- Wallet & payments
- Insurance management

✅ **AI Service** (Python + Flask)
- Disease prediction
- Risk assessment
- Health analysis

✅ **Mobile App** (Flutter)
- Cross-platform (iOS/Android)
- Complete UI/UX
- State management
- All features integrated

✅ **Hospital Dashboard** (React)
- Real-time emergency management
- Patient tracking
- Analytics

✅ **Database Schema**
- Complete MongoDB/Firestore schema
- Optimized indexes
- Sample data

✅ **Comprehensive Documentation**
- Setup guides for each component
- API documentation
- Architecture details
- Deployment guide

## 🔧 Environment Setup

### Minimum Requirements
- Node.js 16+
- Python 3.8+
- MongoDB 4.4+
- 2GB RAM
- 2GB Storage

### Production Requirements
- Database: MongoDB Atlas or AWS DocumentDB
- Cloud Storage: AWS S3 or Google Cloud Storage
- SMS Service: Twilio or AWS SNS
- Push Notifications: Firebase Cloud Messaging
- Maps API: Google Maps API

## 📝 Configuration

### Backend .env
```env
MONGODB_URI=mongodb://localhost:27017/medilink
JWT_SECRET=your_secret_key
PORT=5000
AI_SERVICE_URL=http://localhost:5001
```

### Environment Variables Required
- MONGODB_URI
- JWT_SECRET
- FIREBASE_PROJECT_ID
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- GOOGLE_MAPS_API_KEY

## 🧪 Testing

### Test API Endpoints
```bash
# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"aadhaarNumber":"123456789012","phoneNumber":"9876543210"}'

# Verify OTP (Demo: use 123456)
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210","otp":"123456"}'

# AI Prediction
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"age":45,"gender":"Male","bmi":28}'
```

### Default Demo Credentials
```
Aadhaar: 123456789012
Phone: 9876543210
OTP: 123456
Hospital ID: demo-hospital-001
API Key: demo-api-key-001
```

## 📚 Documentation Links

- [Full Documentation](./docs/DOCUMENTATION.md)
- [Backend Setup](./docs/BACKEND_SETUP.md)
- [AI Service Setup](./docs/AI_SERVICE_SETUP.md)
- [Mobile Setup](./docs/MOBILE_SETUP.md)
- [Dashboard Setup](./docs/DASHBOARD_SETUP.md)
- [Docker Setup](./DOCKER_SETUP.md)

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Linux/Mac: Kill process on port
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill

# Windows: Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Connection Failed
```bash
# Ensure MongoDB is running
mongod

# Check connection
mongo --version
```

### Module Not Found
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# For Python
python -m pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

## 🚀 Deployment

Ready to deploy? See:
- [AWS Deployment](./docs/DOCUMENTATION.md#deployment)
- [Google Cloud Deployment](./docs/DOCUMENTATION.md#deployment)
- [Docker Hub](./DOCKER_SETUP.md)

## 📞 Support

- 📖 Read the full documentation
- 🐛 Check GitHub issues
- 💬 Review API documentation
- 📧 Contact support team

## 🎯 Next Steps

1. **Local Development**
   - Set up backend, AI, and dashboard
   - Run on Flutter emulator

2. **Integration Testing**
   - Test all API endpoints
   - Verify authentication flow
   - Test Emergency SOS flow

3. **Hospital Integration**
   - Register hospital accounts
   - Set up API keys
   - Configure webhooks

4. **Production Deployment**
   - Set up cloud database
   - Configure secure storage
   - Enable push notifications
   - Set up monitoring

## ✨ Key Features to Try

1. **User Registration**
   - Use Aadhaar OTP login demo

2. **Medical Records**
   - Upload lab reports
   - Add medical history

3. **AI Prediction**
   - Get disease predictions
   - See health recommendations

4. **Emergency SOS**
   - Activate emergency system
   - Track ambulance in real-time

5. **Wallet**
   - Check balance
   - Make payments
   - View transaction history

---

**Happy coding! 🎉**
