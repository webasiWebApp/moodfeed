
const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
