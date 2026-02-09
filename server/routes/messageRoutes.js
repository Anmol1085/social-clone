const express = require('express');
const router = express.Router();
const { accessConversation, getConversations, sendMessage, getMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/conversation', protect, accessConversation);
router.get('/conversations', protect, getConversations);
router.post('/', protect, sendMessage);
router.get('/:conversationId', protect, getMessages);

module.exports = router;
