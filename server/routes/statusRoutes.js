const express = require('express');
const router = express.Router();
const statusService = require('../services/statusService');
const authMiddleware = require('./middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, type } = req.body;
    const userId = req.user.userId;
    const status = await statusService.createStatus(userId, content, type);
    res.status(201).json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create status' });
  }
});

router.get('/', authMiddleware, async (req, res) => {

  res.status(200).send("status is work");
  // try {
  //   const statuses = await statusService.getStatuses(req.user.userId);
  //   res.status(200).json(statuses);
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ message: 'Failed to retrieve statuses' });
  // }
});

module.exports = router;