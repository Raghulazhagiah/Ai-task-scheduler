const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path'); // Import path module
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt')
const { exec } = require('child_process'); // Add this line

app.use(cors());

const port = 3002;

// Middleware to parse JSON
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'Frontend')));

// Connect to MySQL database
const db = mysql.createConnection({
    host: 'localhost',      
    user: 'root',  
    password: 'root',  
    database: 'agency_db'   
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
    } else {
        console.log('Connected to the MySQL database.');
    }
});

app.post('/tasks', (req, res) => {
    const { name, task, email, email_id } = req.body;
    console.log("Req",req.body)
    if (!name || !task) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const sql = 'INSERT INTO agency_db.new_table1 (name, task, email, created_at, email_id) VALUES (?, ?, ?, ?, ?)';
    const date = new Date();

    db.query(sql, [name, task, email, date, email_id], (err, result) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ id: result.insertId });
    });
});



app.get('/get/:email_id', (req, res) => {
    const { email_id } = req.params;

    // Use parameterized query to prevent SQL injection
    const sql = 'SELECT * FROM agency_db.new_table1 WHERE email_id = ?';

    db.query(sql, [email_id], (err, result) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(200).json(result);
    });
});



app.post('/delete', (req, res) => {
    const { name } = req.body;

    // Use a parameterized query to safely include the 'name' variable
    const sql = `DELETE FROM agency_db.new_table1 WHERE name = ?`;
    console.log(sql);

    db.query(sql, [name], (err, result) => {
        if (err) {
            console.error('Error deleting record:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.status(200).json({ message: 'Record deleted successfully' });
    });
});

app.get('/email-details', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'email-details.html'));
});

// Signup API
app.post('/signup', async (req, res) => {
    const { email_id, password } = req.body;

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Query to check if the email already exists
    const checkEmailSql = 'SELECT * FROM user WHERE email_id = ?';
    
    db.query(checkEmailSql, [email_id], (err, result) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (result.length > 0) {
            // Email already exists
            return res.status(400).json({ error: 'Email already exists' });
        }

        // If email does not exist, insert the new user
        const insertSql = 'INSERT INTO user (email_id, password) VALUES (?, ?)';
        
        db.query(insertSql, [email_id, hashedPassword], (err, result) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.status(201).json({ id: result.insertId });
        });
    });
});

// Signin API

app.post('/signin', async (req, res) => {
    const { email_id, password } = req.body;

    // Query to get user by email
    const getUserSql = 'SELECT * FROM user WHERE email_id = ?';
    
    db.query(getUserSql, [email_id], async (err, result) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (result.length === 0) {
            // Email not found
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result[0];

        // Compare the provided password with the hashed password in the database
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // Authentication successful
            res.status(200).json({ message: 'Signin successful', userId: user.id });            
        } else {
            // Password does not match
            res.status(401).json({ error: 'Invalid email or password' });
        }
    });
});




app.listen(port, () => {
    console.log(`Task Scheduler API running on http://localhost:${port}`);
});
