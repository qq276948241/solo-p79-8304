const readline = require('readline');
const chalk = require('chalk');

class Input {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  question(prompt) {
    return new Promise(resolve => {
      this.rl.question(prompt, answer => resolve(answer.trim()));
    });
  }

  async pause(hint) {
    await this.question(chalk.gray(hint || '  按回车键继续...'));
  }

  async confirm(message, defaultYes = false) {
    const suffix = defaultYes ? '(Y/n)' : '(y/N)';
    const answer = await this.question(chalk.yellow('  ' + message + ' ' + suffix + ': '));
    if (defaultYes) {
      return answer.toLowerCase() !== 'n';
    }
    return answer.toLowerCase() === 'y';
  }

  async chooseNumber(min, max, prompt) {
    while (true) {
      const answer = await this.question(chalk.white(prompt || '  请输入选项 (' + min + '-' + max + '): '));
      const num = parseInt(answer);
      if (!isNaN(num) && num >= min && num <= max) {
        return num;
      }
      return null;
    }
  }

  async inputNumber(prompt) {
    while (true) {
      const answer = await this.question(chalk.white(prompt));
      const num = parseInt(answer);
      if (!isNaN(num) && num >= 0) {
        return num;
      }
      return null;
    }
  }

  close() {
    this.rl.close();
  }
}

module.exports = Input;
