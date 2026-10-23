# MediLink Hospital Dashboard - Setup Guide

## Prerequisites
- Node.js 16+
- npm or yarn
- React 18+
- Modern web browser

## Installation

### 1. Navigate to Dashboard Directory
```bash
cd medilink-hospital-dashboard
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Development Server
```bash
npm run dev
```

Dashboard available at `http://localhost:5173`

## Project Structure

```
medilink-hospital-dashboard/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Sidebar.jsx
│   │   └── Header.jsx
│   ├── pages/               # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Emergencies.jsx
│   │   ├── PatientManagement.jsx
│   │   ├── Analytics.jsx
│   │   └── Settings.jsx
│   ├── services/            # API services
│   │   └── api.ts
│   ├── styles/              # CSS/Tailwind
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS
└── package.json
```

## Key Features

### 1. Hospital Authentication
```jsx
// Login with Hospital API Key and ID
POST /api/hospital/login
  - apiKey: String
  - hospitalId: String
```

### 2. Emergency Dashboard
- Real-time emergency list
- Patient information display
- Accept/Reject emergency
- Location tracking
- Severity indicators

### 3. Patient Management
- Patient records
- Medical history
- Treatment status
- Follow-up scheduling

### 4. Analytics
- Monthly trends
- Emergency response metrics
- Bed occupancy rates
- Performance indicators

### 5. Settings
- Hospital profile
- Operating hours
- Department configuration
- Notification preferences

## API Integration

### Hospital API Service
```javascript
// src/services/api.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'X-API-Key': localStorage.getItem('hospitalApiKey'),
    'X-Hospital-Id': localStorage.getItem('hospitalId')
  }
});
```

### Key Endpoints
```javascript
// Get emergencies
GET /hospital/emergencies/active

// Respond to emergency
POST /hospital/respond-emergency/:sosId
  body: { status: 'Accepted' | 'Rejected' }

// Update emergency status
PUT /hospital/emergency/:sosId/update-status
  body: { status: 'In_Transit' | 'Arrived' | 'Completed' }
```

## Styling with Tailwind CSS

### Utility Classes
```jsx
// Container spacing
<div className="p-6 m-4">

// Colors
<div className="bg-blue-600 text-white">

// Responsive
<div className="grid grid-cols-1 lg:grid-cols-3">

// Flexbox
<div className="flex items-center justify-between">
```

### Custom Theme
Edit `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'hospital-green': '#2E7D32',
        'hospital-blue': '#1976D2'
      }
    }
  }
}
```

## Building for Production

### Build
```bash
npm run build
# Output: dist/
```

### Preview
```bash
npm run preview
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
netlify deploy --prod --dir=dist
```

## Real-time Updates

### Using Server-Sent Events (SSE)
```javascript
const eventSource = new EventSource('/api/hospital/emergencies/stream');

eventSource.onmessage = (event) => {
  const emergency = JSON.parse(event.data);
  // Update UI
};
```

### Using WebSockets
```javascript
const socket = new WebSocket('ws://localhost:5000/hospital/updates');

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update emergency status
};
```

## Charts & Visualization

### Recharts Integration
```jsx
import { LineChart, Line, XAxis, YAxis } from 'recharts';

<LineChart data={data}>
  <CartesianGrid />
  <XAxis dataKey="month" />
  <YAxis />
  <Line type="monotone" dataKey="emergencies" stroke="#ef4444" />
</LineChart>
```

## User Management

### Hospital Admin Login
```javascript
// Credentials stored:
localStorage.setItem('hospitalApiKey', apiKey);
localStorage.setItem('hospitalId', hospitalId);
```

### Logout
```javascript
localStorage.removeItem('hospitalApiKey');
localStorage.removeItem('hospitalId');
// Navigate to login
```

## Performance Optimization

### Code Splitting
```javascript
import { lazy, Suspense } from 'react';

const Emergencies = lazy(() => import('./pages/Emergencies'));

<Suspense fallback={<Loading />}>
  <Emergencies />
</Suspense>
```

### Memoization
```javascript
import { memo } from 'react';

const EmergencyCard = memo(({ data }) => {
  // Component won't re-render unless props change
});
```

## Testing

### Unit Tests with Vitest
```bash
npm run test
```

### E2E Tests with Playwright
```bash
npm run test:e2e
```

## Troubleshooting

### Port 5173 Already in Use
```bash
npm run dev -- --port 5174
```

### CORS Issues
- Ensure backend has CORS enabled
- Check API URL environment variable
- Verify hospital API credentials

### Real-time Updates Not Working
- Check WebSocket connection
- Verify event source endpoint
- Check browser console for errors

## Browser Support

✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+  

## Security Checklist

✅ HTTPS-only in production  
✅ Secure storage of API keys  
✅ Input validation on forms  
✅ XSS prevention  
✅ CSRF protection  
✅ Rate limiting configured  

## Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)

## Support

For issues or feature requests, please refer to the main project documentation.

---

**Maintained by**: MediLink Dashboard Team  
**Last Updated**: April 2024
