const express = require('express');
const UserService = require('../services/userService.js');
const { requireUser } = require('./middleware/auth.js');

const router = express.Router();

// Get current user profile
router.get('/me', requireUser, async (req, res) => {
  try {
    console.log(`Getting profile for user: ${req.user.email}`);
    const user = await UserService.get(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      user: user.toJSON() 
    });
  } catch (error) {
    console.error(`Error getting user profile: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Update current user profile
router.put('/me', requireUser, async (req, res) => {
  try {
    const { displayName, bio, mood, avatar } = req.body;
    
    console.log(`Updating profile for user: ${req.user.email}`, { displayName, bio, mood });

    // Validate mood if provided
    const validMoods = ['😊', '😠', '😢', '🤩', '😌', '😐'];
    if (mood && !validMoods.includes(mood)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mood selected'
      });
    }

    // Validate bio length
    if (bio && bio.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Bio cannot exceed 150 characters'
      });
    }

    // Validate display name
    if (displayName && (displayName.length < 1 || displayName.length > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Display name must be between 1 and 50 characters'
      });
    }

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (bio !== undefined) updateData.bio = bio;
    if (mood !== undefined) updateData.mood = mood;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await UserService.update(req.user._id, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log(`Profile updated successfully for user: ${updatedUser.email}`);
    res.json({ 
      success: true, 
      user: updatedUser.toJSON() 
    });
  } catch (error) {
    console.error(`Error updating user profile: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get user by ID
router.get('/id/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`Getting profile for user ID: ${userId}`);
    const user = await UserService.get(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      user: user.toJSON() 
    });
  } catch (error) {
    console.error(`Error getting user by ID: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Follow/unfollow user
router.post('/:userId/follow', requireUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await UserService.followUser(req.user._id, userId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get user by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log(`Getting profile for username: ${username}`);
    const user = await UserService.getByUsername(username);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      user: user.toJSON() 
    });
  } catch (error) {
    console.error(`Error getting user by username: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;