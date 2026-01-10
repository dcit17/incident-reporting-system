# Email Notification System Setup Guide

This guide outlines how to implement email notifications for executives when new incident reports are submitted.

## Overview

When a new incident report is submitted via the public form, the system will automatically send an email notification to all users with the `exec` role.

## Requirements

### 1. Install Dependencies

```bash
cd server
npm install nodemailer dotenv
```

### 2. Environment Configuration

Create a `.env` file in the `server/` directory:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Incident Reporting System
```

> **Note**: For Gmail, you'll need to create an [App Password](https://support.google.com/accounts/answer/185833) instead of using your regular password.

### 3. Update `server/index.js`

Add at the top:
```javascript
require('dotenv').config();
const nodemailer = require('nodemailer');
```

Create email transporter after imports:
```javascript
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
```

### 4. Add Email Function

```javascript
async function sendNewIncidentNotification(incident) {
    try {
        // Get all exec users
        const execs = await new Promise((resolve, reject) => {
            db.all("SELECT username FROM users WHERE role = 'exec'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (execs.length === 0) return;

        const recipients = execs.map(u => `${u.username}@yourdomain.com`).join(', ');

        const mailOptions = {
            from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
            to: recipients,
            subject: `New Incident Report: ${incident.nature_of_incident}`,
            html: `
                <h2>New Incident Report Submitted</h2>
                <p><strong>Date/Time:</strong> ${new Date(incident.incident_date_time).toLocaleString()}</p>
                <p><strong>Type:</strong> ${incident.nature_of_incident}</p>
                <p><strong>Location:</strong> ${incident.location}</p>
                <p><strong>Students:</strong> ${incident.student_names}</p>
                <p><strong>Reported By:</strong> ${incident.leader_name}</p>
                <hr>
                <p>${incident.what_happened}</p>
                <hr>
                <p><a href="http://localhost:5000/dashboard">View in Dashboard</a></p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Notification email sent to executives');
    } catch (error) {
        console.error('Failed to send notification email:', error);
    }
}
```

### 5. Update POST `/api/incidents` Route

After successfully inserting the incident:

```javascript
app.post('/api/incidents', (req, res) => {
    const { /* ... fields ... */ } = req.body;
    
    const query = `INSERT INTO incidents (/* ... */) VALUES (/* ... */)`;
    
    db.run(query, values, function(err) {
        if (err) {
            return res.status(500).json({ message: 'error', error: err.message });
        }
        
        // Get the inserted incident for email
        db.get('SELECT * FROM incidents WHERE id = ?', [this.lastID], (err, incident) => {
            if (!err && incident) {
                sendNewIncidentNotification(incident); // Send async, don't await
            }
        });
        
        res.json({ message: 'success', id: this.lastID });
    });
});
```

## Email Service Options

### Gmail
- **Free tier**: 500 emails/day
- **Setup**: Enable 2FA, create App Password
- **Host**: `smtp.gmail.com`
- **Port**: `587`

### SendGrid
- **Free tier**: 100 emails/day
- **Setup**: Create API key
- **Host**: `smtp.sendgrid.net`
- **Port**: `587`

### AWS SES
- **Free tier**: 62,000 emails/month (if sending from EC2)
- **Setup**: Verify domain, create SMTP credentials
- **Requires**: AWS account

## Testing

Test the email configuration:

```javascript
// Add a test route temporarily
app.get('/test-email', async (req, res) => {
    try {
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: 'your-test-email@example.com',
            subject: 'Test Email',
            text: 'Email configuration is working!'
        });
        res.send('Email sent successfully');
    } catch (error) {
        res.status(500).send('Email failed: ' + error.message);
    }
});
```

## Security Notes

- **Never commit `.env`** to version control
- Add `.env` to `.gitignore`
- Use environment variables in production
- For Docker: Pass env vars in `docker-compose.yml`

## Docker Configuration

Update `docker-compose.yml`:

```yaml
services:
  backend:
    build: ./server
    environment:
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - FROM_EMAIL=${FROM_EMAIL}
      - FROM_NAME=${FROM_NAME}
```

Create `.env` in project root with the same variables.

## Customization

### Email Template
Modify the HTML in `sendNewIncidentNotification()` to match your branding.

### Recipients
Change the query to target different roles:
```javascript
db.all("SELECT username FROM users WHERE role IN ('exec', 'admin')", ...)
```

### Email Addresses
Currently assumes `username@yourdomain.com`. Update to use actual email addresses by:
1. Adding an `email` column to the `users` table
2. Updating the recipients line: `execs.map(u => u.email).join(', ')`
