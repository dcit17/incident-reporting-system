# Deployment Guide

## Docker Desktop Deployment

### Prerequisites
- Docker Desktop installed and running
- 4GB RAM minimum
- 10GB free disk space

### Steps

1. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd intervention-site
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if you want email notifications (optional).

3. **Build and Start**
   ```bash
   docker-compose up -d --build
   ```

4. **Verify**
   - Open http://localhost
   - Login with `admin` / `admin123`
   - Change password immediately!

### Updating

```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Stopping

```bash
docker-compose down
```

### Complete Reset

```bash
docker-compose down -v  # Removes volumes (deletes data!)
docker-compose up -d --build
```

## Production Deployment

### Using Docker on VPS/Cloud

1. **Server Requirements**
   - Ubuntu 20.04+ or similar
   - Docker and Docker Compose installed
   - Domain name (optional but recommended)

2. **Setup**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   sudo apt install docker-compose
   
   # Clone and configure
   git clone <your-repo-url>
   cd intervention-site
   cp .env.example .env
   nano .env  # Configure production settings
   ```

3. **Run**
   ```bash
   docker-compose up -d --build
   ```

4. **Setup Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:80;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

5. **SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## Backup Strategy

### Automated Backup Script

Create `backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/backups/intervention-site"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker cp intervention_backend:/app/data/incidents.db \
  $BACKUP_DIR/incidents_$DATE.db

# Backup uploads
docker cp intervention_backend:/app/public/uploads \
  $BACKUP_DIR/uploads_$DATE/

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete
```

Run daily with cron:
```bash
0 2 * * * /path/to/backup.sh
```

## Monitoring

### Check Logs
```bash
docker-compose logs -f
docker-compose logs backend
docker-compose logs frontend
```

### Container Status
```bash
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

## Troubleshooting

### Port Already in Use
Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Change 80 to 8080
```

### Database Corruption
```bash
docker-compose down
docker volume rm intervention-site_db-data
docker-compose up -d
```

### Out of Memory
Increase Docker Desktop memory limit in Settings > Resources.

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong JWT secret
- [ ] Configured firewall (allow only 80, 443)
- [ ] Enabled HTTPS
- [ ] Regular backups configured
- [ ] Updated CORS settings
- [ ] Removed development tools
- [ ] Set secure environment variables
- [ ] Regular security updates
