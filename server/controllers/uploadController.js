const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');

// Configure Multer for Local Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100000000 }, // 100MB limit for videos
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('file');

// Check File Type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|mp4|mov/; // Added video support
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images/Videos Only!');
    }
}

// @desc    Upload file locally
// @route   POST /api/upload
// @access  Private
const uploadFile = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        // Return the URL
        const protocol = req.protocol;
        const host = req.get('host');
        const url = `${protocol}://${host}/uploads/${req.file.filename}`;
        
        res.json({ 
            url: url,
            type: req.file.mimetype.startsWith('video') ? 'video' : 'image'
        });
    });
};

// @desc    Get signature for client-side upload (Legacy/Cloudinary)
// @route   GET /api/upload/sign
// @access  Private
const getUploadSignature = (req, res) => {
    // Keep this for backward compatibility or if user sets keys later
    if (!process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET === 'your_api_secret') {
         return res.status(500).json({ message: 'Cloudinary not configured' });
    }

    const timestamp = Math.round((new Date()).getTime() / 1000);
    const params = {
        timestamp: timestamp,
        folder: 'social_app_posts',
    };
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
    res.json({
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder: 'social_app_posts'
    });
};

module.exports = { getUploadSignature, uploadFile };
