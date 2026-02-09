const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get user profile by username
// @route   GET /api/users/:username
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const user = await User.findOne({ username: req.params.username })
            .select('-password')
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check blocking (both ways)
        if (currentUser.blockedUsers.includes(user._id) || user.blockedUsers.includes(currentUser._id)) {
            return res.status(404).json({ message: 'User not found' }); // Standard privacy practice to return 404
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Search users
// @route   GET /api/users/search?q=query
// @access  Private
const searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        const currentUser = await User.findById(req.user.id);

        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $nin: [...currentUser.blockedUsers, currentUser._id] }, // Exclude blocked users
            blockedUsers: { $ne: currentUser._id } // Exclude users who blocked me
        }).select('username avatar bio publicKey').limit(10); // Include publicKey in search

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get suggested users to follow
// @route   GET /api/users/suggested
// @access  Private
const getSuggestedUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        
        // Find users not in following/blocked list and not self
        const users = await User.find({
            _id: { $nin: [...currentUser.following, ...currentUser.blockedUsers, currentUser.id] },
            blockedUsers: { $ne: currentUser._id }
        })
        .select('username avatar bio publicKey')
        .limit(5);

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/follow/:id
// @access  Private
const followUser = async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToFollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToFollow.id === currentUser.id) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        // Check if blocked
        if (userToFollow.blockedUsers.includes(currentUser.id) || currentUser.blockedUsers.includes(userToFollow.id)) {
            return res.status(403).json({ message: 'Cannot follow this user' });
        }

        // Check if already following
        const isFollowing = currentUser.following.some(
            (id) => id.toString() === userToFollow.id.toString()
        );

        if (isFollowing) {
            // Unfollow
            await currentUser.updateOne({ $pull: { following: userToFollow.id } });
            await userToFollow.updateOne({ $pull: { followers: currentUser.id } });
            res.json({ message: 'Unfollowed user', action: 'unfollow' });
        } else {
            await currentUser.updateOne({ $push: { following: userToFollow.id } });
            await userToFollow.updateOne({ $push: { followers: currentUser.id } });
            
            // Create Notification
            await Notification.create({
                recipient: userToFollow._id,
                sender: currentUser._id,
                type: 'follow'
            });

            res.json({ message: 'Followed user', action: 'follow' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Block/Unblock user
// @route   POST /api/users/block/:id
// @access  Private
const blockUser = async (req, res) => {
    try {
        const userToBlock = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (!userToBlock) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToBlock.id === currentUser.id) {
            return res.status(400).json({ message: 'You cannot block yourself' });
        }

        const isBlocked = currentUser.blockedUsers.includes(userToBlock.id);

        if (isBlocked) {
            // Unblock
            await currentUser.updateOne({ $pull: { blockedUsers: userToBlock.id } });
            res.json({ message: 'Unblocked user' });
        } else {
            // Block
            // Also unfollow each other
            await currentUser.updateOne({ 
                $push: { blockedUsers: userToBlock.id },
                $pull: { following: userToBlock.id, followers: userToBlock.id } 
            });
            await userToBlock.updateOne({ 
                $pull: { following: currentUser.id, followers: currentUser.id } 
            });
            
            res.json({ message: 'Blocked user' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Public Key for E2EE
// @route   PUT /api/users/key
// @access  Private
const updatePublicKey = async (req, res) => {
    try {
        const { publicKey } = req.body;
        if (!publicKey) {
            return res.status(400).json({ message: 'Public Key is required' });
        }

        await User.findByIdAndUpdate(req.user.id, { publicKey });
        res.json({ message: 'Public Key updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
             return res.status(404).json({ message: 'User not found' });
        }

        console.log("Updating Profile for:", user.username);
        console.log("Request Body:", req.body);

        if (req.body.username) user.username = req.body.username;
        if (req.body.bio !== undefined) user.bio = req.body.bio;
        if (req.body.avatar) user.avatar = req.body.avatar;
        
        // Handle age: If sent as "", set to undefined (remove). If valid number, set it.
        if (req.body.age !== undefined) {
            if (req.body.age === '') {
                user.age = undefined; 
            } else {
                user.age = req.body.age;
            }
        }

        const updatedUser = await user.save();
        res.json(updatedUser);

    } catch (error) {
        console.error("Profile Update Error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
const updateUserPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user's saved posts
// @route   GET /api/users/saved
// @access  Private
const getSavedPosts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'savedPosts',
            populate: {
                path: 'user',
                select: 'username avatar'
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.savedPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getUserProfile,
    searchUsers,
    getSuggestedUsers,
    followUser,
    blockUser,
    updatePublicKey,
    updateUserProfile,
    updateUserPassword,
    getSavedPosts
};
