const chalk = require('chalk');
const { CATEGORIES, getProductById } = require('./products');
const { getInventoryValue } = require('./shopState');

const DIVIDER = chalk.gray('─'.repeat(60));
const DOUBLE_DIVIDER = chalk.gray('═'.repeat(60));

function clearScreen() {
  console.clear();
}

function printTitle() {
  console.log('');
  console.log(chalk.yellow.bold('         ╔════════════════════════════════════════════════════╗'));
  console.log(chalk.yellow.bold('         ║') + chalk.magenta.bold('          🌙  深  夜  便  利  店  主  🌙              ') + chalk.yellow.bold('║'));
  console.log(chalk.yellow.bold('         ╚════════════════════════════════════════════════════╝'));
  console.log('');
}

function printShopStatus(state) {
  const invValue = getInventoryValue(state);
  const totalAsset = state.money + invValue;

  console.log(DOUBLE_DIVIDER);
  console.log(
    chalk.cyan.bold('  📅 第 ') + chalk.white.bold(state.day) + chalk.cyan.bold(' 天') +
    chalk.cyan.bold('      💰 资金: ') + (state.money >= 100 ? chalk.green.bold('¥' + state.money) : chalk.red.bold('¥' + state.money)) +
    chalk.cyan.bold('      ⭐ 声誉: ') + (state.reputation >= 50 ? chalk.green.bold(state.reputation) : chalk.red.bold(state.reputation))
  );
  console.log(chalk.gray('  库存价值: ¥' + invValue) + chalk.gray('  |  总资产: ¥' + totalAsset) + chalk.gray('  |  累计顾客: ' + state.totalCustomers));
  console.log(DOUBLE_DIVIDER);
}

function printTimeOfNight(customerIndex, totalCustomers) {
  console.log('');
  console.log(chalk.blue.bold('  🌙 深夜营业中...  (' + chalk.white(customerIndex + 1) + '/' + chalk.white(totalCustomers) + ' 位顾客)'));
  console.log('');
}

function printCustomer(customer) {
  const moodColors = {
    happy: chalk.green,
    neutral: chalk.white,
    tired: chalk.gray,
    angry: chalk.red,
    mysterious: chalk.magenta,
    sad: chalk.blue,
    excited: chalk.yellow,
    drunk: chalk.hex('#FFA500')
  };

  const moodEmoji = {
    happy: '😊',
    neutral: '😐',
    tired: '😩',
    angry: '😠',
    mysterious: '🤔',
    sad: '😢',
    excited: '🤩',
    drunk: '🥴'
  };

  const moodNames = {
    happy: '开心',
    neutral: '平静',
    tired: '疲惫',
    angry: '生气',
    mysterious: '神秘',
    sad: '难过',
    excited: '兴奋',
    drunk: '醉酒'
  };

  const colorFn = moodColors[customer.mood] || chalk.white;
  const emoji = moodEmoji[customer.mood] || '😐';
  const moodName = moodNames[customer.mood] || '未知';

  console.log(DIVIDER);
  console.log(
    chalk.bold('  ' + emoji + '  ') +
    colorFn.bold(customer.name) +
    chalk.gray('  [' + customer.typeName + ' | ' + moodName + ']')
  );
  console.log('');
  console.log(colorFn('    "' + customer.greeting + '"'));
  console.log('');
}

function printWantedItems(customer, state) {
  console.log(chalk.cyan.bold('  顾客想要购买:'));
  console.log(DIVIDER);
  customer.wantedItems.forEach((item, idx) => {
    const product = getProductById(item.productId);
    if (product) {
      const inStock = state.inventory[item.productId]?.quantity || 0;
      const stockColor = inStock >= item.quantity ? chalk.green : chalk.red;
      const stockStatus = inStock >= item.quantity ? '✔' : '✘ 缺货!';
      console.log(
        chalk.white('    ' + (idx + 1) + '. ') +
        chalk.white.bold(product.name) +
        chalk.gray(' × ' + item.quantity) +
        chalk.gray('  (¥' + product.price + '/个)') +
        stockColor('  [' + stockStatus + ' 库存:' + inStock + ']')
      );
    }
  });
  console.log('');
}

function printOfferInfo(basePrice, costPrice, customerBudget) {
  console.log(chalk.yellow.bold('  💵 价格参考:'));
  console.log(
    chalk.white('    标价总计: ') + chalk.white('¥' + basePrice) +
    chalk.white('    成本价: ') + chalk.gray('¥' + costPrice) +
    chalk.white('    顾客预算: ') + chalk.cyan('¥' + customerBudget)
  );
  console.log('');
}

function printMenu(options) {
  console.log(chalk.yellow.bold('  📋 请选择:'));
  options.forEach((opt, idx) => {
    console.log(chalk.white('    ' + (idx + 1) + '. ') + chalk.white(opt));
  });
  console.log('');
}

function printMessage(message, type = 'info') {
  const typeStyles = {
    info: chalk.blue,
    success: chalk.green.bold,
    warning: chalk.yellow.bold,
    error: chalk.red.bold,
    customer: chalk.magenta
  };
  const style = typeStyles[type] || chalk.white;
  console.log(style('  ' + message));
  console.log('');
}

function printCustomerDialog(customer, message) {
  const moodColors = {
    happy: chalk.green,
    neutral: chalk.white,
    tired: chalk.gray,
    angry: chalk.red,
    mysterious: chalk.magenta,
    sad: chalk.blue,
    excited: chalk.yellow,
    drunk: chalk.hex('#FFA500')
  };
  const colorFn = moodColors[customer.mood] || chalk.white;
  console.log(colorFn('    💬 "' + message + '"'));
  console.log('');
}

function printInventory(state, categoryFilter = null) {
  console.log(DIVIDER);
  console.log(chalk.cyan.bold('  📦 当前库存:'));
  console.log(DIVIDER);

  const categories = categoryFilter ? [categoryFilter] : Object.values(CATEGORIES);

  categories.forEach(category => {
    const items = Object.keys(state.inventory)
      .map(id => ({ id, product: getProductById(id), ...state.inventory[id] }))
      .filter(item => item.product && item.product.category === category && item.quantity > 0);

    if (items.length === 0) return;

    console.log(chalk.white.bold('  [' + category + ']'));
    items.forEach(item => {
      const expiryInfo = item.product.shelfLife === -1
        ? chalk.gray('[冷冻/永久]')
        : item.expiryIn <= 1
          ? chalk.red('[即将过期: ' + item.expiryIn + '天]')
          : chalk.yellow('[保质期: ' + item.expiryIn + '天]');

      console.log(
        chalk.white('    • ') +
        chalk.white.bold(item.product.name) +
        chalk.gray(' × ' + item.quantity) +
        chalk.gray('  ¥' + item.product.price + '/个') +
        '  ' + expiryInfo
      );
    });
    console.log('');
  });
  console.log(DIVIDER);
}

function printDayEndReport(state, nightlyStats) {
  console.log('');
  console.log(DOUBLE_DIVIDER);
  console.log(chalk.yellow.bold('  🌅 第 ' + state.day + ' 天营业结束 - 今日报告'));
  console.log(DOUBLE_DIVIDER);
  console.log(chalk.white('    接待顾客: ') + chalk.white.bold(nightlyStats.customersServed + ' / ' + nightlyStats.totalCustomers));
  console.log(chalk.white('    满意顾客: ') + chalk.green.bold(nightlyStats.happyCustomers));
  console.log(chalk.white('    流失顾客: ') + chalk.red.bold(nightlyStats.lostCustomers));
  console.log(chalk.white('    营业额: ') + chalk.green.bold('¥' + nightlyStats.revenue));
  console.log(chalk.white('    利润: ') + (nightlyStats.profit >= 0 ? chalk.green.bold('¥' + nightlyStats.profit) : chalk.red.bold('¥' + nightlyStats.profit)));

  if (nightlyStats.expiredItems && nightlyStats.expiredItems.length > 0) {
    console.log('');
    console.log(chalk.red.bold('  ⚠  过期损耗 (损失 ¥' + nightlyStats.expiryLoss + '):'));
    nightlyStats.expiredItems.forEach(item => {
      console.log(chalk.red('    × ' + item.name + ' × ' + item.quantity));
    });
  }

  console.log(DOUBLE_DIVIDER);
  console.log('');
}

function printGameOver(state) {
  console.log('');
  console.log(chalk.red.bold('         ╔════════════════════════════════════════════════════╗'));
  console.log(chalk.red.bold('         ║') + chalk.bgRed.white.bold('                    💀 游 戏 结 束 💀                    ') + chalk.red.bold('║'));
  console.log(chalk.red.bold('         ╚════════════════════════════════════════════════════╝'));
  console.log('');

  if (state.money <= 0) {
    console.log(chalk.red.bold('  💸 破产了！你的资金已经耗尽...'));
  }
  if (state.reputation <= 10) {
    console.log(chalk.red.bold('  👎 声誉扫地！再也没人愿意来你的店了...'));
  }

  console.log('');
  console.log(chalk.white.bold('  最终成绩:'));
  console.log(chalk.white('    营业天数: ') + chalk.yellow.bold(state.day + ' 天'));
  console.log(chalk.white('    累计销售额: ') + chalk.green.bold('¥' + state.totalSales));
  console.log(chalk.white('    累计接待顾客: ') + chalk.cyan.bold(state.totalCustomers + ' 人'));
  console.log(chalk.white('    满意顾客: ') + chalk.green.bold(state.happyCustomers + ' 人'));
  console.log('');
}

function printWelcomeMenu(hasSave) {
  printTitle();
  console.log(DIVIDER);
  console.log(chalk.white('  欢迎来到深夜便利店！在这里，你将扮演一位24小时便利店的老板。'));
  console.log(chalk.white('  深夜会有各种稀奇古怪的顾客上门，你需要：'));
  console.log('');
  console.log(chalk.cyan('    • 根据顾客需求推荐商品'));
  console.log(chalk.cyan('    • 与顾客讨价还价'));
  console.log(chalk.cyan('    • 控制库存，避免过期损失'));
  console.log(chalk.cyan('    • 保持资金和声誉，别让店倒闭了！'));
  console.log(DIVIDER);
  console.log('');
  if (hasSave) {
    console.log(chalk.yellow.bold('  📋 主菜单:'));
    console.log(chalk.white('    1. ') + chalk.green.bold('继续游戏 (读取存档)'));
    console.log(chalk.white('    2. ') + chalk.white('开始新游戏'));
    console.log(chalk.white('    3. ') + chalk.red('删除存档'));
    console.log(chalk.white('    4. ') + chalk.gray('退出游戏'));
  } else {
    console.log(chalk.yellow.bold('  📋 主菜单:'));
    console.log(chalk.white('    1. ') + chalk.green.bold('开始新游戏'));
    console.log(chalk.white('    2. ') + chalk.gray('退出游戏'));
  }
  console.log('');
}

function printEventIntro(event) {
  console.log('');
  console.log(chalk.bgRed.white.bold('         ╔════════════════════════════════════════════════════╗'));
  console.log(chalk.bgRed.white.bold('         ║              ⚠  突  发  事  件  ⚠                ║'));
  console.log(chalk.bgRed.white.bold('         ╚════════════════════════════════════════════════════╝'));
  console.log('');
  console.log(chalk.red.bold('  【' + event.name + '】'));
  console.log('');
  const lines = event.description.split('');
  let wrapped = '';
  let lineLen = 0;
  for (const ch of lines) {
    wrapped += ch;
    lineLen += ch.charCodeAt(0) > 127 ? 2 : 1;
    if (lineLen >= 54 && (ch === '，' || ch === '。' || ch === '？' || ch === '！' || ch === '；')) {
      wrapped += '\n  ';
      lineLen = 0;
    }
  }
  console.log(chalk.white('  ' + wrapped));
  console.log('');
  console.log(chalk.gray('  ────────────────────────────────────────────────────────────'));
  console.log('');
}

function printEventChoices(event) {
  console.log(chalk.yellow.bold('  你该怎么办？'));
  console.log('');
  event.choices.forEach((choice, idx) => {
    console.log(chalk.white('    ' + (idx + 1) + '. ') + chalk.white.bold(choice.text));
  });
  console.log('');
}

function printEventResult(result) {
  console.log('');
  console.log(chalk.gray('  ────────────────────────────────────────────────────────────'));
  console.log('');

  const lines = result.outcome.message.split('');
  let wrapped = '';
  let lineLen = 0;
  for (const ch of lines) {
    wrapped += ch;
    lineLen += ch.charCodeAt(0) > 127 ? 2 : 1;
    if (lineLen >= 54 && (ch === '，' || ch === '。' || ch === '？' || ch === '！' || ch === '；')) {
      wrapped += '\n  ';
      lineLen = 0;
    }
  }
  console.log(chalk.magenta('  ' + wrapped));
  console.log('');

  if (result.outcome.money !== 0 || result.outcome.reputation !== 0) {
    const parts = [];
    if (result.outcome.money > 0) {
      parts.push(chalk.green.bold('💰 +¥' + result.outcome.money));
    } else if (result.outcome.money < 0) {
      parts.push(chalk.red.bold('💰 ¥' + result.outcome.money));
    }
    if (result.outcome.reputation > 0) {
      parts.push(chalk.green.bold('⭐ +' + result.outcome.reputation));
    } else if (result.outcome.reputation < 0) {
      parts.push(chalk.red.bold('⭐ ' + result.outcome.reputation));
    }
    if (parts.length > 0) {
      console.log(chalk.white('    ' + parts.join('    ')));
      console.log('');
    }
  }
}

module.exports = {
  clearScreen,
  printTitle,
  printShopStatus,
  printTimeOfNight,
  printCustomer,
  printWantedItems,
  printOfferInfo,
  printMenu,
  printMessage,
  printCustomerDialog,
  printInventory,
  printDayEndReport,
  printGameOver,
  printWelcomeMenu,
  printEventIntro,
  printEventChoices,
  printEventResult,
  DIVIDER,
  DOUBLE_DIVIDER
};
