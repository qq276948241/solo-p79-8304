const CATEGORIES = {
  FOOD: '食品',
  DRINK: '饮料',
  SNACK: '零食',
  DAILY: '日用品',
  TOBACCO: '烟酒',
  SPECIAL: '神秘商品'
};

const PRODUCTS = [
  { id: 'bento_a', name: '招牌便当', category: CATEGORIES.FOOD, cost: 8, price: 15, shelfLife: 2, description: '热气腾腾的家常便饭' },
  { id: 'bento_b', name: '豪华便当', category: CATEGORIES.FOOD, cost: 15, price: 28, shelfLife: 2, description: '有鱼有肉的豪华套餐' },
  { id: 'onigiri', name: '饭团', category: CATEGORIES.FOOD, cost: 3, price: 6, shelfLife: 1, description: '各种口味的日式饭团' },
  { id: 'sandwich', name: '三明治', category: CATEGORIES.FOOD, cost: 5, price: 10, shelfLife: 1, description: '新鲜制作的三明治' },
  { id: 'noodle', name: '泡面', category: CATEGORIES.FOOD, cost: 4, price: 8, shelfLife: 30, description: '深夜救星方便面' },
  { id: 'bread', name: '面包', category: CATEGORIES.FOOD, cost: 5, price: 9, shelfLife: 3, description: '松软可口的面包' },

  { id: 'cola', name: '可乐', category: CATEGORIES.DRINK, cost: 3, price: 6, shelfLife: 60, description: '冰爽碳酸饮料' },
  { id: 'coffee', name: '咖啡', category: CATEGORIES.DRINK, cost: 5, price: 12, shelfLife: 7, description: '提神醒脑的咖啡' },
  { id: 'water', name: '矿泉水', category: CATEGORIES.DRINK, cost: 1, price: 3, shelfLife: 180, description: '纯净的矿泉水' },
  { id: 'milk', name: '牛奶', category: CATEGORIES.DRINK, cost: 5, price: 10, shelfLife: 5, description: '新鲜牛奶' },
  { id: 'energy', name: '功能饮料', category: CATEGORIES.DRINK, cost: 6, price: 15, shelfLife: 30, description: '熬夜必备能量水' },
  { id: 'tea', name: '茶饮', category: CATEGORIES.DRINK, cost: 4, price: 8, shelfLife: 30, description: '各种口味的茶饮' },

  { id: 'chips', name: '薯片', category: CATEGORIES.SNACK, cost: 4, price: 9, shelfLife: 60, description: '香脆可口的薯片' },
  { id: 'chocolate', name: '巧克力', category: CATEGORIES.SNACK, cost: 6, price: 12, shelfLife: 90, description: '甜蜜的巧克力' },
  { id: 'candy', name: '糖果', category: CATEGORIES.SNACK, cost: 2, price: 5, shelfLife: 180, description: '各种口味的糖果' },
  { id: 'icecream', name: '冰淇淋', category: CATEGORIES.SNACK, cost: 5, price: 12, shelfLife: -1, description: '冰凉甜蜜的冰淇淋' },
  { id: 'nuts', name: '坚果', category: CATEGORIES.SNACK, cost: 8, price: 16, shelfLife: 60, description: '健康美味的坚果' },

  { id: 'tissue', name: '纸巾', category: CATEGORIES.DAILY, cost: 4, price: 8, shelfLife: 365, description: '生活必需品纸巾' },
  { id: 'umbrella', name: '雨伞', category: CATEGORIES.DAILY, cost: 10, price: 25, shelfLife: 365, description: '下雨天的好帮手' },
  { id: 'charger', name: '充电宝', category: CATEGORIES.DAILY, cost: 40, price: 80, shelfLife: 365, description: '手机续航救星' },
  { id: 'mask', name: '口罩', category: CATEGORIES.DAILY, cost: 2, price: 5, shelfLife: 365, description: '一次性口罩' },

  { id: 'cigarette', name: '香烟', category: CATEGORIES.TOBACCO, cost: 18, price: 30, shelfLife: 365, description: '成年人的消遣' },
  { id: 'beer', name: '啤酒', category: CATEGORIES.TOBACCO, cost: 6, price: 15, shelfLife: 60, description: '冰镇啤酒' },
  { id: 'sake', name: '清酒', category: CATEGORIES.TOBACCO, cost: 40, price: 80, shelfLife: 180, description: '日式清酒' },

  { id: 'mystery_box', name: '神秘盒子', category: CATEGORIES.SPECIAL, cost: 20, price: 50, shelfLife: 365, description: '没人知道里面是什么' },
  { id: 'lucky_charm', name: '幸运符', category: CATEGORIES.SPECIAL, cost: 10, price: 30, shelfLife: 365, description: '据说能带来好运' },
  { id: 'old_photo', name: '老照片', category: CATEGORIES.SPECIAL, cost: 5, price: 20, shelfLife: 365, description: '泛黄的老照片，背面有字' }
];

function getProductById(id) {
  return PRODUCTS.find(p => p.id === id);
}

function getProductsByCategory(category) {
  return PRODUCTS.filter(p => p.category === category);
}

function getRandomProducts(count) {
  const shuffled = [...PRODUCTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

module.exports = {
  CATEGORIES,
  PRODUCTS,
  getProductById,
  getProductsByCategory,
  getRandomProducts
};
