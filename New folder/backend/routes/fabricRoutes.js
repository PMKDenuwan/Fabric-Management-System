// routes/fabricRoutes.js
const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const controller = require('../controllers/fabricController');

// validation middleware for create & update
const validateCreateUpdate = [
  body('fabricName').trim().notEmpty().withMessage('fabricName is required'),
  body('pricePerYard').notEmpty().withMessage('pricePerYard is required').isFloat({ gt: 0 }).withMessage('pricePerYard must be > 0'),
  body('apparelLengthInches').optional().isFloat({ gt: 0 }).withMessage('apparelLengthInches must be > 0'),
  body('inputMode').notEmpty().withMessage('inputMode is required').isIn(['yard', 'roll']),
  // conditional checks:
  body('numYards').if(body('inputMode').equals('yard')).notEmpty().withMessage('numYards required when inputMode is yard').isFloat({ gt: 0 }),
  body('numRolls').if(body('inputMode').equals('roll')).notEmpty().withMessage('numRolls required when inputMode is roll').isFloat({ gt: 0 }),
  body('yardsPerRoll').if(body('inputMode').equals('roll')).notEmpty().withMessage('yardsPerRoll required when inputMode is roll').isFloat({ gt: 0 }),

  body('receiveDiscount').optional().isBoolean().withMessage('receiveDiscount must be boolean'),
  body('discountType').if(body('receiveDiscount').equals('true')).notEmpty().withMessage('discountType required when receiveDiscount is true').isIn(['overall', 'perYard', 'perRoll']),
  body('overallDiscountAmount').if(body('discountType').equals('overall')).notEmpty().withMessage('overallDiscountAmount required for overall discount').isFloat({ min: 0 }),
  body('discountedPricePerYard').if(body('discountType').equals('perYard')).notEmpty().withMessage('discountedPricePerYard required for perYard').isFloat({ min: 0 }),
  body('discountedPricePerRoll').if(body('discountType').equals('perRoll')).notEmpty().withMessage('discountedPricePerRoll required for perRoll').isFloat({ min: 0 }),
];

// routes
router.post('/', validateCreateUpdate, controller.createFabric);
router.get('/', controller.getFabrics);
router.get('/:id', controller.getFabricById);
router.put('/:id', validateCreateUpdate, controller.updateFabric);
router.patch('/:id/actual', controller.updateActualProduced);
router.delete('/:id', controller.deleteFabric);

module.exports = router;
