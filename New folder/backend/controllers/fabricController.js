// controllers/fabricController.js
const { validationResult } = require('express-validator');
const Fabric = require('../models/Fabric');
const { computeFabric } = require('../utils/calc');

/**
 * Create new fabric entry
 */
const createFabric = async (req, res, next) => {
  try {
    // validation (from route) errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed');
      err.statusCode = 400;
      err.errors = errors.array();
      throw err;
    }

    const payload = req.body;

    // server-side compute
    const computed = computeFabric(payload);

    // build doc
    const doc = new Fabric({
      fabricName: payload.fabricName,
      fabricHeight: payload.fabricHeight || '',
      pricePerYard: Number(payload.pricePerYard) || 0,
      apparelLengthInches: Number(payload.apparelLengthInches) || 65,
      inputMode: payload.inputMode === 'roll' ? 'roll' : 'yard',
      numYards: computed.numYards,
      numRolls: Number(payload.numRolls) || 0,
      yardsPerRoll: Number(payload.yardsPerRoll) || 0,
      receiveDiscount: Boolean(payload.receiveDiscount),
      discountType: payload.receiveDiscount ? (payload.discountType || 'none') : 'none',
      overallDiscountAmount: Number(payload.overallDiscountAmount) || 0,
      discountedPricePerYard: Number(payload.discountedPricePerYard) || 0,
      discountedPricePerRoll: Number(payload.discountedPricePerRoll) || 0,
      originalAmount: computed.originalAmount,
      discountedAmount: computed.discountedAmount,
      totalAmount: computed.totalAmount,
      expectedItems: computed.expectedItems,
      actualProducedItems: Number(payload.actualProducedItems) || 0,
    });

    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

/**
 * Get list of fabrics with pagination and search
 */
const getFabrics = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const search = req.query.search ? String(req.query.search).trim() : '';
    const filters = { deleted: false };

    if (search) {
      filters.fabricName = { $regex: search, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      Fabric.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      Fabric.countDocuments(filters)
    ]);

    res.json({
      page,
      limit,
      total,
      items
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single fabric by id
 */
const getFabricById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Fabric.findById(id).lean().exec();
    if (!item || item.deleted) {
      const err = new Error('Fabric not found');
      err.statusCode = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * Update full fabric (recompute derived values)
 */
const updateFabric = async (req, res, next) => {
  try {
    const { id } = req.params;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed');
      err.statusCode = 400;
      err.errors = errors.array();
      throw err;
    }

    const payload = req.body;
    // recompute on server
    const computed = computeFabric(payload);

    const update = {
      fabricName: payload.fabricName,
      fabricHeight: payload.fabricHeight || '',
      pricePerYard: Number(payload.pricePerYard) || 0,
      apparelLengthInches: Number(payload.apparelLengthInches) || 65,
      inputMode: payload.inputMode === 'roll' ? 'roll' : 'yard',
      numYards: computed.numYards,
      numRolls: Number(payload.numRolls) || 0,
      yardsPerRoll: Number(payload.yardsPerRoll) || 0,
      receiveDiscount: Boolean(payload.receiveDiscount),
      discountType: payload.receiveDiscount ? (payload.discountType || 'none') : 'none',
      overallDiscountAmount: Number(payload.overallDiscountAmount) || 0,
      discountedPricePerYard: Number(payload.discountedPricePerYard) || 0,
      discountedPricePerRoll: Number(payload.discountedPricePerRoll) || 0,
      originalAmount: computed.originalAmount,
      discountedAmount: computed.discountedAmount,
      totalAmount: computed.totalAmount,
      expectedItems: computed.expectedItems,
      // allow updating actualProducedItems from full edit if provided:
      actualProducedItems: payload.actualProducedItems !== undefined ? Number(payload.actualProducedItems) : undefined,
    };

    // remove undefined fields (so Mongoose won't overwrite with undefined)
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

    const updated = await Fabric.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
    if (!updated) {
      const err = new Error('Fabric not found');
      err.statusCode = 404;
      throw err;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Patch actual produced items only
 */
const updateActualProduced = async (req, res, next) => {
  try {
    const { id } = req.params;
    // basic validation
    const val = req.body.actualProducedItems;
    if (val === undefined || val === null) {
      const err = new Error('actualProducedItems is required');
      err.statusCode = 400;
      throw err;
    }
    const actual = Number(val);
    if (isNaN(actual) || actual < 0) {
      const err = new Error('actualProducedItems must be a non-negative number');
      err.statusCode = 400;
      throw err;
    }

    const updated = await Fabric.findByIdAndUpdate(id, { actualProducedItems: actual }, { new: true }).exec();
    if (!updated) {
      const err = new Error('Fabric not found');
      err.statusCode = 404;
      throw err;
    }

    // compute difference (optional to return)
    const diff = updated.actualProducedItems - updated.expectedItems;

    res.json({ updated, difference: diff });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete fabric (soft delete)
 */
const deleteFabric = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await Fabric.findByIdAndUpdate(id, { deleted: true }, { new: true }).exec();
    if (!updated) {
      const err = new Error('Fabric not found');
      err.statusCode = 404;
      throw err;
    }
    res.json({ message: 'Fabric deleted (soft)', id });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFabric,
  getFabrics,
  getFabricById,
  updateFabric,
  updateActualProduced,
  deleteFabric
};
