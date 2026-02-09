const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mediaUrl: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
    },
    viewers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now }
    }],
    mentions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        x: { type: Number, default: 0.5 }, // Relative position X (0-1)
        y: { type: Number, default: 0.5 }  // Relative position Y (0-1)
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // 24 hours in seconds (TTL index)
    }
});

const Story = mongoose.model('Story', storySchema);
module.exports = Story;
