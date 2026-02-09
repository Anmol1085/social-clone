const express = require('express');
const router = express.Router();
const { createPost, getFeedPosts, getUserPosts, likePost, addComment, savePost, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createPost);
router.get('/feed', protect, getFeedPosts);
router.get('/user/:username', protect, getUserPosts);
router.put('/:id/like', protect, likePost); // PUT is semantically okay for toggles
router.put('/:id/save', protect, savePost);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, deletePost);

module.exports = router;
