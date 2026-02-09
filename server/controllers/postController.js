const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
    try {
        const { caption, media, location, visibility } = req.body;

        if (!media || media.length === 0) {
            return res.status(400).json({ message: 'Post must have media' });
        }

        const newPost = new Post({
            user: req.user.id,
            caption,
            media,
            location,
            visibility
        });

        const post = await newPost.save();
        await post.populate('user', 'username avatar');

        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get feed posts
// @route   GET /api/posts/feed
// @access  Private
const getFeedPosts = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const followingIds = currentUser.following;

        // Get posts from following users AND self
        const posts = await Post.find({
            user: { $in: [...followingIds, req.user.id] }
        })
        .sort({ createdAt: -1 })
        .populate('user', 'username avatar')
        .populate('comments.user', 'username avatar');

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get posts by username
// @route   GET /api/posts/user/:username
// @access  Private
const getUserPosts = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate('user', 'username avatar comments.user');

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Like/Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const isLiked = post.likes.includes(req.user.id);

        if (isLiked) {
            // Unlike
            await post.updateOne({ $pull: { likes: req.user.id } });
            res.json({ message: 'Post unliked', likes: post.likes.length - 1, isLiked: false });
        } else {
            // Like
            await post.updateOne({ $push: { likes: req.user.id } });
            
            // Notification (if not self-like)
            if (post.user.toString() !== req.user.id) {
                await Notification.create({
                    recipient: post.user,
                    sender: req.user.id,
                    type: 'like',
                    post: post._id
                });
            }

            res.json({ message: 'Post liked', likes: post.likes.length + 1, isLiked: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a comment
// @route   POST /api/posts/:id/comment
// @access  Private
const addComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = {
            user: req.user.id,
            text: req.body.text,
            createdAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();
        
        // Re-fetch to populate user details for the new comment
        const updatedPost = await Post.findById(req.params.id).populate('comments.user', 'username avatar');
        
        // Return the last added comment (which is the new one)
        const commentToSend = updatedPost.comments[updatedPost.comments.length - 1];

        // Notification (if not self-comment)
        if (post.user.toString() !== req.user.id) {
            await Notification.create({
                recipient: post.user,
                sender: req.user.id,
                type: 'comment',
                post: post._id,
                text: req.body.text
            });
        }

        res.status(201).json(commentToSend);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const savePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const user = await User.findById(req.user.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const isSaved = user.savedPosts.includes(post._id);

        if (isSaved) {
            // Unsave
            await user.updateOne({ $pull: { savedPosts: post._id } });
            res.json({ message: 'Post unsaved', isSaved: false });
        } else {
            // Save
            await user.updateOne({ $push: { savedPosts: post._id } });
            res.json({ message: 'Post saved', isSaved: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check ownership
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await post.deleteOne();
        res.json({ message: 'Post removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createPost,
    getFeedPosts,
    getUserPosts,
    likePost,
    addComment,
    savePost,
    deletePost
};
