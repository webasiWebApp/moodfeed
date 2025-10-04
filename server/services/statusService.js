const Status = require('../models/Status');

async function createStatus(userId, content, type = 'text') {
  const status = new Status({
    user: userId,
    content: content,
    type: type
  });
  await status.save();
  return status;
}

async function getStatuses(userId) {
  // Fetch statuses from people the user follows.  For now, just return all statuses.
  const statuses = await Status.find().sort({ createdAt: 'desc' }).populate('user');
  return statuses;
}


module.exports = {
  createStatus,
  getStatuses,
};