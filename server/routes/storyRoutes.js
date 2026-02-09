const express = require('express');
const router = express.Router();
const { createStory, getStories, deleteStory, viewStory } = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createStory);
router.get('/', protect, getStories);
router.delete('/:id', protect, deleteStory);
router.post('/:id/view', protect, viewStory);

module.exports = router;
