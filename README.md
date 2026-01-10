# Incident Reporting System

A comprehensive web-based incident reporting and management system with role-based access control, designed for organizations to track and manage incidents efficiently.

## Features

- **Public Incident Reporting**: Easy-to-use form for submitting incident reports
- **Secure Staff Dashboard**: Role-based access for viewing and managing incidents
- **Staff Interventions**: Track follow-up actions and resolutions
- **Search & Filter**: Powerful search across all incident fields
- **Batch Printing**: Print individual reports or multiple selected incidents
- **Archive System**: Soft-delete incidents with restore capability
- **Branding**: Custom logo and favicon support
- **User Management**: Create and manage staff accounts with different permission levels
- **Email Notifications** (Optional): Notify executives of new incidents

## User Roles

- **User**: View incidents, add interventions
- **Exec**: User permissions + delete incidents + print reports
- **Tech**: User permissions + manage user accounts + access archive
- **Admin**: Full system access including settings and branding

## Tech Stack

### Frontend
- React 18 with React Router
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons

### Backend
- Node.js with Express
- SQLite database
- JWT authentication
- Bcrypt for password hashing
- Multer for file uploads

### Deployment
- Docker & Docker Compose
- Nginx for frontend serving
- Persistent volumes for data

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed
- Git (for cloning)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd intervention-site
   ```

2. **Configure environment (optional for email)**
   ```bash
   cp .env.example .env
   # Edit .env with your SMTP credentials if you want email notifications
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000

5. **Default Login**
   - Username: `admin`
   - Password: `admin123`
   - **⚠️ Change this immediately in production!**

## Development Setup

### Without Docker

#### Backend
```bash
cd server
npm install
node index.js
```

#### Frontend
```bash
cd client
npm install
npm run dev
```

## Email Notifications Setup

Email notifications are **optional**. To enable:

1. Install dependencies:
   ```bash
   cd server
   npm install nodemailer dotenv
   ```

2. Configure `.env` with your SMTP settings (see `.env.example`)

3. Follow the detailed guide in `docs/email_setup_guide.md`

## Docker Configuration

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file based on `.env.example`:

```env
# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@example.com
FROM_NAME=Incident Reporting System
```

### Volumes

Data is persisted using Docker volumes:
- `db-data`: SQLite database
- `uploads-data`: Uploaded logos and favicons

### Ports

- `80`: Frontend (Nginx)
- `5000`: Backend API

## Project Structure

```
intervention-site/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Main app component
│   ├── Dockerfile
│   └── nginx.conf
├── server/                # Node.js backend
│   ├── db.js             # Database setup
│   ├── index.js          # Express server
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Public
- `POST /api/incidents` - Submit new incident report

### Protected (requires authentication)
- `POST /api/login` - Authenticate user
- `GET /api/incidents` - List all incidents
- `GET /api/incidents/:id` - Get single incident
- `PATCH /api/incidents/:id` - Update incident
- `DELETE /api/incidents/:id` - Archive incident
- `POST /api/incidents/merge` - Merge multiple incidents
- `GET /api/archive` - List archived incidents
- `POST /api/archive/:id/restore` - Restore archived incident

### Admin Only
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PATCH /api/users/:id/reset-password` - Reset user password
- `GET /api/settings` - Get branding settings
- `POST /api/settings/upload` - Upload logo/favicon

## Security Notes

- JWT tokens for authentication
- Bcrypt password hashing
- Role-based access control
- Protected routes on frontend and backend
- CORS enabled for localhost development
- Environment variables for sensitive data

## Production Deployment

1. **Change default credentials** immediately
2. **Set strong JWT secret** in production
3. **Use HTTPS** (configure reverse proxy)
4. **Regular backups** of Docker volumes
5. **Update CORS settings** to match your domain
6. **Set secure environment variables**

## Backup & Restore

### Backup
```bash
# Backup database
docker cp intervention_backend:/app/data/incidents.db ./backup/

# Backup uploads
docker cp intervention_backend:/app/public/uploads ./backup/
```

### Restore
```bash
# Restore database
docker cp ./backup/incidents.db intervention_backend:/app/data/

# Restore uploads
docker cp ./backup/uploads intervention_backend:/app/public/
```

## Troubleshooting

### Database Issues
- Delete the database volume to reset: `docker volume rm intervention-site_db-data`
- Database will be recreated with default admin user on next start

### Port Conflicts
- Change ports in `docker-compose.yml` if 80 or 5000 are in use

### Build Failures
- Clear Docker cache: `docker-compose build --no-cache`
- Remove old containers: `docker-compose down -v`

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.
