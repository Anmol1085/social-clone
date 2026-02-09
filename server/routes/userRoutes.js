const express = require('express');
const router = express.Router();
const { getUserProfile, searchUsers, followUser, getSuggestedUsers, blockUser, updatePublicKey, updateUserProfile, updateUserPassword, getSavedPosts } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchUsers);
router.get('/suggested', protect, getSuggestedUsers);
router.get('/:username', protect, getUserProfile);
router.post('/follow/:id', protect, followUser);
router.post('/block/:id', protect, blockUser);
router.put('/key', protect, updatePublicKey);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updateUserPassword);
router.get('/saved', protect, getSavedPosts);

module.exports = router;
