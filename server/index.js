const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = 'super-secret-key-change-in-production'; // In a real app, use .env

app.use(cors());
app.use(bodyParser.json());

// --- Middleware ---

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admin role required." });
    }
};

// --- API Routes ---

// GET all incidents (Protected: Staff only)
app.get('/api/incidents', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM incidents ORDER BY created_at DESC';
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'success', data: rows });
    });
});

// GET single incident (Protected)
app.get('/api/incidents/:id', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM incidents WHERE id = ?';
    const params = [req.params.id];
    db.get(sql, params, (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'success', data: row });
    });
});

// POST new incident report (Public)
app.post('/api/incidents', (req, res) => {
    const {
        incident_date_time, event_title, location, student_names, phone_number, address,
        nature_of_incident, leaders_present, what_happened, why_did_it_happened,
        initial_action_taken, parents_contacted, parent_response, leader_name, witness_name
    } = req.body;

    const sql = `INSERT INTO incidents (
    incident_date_time, event_title, location, student_names, phone_number, address,
    nature_of_incident, leaders_present, what_happened, why_did_it_happen,
    initial_action_taken, parents_contacted, parent_response, leader_name, witness_name
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const params = [
        incident_date_time, event_title, location, student_names, phone_number, address,
        nature_of_incident, leaders_present, what_happened, why_did_it_happened,
        initial_action_taken, parents_contacted, parent_response, leader_name, witness_name
    ];

    db.run(sql, params, function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'success', data: { id: this.lastID } });
    });
});

// PATCH update incident (Protected: Staff / Admin)
app.patch('/api/incidents/:id', authenticateToken, (req, res) => {
    const { status, staff_intervention_details, staff_intervention_by } = req.body;
    let sql = `UPDATE incidents SET `;
    const params = [];
    const updates = [];

    if (status) { updates.push(`status = ?`); params.push(status); }
    if (staff_intervention_details) { updates.push(`staff_intervention_details = ?`); params.push(staff_intervention_details); }
    if (staff_intervention_by) { updates.push(`staff_intervention_by = ?`); params.push(staff_intervention_by); }

    if (updates.length === 0) return res.status(400).json({ message: "No fields to update" });

    sql += updates.join(', ') + ` WHERE id = ?`;
    params.push(req.params.id);

    db.run(sql, params, function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'success', changes: this.changes });
    });
});

// --- Auth & User Management ---

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
                res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        });
    });
});

// Check Auth Status (Validation)
app.get('/api/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// --- Admin Routes ---

// --- Archive & Restore ---

// DELETE Incident (Archive) - Exec & Superadmin
app.delete('/api/incidents/:id', authenticateToken, (req, res) => {
    // Role check: 'exec' or 'superadmin' ('tech' creates users, 'exec' deletes events)
    // Assuming 'admin' is superadmin here. Let's stick to requested roles.
    // User requested: "exec can delete events".
    if (!['exec', 'admin'].includes(req.user.role)) return res.sendStatus(403);

    const id = req.params.id;

    // 1. Get Incident
    db.get('SELECT * FROM incidents WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: 'Incident not found' });

        // 2. Archive
        const archiveSql = `INSERT INTO archived_incidents (
            original_id, incident_date_time, event_title, location, student_names, phone_number, address,
            nature_of_incident, leaders_present, what_happened, why_did_it_happen,
            initial_action_taken, parents_contacted, parent_response, leader_name, witness_name,
            leader_signature, witness_signature, status, staff_intervention_details, staff_intervention_by,
            created_at, archived_by
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        const params = [
            row.id, row.incident_date_time, row.event_title, row.location, row.student_names, row.phone_number, row.address,
            row.nature_of_incident, row.leaders_present, row.what_happened, row.why_did_it_happen,
            row.initial_action_taken, row.parents_contacted, row.parent_response, row.leader_name, row.witness_name,
            row.leader_signature, row.witness_signature, row.status, row.staff_intervention_details, row.staff_intervention_by,
            row.created_at, req.user.username
        ];

        db.run(archiveSql, params, function (err) {
            if (err) return res.status(500).json({ error: 'Failed to archive: ' + err.message });

            // 3. Delete
            db.run('DELETE FROM incidents WHERE id = ?', [id], (err) => {
                if (err) return res.status(500).json({ error: 'Failed to delete original: ' + err.message });
                res.json({ message: 'success' });
            });
        });
    });
});

// GET Archived Incidents - Tech & Superadmin
app.get('/api/archive', authenticateToken, (req, res) => {
    if (!['tech', 'admin'].includes(req.user.role)) return res.sendStatus(403);

    db.all('SELECT * FROM archived_incidents ORDER BY archived_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// RESTORE Archived Incident - Tech Only
app.post('/api/archive/:id/restore', authenticateToken, (req, res) => {
    if (req.user.role !== 'tech' && req.user.role !== 'admin') return res.sendStatus(403);

    const id = req.params.id; // This is the ID in the ARCHIVE table

    db.get('SELECT * FROM archived_incidents WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: 'Archived incident not found' });

        // Insert back into incidents
        // We let SQLite assign a NEW ID to avoid collisions if ID was reused, 
        // OR we could try to force ID. For safety, new ID is better.
        // But user might expect same ID. Let's try to pass all data excluding ID and Archive Metadata.

        const restoreSql = `INSERT INTO incidents (
            incident_date_time, event_title, location, student_names, phone_number, address,
            nature_of_incident, leaders_present, what_happened, why_did_it_happen,
            initial_action_taken, parents_contacted, parent_response, leader_name, witness_name,
            leader_signature, witness_signature, status, staff_intervention_details, staff_intervention_by,
            created_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        const params = [
            row.incident_date_time, row.event_title, row.location, row.student_names, row.phone_number, row.address,
            row.nature_of_incident, row.leaders_present, row.what_happened, row.why_did_it_happen,
            row.initial_action_taken, row.parents_contacted, row.parent_response, row.leader_name, row.witness_name,
            row.leader_signature, row.witness_signature, row.status, row.staff_intervention_details, row.staff_intervention_by,
            row.created_at
        ];

        db.run(restoreSql, params, function (err) {
            if (err) return res.status(500).json({ error: 'Failed to restore: ' + err.message });

            // Delete from archive
            db.run('DELETE FROM archived_incidents WHERE id = ?', [id], (err) => {
                if (err) console.error("Warning: Failed to cleanup archive", err);
                res.json({ message: 'success' });
            });
        });
    });
});


// --- Admin Routes ---

// GET All Users
app.get('/api/users', authenticateToken, (req, res) => {
    // Admin, Tech can view users
    if (!['admin', 'tech'].includes(req.user.role)) return res.sendStatus(403);

    db.all('SELECT id, username, role, created_at FROM users', [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ data: rows });
    });
});

// POST Create User - Admin & Tech
app.post('/api/users', authenticateToken, (req, res) => {
    const { username, password, role } = req.body;

    if (!['admin', 'tech'].includes(req.user.role)) return res.sendStatus(403);

    // Only Admin can create Admin? Or Tech too?
    // User request: "tech user that can only create accounts (including super user)" -> so Tech CAN create admin.

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, role || 'user'], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: 'success', data: { id: this.lastID } });
        });
    });
});

// --- Branding & Settings (File Uploads) ---
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Use fixed names based on fieldname to overwrite old logos (or unique if preferred)
        // Here we use unique names to avoid cache issues
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// GET Settings
app.get('/api/settings', (req, res) => {
    db.all('SELECT key, value FROM settings', [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);
        res.json({ data: settings });
    });
});

// POST Upload Branding
app.post('/api/settings/upload', authenticateToken, requireAdmin, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]), (req, res) => {
    const updates = [];

    if (req.files['logo']) {
        const logoPath = '/uploads/' + req.files['logo'][0].filename;
        updates.push(new Promise((resolve, reject) => {
            db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['logo', logoPath], (err) => {
                if (err) reject(err); else resolve();
            });
        }));
    }

    if (req.files['favicon']) {
        const faviconPath = '/uploads/' + req.files['favicon'][0].filename;
        updates.push(new Promise((resolve, reject) => {
            db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['favicon', faviconPath], (err) => {
                if (err) reject(err); else resolve();
            });
        }));
    }

    Promise.all(updates)
        .then(() => res.json({ message: 'success' }))
        .catch(err => res.status(500).json({ error: err.message }));
});


// --- Admin: Merge Tickets ---
app.post('/api/incidents/merge', authenticateToken, requireAdmin, async (req, res) => {
    const { ids } = req.body; // Array of IDs
    if (!ids || ids.length < 2) return res.status(400).json({ message: "At least 2 IDs required" });

    // 1. Get all incidents sorted by ID (Ascending) -> First is the survivor
    const placeholders = ids.map(() => '?').join(',');
    const sql = `SELECT * FROM incidents WHERE id IN (${placeholders}) ORDER BY id ASC`;

    db.all(sql, ids, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length < 2) return res.status(400).json({ message: "Incidents not found" });

        const survivor = rows[0];
        const victims = rows.slice(1);

        // 2. Concatenate Data
        const combinedStudentNames = [...new Set([survivor.student_names, ...victims.map(v => v.student_names)].flatMap(s => s.split(',').map(n => n.trim())))].join(', ');

        const combineField = (field) => {
            return [survivor[field], ...victims.map(v => v[field])]
                .filter(Boolean)
                .join('\n-- MERGED --\n');
        };

        const newDescription = combineField('what_happened');
        const newInitialAction = combineField('initial_action_taken');

        // Merge Logs (Intervention Details)
        // Add a header to identify where logs came from if needed, but simple append works
        let combinedLogs = survivor.staff_intervention_details || '';
        victims.forEach(v => {
            if (v.staff_intervention_details) {
                combinedLogs += `\n\n[MERGED FROM #${v.id}]:\n` + v.staff_intervention_details;
            }
        });

        // 3. Update Survivor
        const updateSql = `UPDATE incidents SET student_names = ?, what_happened = ?, initial_action_taken = ?, staff_intervention_details = ? WHERE id = ?`;

        db.run(updateSql, [combinedStudentNames, newDescription, newInitialAction, combinedLogs, survivor.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // 4. Delete Victims
            const victimIds = victims.map(v => v.id);
            const deletePlaceholders = victimIds.map(() => '?').join(',');
            db.run(`DELETE FROM incidents WHERE id IN (${deletePlaceholders})`, victimIds, function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'success', mergedId: survivor.id });
            });
        });
    });
});

// PATCH Reset Password - Admin & Tech
app.patch('/api/users/:id/reset-password', authenticateToken, (req, res) => {
    if (!['admin', 'tech'].includes(req.user.role)) return res.sendStatus(403);

    const { password } = req.body;
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run('UPDATE users SET password = ? WHERE id = ?', [hash, req.params.id], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: 'success' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
