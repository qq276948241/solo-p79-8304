const GameLoop = require('./gameLoop');

async function main() {
  const game = new GameLoop();
  try {
    await game.run();
  } catch (error) {
    console.error('\n  ❌ 游戏发生错误:', error.message);
    console.error('  堆栈信息:', error.stack);
    game.close();
    process.exit(1);
  }
}

main();
