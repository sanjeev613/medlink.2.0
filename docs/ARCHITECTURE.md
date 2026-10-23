# MediLink - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        End Users                                │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │  Mobile App      │  │  Hospital Admin  │  │  Browser   │  │
│  │  (Flutter)       │  │  (Dashboard)     │  │            │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬──────┘  │
└───────────┼─────────────────────┼──────────────────┼──────────┘
            │                     │                  │
            └─────┬───────────────┴──────┬───────────┘
                  │                      │
        ┌─────────▼──────────┐  ┌────────▼──────────┐
        │   HTTPS/TLS        │  │   HTTPS/TLS      │
        │   Encrypted        │  │   Encrypted      │
        └─────────┬──────────┘  └────────┬──────────┘
                  │                      │
        ┌─────────▼──────────────────────▼──────────┐
        │     API Gateway / Load Balancer           │
        │  (Rate Limiting, CORS, Auth Validation)  │
        └─────────────────┬────────────────────────┘
                          │
        ┌─────────────────┴──────────────┬──────────────────┐
        │                                │                  │
┌───────▼────────────┐  ┌───────────────▼───────────┐  ┌──┴────────────┐
│   Backend API      │  │   AI Service              │  │ Cache Layer   │
│   (Express.js)     │  │   (Flask/Python)          │  │ (Redis)       │
│                    │  │                           │  │               │
│ •Auth              │  │ • Prediction Models       │  │ • Sessions    │
│ •User Management   │  │ • Risk Assessment        │  │ • Medical Data│
│ •Medical Records   │  │ • ML Algorithms          │  │ • Results     │
│ •SOS Emergency     │  │ • Health Analytics       │  └───────────────┘
│ •Wallet/Payment    │  │                           │
│ •Insurance         │  │                           │
│ •Hospital Gateway  │  │                           │
│                    │  │                           │
└─────────┬──────────┘  └──────────────┬────────────┘
          │                            │
          └────────────────┬───────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │       Database Layer                │
        │                                     │
        │  ┌─────────────┐  ┌──────────────┐ │
        │  │  MongoDB    │  │  Firestore   │ │
        │  │             │  │              │ │
        │  │ • Users     │  │ • Real-time  │ │
        │  │ • Records   │  │ • Backups    │ │
        │  │ • SOS Logs  │  │ • Analytics  │ │
        │  └─────────────┘  └──────────────┘ │
        │                                     │
        └─────────────────────────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │    Cloud Storage                    │
        │                                     │
        │  ┌──────────┐  ┌──────────────────┐│
        │  │ AWS S3   │  │ Backups          ││
        │  │          │  │ Medical Files    ││
        │  └──────────┘  └──────────────────┘│
        │                                     │
        └─────────────────────────────────────┘
```

## Data Flow Diagram

### User Registration Flow
```
User Phone & Aadhaar
         │
         ▼
    OTP Generation
         │
         ▼
    SMS Gateway (Twilio/AWS SNS)
         │
         ▼
    OTP Verification
         │
         ▼
    JWT Token Generation
         │
         ▼
    Create User Profile
         │
         ▼
    Return Token
```

### Emergency (SOS) Flow
```
User Activates SOS
         │
         ▼
    Get User Location (GPS)
         │
         ▼
    Find Nearest Hospitals (within 15km)
         │
         ▼
    Dispatch Ambulance
         │
         ├──────────────────────────┐
         │                          │
         ▼                          ▼
    Send Alert to     Send SMS/Push to
    Hospital          Ambulance Driver
         │                          │
         ├──────────────────────────┤
         │
         ▼
    Real-time Status Updates
         │
         ├─────────┬──────────────┬──────────┐
         │         │              │          │
         ▼         ▼              ▼          ▼
    Ambulance   Hospital    Patient App   Medical
    In Transit  Alerted     Update        Data
                                          Share
```

### AI Prediction Flow
```
User Input Medical Data
         │
         ▼
    Feature Engineering
         │
         ▼
    AI Service Processing
         │
    ┌────┴────┬────────┬──────────┐
    │          │        │          │
    ▼          ▼        ▼          ▼
  Diabetes  Heart    Hypertension  Other
  Model    Disease   Model        Models
    │          │        │          │
    └────┬─────┴────┬───┴──────────┘
         │          │
         ▼          ▼
    Risk Score    Risk Level
    Calculation   Determination
         │
         ▼
    Generate Recommendations
         │
         ▼
    Return Predictions to User
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│         Application Layer Security          │
│  • JWT Tokens                               │
│  • Role-Based Access Control (RBAC)         │
│  • Input Validation                         │
│  • Output Encoding                          │
│  └─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│         Transport Layer Security            │
│  • HTTPS/TLS 1.2+                           │
│  • Certificate Pinning (Mobile)             │
│  • Secure Headers                           │
│  └─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│         Data Layer Security                 │
│  • Encryption at Rest (AES-256)             │
│  • Database Authentication                  │
│  • Connection String Encryption             │
│  • Backups Encrypted                        │
│  └─────────────────────────────────────────┘
```

## Component Interaction

### Mobile App ↔ Backend
```
Mobile App
    │
    ├─→ POST /auth/send-otp →─→ OTP Generation
    │
    ├─→ POST /auth/verify-otp →─→ JWT Token
    │
    ├─→ GET /user/profile →─→ User Data
    │
    ├─→ POST /medical/upload-report →─→ S3 Storage
    │
    ├─→ POST /medical/ai-prediction →─→ AI Service
    │
    ├─→ POST /sos/activate →─→ Emergency Handler
    │
    ├─→ POST /wallet/pay →─→ Payment Processing
    │
    └─→ GET /insurance/recommendations →─→ Insurance List
```

### Backend ↔ Hospital Dashboard
```
Hospital Dashboard
    │
    ├─→ GET /hospital/emergencies/active →─→ Emergency List
    │
    ├─→ POST /hospital/respond-emergency →─→ Accept/Reject
    │
    ├─→ PUT /hospital/emergency/update-status →─→ Status Update
    │
    └─→ GET /hospital/emergencies/stream →─→ Real-time Updates
```

### Backend ↔ AI Service
```
Backend
    │
    ├─→ POST /predict →─→ Disease Prediction
    │
    └─→ POST /assess-risk →─→ Insurance Risk Assessment
```

## Scalability Architecture

```
┌────────────────────────────────────┐
│     CDN / Static Content           │
│   (CloudFront / Cloudflare)        │
└────────────────────────────────────┘
           │
┌──────────▼────────────────────────┐
│   Load Balancer                   │
│   (ELB / ALB / NGINX)             │
│   - Auto-scaling enabled          │
│   - Health checks                 │
│   - Session persistence           │
└──────┬───────────────┬────────────┘
       │               │
   ┌───▼───┐       ┌───▼───┐
   │ API 1 │       │ API N │  (Auto-scaled instances)
   └───┬───┘       └───┬───┘
       │               │
   ┌───────────────────┴────────┐
   │    Cache Layer             │
   │    (Redis Cluster)         │
   └──────────┬─────────────────┘
              │
   ┌──────────▼──────────────────┐
   │  Database Replication       │
   │  • Master-Slave Replication │
   │  • Read replicas            │
   │  • Sharding for large data  │
   └─────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────┐
│    Development Environment       │
│    - localhost:3000-5173         │
│    - Hot reload enabled          │
│    - Mock data                   │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│    Staging Environment           │
│    - staging.medilink.ai         │
│    - Production-like setup       │
│    - Real (test) data            │
│    - Performance testing         │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│    Production Environment        │
│    - medilink.ai                 │
│    - High availability           │
│    - Auto-scaling                │
│    - Real data                   │
│    - Full monitoring             │
│    - Backup & recovery           │
└──────────────────────────────────┘
```

## Monitoring & Observability

```
┌────────────────────────────────────────┐
│     Application Monitoring             │
│  • Error rates and exceptions          │
│  • API response times                  │
│  • User activity tracking              │
└────────┬──────────────────────────────┘
         │
┌────────▼──────────────────────────────┐
│     Infrastructure Monitoring          │
│  • CPU, Memory, Disk usage            │
│  • Network bandwidth                   │
│  • Container health                    │
└────────┬──────────────────────────────┘
         │
┌────────▼──────────────────────────────┐
│     Business Analytics                 │
│  • User registration trends            │
│  • Emergency response metrics          │
│  • Wallet transaction volume           │
└────────┬──────────────────────────────┘
         │
┌────────▼──────────────────────────────┐
│     Centralized Logging                │
│  • CloudWatch / ELK / Datadog          │
│  • Alert generation                    │
│  • Dashboard visualization             │
└────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0  
**Last Updated**: April 2024
