# MediLink AI - Manual Startup Guide

## 🚀 Quick Start (Choose One Option)

### ✅ OPTION 1: One-Click Start (Windows)
```powershell
# Run this in PowerShell from project root
.\START_ALL.ps1
```
This starts all components in separate windows.

---

### ✅ OPTION 2: Manual Component Start (Recommended for Debugging)

Open **5 separate terminal windows** and run these commands:

#### Terminal 1: Backend API (Port 5000)
```powershell
cd c:\Users\sanje\exam_proctoring_app\web\medical\medilink-backend
npm run dev
```
Expected output:
```
Server running on http://localhost:5000
Connected to MongoDB
```

#### Terminal 2: AI Service (Port 5001)
```powershell
cd c:\Users\sanje\exam_proctoring_app\web\medical\medilink-ai
.\venv\Scripts\Activate.ps1
python app.py
```
Expected output:
```
Running on http://localhost:5001
```

#### Terminal 3: Hospital Dashboard (Port 5173)
```powershell
cd c:\Users\sanje\exam_proctoring_app\web\medical\medilink-hospital-dashboard
npm run dev
```
Expected output:
```
VITE v4.x ready in xxx ms

➜  Local:   http://localhost:5173/
```

#### Terminal 4: Mobile App (Flutter Web)
```powershell
cd c:\Users\sanje\exam_proctoring_app\web\medical\medilink-mobile
flutter run -d chrome
```

#### Terminal 5: (Optional) Monitor logs
```powershell
# This stays open to monitor all connections
# You can check API responses here
```

---

## 🔧 Database Setup (IMPORTANT FIRST STEP!)

### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to: https://www.mongodb.com/cloud/atlas
2. Create FREE account
3. Create a free cluster
4. Click "Connect" → "Drivers" → "Node.js"
5. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/medilink
   ```
6. Update `medilink-backend\.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medilink
   ```

### Option B: MongoDB Local
1. Download: https://www.mongodb.com/try/download/community
2. Install (Windows installer)
3. Default connection works: `mongodb://localhost:27017/medilink`

---

## 📱 Access Services

After everything is running:

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:5000 | REST API endpoints |
| AI Service | http://localhost:5001 | ML predictions |
| Dashboard | http://localhost:5173 | Hospital management UI |
| Mobile App | http://localhost:XXXX | Flutter web version |

---

## ✅ Verification Checklist

- [ ] Backend running on 5000
- [ ] AI Service running on 5001
- [ ] Dashboard running on 5173
- [ ] Can access http://localhost:5173 in browser
- [ ] Can access http://localhost:5000/api/health
- [ ] Mobile app shows "Demo Mode" or login screen

---

## 🐛 Troubleshooting

### Backend won't start
```
Error: Port 5000 already in use
→ Kill process: netstat -ano | findstr :5000
→ taskkill /PID <PID> /F

Error: Cannot connect to MongoDB
→ Check MONGODB_URI in .env
→ Ensure MongoDB is running
→ Use MongoDB Atlas if local installation issues
```

### Dashboard won't load
```
Error: npm install failed
→ Run: npm install --legacy-peer-deps

Error: Port 5173 in use
→ Change in vite.config.js: server: { port: 5174 }
```

### AI Service won't start
```
Error: ModuleNotFoundError
→ Activate venv: .\venv\Scripts\Activate.ps1
→ Reinstall: pip install -r requirements.txt

Error: Port 5001 in use
→ Change in app.py: app.run(port=5002)
```

### Mobile app issues
```
Error: No devices found
→ Enable USB Debugging on Android phone
→ Or use: flutter run -d chrome (for web)

Error: Dependency conflicts
→ Run: flutter pub get --force-upgrade
```

---

## 🔐 Configuration Files

Save MongoDB Atlas connection string in `.env` files:

### medilink-backend/.env
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/medilink
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
PORT=5000
```

### Other .env files
Pre-configured with examples. Optional fields for Firebase, AWS S3, etc.

---

## 📊 API Endpoints (Quick Test)

```bash
# Health check
curl http://localhost:5000/api/health

# AI prediction test
curl -X POST http://localhost:5001/predict ^
  -H "Content-Type: application/json" ^
  -d "{\"age\":30,\"bmi\":28,\"condition\":\"diabetes\"}"
```

---

## 🎯 Next Steps

1. **Set up MongoDB connection** (Steps in "Database Setup" above)
2. **Start all components** (Use START_ALL.ps1 or manual startup)
3. **Test Dashboard** at http://localhost:5173
4. **Test Mobile App** with flutter run -d chrome
5. **Review API docs** in docs/DOCUMENTATION.md

---

## 📚 Full Documentation

- Backend: `docs/BACKEND_SETUP.md`
- AI Service: `docs/AI_SERVICE_SETUP.md`
- Dashboard: `docs/DASHBOARD_SETUP.md`
- Mobile: `docs/MOBILE_SETUP.md`
- Architecture: `docs/ARCHITECTURE.md`

---

**Status:** ✅ All components ready for startup!
