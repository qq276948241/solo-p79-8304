const { PRODUCTS, CATEGORIES } = require('./products');
const { CUSTOMER_TYPES, CUSTOMER_NAMES, CUSTOMER_GREETINGS, MOODS } = require('./config');
const { weightedRandom, randomChoice } = require('./utils');

function generateMood(biasMoods) {
  if (biasMoods && Math.random() < 0.6) {
    return randomChoice(biasMoods);
  }
  return randomChoice(MOODS);
}

function generateWantedProducts(mood) {
  let productPool = [...PRODUCTS];
  
  if (mood === 'tired') {
    productPool = productPool.filter(p => 
      p.category === CATEGORIES.DRINK || p.category === CATEGORIES.FOOD
    );
  } else if (mood === 'drunk') {
    productPool = productPool.filter(p => 
      p.category === CATEGORIES.DRINK || p.category === CATEGORIES.FOOD
    );
  } else if (mood === 'happy' || mood === 'excited') {
    productPool = productPool.filter(p => 
      p.category === CATEGORIES.SNACK || p.category === CATEGORIES.SPECIAL || p.category === CATEGORIES.DRINK
    );
  } else if (mood === 'mysterious') {
    productPool = productPool.filter(p => 
      p.category === CATEGORIES.SPECIAL || p.category === CATEGORIES.TOBACCO || p.category === CATEGORIES.DAILY
    );
  } else if (mood === 'sad') {
    productPool = productPool.filter(p => 
      p.category === CATEGORIES.FOOD || p.category === CATEGORIES.SNACK || p.category === CATEGORIES.DRINK
    );
  }

  const wantedCount = Math.random() < 0.6 ? 1 : (Math.random() < 0.7 ? 2 : 3);
  const shuffled = [...productPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(wantedCount, shuffled.length)).map(p => ({
    productId: p.id,
    quantity: Math.floor(Math.random() * 3) + 1
  }));
}

function generateBudget(mood, wantedItems) {
  const baseTotal = wantedItems.reduce((sum, item) => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  let minRatio = 0.8;
  let maxRatio = 1.5;

  if (mood === 'angry') {
    minRatio = 1.0;
    maxRatio = 2.0;
  } else if (mood === 'happy' || mood === 'excited') {
    minRatio = 1.0;
    maxRatio = 1.8;
  } else if (mood === 'tired' || mood === 'sad') {
    minRatio = 0.7;
    maxRatio = 1.2;
  } else if (mood === 'drunk') {
    minRatio = 1.2;
    maxRatio = 2.5;
  }

  const ratio = minRatio + Math.random() * (maxRatio - minRatio);
  return Math.floor(baseTotal * ratio);
}

function generateBargainStyle(mood) {
  if (mood === 'angry') return 'aggressive';
  if (mood === 'happy' || mood === 'excited') return 'generous';
  if (mood === 'tired' || mood === 'sad') return 'weak';
  if (mood === 'drunk') return 'confused';
  if (mood === 'mysterious') return 'cunning';
  return 'normal';
}

function generateCustomer() {
  const customerType = weightedRandom(CUSTOMER_TYPES);
  const mood = generateMood(customerType.moodBias);
  const wantedItems = generateWantedProducts(mood);
  const budget = generateBudget(mood, wantedItems);
  const bargainStyle = generateBargainStyle(mood);

  const greetings = CUSTOMER_GREETINGS[mood] || CUSTOMER_GREETINGS.neutral;

  return {
    id: Date.now() + Math.random(),
    type: customerType.type,
    typeName: customerType.name,
    name: randomChoice(CUSTOMER_NAMES),
    mood: mood,
    wantedItems: wantedItems,
    budget: budget,
    bargainStyle: bargainStyle,
    greeting: randomChoice(greetings),
    currentOffer: null,
    bargainAttempts: 0
  };
}

function generateCustomersForNight(minCount, maxCount) {
  const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
  const customers = [];
  for (let i = 0; i < count; i++) {
    customers.push(generateCustomer());
  }
  return customers;
}

module.exports = {
  generateCustomer,
  generateCustomersForNight
};
