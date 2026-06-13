const express = require('express');
const { listMusicians, createMusician, getMusicianWorks } = require('../controllers/musicianController');

const router = express.Router();

router.get('/', listMusicians);
router.post('/', createMusician);
router.get('/:id/works', getMusicianWorks);

module.exports = router;
