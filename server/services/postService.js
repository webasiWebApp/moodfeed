const Post = require('../models/Post');

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
    // Validate and sanitize input
    page = Math.max(1, Math.min(50, parseInt(page) || 1)); // Limit to 50 pages
    limit = Math.max(1, Math.min(50, parseInt(limit) || 10)); // Limit to 50 items per page
    
    const skip = (page - 1) * limit;
    
    // Store userId for isLiked virtual
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar mood')
      .lean();

    if (!posts.length) {
      return { posts: [], hasMore: false };
    }

    // Add isLiked field and clean up response
    posts.forEach(post => {
      post.isLiked = post.likes.includes(userId);
      post.likes = post.likes.length;
      post.comments = post.comments.length;
    });

    // Check if there are more posts, but limit the count query
    const nextPage = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip + limit)
      .limit(1)
      .select('_id')
      .lean();

    const hasMore = nextPage.length > 0;

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

  static async likePost(postId, userId) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    return {
      likes: post.likes.length,
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
