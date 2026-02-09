const Story = require('../models/Story');
const User = require('../models/User');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
const Notification = require('../models/Notification'); // Import Notification

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res) => {
    try {
        const { mediaUrl, mediaType, mentions } = req.body;

        if (!mediaUrl) {
            return res.status(400).json({ message: 'Story must have media' });
        }

        const newStory = new Story({
            user: req.user.id,
            mediaUrl,
            mediaType: mediaType || 'image',
            mentions: mentions || [],
            createdAt: Date.now()
        });

        const story = await newStory.save();
        
        // Notify mentioned users
        if (mentions && mentions.length > 0) {
            mentions.forEach(async (mention) => {
                if (mention.user !== req.user.id) {
                     await Notification.create({
                        recipient: mention.user,
                        sender: req.user.id,
                        type: 'mention',
                        story: story._id // Assuming Notification schema could support story reference or generic link
                    });
                }
            });
        }

        await story.populate('user', 'username avatar');
        await story.populate('mentions.user', 'username avatar');

        res.status(201).json(story);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get valid stories from own and following
// @route   GET /api/stories
// @access  Private
const getStories = async (req, res) => {
    try {
        // We rely on TTL index for expiry, but let's also filter in query for safety
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const currentUser = await User.findById(req.user.id);
        const followingIds = currentUser.following;

        // Get stories from following users AND self
        const stories = await Story.find({
            user: { $in: [...followingIds, req.user.id] },
            createdAt: { $gte: twentyFourHoursAgo }
        })
        .sort({ createdAt: -1 })
        .populate('user', 'username avatar')
        .populate('viewers.user', 'username avatar')
        .populate('mentions.user', 'username avatar');

        res.json(stories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Record a view on a story
// @route   POST /api/stories/:id/view
// @access  Private
const viewStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Check if user already viewed
        const alreadyViewed = story.viewers.some(v => v.user.toString() === req.user.id);

        if (!alreadyViewed) {
            story.viewers.push({ user: req.user.id });
            await story.save();
        }

        res.json(story.viewers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        // Check ownership
        if (story.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await story.deleteOne();
        res.json({ message: 'Story removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createStory,
    getStories,
    viewStory,
    deleteStory
};
