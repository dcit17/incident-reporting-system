const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Connect to SQLite database
const fs = require('fs');
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'incidents.db');

// Ensure directory exists if using a custom path
if (process.env.DB_PATH) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Incidents Table
        db.run(`CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_date_time TEXT,
            event_title TEXT,
            location TEXT,
            student_names TEXT,
            phone_number TEXT,
            address TEXT,
            nature_of_incident TEXT,
            leaders_present TEXT,
            what_happened TEXT,
            why_did_it_happen TEXT,
            initial_action_taken TEXT,
            parents_contacted INTEGER DEFAULT 0, -- 0 for No, 1 for Yes
            parent_response TEXT,
            leader_name TEXT,
            witness_name TEXT,
            leader_signature TEXT,
            witness_signature TEXT,
            
            -- Backend/Dashboard fields
            status TEXT DEFAULT 'Open', -- 'Open', 'Resolved'
            staff_intervention_details TEXT,
            staff_intervention_by TEXT,
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating incidents table', err.message);
            else console.log('Incidents table ready.');
        });

        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user', -- 'admin' or 'user'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating users table', err.message);
            } else {
                console.log('Users table ready.');
                seedAdmin();
            }
        });

        // Settings Table (Branding)
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`, (err) => {
            if (err) console.error('Error creating settings table', err.message);
            else console.log('Settings table ready.');
        });

        // Archived Incidents Table
        db.run(`CREATE TABLE IF NOT EXISTS archived_incidents (
            id INTEGER PRIMARY KEY,
            original_id INTEGER,
            incident_date_time TEXT,
            event_title TEXT,
            location TEXT,
            student_names TEXT,
            phone_number TEXT,
            address TEXT,
            nature_of_incident TEXT,
            leaders_present TEXT,
            what_happened TEXT,
            why_did_it_happen TEXT,
            initial_action_taken TEXT,
            parents_contacted INTEGER,
            parent_response TEXT,
            leader_name TEXT,
            witness_name TEXT,
            leader_signature TEXT,
            witness_signature TEXT,
            status TEXT,
            staff_intervention_details TEXT,
            staff_intervention_by TEXT,
            created_at DATETIME,
            archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            archived_by TEXT
        )`, (err) => {
            if (err) console.error('Error creating archived_incidents table', err.message);
            else console.log('Archived Incidents table ready.');
        });
    });
}

function seedAdmin() {
    const adminUser = 'admin';
    const adminPass = 'admin123';

    db.get('SELECT id FROM users WHERE username = ?', [adminUser], (err, row) => {
        if (err) {
            console.error('Error checking admin existence:', err);
            return;
        }
        if (!row) {
            console.log('Seeding default admin user...');
            bcrypt.hash(adminPass, 10, (err, hash) => {
                if (err) {
                    console.error('Error hashing password:', err);
                    return;
                }
                db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [adminUser, hash, 'admin'], (err) => {
                    if (err) console.error('Error seeding admin:', err);
                    else console.log('Default admin user created.');
                });
            });
        }
    });
}

module.exports = db;
