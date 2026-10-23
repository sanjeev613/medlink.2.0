# MediLink AI - Complete Project Startup Script
# This script starts all components on localhost

$projectRoot = $PSScriptRoot
if (-not $projectRoot) { $projectRoot = "c:\davinci\medical" }

Write-Host "
╔═══════════════════════════════════════════════════════════════╗
║          MediLink AI - Complete Project Startup              ║
║           All Components on LocalHost                         ║
╚═══════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

Write-Host "[1/5] MongoDB Setup" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray

# Check if MongoDB is available
$mongoCheck = Get-Command mongod -ErrorAction SilentlyContinue

if ($mongoCheck) {
    Write-Host "✓ MongoDB found. Starting MongoDB..." -ForegroundColor Green
    Start-Process mongod -WindowStyle Minimized
    Start-Sleep -Seconds 2
} else {
    Write-Host "⚠ MongoDB not installed locally. Using MongoDB Atlas Cloud:" -ForegroundColor Yellow
    Write-Host "
  1. Go to: https://www.mongodb.com/cloud/atlas
  2. Create a free cluster
  3. Copy the connection string
  4. Update MONGODB_URI in medilink-backend\.env
  5. Press ENTER to continue...
" -ForegroundColor Cyan
    Read-Host "Press ENTER after updating .env file"
}

Write-Host ""
Write-Host "[2/5] Backend API (Port 5000)" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\medilink-backend'; npm run dev" -WindowStyle Normal
Write-Host "✓ Backend starting... (wait 5-10 seconds)" -ForegroundColor Green
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[3/5] AI Service (Port 5001)" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\medilink-ai'; .\venv\Scripts\Activate.ps1; python app.py" -WindowStyle Normal
Write-Host "✓ AI Service starting..." -ForegroundColor Green
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[4/5] Hospital Dashboard (Port 5173)" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\medilink-hospital-dashboard'; npm run dev" -WindowStyle Normal
Write-Host "✓ Hospital Dashboard starting..." -ForegroundColor Green
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[5/5] Mobile App (Flutter)" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "
To run the mobile app, use one of these commands in a new terminal:

  # Chrome Web
  cd $projectRoot\medilink-mobile
  flutter run -d chrome

  # Android Emulator
  flutter run -d emulator-5554

  # Or use VS Code: F5 with Flutter extension
" -ForegroundColor Cyan

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           ✓ ALL COMPONENTS STARTING ON LOCALHOST             ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host ""
Write-Host "🌐 SERVICES RUNNING:" -ForegroundColor Cyan
Write-Host "  • Backend API        → http://localhost:5000" -ForegroundColor Green
Write-Host "  • AI Service         → http://localhost:5001" -ForegroundColor Green
Write-Host "  • Hospital Dashboard → http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "📱 MOBILE APP:" -ForegroundColor Cyan
Write-Host "  Use flutter run -d chrome  (or your device)" -ForegroundColor Green
Write-Host ""
Write-Host "📊 MONITORING:" -ForegroundColor Cyan
Write-Host "  • Backend Logs       → Check terminal #1" -ForegroundColor Green
Write-Host "  • AI Service Logs    → Check terminal #2" -ForegroundColor Green
Write-Host "  • Dashboard Logs     → Check terminal #3" -ForegroundColor Green
Write-Host ""
Write-Host "⚙️ TO STOP ALL SERVICES:" -ForegroundColor Yellow
Write-Host "  • Close each terminal window or press Ctrl+C" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 TIPS:" -ForegroundColor Cyan
Write-Host "  • Backend uses hot-reload (nodemon): Changes auto-apply" -ForegroundColor Gray
Write-Host "  • Dashboard uses hot-reload (Vite): Changes auto-apply" -ForegroundColor Gray
Write-Host "  • Check .env files if connection issues occur" -ForegroundColor Gray
Write-Host ""

# Keep script running
Read-Host "Press ENTER to exit this startup window"
