const fs = require('fs');
const { CONFIG } = require('./config');

function saveGame(state) {
  try {
    const saveData = {
      savedAt: Date.now(),
      state: normalizeState(state)
    };
    const jsonString = JSON.stringify(saveData, null, 2);
    fs.writeFileSync(CONFIG.SAVE_FILE, jsonString, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function normalizeState(state) {
  if (typeof state.money === 'number') {
    state.money = Math.round(state.money);
  }
  if (typeof state.reputation === 'number') {
    state.reputation = Math.round(state.reputation);
  }
  if (typeof state.totalSales === 'number') {
    state.totalSales = Math.round(state.totalSales);
  }
  if (state.inventory && typeof state.inventory === 'object') {
    Object.keys(state.inventory).forEach(pid => {
      const item = state.inventory[pid];
      if (item && typeof item.quantity === 'number') {
        item.quantity = Math.round(item.quantity);
      }
      if (item && typeof item.expiryIn === 'number') {
        item.expiryIn = Math.round(item.expiryIn);
      }
    });
  }
  if (typeof state.totalCustomers === 'number') {
    state.totalCustomers = Math.round(state.totalCustomers);
  }
  if (typeof state.happyCustomers === 'number') {
    state.happyCustomers = Math.round(state.happyCustomers);
  }
  if (typeof state.angryCustomers === 'number') {
    state.angryCustomers = Math.round(state.angryCustomers);
  }
  return state;
}

function loadGame() {
  try {
    if (!fs.existsSync(CONFIG.SAVE_FILE)) {
      return { success: false, error: '存档文件不存在' };
    }
    const rawData = fs.readFileSync(CONFIG.SAVE_FILE, 'utf8');
    const saveData = JSON.parse(rawData);
    if (!saveData || !saveData.state) {
      return { success: false, error: '存档文件格式错误' };
    }
    normalizeState(saveData.state);
    return { success: true, state: saveData.state, savedAt: saveData.savedAt };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function hasSaveFile() {
  return fs.existsSync(CONFIG.SAVE_FILE);
}

function deleteSave() {
  try {
    if (fs.existsSync(CONFIG.SAVE_FILE)) {
      fs.unlinkSync(CONFIG.SAVE_FILE);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  saveGame,
  loadGame,
  hasSaveFile,
  deleteSave
};
