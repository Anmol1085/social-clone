const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc    Create new conversation or get existing one
// @route   POST /api/messages/conversation
// @access  Private
const accessConversation = async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Check if conversation exists
        let conversation = await Conversation.findOne({
            members: { $all: [req.user.id, userId] }
        }).populate('members', 'username avatar publicKey');

        if (conversation) {
            return res.json(conversation);
        }

        // Create new
        const newConversation = new Conversation({
            members: [req.user.id, userId]
        });

        const savedConversation = await newConversation.save();
        const populatedConversation = await savedConversation.populate('members', 'username avatar publicKey');
        
        res.status(200).json(populatedConversation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all conversations for user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            members: { $in: [req.user.id] }
        })
        .populate('members', 'username avatar publicKey')
        .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { conversationId, text, media, type, iv } = req.body;

        const newMessage = new Message({
            conversationId,
            sender: req.user.id,
            text,
            media,
            type: type || (media ? 'image' : 'text'), // Default fallback
            iv
        });

        const savedMessage = await newMessage.save();
        
        // Update conversation updated time
        await Conversation.findByIdAndUpdate(conversationId, {
            updatedAt: Date.now()
        });

        res.status(200).json(savedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId
        });
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    accessConversation,
    getConversations,
    sendMessage,
    getMessages
};
