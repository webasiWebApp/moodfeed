const { randomUUID } = require('crypto');

const User = require('../models/User.js');
const { generatePasswordHash, validatePassword } = require('../utils/password.js');

class UserService {
  static async list() {
    try {
      return User.find();
    } catch (err) {
      throw new Error(`Database error while listing users: ${err}`);
    }
  }

  static async get(id) {
    try {
      return User.findOne({ _id: id }).exec();
    } catch (err) {
      throw new Error(`Database error while getting the user by their ID: ${err}`);
    }
  }

  static async getByEmail(email) {
    try {
      return User.findOne({ email }).exec();
    } catch (err) {
      throw new Error(`Database error while getting the user by their email: ${err}`);
    }
  }

  static async getByUsername(username) {
    try {
      return User.findOne({ username: username.toLowerCase() }).exec();
    } catch (err) {
      throw new Error(`Database error while getting the user by their username: ${err}`);
    }
  }

  static async update(id, data) {
    try {
      // Remove fields that shouldn't be updated directly
      const { email, password, createdAt, refreshToken, ...updateData } = data;
      
      return User.findOneAndUpdate({ _id: id }, updateData, { new: true, upsert: false });
    } catch (err) {
      throw new Error(`Database error while updating user ${id}: ${err}`);
    }
  }

  static async delete(id) {
    try {
      const result = await User.deleteOne({ _id: id }).exec();
      return (result.deletedCount === 1);
    } catch (err) {
      throw new Error(`Database error while deleting user ${id}: ${err}`);
    }
  }

  static async authenticateWithPassword(email, password) {
    if (!email) throw new Error('Email is required');
    if (!password) throw new Error('Password is required');

    try {
      const user = await User.findOne({email}).exec();
      if (!user) return null;

      const passwordValid = await validatePassword(password, user.password);
      if (!passwordValid) return null;

      user.lastLoginAt = Date.now();
      const updatedUser = await user.save();
      return updatedUser;
    } catch (err) {
      throw new Error(`Database error while authenticating user ${email} with password: ${err}`);
    }
  }

  static async generateUniqueUsername(email) {
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    let username = baseUsername;
    let counter = 1;

    while (await this.getByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  }

  static async create({ email, password, displayName, username }) {
    if (!email) throw new Error('Email is required');
    if (!password) throw new Error('Password is required');

    const existingUser = await UserService.getByEmail(email);
    if (existingUser) throw new Error('User with this email already exists');

    // Generate username if not provided
    let finalUsername = username;
    if (!finalUsername) {
      finalUsername = await this.generateUniqueUsername(email);
    } else {
      // Check if provided username is available
      const existingUsername = await this.getByUsername(finalUsername);
      if (existingUsername) throw new Error('Username is already taken');
    }

    // Generate display name if not provided
    const finalDisplayName = displayName || finalUsername;

    const hash = await generatePasswordHash(password);

    try {
      const user = new User({
        email,
        username: finalUsername,
        displayName: finalDisplayName,
        password: hash,
        avatar: '',
        bio: '',
        mood: '😊',
        followers: [],
        following: [],
        followersCount: 0,
        followingCount: 0,
        postsCount: 0
      });

      await user.save();
      console.log(`User created successfully: ${user.email} (${user.username})`);
      return user;
    } catch (err) {
      if (err.code === 11000) {
        if (err.keyPattern.username) {
          throw new Error('Username is already taken');
        }
        if (err.keyPattern.email) {
          throw new Error('User with this email already exists');
        }
      }
      throw new Error(`Database error while creating new user: ${err}`);
    }
  }

  static async setPassword(user, password) {
    if (!password) throw new Error('Password is required');
    user.password = await generatePasswordHash(password); // eslint-disable-line

    try {
      if (!user.isNew) {
        await user.save();
      }

      return user;
    } catch (err) {
      throw new Error(`Database error while setting user password: ${err}`);
    }
  }

  static async followUser(currentUserId, targetUserId) {
    if (currentUserId.toString() === targetUserId.toString()) {
      throw new Error('You cannot follow yourself');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
        throw new Error('User not found');
    }

    const isFollowing = currentUser.following && currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      await User.updateOne({ _id: currentUserId }, { 
        $pull: { following: targetUserId },
        $inc: { followingCount: -1 }
      });
      await User.updateOne({ _id: targetUserId }, { 
        $pull: { followers: currentUserId },
        $inc: { followersCount: -1 }
      });
    } else {
      // Follow
      await User.updateOne({ _id: currentUserId }, { 
        $addToSet: { following: targetUserId }, // use $addToSet to prevent duplicates
        $inc: { followingCount: 1 }
      });
      await User.updateOne({ _id: targetUserId }, {
        $addToSet: { followers: currentUserId },
        $inc: { followersCount: 1 }
      });
    }
    
    return { isFollowing: !isFollowing };
  }
}

module.exports = UserService;