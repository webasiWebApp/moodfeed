const express = require('express');
const router = express.Router();
const { requireUser } = require('./middleware/auth');
const PostService = require('../services/postService');

// Get feed posts
router.get('/feed', requireUser, (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  PostService.getFeedPosts(req.user._id, page, limit)
    .then(feed => {
      res.json(feed);
    })
    .catch(error => {
      next(error);
    });
});

// Get single post
router.get('/:postId', requireUser, (req, res, next) => {
  PostService.getPostById(req.params.postId, req.user._id)
    .then(post => {
      res.json(post);
    })
    .catch(error => {
      if (error.message === 'Post not found') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    });
});

// Create post
router.post('/', requireUser, (req, res, next) => {
  const { content, mediaUrl, mediaType } = req.body;
  PostService.createPost(req.user._id, {
    content,
    mediaUrl,
    mediaType
  })
    .then(post => {
      res.status(201).json(post);
    })
    .catch(error => {
      next(error);
    });
});

// Like/unlike post
router.post('/:postId/like', requireUser, (req, res, next) => {
  PostService.likePost(req.params.postId, req.user._id)
    .then(result => {
      res.json(result);
    })
    .catch(error => {
      if (error.message === 'Post not found') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    });
});

router.get('/:postId/comments', requireUser, (req, res, next) => {
  PostService.getPostComments(req.params.postId)
    .then(comments => {
      res.json({ comments });
    })
    .catch(error => {
      if (error.message === 'Post not found') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    });
});

// Add comment
router.post('/:postId/comments', requireUser, (req, res, next) => {
  const { content } = req.body;
  PostService.addComment(req.params.postId, req.user._id, content)
    .then(comment => {
      res.status(201).json({ success: true, comment });
    })
    .catch(error => {
      if (error.message === 'Post not found') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    });
});

// Mark post as "not for me"
router.post('/:postId/not-for-me', requireUser, (req, res, next) => {
  // For now, just return success - this could be used for recommendation algorithms
  res.json({ success: true });
});

// Delete post
router.delete('/:postId', requireUser, (req, res, next) => {
  PostService.deletePost(req.params.postId, req.user._id)
    .then(() => {
      res.status(204).send();
    })
    .catch(error => {
      if (error.message === 'Post not found or unauthorized') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    });
});

module.exports = router;
