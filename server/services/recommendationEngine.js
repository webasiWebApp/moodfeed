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

    let candidatePosts = await Post.find({
      _id: { $nin: excludedPostIds },
      author: { $ne: userId } // Exclude user's own posts
    })
      .sort({ createdAt: -1 })
      .limit(20) // Increased limit for more variety
      .populate('author', 'username')
      .lean();

    if (candidatePosts.length === 0) {
        console.log('Initial query returned no candidate posts. Falling back to recent posts.');
        candidatePosts = await Post.find({}).sort({ createdAt: -1 }).limit(20).populate('author', 'username').lean();
    }

    if (candidatePosts.length === 0) {
      return [];
    }

    const candidatePostsForLlm = candidatePosts.filter(post => post.author).map(post => ({
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
      ) || [];

      let finalPostIds = [...new Set(recommendedPostIds.map(id => id.toString()))];
      const numAiPosts = finalPostIds.length;
      let numFillerPosts = 0;

      
      // If AI recommended less than 10 posts, fill with other posts randomly
      if (finalPostIds.length < 10) {
        const needed = 10 - finalPostIds.length;

        
        const recommendedSet = new Set(finalPostIds);
        
        const fillerPool = candidatePosts.filter(p => !recommendedSet.has(p._id.toString()));
        // console.log("reccomended post :",fillerPool);


        // Shuffle the filler pool to get random posts
        for (let i = fillerPool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [fillerPool[i], fillerPool[j]] = [fillerPool[j], fillerPool[i]];
        }

        const fillerPosts = fillerPool.slice(0, needed);
        numFillerPosts = fillerPosts.length;
        
        finalPostIds.push(...fillerPosts.map(p => p._id.toString()));
      }

      
      
      // 4. Fetch the full post objects for the recommended IDs
      const recommendedPosts = await Post.find({
        _id: { $in: finalPostIds }
      })
        .populate('author', 'username displayName avatar mood')
        .lean();

      // Add isLiked field
      recommendedPosts.forEach(post => {
        post.isLiked = user.likedPosts.some(p => p._id.equals(post._id));
        post.likes = post.likes.length;
        post.comments = post.comments.length;
      });

      console.log(`Returning ${recommendedPosts.length} posts. ${numAiPosts} from AI, ${numFillerPosts} as filler.`);

      return recommendedPosts;
    } catch (error) {
      console.error('Error in recommendation engine, falling back to recent posts:', error);
      // Fallback to most recent posts if LLM fails
      const fallbackPosts = candidatePosts.slice(0, 10);
      fallbackPosts.forEach(post => {
        post.isLiked = user.likedPosts.some(p => p._id.equals(post._id));
        post.likes = post.likes ? post.likes.length : 0;
        post.comments = post.comments ? post.comments.length : 0;
      });
      return fallbackPosts;
    }
  }
}

module.exports = new RecommendationEngine();