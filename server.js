const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // serve your landing page

// Setup SQLite database
const dbPath = path.resolve(__dirname, "emails.db");
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error(err.message);
    console.log("Connected to the SQLite database.");
});

// Create table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS waiting_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// API endpoint to handle email submissions
app.post("/signup", (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    // Insert email into database
    const query = `INSERT INTO waiting_list (email) VALUES (?)`;
    db.run(query, [email], function(err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint")) {
                return res.status(409).json({ message: "Email already signed up." });
            }
            return res.status(500).json({ message: "Database error." });
        }

        res.json({ message: "Thanks for joining the waiting list!" });
    });
});

// Optional: route to view the waiting list
app.get("/list", (req, res) => {
    db.all(`SELECT * FROM waiting_list ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ message: "Database error." });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
