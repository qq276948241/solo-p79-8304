const fs = require('fs');
const { CONFIG } = require('./config');

function saveGame(state) {
  try {
    const saveData = {
      savedAt: Date.now(),
      state: state
    };
    const jsonString = JSON.stringify(saveData, null, 2);
    fs.writeFileSync(CONFIG.SAVE_FILE, jsonString, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
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
