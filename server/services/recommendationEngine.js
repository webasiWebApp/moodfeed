const Post = require('../models/Post');
const User = require('../models/User');
const LlmService = require('./llmService');

class RecommendationEngine {
  async getRecommendedPosts(userId) {
    // 1. Get user's liked and disliked posts
    
    const user = await User.findById(userId).populate('likedPosts notForMePosts');
    if (!user) {
      throw new Error('User not found');
    }

    const likedPosts = user.likedPosts.slice(0, 5).map(post => ({
      post_id: post._id,
      author_id: post.author,
      content: post.content,
      mood: post.mood,
    }));

    const dislikedPosts = user.notForMePosts.slice(0, 5).map(post => ({
      post_id: post._id,
      author_id: post.author,
      content: post.content,
      mood: post.mood,
    }));

    // 2. Get candidate posts (excluding liked and disliked ones)
    const excludedPostIds = [
      ...user.likedPosts.map(p => p._id),
      ...user.notForMePosts.map(p => p._id)
    ];

    const candidatePosts = await Post.find({
      _id: { $nin: excludedPostIds },
      author: { $ne: userId } // Exclude user's own posts
    })
      .sort({ createdAt: -1 })
      .limit(20) // Increased limit for more variety
      .populate('author', 'username')
      .lean();

    if (candidatePosts.length === 0) {
      return [];
    }
    
    const candidatePostsForLlm = candidatePosts.map(post => ({
      post_id: post._id,
      author_id: post.author._id,
      content: post.content,
      mood: post.mood,
    }));

    // 3. Get recommendations from LLM
    try {
      
      const recommendedPostIds = await LlmService.generateRecommendations(
        likedPosts,
        dislikedPosts,
        candidatePostsForLlm
      );

      if (!recommendedPostIds || recommendedPostIds.length === 0) {
        // Fallback to most recent posts if no recommendations
        return candidatePosts.slice(0, 6);
      }
      
      // 4. Fetch the full post objects for the recommended IDs
      const recommendedPosts = await Post.find({
        _id: { $in: recommendedPostIds }
      })
        .populate('author', 'username displayName avatar mood')
        .lean();

      // Add isLiked field
      recommendedPosts.forEach(post => {
        post.isLiked = user.likedPosts.some(p => p._id.equals(post._id));
        post.likes = post.likes.length;
        post.comments = post.comments.length;
      });

      return recommendedPosts;
    } catch (error) {
      console.error('Error in recommendation engine, falling back to recent posts:', error);
      // Fallback to most recent posts if LLM fails
      const fallbackPosts = candidatePosts.slice(0, 6);
      fallbackPosts.forEach(post => {
        post.isLiked = user.likedPosts.some(p => p._id.equals(post._id));
        post.likes = post.likes.length;
        post.comments = post.comments.length;
      });
      return fallbackPosts;
    }
  }
}

module.exports = new RecommendationEngine();