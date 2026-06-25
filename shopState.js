const { PRODUCTS, getProductById } = require('./products');
const { CONFIG } = require('./config');

function createInitialState() {
  const inventory = {};
  const initialStock = [
    { id: 'bento_a', qty: 5 },
    { id: 'onigiri', qty: 8 },
    { id: 'noodle', qty: 10 },
    { id: 'sandwich', qty: 5 },
    { id: 'bread', qty: 6 },
    { id: 'cola', qty: 15 },
    { id: 'coffee', qty: 10 },
    { id: 'water', qty: 20 },
    { id: 'milk', qty: 8 },
    { id: 'energy', qty: 6 },
    { id: 'tea', qty: 10 },
    { id: 'chips', qty: 10 },
    { id: 'chocolate', qty: 8 },
    { id: 'candy', qty: 15 },
    { id: 'icecream', qty: 8 },
    { id: 'nuts', qty: 5 },
    { id: 'tissue', qty: 10 },
    { id: 'mask', qty: 20 },
    { id: 'cigarette', qty: 5 },
    { id: 'beer', qty: 10 }
  ];

  initialStock.forEach(item => {
    inventory[item.id] = {
      quantity: item.qty,
      expiryIn: getProductById(item.id).shelfLife
    };
  });

  return {
    day: CONFIG.INITIAL_DAY,
    money: CONFIG.INITIAL_MONEY,
    reputation: CONFIG.INITIAL_REPUTATION,
    inventory: inventory,
    totalSales: 0,
    totalCustomers: 0,
    happyCustomers: 0,
    angryCustomers: 0
  };
}

function getInventoryItem(state, productId) {
  return state.inventory[productId] || { quantity: 0, expiryIn: 0 };
}

function hasStock(state, productId, quantity = 1) {
  const item = getInventoryItem(state, productId);
  return item.quantity >= quantity;
}

function reduceStock(state, productId, quantity) {
  if (!hasStock(state, productId, quantity)) {
    return false;
  }
  state.inventory[productId].quantity -= quantity;
  return true;
}

function addStock(state, productId, quantity) {
  const product = getProductById(productId);
  if (!product) return false;

  if (!state.inventory[productId]) {
    state.inventory[productId] = {
      quantity: 0,
      expiryIn: product.shelfLife
    };
  }
  state.inventory[productId].quantity += quantity;
  return true;
}

function restockProduct(state, productId, quantity) {
  const product = getProductById(productId);
  if (!product) return false;

  const totalCost = Math.floor(product.cost * quantity * CONFIG.RESTOCK_COST_MULTIPLIER);
  if (state.money < totalCost) {
    return { success: false, reason: '资金不足' };
  }

  state.money -= totalCost;
  addStock(state, productId, quantity);
  return { success: true, cost: totalCost };
}

function processExpiry(state) {
  const expired = [];
  let totalLoss = 0;

  Object.keys(state.inventory).forEach(productId => {
    const item = state.inventory[productId];
    const product = getProductById(productId);
    if (!product) return;

    if (product.shelfLife === -1) return;

    if (item.expiryIn > 0) {
      item.expiryIn -= 1;
    }

    if (item.expiryIn <= 0 && item.quantity > 0) {
      const lostQty = Math.ceil(item.quantity * CONFIG.EXPIRY_DAMAGE_RATIO);
      if (lostQty > 0) {
        totalLoss += lostQty * product.cost;
        item.quantity -= lostQty;
        expired.push({
          productId: productId,
          name: product.name,
          quantity: lostQty
        });
      }
      if (item.quantity > 0) {
        item.expiryIn = product.shelfLife;
      }
    }
  });

  state.money = Math.max(0, state.money - totalLoss);
  return { expired, totalLoss };
}

function addMoney(state, amount) {
  state.money += amount;
  state.totalSales += amount;
}

function addReputation(state, amount) {
  state.reputation = Math.max(0, Math.min(100, state.reputation + amount));
}

function incrementDay(state) {
  state.day += 1;
}

function isGameOver(state) {
  return state.money <= CONFIG.MONEY_GAME_OVER || state.reputation <= CONFIG.REPUTATION_GAME_OVER;
}

function getInventoryValue(state) {
  let value = 0;
  Object.keys(state.inventory).forEach(productId => {
    const product = getProductById(productId);
    const item = state.inventory[productId];
    if (product && item.quantity > 0) {
      value += product.cost * item.quantity;
    }
  });
  return value;
}

module.exports = {
  createInitialState,
  getInventoryItem,
  hasStock,
  reduceStock,
  addStock,
  restockProduct,
  processExpiry,
  addMoney,
  addReputation,
  incrementDay,
  isGameOver,
  getInventoryValue
};
