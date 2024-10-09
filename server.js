const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next();
});

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const CART_FILE = path.join(__dirname, 'data', 'cart.json');
// Ensure data files exist
async function ensureDataFiles() {
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, '[]');
    }
    try {
        await fs.access(CART_FILE);
    } catch {
        await fs.writeFile(CART_FILE, '{}');
    }
}
ensureDataFiles();
// Login endpoint
app.post('/login', async (req, res) => {
    console.log('Login attempt:', req.body); // Debug log
    try {
        const { username, password } = req.body;
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        const users = JSON.parse(data);
        
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Existing cart endpoint
app.get('/cart/:username', async (req, res) => {
    const { username } = req.params;
    console.log(`Fetching cart for user: ${username}`);
    try {
        const data = await fs.readFile(CART_FILE, 'utf-8');
        console.log(`Cart data: ${data}`);
        const cartData = JSON.parse(data);
        const userCart = cartData[username] || [];
        res.json(userCart);
    } catch (err) {
        console.error('Error reading cart file:', err);
        res.status(500).json({ error: 'Error reading cart file' });
    }
});

// Register endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        const users = JSON.parse(data);
        
        if (users.some(u => u.username === username)) {
            return res.json({ success: false, message: 'Username already exists' });
        }
        
        users.push({ username, password });
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        
        // Initialize empty cart for new user
        const cartData = await fs.readFile(CART_FILE, 'utf-8');
        const carts = JSON.parse(cartData);
        carts[username] = [];
        await fs.writeFile(CART_FILE, JSON.stringify(carts, null, 2));
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// Add this to your server.js file

// Update this in your server.js file

app.post('/cart/:username', async (req, res) => {
    const { username } = req.params;
    const { item } = req.body;
    
    try {
        const data = await fs.readFile(CART_FILE, 'utf-8');
        const carts = JSON.parse(data);
        
        if (!carts[username]) {
            carts[username] = [];
        }
        
        carts[username].push(item);
        
        await fs.writeFile(CART_FILE, JSON.stringify(carts, null, 2));
        
        res.json({ 
            success: true, 
            cart: carts[username]  // Return the updated cart
        });
    } catch (err) {
        console.error('Error updating cart:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Error updating cart' 
        });
    }
});

// Existing GET endpoint for cart
app.get('/cart/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const data = await fs.readFile(CART_FILE, 'utf-8');
        const cartData = JSON.parse(data);
        const userCart = cartData[username] || [];
        res.json(userCart);
    } catch (err) {
        console.error('Error reading cart file:', err);
        res.status(500).json({ error: 'Error reading cart file' });
    }
});

// Clear cart after purchase
app.post('/purchase/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const data = await fs.readFile(CART_FILE, 'utf-8');
        const carts = JSON.parse(data);
        carts[username] = [];
        await fs.writeFile(CART_FILE, JSON.stringify(carts, null, 2));
        res.json({ success: true });
    } catch (err) {
        console.error('Error processing purchase:', err);
        res.status(500).json({ error: 'Error processing purchase' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});