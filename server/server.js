
import express from 'express';
import mysql from 'mysql2';
import bcrypt from 'bcryptjs';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'edubari'
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database "edubari"');

  // Create users table if it doesn't exist
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullName VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    )
  `;
  db.query(createTableSql, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
      return;
    }
    console.log('Users table checked/created successfully.');
  });
});

// Signup route
app.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const sql = 'INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)';
    await db.promise().query(sql, [fullName, email, hashedPassword]);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({ message: 'Login successful', user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
