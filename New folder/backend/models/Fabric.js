// models/Fabric.js
const mongoose = require('mongoose');

const FabricSchema = new mongoose.Schema({
  fabricName: { type: String, required: true, trim: true },
  fabricHeight: { type: String, trim: true },

  pricePerYard: { type: Number, required: true, min: 0 },

  // production specification
  apparelLengthInches: { type: Number, required: true, min: 1, default: 65 },

  // quantity input mode
  inputMode: { type: String, enum: ['yard', 'roll'], required: true },

  // yard/roll quantities
  numYards: { type: Number, default: 0, min: 0 },
  numRolls: { type: Number, default: 0, min: 0 },
  yardsPerRoll: { type: Number, default: 0, min: 0 },

  // discount block
  receiveDiscount: { type: Boolean, default: false },
  discountType: { type: String, enum: ['none', 'overall', 'perYard', 'perRoll'], default: 'none' },
  overallDiscountAmount: { type: Number, default: 0, min: 0 },
  discountedPricePerYard: { type: Number, default: 0, min: 0 },
  discountedPricePerRoll: { type: Number, default: 0, min: 0 },

  // computed fields
  originalAmount: { type: Number, required: true, min: 0 },
  discountedAmount: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },

  // production quantities
  expectedItems: { type: Number, required: true, min: 0 },
  actualProducedItems: { type: Number, default: 0, min: 0 },

  // soft delete / audit
  deleted: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('Fabric', FabricSchema);
