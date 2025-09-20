const Post = require('../models/Post');
const User = require('../models/User');
const RecommendationEngine = require('./recommendationEngine');

const transformPost = (post, userId) => {
    const postObject = post.toObject ? post.toObject() : { ...post };

    const likedPostIds = new Set(userId ? user.likedPosts.map(p => p.toString()) : []);

    // Check if mediaUrl needs prefixing
    if (postObject.mediaUrl && !postObject.mediaUrl.startsWith('http')) {
        postObject.mediaUrl = `http://localhost:3000/uploads/${postObject.mediaUrl.split('/').pop()}`;
    }

    return {
        ...postObject,
        isLiked: likedPostIds.has(postObject._id.toString()),
        likes: Array.isArray(postObject.likes) ? postObject.likes.length : 0,
        comments: Array.isArray(postObject.comments) ? postObject.comments.length : 0,
    };
};


class PostService {
  static async createPost(userId, postData) {
    try {
      // Validate required fields
      if (!userId) {
        throw new Error('User ID is required');
      }
      if (!postData.content && !postData.mediaUrl) {
        throw new Error('Post must have either content or media');
      }

      // Create the post
      const post = new Post({
        author: userId,
        content: postData.content || '',
        mediaUrl: postData.mediaUrl,
        mediaType: postData.mediaType,
        mood: postData.mood
      });

      // Save and populate
      await post.save();
      await post.populate('author', 'username displayName avatar mood');

      return post;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new Error(`Validation error: ${error.message}`);
      }
      throw error;
    }
  }

  static async getFeedPosts(userId, page = 1, limit = 10) {
    if (page === 1) {
        try {
            const recommendedPosts = await RecommendationEngine.getRecommendedPosts(userId);
            const user = await User.findById(userId).select('likedPosts').lean();
            const transformedPosts = recommendedPosts.map(post => transformPost(post, user));
            return { posts: transformedPosts, hasMore: recommendedPosts.length > 0 };
        } catch (error) {
            console.error('Error getting recommendations, falling back to chronological feed:', error);
            return this.getChronologicalFeed(userId, page, limit);
        }
    } else {
        return this.getChronologicalFeed(userId, page, limit);
    }
}

  static async getChronologicalFeed(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar mood')
      .lean();

    if (!posts.length) {
      return { posts: [], hasMore: false };
    }

    const user = await User.findById(userId).select('likedPosts').lean();
    const likedPostIds = new Set(user ? user.likedPosts.map(p => p.toString()) : []);

    posts.forEach(post => {
      post.isLiked = likedPostIds.has(post._id.toString());
      post.likes = Array.isArray(post.likes) ? post.likes.length : 0;
      post.comments = Array.isArray(post.comments) ? post.comments.length : 0;
       if (post.mediaUrl && !post.mediaUrl.startsWith('http')) {
        post.mediaUrl = `http://localhost:3000/uploads/${post.mediaUrl.split('/').pop()}`;
    }
    });
    
    const hasMore = (await Post.countDocuments({ createdAt: { $lt: posts[posts.length - 1].createdAt } })) > 0;

    return { posts, hasMore };
  }

  static async getPostById(postId, userId) {
    const post = await Post.findById(postId)
      .populate('author', 'username displayName avatar mood')
      .populate('comments.author', 'username displayName avatar')
      .lean();

    if (!post) {
      throw new Error('Post not found');
    }

    post.isLiked = post.likes.includes(userId);
    post.likes = post.likes.length;

    return post;
  }

  static async getPostComments(postId) {
    const post = await Post.findById(postId)
      .populate('comments.author', 'username displayName avatar')
      .lean();

    if (!post) {
      throw new Error('Post not found');
    }

    return post.comments;
  }

  static async likePost(postId, userId) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const likeIndex = post.likes.indexOf(userId);
    const userLikeIndex = user.likedPosts.indexOf(postId);

    if (likeIndex === -1) {
      post.likes.push(userId);
      if (userLikeIndex === -1) {
        user.likedPosts.push(postId);
      }
    } else {
      post.likes.splice(likeIndex, 1);
      if (userLikeIndex > -1) {
        user.likedPosts.splice(userLikeIndex, 1);
      }
    }

    await post.save();
    await user.save();

    return {
      likesCount: post.likes.length,
      isLiked: post.likes.includes(userId)
    };
  }

  static async addComment(postId, userId, content) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    post.comments.push({
      author: userId,
      content
    });

    await post.save();
    const newComment = post.comments[post.comments.length - 1];
    await Post.populate(newComment, { path: 'author', select: 'username displayName avatar' });
    
    return newComment;
  }

  static async notForMe(postId, userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.notForMePosts.includes(postId)) {
      user.notForMePosts.push(postId);
      await user.save();
    }

    return { success: true };
  }

  static async deletePost(postId, userId) {
    const post = await Post.findOne({ _id: postId, author: userId });
    if (!post) {
      throw new Error('Post not found or unauthorized');
    }
    
    await post.remove();
    return true;
  }
}

module.exports = PostService;
