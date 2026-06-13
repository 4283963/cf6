const express = require('express');
const { createVinylRecord, listVinylRecords, getVinylDetail } = require('../controllers/vinylController');

const router = express.Router();

router.post('/', createVinylRecord);
router.get('/', listVinylRecords);
router.get('/:id', getVinylDetail);

module.exports = router;
