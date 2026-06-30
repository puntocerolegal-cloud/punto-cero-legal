# Punto Cero Legal - Quick Start

## Prerequisites
- Docker & Docker Compose
- Node.js 16+
- Python 3.11+

## Setup

### 1. Start MongoDB (Terminal 1)
```bash
docker-compose up -d
```

Verify MongoDB is running:
```bash
docker-compose logs mongodb
```

Should show: `initandlisten done`

### 2. Start Backend (Terminal 2)
```bash
cd backend
python server.py
```

Should show:
```
Uvicorn running on http://0.0.0.0:8000
Application startup complete
```

### 3. Start Frontend (Terminal 3)
```bash
cd frontend
npm start
```

Should show:
```
Compiled successfully!
Local: http://localhost:3000
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://127.0.0.1:8000/docs
- **Health Check**: http://127.0.0.1:8000/api/health

## Test Credentials

**Admin**:
- Email: `darwin@puntocerolegal.com`
- Password: `Admin2025!`

**Lawyer**:
- Email: `lawyer@test.com`
- Password: `Lawyer2025!`

**Client**:
- Email: `client@test.com`
- Password: `Client2025!`

## Troubleshooting

### MongoDB connection refused
```bash
docker-compose up -d
```

### Backend logs already bound
Port 8000 is in use. Kill the process or change the port in uvicorn.

### Frontend compilation errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

## Verify Everything Works

1. Go to http://localhost:3000
2. Click "Iniciar Sesión"
3. Login with admin credentials
4. Should redirect to /admin
5. Check browser console (F12) for no errors
6. Check Network tab for no 401/403/500 errors

## Database

MongoDB runs in Docker with:
- Host: localhost
- Port: 27017
- Username: admin
- Password: admin123
- Database: punto_cero_legal

Data persists in `mongodb_data` volume.

## Stopping Everything

```bash
# Stop MongoDB
docker-compose down

# Kill all dev servers (Ctrl+C in each terminal)
```

## Notes

- .env already configured for local development
- CORS configured for localhost:3000
- JWT tokens expire in 24 hours
- Test user accounts created automatically on backend startup
