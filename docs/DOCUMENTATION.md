# MediLink AI - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Setup Instructions](#setup-instructions)
6. [Security](#security)
7. [Deployment](#deployment)

## 🏥 Project Overview

MediLink AI is an integrated healthcare platform that combines emergency response, digital medical records, AI disease prediction, and fintech services into a single mobile and web application.

### Core Modules:
- **User Authentication**: Aadhaar-based OTP verification
- **Digital Medical Records**: Secure medical data storage
- **AI Disease Prediction**: ML-based disease risk assessment
- **Emergency SOS**: Real-time ambulance dispatch and hospital alerts
- **Government Health Wallet**: Non-withdrawable medical expense wallet
- **Insurance Integration**: AI-recommended health plans
- **Hospital Dashboard**: Emergency management portal

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (Flutter)                     │
│  - Authentication | Health Records | SOS Button | Payments  │
└┐────────────────────────────────┬────────────────────────────┘
 │                                │
 ├────────────────┬───────────────┴────────────┬────────────┐
 │                │                            │            │
 ▼                ▼                            ▼            ▼
┌──────────┐  ┌──────────┐            ┌──────────────┐  ┌──────────┐
│ Backend  │  │   AI     │            │   Hospital   │  │ Database │
│ (Node.js)│  │(Python)  │            │  Dashboard   │  │(MongoDB) │
│ Express  │  │  Flask   │            │   (React)    │  │Firestore │
└──────────┘  └──────────┘            └──────────────┘  └──────────┘
```

## 📊 Database Schema

### Collections/Tables:

#### 1. Users
```
{
  _id: ObjectId
  phoneNumber: String (unique, 10 digits)
  aadhaarNumber: String (unique, 12 digits)
  firstName: String
  lastName: String
  email: String
  dateOfBirth: Date
  gender: Enum['Male', 'Female', 'Other']
  bloodGroup: Enum['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
  height: Number (cm)
  weight: Number (kg)
  medicalConditions: [String]
  allergies: [String]
  currentMedications: [{name, dosage, frequency}]
  labReports: [{reportName, date, fileUrl, description}]
  prescriptions: [{doctorName, date, fileUrl, medications}]
  walletBalance: Number
  lastKnownLocation: {latitude, longitude, updatedAt}
  deviceTokens: [String]
  createdAt: Date
  updatedAt: Date
}
```

#### 2. EmergencySOS
```
{
  _id: ObjectId
  userId: ObjectId (ref: User)
  emergencyType: Enum['Medical', 'Accident', 'Other']
  severity: Enum['Low', 'Medium', 'High', 'Critical']
  latitude: Number
  longitude: Number
  ambulanceId: ObjectId
  selectedHospitalId: ObjectId (ref: Hospital)
  status: Enum['Initiated', 'Ambulance_Assigned', 'In_Transit', 'Arrived', 'Completed']
  medicalDataSent: Boolean
  aiPredictionShared: Boolean
  createdAt: Date
  completedAt: Date
}
```

#### 3. Hospitals
```
{
  _id: ObjectId
  name: String
  registrationNumber: String (unique)
  latitude: Number
  longitude: Number
  address: String
  city: String
  bedCapacity: Number
  availableBeds: Number
  departments: [{name, specializations, doctorCount}]
  apiKey: String (unique)
  operatingHours: {monday: {opens, closes}, ...}
  isActive: Boolean
  isAcceptingEmergencies: Boolean
  createdAt: Date
}
```

#### 4. Transactions
```
{
  _id: ObjectId
  userId: ObjectId (ref: User)
  transactionType: Enum['Wallet_Credit', 'Hospital_Payment', 'Pharmacy_Payment']
  amount: Number
  walletBalance: Number
  status: Enum['Pending', 'Completed', 'Failed']
  transactionDate: Date
  completedAt: Date
}
```

#### 5. Insurance
```
{
  _id: ObjectId
  providerName: String
  planName: String
  planCode: String (unique)
  coverage: Enum['Individual', 'Family', 'Group']
  baseCoverageAmount: Number
  monthlyPremium: Number
  coveredServices: [String]
  targetRiskProfiles: [String]
  networkHospitals: [ObjectId] (ref: Hospital)
  isActive: Boolean
  createdAt: Date
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and authenticate
- `GET /api/auth/verify-token` - Verify JWT token

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/medical-profile` - Update medical data
- `POST /api/user/device-token` - Register device for notifications
- `POST /api/user/update-location` - Update current location

### Medical Records
- `GET /api/medical/records` - Get all medical records
- `POST /api/medical/upload-report` - Upload lab report
- `POST /api/medical/add-prescription` - Add prescription
- `POST /api/medical/ai-prediction` - Get AI disease prediction
- `GET /api/medical/export-qr` - Generate QR medical data

### Emergency SOS
- `POST /api/sos/activate` - Activate emergency SOS
- `GET /api/sos/status/:sosId` - Get SOS status
- `POST /api/sos/cancel/:sosId` - Cancel SOS
- `GET /api/sos/history` - Get SOS history

### Hospital Management
- `GET /api/hospital/list` - Get hospitals (with filters)
- `GET /api/hospital/:hospitalId` - Get hospital details
- `POST /api/hospital/respond-emergency/:sosId` - Accept/reject emergency
- `GET /api/hospital/emergencies/active` - Get active emergencies

### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/credit` - Credit government funds
- `POST /api/wallet/pay` - Make payment from wallet
- `GET /api/wallet/transactions` - Transaction history
- `POST /api/wallet/verify-qr` - Verify QR payment

### Insurance
- `GET /api/insurance/plans` - Get insurance plans
- `GET /api/insurance/recommendations` - Get AI recommendations
- `POST /api/insurance/enroll` - Enroll in plan
- `GET /api/insurance/my-policy` - Get user's policy

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+
- Python 3.8+
- Flutter 3.0+
- MongoDB
- Firebase account

### Backend Setup

```bash
# 1. Navigate to backend directory
cd medilink-backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Configure environment variables
# Update .env with your API keys and database URLs

# 5. Start MongoDB
mongod

# 6. Run server
npm run dev
```

### AI Service Setup

```bash
# 1. Navigate to AI directory
cd medilink-ai

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run service
python app.py
```

### Mobile App Setup

```bash
# 1. Navigate to mobile directory
cd medilink-mobile

# 2. Get Flutter dependencies
flutter pub get

# 3. Run on device/emulator
flutter run
```

### Hospital Dashboard Setup

```bash
# 1. Navigate to dashboard directory
cd medilink-hospital-dashboard

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```

## 🔒 Security

### Data Protection
- **Encryption**: All sensitive data encrypted using AES-256
- **HTTPS**: All API calls must use HTTPS
- **JWT Tokens**: Expiring tokens (7 days default)
- **Rate Limiting**: 100 requests per 15 minutes

### Authentication
- Aadhaar OTP verification
- Hospital API key authentication
- Device token verification

### Data Access
- Medical records only accessible by authorized users
- Hospital access restricted to emergency scenarios
- Government wallet restricted to medical expenses only

## 📦 Deployment

### Docker Setup (Optional)

```dockerfile
# Backend
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Cloud Deployment Options
- **AWS**: EC2 for backend, S3 for storage
- **Google Cloud**: Cloud Run + Firestore
- **Azure**: App Service + Cosmos DB

## 📱 Key Features Summary

✅ Aadhaar-based authentication  
✅ AI disease prediction with risk assessment  
✅ Real-time SOS and ambulance dispatch  
✅ Automatic medical data sharing with hospitals  
✅ Government health wallet (India-specific)  
✅ Insurance plan recommendations  
✅ Hospital emergency management dashboard  
✅ Multi-language support (English + Tamil)  
✅ QR code medical data export  
✅ Real-time location tracking  
✅ Push notifications  
✅ Offline QR code access  

## 📞 Support & Contact

For issues, feature requests, or questions, please refer to the individual README files in each module directory.

---

**Project Version**: 1.0.0  
**Last Updated**: April 2024
