const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() {
      return !this.mediaUrl; // Content is required only if there's no media
    },
    trim: true
  },
  mediaUrl: {
    type: String,
    trim: true,
    get: function(v) {
      // If the URL starts with /uploads, prepend the server URL
      if (v && v.startsWith('http://localhost:3000/uploads')) {
        return `${process.env.SERVER_URL || 'http://localhost:3000'}${v}`;
      }
      return v;
    }
  },
  mediaType: {
    type: String,
    enum: ['image', 'video']
  },
  localFilePath: {
    type: String,
    trim: true,
    select: false // This field won't be returned in queries
  },
  mood: {
    type: String,
    default: '😊'
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.likes = ret.likes.length;
      ret.comments = ret.comments.length;
      return ret;
    }
  }
});

// Add virtual field for isLiked
postSchema.virtual('isLiked').get(function() {
  if (this._userId) {
    return this.likes.includes(this._userId);
  }
  return false;
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
