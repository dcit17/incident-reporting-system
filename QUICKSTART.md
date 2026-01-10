# Quick Start Guide

## For First-Time Users

### 1. Install Docker Desktop
- Download from https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop
- Wait for it to fully start (whale icon in system tray)

### 2. Get the Code
```bash
# Option A: Download ZIP from GitHub
# Click "Code" > "Download ZIP" > Extract

# Option B: Clone with Git
git clone <your-repo-url>
cd intervention-site
```

### 3. Start the Application
```bash
docker-compose up -d
```

This will:
- Download required images (~500MB)
- Build the application
- Start frontend and backend
- Create database with default admin

**First time takes 5-10 minutes. Be patient!**

### 4. Access the Application
- Open browser to http://localhost
- Login: `admin` / `admin123`
- **Change password immediately!**

### 5. Stop the Application
```bash
docker-compose down
```

## Daily Usage

### Start
```bash
docker-compose up -d
```

### Stop
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

## Common Issues

### "Port 80 is already in use"
Another app is using port 80. Either:
- Stop that app, or
- Edit `docker-compose.yml` and change `"80:80"` to `"8080:80"`, then access at http://localhost:8080

### "Cannot connect to Docker daemon"
Docker Desktop is not running. Start it and wait for the whale icon.

### "Database is locked"
Stop and restart:
```bash
docker-compose down
docker-compose up -d
```

## Email Setup (Optional)

Email notifications are **optional**. To enable:

1. Copy `.env.example` to `.env`
2. Edit `.env` with your email settings
3. Restart: `docker-compose down && docker-compose up -d`
4. See `docs/email_setup_guide.md` for details

## Need Help?

- Check `docs/DEPLOYMENT.md` for detailed deployment info
- Open an issue on GitHub
- Review logs: `docker-compose logs`
