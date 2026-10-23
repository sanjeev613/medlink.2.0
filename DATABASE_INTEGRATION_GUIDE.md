# MediLink AI - Database Integration Guide

## ✅ System Setup Complete!

Your MediLink application now has full database integration with multi-role authentication and data persistence.

### 🗄️ **Database Structure**

**MongoDB Collections (Auto-created):**

1. **Users Collection**
   - Phone number (unique)
   - Aadhaar number (unique, verified)
   - Personal info (name, DOB, gender)
   - Medical profile (blood group, height, weight)
   - Medical records (lab reports, prescriptions)
   - Wallet balance
   - Insurance policies
   - Emergency contacts

2. **Medical Records Collection**
   - Lab reports
   - Prescriptions
   - Medical history
   - Allergies & conditions
   - Current medications

3. **Transactions Collection** (for wallet)
   - Transaction history
   - Payments
   - Refunds

4. **Emergency SOS Collection**
   - Emergency alerts
   - Ambulance dispatch
   - Hospital bookings

### 🔐 **Authentication Flow**

**Step 1: Send OTP**
```
POST /api/auth/send-otp
Body: { aadhaarNumber: "123456789012", phoneNumber: "9876543210" }
Response: OTP sent to phone
```

**Step 2: Verify OTP & Login**
```
POST /api/auth/verify-otp
Body: { phoneNumber: "9876543210", otp: "123456" }
Response: JWT token + user data
```

**Step 3: Use Token for All Requests**
```
Header: "Authorization: Bearer <token>"
GET /api/medical/records
```

### 📱 **Demo Test Credentials**

| Field | Value |
|-------|-------|
| Aadhaar | 123456789012 |
| Phone | 9876543210 |
| OTP | Check backend logs (dev mode) |
| Role | patient/doctor/nurse |

### 🚀 **How to Test**

#### **1. Start Backend (Port 5000)**
```bash
cd medilink-backend
npm start
```
✓ Should show: "✓ MongoDB connected"

#### **2. Start Frontend (Port 5173)**
```bash
cd medilink-hospital-dashboard
npm run dev
```

#### **3. Test Login**
1. Enter Aadhaar: `123456789012`
2. Enter Phone: `9876543210`
3. Select Role: Patient/Doctor/Nurse
4. Click "📤 Send OTP"
5. Check backend console for OTP
6. Enter OTP in form
7. Click "🔓 Verify & Login"

#### **4. Test Data Storage**
- Upload medical record → Saved to MongoDB
- Apply insurance → Saved to user profile
- Book hospital → Saved to emergency collection

### 📊 **Data Flow**

```
User Login (Frontend)
    ↓
Send OTP → Backend → SMS Gateway
    ↓
Verify OTP → Backend → Check DB → Create/Update User
    ↓
Generate JWT Token → Store in Browser
    ↓
All Requests → Include Auth Header
    ↓
Backend Validates → Returns User Data
```

### 🔄 **API Endpoints Available**

**Authentication:**
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP & Login
- `POST /api/auth/logout` - Logout

**Medical Records:**
- `GET /api/medical/records` - Get all records
- `POST /api/medical/upload-report` - Upload report
- `POST /api/medical/add-prescription` - Add prescription

**User Profile:**
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile

**Insurance:**
- `GET /api/insurance/policies` - Get policies
- `POST /api/insurance/apply` - Apply policy

**Wallet:**
- `GET /api/wallet/balance` - Get balance
- `POST /api/wallet/transaction` - Record transaction

**Hospital & Ambulance:**
- `GET /api/hospital/nearby` - Get nearby hospitals
- `POST /api/sos/emergency` - Trigger emergency

### 🔌 **Environment Variables**

**Frontend (.env):**
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

**Backend (.env):**
```
MONGODB_URI=mongodb://localhost:27017/medilink_demo
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 💾 **MongoDB Collections Schema**

**User Document:**
```javascript
{
  _id: ObjectId,
  phoneNumber: String (unique),
  aadhaarNumber: String (unique),
  firstName: String,
  lastName: String,
  email: String,
  dateOfBirth: Date,
  gender: String,
  bloodGroup: String,
  walletBalance: Number,
  labReports: [{
    reportName: String,
    date: Date,
    fileUrl: String,
    description: String
  }],
  prescriptions: [{
    doctorName: String,
    date: Date,
    fileUrl: String,
    medications: [String]
  }],
  insurancePolicy: {
    providerId: ObjectId,
    policyNumber: String,
    coverageAmount: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### ⚠️ **Troubleshooting**

**Issue: "MongoDB connection failed"**
- Check MongoDB is running: `mongosh`
- Verify connection string in .env
- Default: `mongodb://localhost:27017/medilink_demo`

**Issue: "OTP not received in backend"**
- Check backend console - OTP printed there in dev mode
- In production, configure SMS gateway (Twilio/AWS)

**Issue: "Token expired"**
- Token valid for 7 days by default
- Change `JWT_EXPIRES_IN` in backend .env

**Issue: "CORS error"**
- Frontend and backend must have same origin
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

### 🎯 **Next Steps**

1. ✅ Test login with OTP
2. ✅ Upload medical records
3. ✅ Apply for insurance
4. ✅ Trigger emergency SOS
5. 🔄 Integrate real SMS gateway (Twilio)
6. 🔄 Add payment gateway (Razorpay/Stripe)
7. 🔄 Deploy to production

### 📞 **Support**

For issues or questions:
1. Check backend logs: `npm start`
2. Check browser console: F12
3. Verify MongoDB: `mongosh`
4. Test API endpoints: Postman

---

**Database Integration: ✅ Complete**
**Status: Ready for Testing**
