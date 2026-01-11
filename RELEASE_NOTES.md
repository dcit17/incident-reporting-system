# Release Notes - v1.1.0

**Release Date**: January 10, 2026

## 🐛 Bug Fixes

### Docker Compose Deployment Issue

**Fixed**: Application failing to connect to backend when running in Docker Compose with error "ensure server is running"

**Root Cause**: Frontend was using hardcoded `http://localhost:5000` URLs which don't work in containerized environments where each service runs in its own container.

**Solution**: 
- Replaced all absolute API URLs with relative paths (`/api/...`)
- Added nginx proxy configuration for `/uploads/` path
- All API calls now properly route through nginx to the backend container

## 📝 Changes

### Frontend Components Updated
- `Dashboard.jsx` - 13 API endpoints + 3 image sources
- `Login.jsx` - Settings & login endpoints + logo source
- `Layout.jsx` - Settings endpoint + logo URL
- `InterventionModal.jsx` - 2 incident update endpoints
- `ReportForm.jsx` - Incident submission endpoint
- `PrintView.jsx` - Incident fetch endpoint
- `PrintListView.jsx` - Incident fetch endpoint

### Configuration
- `nginx.conf` - Added `/uploads/` proxy configuration

## 🚀 Deployment

### For New Deployments
```bash
git clone <your-repo-url>
cd intervention-site
docker-compose up -d --build
```

### For Existing Deployments
```bash
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## ✅ Tested On
- Debian 12
- Docker Compose v2.x
- Windows with Docker Desktop

## 📋 Migration Notes
- **No breaking changes**
- **No database migrations required**
- Simply rebuild containers to apply the fix

## 🔗 Links
- Full commit: [64cf5ac]
- Tag: v1.1.0
- Previous release: v1.0.0 (initial Docker support)

---

For issues or questions, please open an issue on GitHub.
