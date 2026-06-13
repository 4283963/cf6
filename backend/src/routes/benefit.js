const express = require('express');
const router = express.Router();
const benefitController = require('../controllers/benefitController');

router.get('/', benefitController.listBenefits);
router.get('/vinyl/:vinylRecordId', benefitController.listBenefitsWithStatus);
router.get('/order/:orderId', benefitController.getOrderBenefits);
router.post('/', benefitController.createBenefit);
router.put('/:id', benefitController.updateBenefit);
router.delete('/:id', benefitController.deleteBenefit);

module.exports = router;
