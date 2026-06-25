const chalk = require('chalk');
const Input = require('./input');
const { CONFIG } = require('./config');
const {
  createInitialState,
  hasStock,
  reduceStock,
  restockProduct,
  processExpiry,
  addMoney,
  addReputation,
  incrementDay,
  isGameOver
} = require('./shopState');
const { generateCustomersForNight } = require('./customerGenerator');
const {
  calculateBasePrice,
  calculateCost,
  calculateCustomerAcceptance,
  processCounterOffer,
  willCustomerWalkAway
} = require('./transaction');
const { getCustomerResponse } = require('./dialogue');
const {
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
  printEventResult
} = require('./uiRenderer');
const { saveGame, loadGame, hasSaveFile, deleteSave } = require('./storage');
const { PRODUCTS, getProductById, CATEGORIES } = require('./products');
const { rollEventTrigger, resolveEventChoice, applyEventResult } = require('./events');

class GameLoop {
  constructor() {
    this.input = new Input();
    this.state = null;
  }

  close() {
    this.input.close();
  }

  async showMainMenu() {
    const hasSave = hasSaveFile();
    let choice = '';

    while (true) {
      clearScreen();
      printWelcomeMenu(hasSave);

      if (hasSave) {
        choice = await this.input.question(chalk.white('  请输入选项 (1-4): '));
        if (choice === '1') {
          const result = loadGame();
          if (result.success) {
            this.state = result.state;
            printMessage('存档读取成功！继续您的深夜便利店之旅~', 'success');
            await this.input.pause();
            return true;
          } else {
            printMessage('读取存档失败: ' + result.error, 'error');
            await this.input.pause();
          }
        } else if (choice === '2') {
          this.state = createInitialState();
          return true;
        } else if (choice === '3') {
          const confirmed = await this.input.confirm('确定要删除存档吗？此操作不可恢复！');
          if (confirmed) {
            deleteSave();
            printMessage('存档已删除。', 'warning');
          } else {
            printMessage('操作已取消。', 'info');
          }
          await this.input.pause();
        } else if (choice === '4') {
          return false;
        }
      } else {
        choice = await this.input.question(chalk.white('  请输入选项 (1-2): '));
        if (choice === '1') {
          this.state = createInitialState();
          return true;
        } else if (choice === '2') {
          return false;
        }
      }
    }
  }

  async handleCustomer(customer) {
    clearScreen();
    printTitle();
    printShopStatus(this.state);
    printTimeOfNight(this.currentCustomerIndex, this.customers.length);
    printCustomer(customer);
    printWantedItems(customer, this.state);

    const hasAllStock = customer.wantedItems.every(item =>
      hasStock(this.state, item.productId, item.quantity)
    );

    if (!hasAllStock) {
      printMessage('库存不足，无法满足顾客需求。', 'warning');
      await this.input.pause();
      return this.handleCustomerLeft(customer, false);
    }

    const basePrice = calculateBasePrice(customer.wantedItems);
    const costPrice = calculateCost(customer.wantedItems);
    printOfferInfo(basePrice, costPrice, customer.budget);

    let currentOffer = basePrice;

    while (true) {
      printMenu([
        '按标价 ¥' + basePrice + ' 出售',
        '自定义报价',
        '拒绝交易',
        '查看库存'
      ]);

      const choice = await this.input.question(chalk.white('  请输入选项 (1-4): '));

      if (choice === '1') {
        currentOffer = basePrice;
      } else if (choice === '2') {
        const num = await this.input.inputNumber('  请输入您的报价 (¥): ');
        if (num === null) {
          printMessage('请输入有效的金额！', 'error');
          await this.input.pause();
          clearScreen();
          printTitle();
          printShopStatus(this.state);
          printTimeOfNight(this.currentCustomerIndex, this.customers.length);
          printCustomer(customer);
          printWantedItems(customer, this.state);
          printOfferInfo(basePrice, costPrice, customer.budget);
          continue;
        }
        currentOffer = num;
      } else if (choice === '3') {
        return this.handleCustomerLeft(customer, false);
      } else if (choice === '4') {
        clearScreen();
        printTitle();
        printInventory(this.state);
        await this.input.pause();
        clearScreen();
        printTitle();
        printShopStatus(this.state);
        printTimeOfNight(this.currentCustomerIndex, this.customers.length);
        printCustomer(customer);
        printWantedItems(customer, this.state);
        printOfferInfo(basePrice, costPrice, customer.budget);
        continue;
      } else {
        printMessage('无效选项，请重新选择。', 'warning');
        continue;
      }

      printMessage('您报价: ¥' + currentOffer, 'info');

      if (willCustomerWalkAway(customer, currentOffer)) {
        const response = getCustomerResponse(customer, false, true, null);
        printCustomerDialog(customer, response);
        await this.input.pause();
        return this.handleCustomerLeft(customer, false);
      }

      const acceptance = calculateCustomerAcceptance(customer, currentOffer);
      const accepted = Math.random() < acceptance;

      if (accepted) {
        const response = getCustomerResponse(customer, true, false, null);
        printCustomerDialog(customer, response);
        printMessage('交易成功！收入 ¥' + currentOffer + '，利润 ¥' + (currentOffer - costPrice), 'success');
        await this.input.pause();
        return this.handleCustomerSatisfied(customer, currentOffer, costPrice);
      } else {
        const counter = processCounterOffer(customer, currentOffer);

        if (counter === null) {
          const response = getCustomerResponse(customer, false, true, null);
          printCustomerDialog(customer, response);
          await this.input.pause();
          return this.handleCustomerLeft(customer, false);
        }

        const response = getCustomerResponse(customer, false, false, counter);
        printCustomerDialog(customer, response);
        printMessage('顾客还价: ¥' + counter, 'warning');
        printMessage('(已还价 ' + customer.bargainAttempts + '/' + CONFIG.BARGAIN_ATTEMPTS + ' 次)', 'info');
        currentOffer = counter;

        const accepted = await this.input.confirm('接受这个价格吗？');
        if (accepted) {
          printMessage('交易成功！收入 ¥' + currentOffer + '，利润 ¥' + Math.max(0, currentOffer - costPrice), 'success');
          await this.input.pause();
          return this.handleCustomerSatisfied(customer, currentOffer, costPrice);
        }
      }
    }
  }

  handleCustomerSatisfied(customer, price, cost) {
    customer.wantedItems.forEach(item => {
      reduceStock(this.state, item.productId, item.quantity);
    });

    const profit = price - cost;
    addMoney(this.state, price);

    let repChange = CONFIG.REPUTATION_PER_GOOD_SALE;
    if (price >= cost * 1.5) {
      repChange = 1;
    } else if (price < cost) {
      repChange = 4;
    }
    addReputation(this.state, repChange);

    this.state.totalCustomers += 1;
    this.state.happyCustomers += 1;
    this.nightlyStats.customersServed += 1;
    this.nightlyStats.happyCustomers += 1;
    this.nightlyStats.revenue += price;
    this.nightlyStats.profit += profit;
  }

  handleCustomerLeft(customer, boughtSomething) {
    this.state.totalCustomers += 1;
    if (!boughtSomething) {
      this.state.angryCustomers += 1;
      addReputation(this.state, CONFIG.REPUTATION_PER_REFUSE);
      this.nightlyStats.lostCustomers += 1;
    }
  }

  async handleEvent(event) {
    clearScreen();
    printTitle();
    printShopStatus(this.state);
    printEventIntro(event);
    printEventChoices(event);

    while (true) {
      const num = await this.input.chooseNumber(1, event.choices.length, chalk.white('  请输入选项 (1-' + event.choices.length + '): '));
      if (num !== null) {
        const selectedChoice = event.choices[num - 1];
        const result = resolveEventChoice(event, selectedChoice.id);
        applyEventResult(this.state, result);
        printEventResult(result);
        break;
      } else {
        printMessage('无效选项，请重新选择。', 'warning');
      }
    }

    await this.input.pause('  按回车键继续营业...');
    clearScreen();
    printTitle();
    printShopStatus(this.state);
  }

  async showRestockMenu() {
    while (true) {
      clearScreen();
      printTitle();
      printShopStatus(this.state);
      printInventory(this.state);

      printMenu([
        '进货（选择商品）',
        '快速补货（每种商品补5个）',
        '进入下一天',
        '保存游戏',
        '退出游戏'
      ]);

      const choice = await this.input.question(chalk.white('  请输入选项 (1-5): '));

      if (choice === '1') {
        await this.handleManualRestock();
      } else if (choice === '2') {
        await this.handleQuickRestock();
      } else if (choice === '3') {
        return;
      } else if (choice === '4') {
        const result = saveGame(this.state);
        if (result.success) {
          printMessage('游戏已保存！', 'success');
        } else {
          printMessage('保存失败: ' + result.error, 'error');
        }
        await this.input.pause();
      } else if (choice === '5') {
        const confirmed = await this.input.confirm('确定要退出游戏吗？');
        if (confirmed) {
          this.quitRequested = true;
          return;
        }
      } else {
        printMessage('无效选项，请重新选择。', 'warning');
        await this.input.pause();
      }
    }
  }

  async handleManualRestock() {
    clearScreen();
    printTitle();
    printShopStatus(this.state);

    const categories = Object.values(CATEGORIES);
    console.log(chalk.cyan.bold('  🏪 商品目录:'));
    console.log(chalk.gray('  ────────────────────────────────────────────────────────────'));

    categories.forEach((cat, catIdx) => {
      console.log(chalk.white.bold('  [' + (catIdx + 1) + '] ' + cat));
      const products = PRODUCTS.filter(p => p.category === cat);
      products.forEach((product, pIdx) => {
        const currentStock = this.state.inventory[product.id]?.quantity || 0;
        console.log(
          chalk.white('      ' + (catIdx + 1) + '-' + (pIdx + 1) + '. ') +
          chalk.white.bold(product.name) +
          chalk.gray(' | 进价:¥' + product.cost) +
          chalk.gray(' | 售价:¥' + product.price) +
          chalk.gray(' | 库存:' + currentStock)
        );
      });
      console.log('');
    });

    console.log(chalk.gray('  输入格式: 商品编号(如 1-2) 数量, 或输入 q 返回'));
    const input = await this.input.question(chalk.white('  请选择要进货的商品: '));

    if (input.toLowerCase() === 'q') return;

    const parts = input.split(/\s+/);
    if (parts.length < 2) {
      printMessage('输入格式错误！请输入"商品编号 数量"', 'error');
      await this.input.pause();
      return;
    }

    const [code, qtyStr] = parts;
    const codeParts = code.split('-');
    const quantity = parseInt(qtyStr);

    if (codeParts.length !== 2 || isNaN(quantity) || quantity <= 0) {
      printMessage('输入格式错误！', 'error');
      await this.input.pause();
      return;
    }

    const catIdx = parseInt(codeParts[0]) - 1;
    const pIdx = parseInt(codeParts[1]) - 1;

    if (catIdx < 0 || catIdx >= categories.length) {
      printMessage('分类编号错误！', 'error');
      await this.input.pause();
      return;
    }

    const catProducts = PRODUCTS.filter(p => p.category === categories[catIdx]);
    if (pIdx < 0 || pIdx >= catProducts.length) {
      printMessage('商品编号错误！', 'error');
      await this.input.pause();
      return;
    }

    const product = catProducts[pIdx];
    const result = restockProduct(this.state, product.id, quantity);

    if (result.success) {
      printMessage('成功进货 ' + product.name + ' × ' + quantity + '，花费 ¥' + result.cost, 'success');
    } else {
      printMessage('进货失败: ' + result.reason, 'error');
    }
    await this.input.pause();
  }

  async handleQuickRestock() {
    let totalCost = 0;
    let totalItems = 0;

    PRODUCTS.forEach(product => {
      if (this.state.money >= product.cost * 5) {
        const currentStock = this.state.inventory[product.id]?.quantity || 0;
        if (currentStock < 10) {
          const restockQty = Math.min(5, Math.floor(this.state.money / product.cost));
          if (restockQty > 0) {
            const result = restockProduct(this.state, product.id, restockQty);
            if (result.success) {
              totalCost += result.cost;
              totalItems += restockQty;
            }
          }
        }
      }
    });

    if (totalItems > 0) {
      printMessage('快速补货完成！共补充 ' + totalItems + ' 件商品，花费 ¥' + totalCost, 'success');
    } else {
      printMessage('资金不足或库存充足，无需补货。', 'warning');
    }
    await this.input.pause();
  }

  async runDay() {
    this.nightlyStats = {
      customersServed: 0,
      happyCustomers: 0,
      lostCustomers: 0,
      revenue: 0,
      profit: 0,
      expiredItems: [],
      expiryLoss: 0
    };

    this.customers = generateCustomersForNight(
      CONFIG.MIN_CUSTOMERS_PER_NIGHT,
      CONFIG.MAX_CUSTOMERS_PER_NIGHT
    );
    this.nightlyStats.totalCustomers = this.customers.length;

    const midPoint = Math.floor(this.customers.length / 2);
    let eventTriggered = false;

    for (let i = 0; i < this.customers.length; i++) {
      if (isGameOver(this.state)) break;
      this.currentCustomerIndex = i;

      if (!eventTriggered && i >= midPoint) {
        const event = rollEventTrigger(this.state.day, 0.4);
        if (event) {
          eventTriggered = true;
          await this.handleEvent(event);
        }
      }

      if (isGameOver(this.state)) break;
      clearScreen();
      printTitle();
      printShopStatus(this.state);
      await this.handleCustomer(this.customers[i]);
    }

    const expiryResult = processExpiry(this.state);
    this.nightlyStats.expiredItems = expiryResult.expired;
    this.nightlyStats.expiryLoss = expiryResult.totalLoss;
    this.nightlyStats.profit -= expiryResult.totalLoss;

    clearScreen();
    printTitle();
    printDayEndReport(this.state, this.nightlyStats);

    if (!isGameOver(this.state)) {
      incrementDay(this.state);
      const saveResult = saveGame(this.state);
      if (saveResult.success) {
        printMessage('游戏已自动保存。', 'info');
      }
    }

    await this.input.pause();
  }

  async run() {
    this.quitRequested = false;

    const shouldStart = await this.showMainMenu();
    if (!shouldStart) {
      this.close();
      return;
    }

    while (!isGameOver(this.state) && !this.quitRequested) {
      await this.showRestockMenu();
      if (this.quitRequested) break;
      await this.runDay();
    }

    if (isGameOver(this.state)) {
      clearScreen();
      printGameOver(this.state);
      deleteSave();
    } else {
      printMessage('感谢游玩！', 'info');
    }

    await this.input.pause('  按回车键退出...');
    this.close();
  }
}

module.exports = GameLoop;
