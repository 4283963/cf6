const express = require('express');
const { createOrder, listOrders, getEngravingNumbers, lockEngravingNumber } = require('../controllers/orderController');

const router = express.Router();

router.post('/', createOrder);
router.get('/', listOrders);
router.get('/engraving/:vinylRecordId', getEngravingNumbers);
router.post('/engraving/lock', lockEngravingNumber);

module.exports = router;
