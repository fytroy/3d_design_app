const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Node.js File System module

const app = express();
const port = 3000; // You can change this port if 3000 is in use

// --- File Storage Paths ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CUSTOM_REQUESTS_FILE = path.join(__dirname, 'data', 'custom-requests.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// --- Ensure directories and JSON files exist and are initialized ---
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
};

const ensureJsonFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '[]', 'utf8');
        console.log(`Created and initialized file: ${filePath}`);
    } else {
        try {
            JSON.parse(fs.readFileSync(filePath, 'utf8')); // Validate JSON
        } catch (e) {
            console.error(`Error parsing ${filePath}. Re-initializing.`);
            fs.writeFileSync(filePath, '[]', 'utf8');
        }
    }
};

ensureDir(UPLOADS_DIR);
ensureDir(path.join(__dirname, 'data'));
ensureJsonFile(CUSTOM_REQUESTS_FILE);
ensureJsonFile(ORDERS_FILE);


// --- Middleware Setup ---

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// For parsing application/x-www-form-urlencoded (standard HTML form data)
app.use(bodyParser.urlencoded({ extended: true }));
// For parsing application/json (used by the checkout form submission)
app.use(bodyParser.json());

// Set up multer for file uploads (for custom design request form)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR); // Files will be saved in the 'uploads' folder
    },
    filename: function (req, file, cb) {
        // Generate a unique filename: original filename + timestamp + random string
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, path.basename(file.originalname, path.extname(file.originalname)) + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure multer to handle specific fields from the custom design form
const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB file size limit
    fileFilter: (req, file, cb) => {
        const allowedImageTypes = /\.(jpeg|jpg|png|gif|pdf)<span class="math-inline">/i;
const allowed3DTypes = /\.(stl|obj|3mf)$/i;
        const fileExtension = path.extname(file.originalname);

        if (file.fieldname === "reference_images") {
            if (allowedImageTypes.test(fileExtension)) {
                return cb(null, true);
            }
        } else if (file.fieldname === "existing_3d_file") {
            if (allowed3DTypes.test(fileExtension)) {
                return cb(null, true);
            }
        } else {
             // For any other unexpected field, reject
            return cb(new Error('Invalid file field name.'));
        }
        cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: images/PDF for reference_images, STL/OBJ/3MF for existing_3d_file.`));
    }
}).fields([
    { name: 'reference_images', maxCount: 3 },
    { name: 'existing_3d_file', maxCount: 1 }
]);


// --- Routes ---

// Serve specific HTML pages explicitly (or let express.static handle them if named index.html)
app.get('/products.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/checkout.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.get('/success.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// POST route for custom design form submission
app.post('/submit-custom-request', (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer file upload error:', err.message);
            return res.status(400).send(`File upload error: ${err.message}`);
        } else if (err) {
            console.error('Unknown upload error:', err.message);
            return res.status(500).send(`An unexpected error occurred during upload: ${err.message}`);
        }

        const formData = req.body;
        const uploadedFiles = req.files;

        // Collect file information (store only filenames/paths for local demo)
        const fileInfo = {
            reference_images: uploadedFiles && uploadedFiles['reference_images'] ? uploadedFiles['reference_images'].map(f => f.filename) : [],
            existing_3d_file: uploadedFiles && uploadedFiles['existing_3d_file'] && uploadedFiles['existing_3d_file'].length > 0 ? uploadedFiles['existing_3d_file'][0].filename : null
        };

        const submissionData = {
            id: 'CR-' + Date.now(), // Custom Request ID
            timestamp: new Date().toISOString(),
            ...formData, // Spread all form fields
            files: fileInfo, // Add file paths
            status: 'Pending Review' // Initial status
        };

        console.log('--- New Custom Design Request Received ---');
        console.log('Submission Data:', submissionData);

        // --- Store data in custom-requests.json ---
        fs.readFile(CUSTOM_REQUESTS_FILE, 'utf8', (readErr, fileData) => {
            let requests = [];
            if (!readErr) {
                try {
                    requests = JSON.parse(fileData);
                } catch (parseError) {
                    console.error('Error parsing existing custom-requests.json:', parseError);
                    requests = []; // Reset if corrupted
                }
            }
            requests.push(submissionData);

            fs.writeFile(CUSTOM_REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error('Error writing to custom-requests.json:', writeErr);
                    return res.status(500).send('Error saving your request. Please try again later.');
                }
                console.log(`Custom request saved to ${CUSTOM_REQUESTS_FILE}`);
                // In a real app, you'd send an email notification here
                res.status(200).send(`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Request Received</title>
                        <link rel="stylesheet" href="/css/style.css">
                        <style>
                            .response-message { text-align: center; padding: 80px 20px; background-color: #f8f9fa; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 600px; margin: 60px auto; }
                            .response-message h1 { color: #007bff; margin-bottom: 20px; font-size: 2.5em; }
                            .response-message p { font-size: 1.1em; color: #555; margin-bottom: 25px; }
                            .response-message .request-id { font-weight: bold; color: #28a745; }
                            .response-message .btn { margin-top: 30px; }
                        </style>
                    </head>
                    <body>
                        <div class="response-message">
                            <h1>Custom Request Received!</h1>
                            <p>Thank you for your custom design request. Your Request ID is: <span class="request-id">${submissionData.id}</span></p>
                            <p>We will review your details and get back to you shortly with a personalized quote.</p>
                            <a href="/" class="btn primary-btn">Go to Homepage</a>
                        </div>
                    </body>
                    </html>
                `);
            });
        });
    });
});

// POST route for placing a pre-designed product order (checkout)
app.post('/place-order', (req, res) => {
    const orderData = req.body; // Data sent from the frontend checkout form
    orderData.orderId = 'ORD-' + Date.now(); // Generate a unique order ID
    orderData.timestamp = new Date().toISOString();
    orderData.status = 'New Order - Pay on Delivery'; // Set status for COD

    console.log('--- New Order Placed (Pay on Delivery) ---');
    console.log('Order Data:', orderData);

    // --- Store data in orders.json ---
    fs.readFile(ORDERS_FILE, 'utf8', (readErr, fileData) => {
        let orders = [];
        if (!readErr) {
            try {
                orders = JSON.parse(fileData);
            } catch (parseError) {
                console.error('Error parsing existing orders.json:', parseError);
                orders = []; // Reset if corrupted
            }
        }
        orders.push(orderData);

        fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing to orders.json:', writeErr);
                return res.status(500).send('Error placing your order. Please try again later.');
            }
            console.log(`Order saved to ${ORDERS_FILE}`);
            // In a real app, send order confirmation email, update inventory, etc.
            res.status(200).send('Order placed successfully'); // Frontend will redirect to success.html
        });
    });
});


// --- Server Start ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Open http://localhost:${port} in your browser.`);
    console.log(`Custom requests will be saved to '${path.relative(__dirname, CUSTOM_REQUESTS_FILE)}'.`);
    console.log(`Orders will be saved to '${path.relative(__dirname, ORDERS_FILE)}'.`);
    console.log(`Uploaded files will be in '${path.relative(__dirname, UPLOADS_DIR)}'.`);
});