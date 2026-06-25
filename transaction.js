const { getProductById } = require('./products');
const { CONFIG } = require('./config');

function calculateBasePrice(wantedItems) {
  let total = 0;
  wantedItems.forEach(item => {
    const product = getProductById(item.productId);
    if (product) {
      total += product.price * item.quantity;
    }
  });
  return total;
}

function calculateCost(wantedItems) {
  let total = 0;
  wantedItems.forEach(item => {
    const product = getProductById(item.productId);
    if (product) {
      total += product.cost * item.quantity;
    }
  });
  return total;
}

function calculateCustomerAcceptance(customer, offeredPrice) {
  const basePrice = calculateBasePrice(customer.wantedItems);
  const budget = customer.budget;

  if (offeredPrice <= budget) {
    let acceptance = 0.8;
    const priceRatio = offeredPrice / basePrice;

    if (customer.bargainStyle === 'generous') {
      acceptance = 0.95;
    } else if (customer.bargainStyle === 'weak') {
      acceptance = 0.9;
    } else if (customer.bargainStyle === 'aggressive') {
      acceptance = Math.max(0.3, 0.8 - (priceRatio - 1) * 2);
    } else if (customer.bargainStyle === 'confused') {
      acceptance = Math.random() < 0.5 ? 0.9 : 0.5;
    } else if (customer.bargainStyle === 'cunning') {
      acceptance = Math.max(0.4, 1 - (priceRatio - 1) * 3);
    } else {
      acceptance = Math.max(0.5, 0.8 - Math.max(0, priceRatio - 1) * 1.5);
    }

    if (priceRatio < 0.9) {
      acceptance = Math.min(1, acceptance + (0.9 - priceRatio) * 2);
    }

    return acceptance;
  } else {
    const overBudgetRatio = offeredPrice / budget;
    return Math.max(0, 0.3 - (overBudgetRatio - 1) * 0.5);
  }
}

function processCounterOffer(customer, currentOffer) {
  if (customer.bargainAttempts >= CONFIG.BARGAIN_ATTEMPTS) {
    return null;
  }

  customer.bargainAttempts += 1;

  const basePrice = calculateBasePrice(customer.wantedItems);
  const minAcceptable = basePrice * CONFIG.BARGAIN_MIN_RATIO;
  const maxWilling = customer.budget * 0.95;

  let counterOffer;

  if (customer.bargainStyle === 'generous') {
    counterOffer = Math.round(currentOffer * 0.95);
  } else if (customer.bargainStyle === 'weak') {
    counterOffer = Math.round(currentOffer * 0.92);
  } else if (customer.bargainStyle === 'aggressive') {
    counterOffer = Math.round(Math.max(minAcceptable, currentOffer * 0.75));
  } else if (customer.bargainStyle === 'confused') {
    counterOffer = Math.round(currentOffer * (0.8 + Math.random() * 0.15));
  } else if (customer.bargainStyle === 'cunning') {
    counterOffer = Math.round(Math.max(minAcceptable, currentOffer * 0.85));
  } else {
    counterOffer = Math.round(Math.max(minAcceptable, currentOffer * 0.88));
  }

  counterOffer = Math.min(counterOffer, Math.round(maxWilling));
  customer.currentOffer = counterOffer;
  return counterOffer;
}

function willCustomerWalkAway(customer, currentOffer) {
  const basePrice = calculateBasePrice(customer.wantedItems);
  const attempts = customer.bargainAttempts;

  if (attempts >= CONFIG.BARGAIN_ATTEMPTS) {
    return true;
  }

  let walkAwayChance = 0;
  const priceRatio = currentOffer / basePrice;

  if (customer.mood === 'angry') {
    walkAwayChance = 0.3 + attempts * 0.2;
  } else if (customer.mood === 'tired' || customer.mood === 'sad') {
    walkAwayChance = 0.15 + attempts * 0.15;
  } else if (customer.mood === 'happy' || customer.mood === 'excited') {
    walkAwayChance = 0.05 + attempts * 0.1;
  } else if (customer.mood === 'drunk') {
    walkAwayChance = 0.1 + attempts * 0.05;
  } else if (customer.mood === 'mysterious') {
    walkAwayChance = 0.2 + attempts * 0.15;
  } else {
    walkAwayChance = 0.1 + attempts * 0.15;
  }

  if (priceRatio > 1.3) {
    walkAwayChance += 0.3;
  } else if (priceRatio > 1.2) {
    walkAwayChance += 0.15;
  }

  return Math.random() < walkAwayChance;
}

module.exports = {
  calculateBasePrice,
  calculateCost,
  calculateCustomerAcceptance,
  processCounterOffer,
  willCustomerWalkAway
};
