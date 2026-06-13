const express = require('express');
const { addStreamRevenue, settleRevenue, getWorkRevenue } = require('../controllers/revenueController');

const router = express.Router();

router.post('/streams', addStreamRevenue);
router.post('/settle/:workId', settleRevenue);
router.get('/works/:workId', getWorkRevenue);

module.exports = router;
