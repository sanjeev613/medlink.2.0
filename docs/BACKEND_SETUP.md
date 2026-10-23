# MediLink Backend - Setup Guide

## Prerequisites
- Node.js 16.x or higher
- MongoDB 4.4+
- npm or yarn
- Firebase account (for notifications)
- AWS account (for S3 storage)
- Google Maps API key

## Installation

### 1. Clone and Navigate
```bash
cd medilink-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file based on `.env.example`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/medilink

# JWT
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email@firebase.gserviceaccount.com

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=medilink-records

# Google Maps
GOOGLE_MAPS_API_KEY=your_maps_api_key

# Server
PORT=5000
NODE_ENV=development

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# AI Service
AI_SERVICE_URL=http://localhost:5001

# Hospital Notification
HOSPITAL_NOTIFICATION_URL=http://localhost:3000/api/hospital
```

### 4. Database Setup

```bash
# Start MongoDB
mongod

# Seed sample data (optional)
npm run seed
```

### 5. Start Server

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints Overview

### Authentication (`/api/auth`)
```
POST   /send-otp          - Send OTP to phone
POST   /verify-otp        - Verify OTP and get token
GET    /verify-token      - Verify JWT validity
```

### User (`/api/user`)
```
GET    /profile           - Get user profile
PUT    /profile           - Update profile
PUT    /medical-profile   - Update medical data
POST   /device-token      - Register push token
POST   /update-location   - Update GPS location
GET    /health-summary    - Get health dashboard
```

### Medical (`/api/medical`)
```
GET    /records           - Get medical records
POST   /upload-report     - Upload lab report
POST   /add-prescription  - Add prescription
POST   /ai-prediction     - Get AI health prediction
GET    /export-qr         - Export as QR code
```

### SOS (`/api/sos`)
```
POST   /activate          - Activate emergency
GET    /status/:sosId     - Get emergency status
POST   /cancel/:sosId     - Cancel emergency
GET    /history           - View SOS history
```

### Hospital (`/api/hospital`)
```
GET    /list              - Get nearby hospitals
GET    /:hospitalId       - Get hospital details
POST   /emergency-alert   - Receive emergency (internal)
POST   /respond-emergency/:sosId - Accept/reject emergency
GET    /emergencies/active - Get active emergencies
```

### Wallet (`/api/wallet`)
```
GET    /balance           - Get wallet balance
POST   /credit            - Add funds (govt)
POST   /pay               - Make payment
GET    /transactions      - Transaction history
POST   /verify-qr         - Verify payment QR
```

### Insurance (`/api/insurance`)
```
GET    /plans             - List insurance plans
GET    /recommendations   - Get AI recommendations
POST   /enroll            - Enroll in plan
GET    /my-policy         - Get user's policy
```

## Testing

### Manual Testing with cURL

```bash
# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"aadhaarNumber":"123456789012","phoneNumber":"9876543210"}'

# Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210","otp":"123456"}'
```

### Using Postman
1. Import the provider `providers/postman_collection.json`
2. Set environment variables (API URL, token, etc.)
3. Run requests

## Database Models

### User
- Stores personal, medical, and wallet information
- Indexed on phoneNumber, aadhaarNumber
- Medical history with prescriptions and lab reports

### EmergencySOS
- Emergency incident records
- Real-time status tracking
- Ambulance and hospital assignment
- Medical data sharing logs

### Hospital
- Hospital profiles and details
- Operating hours and departments
- Emergency response metrics
- Network and API details

### Insurance
- Insurance plan offerings
- Coverage and premium details
- Risk profile mapping

### Transaction
- All wallet and payment transactions
- For audit and finance tracking

## Performance & Scaling

### Caching Strategy
- Redis for frequently accessed data
- Hospital list cached for 1 hour
- Insurance plans cached for 24 hours

### Database Optimization
- Indexes on frequently queried fields
- Connection pooling
- Query optimization

### Rate Limiting
- 100 requests per 15 minutes per IP
- 1000 requests per day per user
- Priority queue for emergency requests

## Security Best Practices

✅ All passwords hashed with bcryptjs  
✅ JWT tokens with expiration  
✅ HTTPS-only in production  
✅ CORS configured for trusted domains  
✅ SQL injection prevention via Mongoose  
✅ Rate limiting and request validation  
✅ Environment variables for secrets  

## Monitoring & Logging

- Logs saved to `logs/` directory
- Winston logger integration
- Error tracking with Sentry (optional)
- Performance monitoring with New Relic (optional)

## Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
mongod
```

### Port 5000 Already in Use
```bash
# Kill process on port
# Linux/Mac:
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill

# Windows:
netstat -ano | findstr :5000
```

### Firebase Integration Issues
- Verify service account JSON is valid
- Check Firebase project ID matches
- Ensure API keys are enabled

## Deployment

### Heroku
```bash
heroku login
heroku create medilink-backend
git push heroku main
```

### AWS EB
```bash
eb init medilink-backend
eb create medilink-env
eb deploy
```

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [JWT Auth](https://jwt.io/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**Maintained by**: MediLink Team  
**Last Updated**: April 2024
