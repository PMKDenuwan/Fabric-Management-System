// utils/calc.js
// central compute logic used by controllers (server-side authoritative)

function round2(x) {
  // safe rounding to 2 decimals
  if (typeof x !== 'number' || isNaN(x)) return 0;
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function computeFabric(input) {
  // input: object containing fields from request (some optional)
  const {
    inputMode = 'yard',
    numYards: rawNumYards = 0,
    numRolls: rawNumRolls = 0,
    yardsPerRoll: rawYardsPerRoll = 0,
    pricePerYard = 0,
    receiveDiscount = false,
    discountType = 'none',
    overallDiscountAmount = 0,
    discountedPricePerYard = 0,
    discountedPricePerRoll = 0,
    apparelLengthInches = 65
  } = input;

  // determine numYards
  let numYards = Number(rawNumYards) || 0;
  const numRolls = Number(rawNumRolls) || 0;
  const yardsPerRoll = Number(rawYardsPerRoll) || 0;

  if (inputMode === 'roll') {
    numYards = round2(numRolls * yardsPerRoll);
  } else {
    // ensure it's numeric
    numYards = round2(numYards);
  }

  const price = Number(pricePerYard) || 0;
  const originalAmount = round2(price * numYards);

  let discountedAmount = 0;
  let totalAmount = originalAmount;

  if (!receiveDiscount || discountType === 'none') {
    discountedAmount = 0;
    totalAmount = originalAmount;
  } else {
    if (discountType === 'overall') {
      const overall = Number(overallDiscountAmount) || 0;
      discountedAmount = round2(overall);
      totalAmount = round2(Math.max(0, originalAmount - overall));
    } else if (discountType === 'perYard') {
      const dpY = Number(discountedPricePerYard) || 0;
      discountedAmount = round2(dpY * numYards);
      totalAmount = discountedAmount;
    } else if (discountType === 'perRoll') {
      // compute effective rolls if needed
      let effectiveRolls = numRolls;
      if (inputMode !== 'roll') {
        // if user entered yards but discount is perRoll, compute rolls ceil
        effectiveRolls = yardsPerRoll > 0 ? Math.ceil(numYards / yardsPerRoll) : 0;
      }
      const dpR = Number(discountedPricePerRoll) || 0;
      discountedAmount = round2(dpR * effectiveRolls);
      totalAmount = discountedAmount;
    } else {
      discountedAmount = 0;
      totalAmount = originalAmount;
    }
  }

  // expected items: floor((numYards * 36) / apparelLengthInches)
  const apparelLen = Number(apparelLengthInches) || 1;
  const expectedItems = apparelLen > 0 ? Math.floor((numYards * 36) / apparelLen) : 0;

  return {
    numYards,
    numRolls,
    yardsPerRoll,
    originalAmount,
    discountedAmount,
    totalAmount,
    expectedItems
  };
}

module.exports = { computeFabric, round2 };
