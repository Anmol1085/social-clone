const express = require('express');
const router = express.Router();
const { getUploadSignature, uploadFile } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

router.get('/sign', protect, getUploadSignature);
router.post('/', protect, uploadFile);

module.exports = router;
