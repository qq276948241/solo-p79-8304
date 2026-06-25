# 深夜便利店主 — 架构文档

## 1. 快速上手

```bash
# 安装依赖
npm install

# 启动游戏
npm start
```

需要 Node.js >= 12，唯一的外部依赖是 `chalk@4`（终端彩色输出）。

---

## 2. 项目总览

```
project79/
├── index.js              ← 入口，启动 GameLoop
├── gameLoop.js           ← 主循环/游戏引擎，串联所有模块
├── products.js           ← 商品静态数据（27 种商品，6 大类）
├── config.js             ← 游戏常量 + 顾客类型/名字/语录配置
├── customerGenerator.js  ← 随机顾客生成器
├── shopState.js          ← 商店状态管理（资金/声誉/库存/过期）
├── transaction.js        ← 交易计算（定价/接受度/还价/离开判定）
├── dialogue.js           ← 顾客对话文本（4 类 × 8 心情 = 96 条）
├── events.js             ← 突发事件系统（5 种事件，37 种结局）
├── uiRenderer.js         ← 终端 UI 渲染（chalk 彩色）
├── input.js              ← 统一输入层（readline 封装）
├── storage.js            ← JSON 存档读写 + 数据归一化
├── utils.js              ← 共用工具函数（weightedRandom / randomChoice）
└── docs/
    └── ARCHITECTURE.md   ← 本文档
```

---

## 3. 模块依赖关系图

```
                    ┌──────────┐
                    │ index.js │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │gameLoop.js│  ← 主循环，串联一切
                    └────┬─────┘
         ┌──────┬──────┼──────┬──────┬──────┐
         │      │      │      │      │      │
    ┌────▼──┐ ┌─▼───┐ ┌▼────┐┌─▼───┐┌─▼───┐┌▼──────┐
    │input  │ │shop │ │cust ││trans││event ││uiRen  │
    │.js   │ │State│ │Gen  ││.js  ││s.js  ││der.js │
    └──────┘ │.js  │ │.js  │└──┬──┘└──┬───┘└──┬────┘
             └──┬───┘ └──┬───┘   │      │       │
                │        │       │      │       │
         ┌──────▼────────▼───────▼──────▼───────▼──┐
         │            共享基础层                     │
         │  products.js  config.js  utils.js        │
         └──────────────────────────────────────────┘
                │
          ┌─────▼──────┐
          │ storage.js  │  ← 存档（仅被 gameLoop 调用）
          └─────────────┘
```

**依赖方向原则**：上层 → 下层，基础层不依赖任何业务模块。

| 层次 | 模块 | 职责 |
|------|------|------|
| 入口 | `index.js` | 启动，错误兜底 |
| 引擎 | `gameLoop.js` | 流程控制，串联所有模块 |
| 业务 | `shopState`, `transaction`, `customerGenerator`, `events` | 各自独立，互不调用 |
| 表现 | `uiRenderer.js`, `dialogue.js`, `input.js` | UI渲染 + 对话文本 + 用户输入 |
| 基础 | `products.js`, `config.js`, `utils.js` | 静态数据 + 常量 + 工具函数 |
| 持久 | `storage.js` | JSON 存档，仅与 gameLoop 交互 |

---

## 4. 核心数据流

### 4.1 每日营业主循环

```
┌─────────────────────────────────────────────────────────────────┐
│                        gameLoop.run()                           │
│                                                                 │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────┐         │
│   │ 主菜单   │───▶│  进货/休息   │───▶│  runDay()    │──┐     │
│   │showMain  │    │showRestock   │    │  每日营业    │  │     │
│   └──────────┘    └──────────────┘    └──────┬───────┘  │     │
│        ▲                                      │          │     │
│        │              ┌───────────────────────┘          │     │
│        │              ▼                                  │     │
│        │         生成当晚顾客 (3-8 人)                    │     │
│        │              │                                  │     │
│        │    ┌─────────▼──────────┐                       │     │
│        │    │  顾客接待循环      │                       │     │
│        │    │                    │                       │     │
│        │    │  前半段顾客 ──┐   │                       │     │
│        │    │              │   │                       │     │
│        │    │         ┌────▼────────────┐             │     │
│        │    │         │ 突发事件触发？   │             │     │
│        │    │         │ (40% 概率)      │             │     │
│        │    │         └────┬────────────┘             │     │
│        │    │              │                          │     │
│        │    │  后半段顾客 ◀┘                          │     │
│        │    │                    │                    │     │
│        │    └────────────────────┘                    │     │
│        │              │                               │     │
│        │         过期结算 processExpiry()              │     │
│        │              │                               │     │
│        │         日报表 + 自动存档                     │     │
│        │              │                               │     │
│        └──────────────┘     (游戏未结束则继续)         │     │
│                                                                 │
│   Game Over / 退出                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 单次交易流程

```
  顾客进场
      │
      ▼
  检查库存 ───缺货──▶ 拒绝交易，声誉 -1
      │
    有货
      │
      ▼
  玩家报价（标价 / 自定义 / 拒绝）
      │
      ├── 拒绝 ──▶ 顾客离开
      │
      ▼
  willCustomerWalkAway() ───要走──▶ 顾客离开
      │
    不走
      │
      ▼
  calculateCustomerAcceptance()
      │
      ├── 接受 ──▶ 交易成功，扣库存 + 加钱 + 加声誉
      │
      ▼
  processCounterOffer() ───到上限──▶ 顾客离开
      │
    还价
      │
      ▼
  玩家确认 ───接受──▶ 交易成功
      │
    拒绝
      │
      ▼
  回到玩家报价（或顾客离开）
```

---

## 5. 事件系统详解 ⚠

> 这是整个项目里逻辑最绕的部分，重点讲清楚。

### 5.1 事件触发时机

在 `gameLoop.runDay()` 的顾客接待循环中，**当接待完前半段顾客**（`i >= midPoint`）时，以 **40% 概率**尝试触发一个随机事件。每晚最多触发一次。

```
顾客 1  顾客 2  顾客 3  [事件?]  顾客 4  顾客 5  顾客 6
                 ↑ midPoint          ↑ 后半段继续
```

### 5.2 事件触发流程

```
gameLoop.runDay()
      │
      │  i >= midPoint && !eventTriggered
      ▼
 events.rollEventTrigger(day, 0.4)
      │
      ├── null (60% 概率不触发) ──▶ 继续接待顾客
      │
      └── event 对象 (40% 概率触发)
              │
              ▼
      gameLoop.handleEvent(event)     ← 此时 UI 切换到事件界面
              │
              ├── uiRenderer.printEventIntro()     ← 红色弹窗 + 氛围文案
              ├── uiRenderer.printEventChoices()   ← 列出 3 个选项
              │
              ▼  玩家选择
      events.resolveEventChoice(event, choiceId)
              │
              │  根据 choiceId 找到 choice
              │  对 choice.outcomes 做 weightedRandom 抽一个结局
              │
              ▼
      events.applyEventResult(state, result)
              │
              │  state.money += outcome.money  (带 Math.round)
              │  state.reputation += outcome.reputation (带 Math.round)
              │
              ▼
      uiRenderer.printEventResult()   ← 显示结局文案 + 💰⭐ 数值变化
              │
              ▼
      input.pause()  →  clearScreen + printShopStatus()  ← 关键：刷新 UI
              │
              ▼
      回到顾客接待循环（状态栏已刷新为事件后的新数值）
```

### 5.3 事件数据结构

每个事件长这样：

```javascript
{
  id: 'police_raid',          // 唯一标识
  name: '警察突击检查',        // 显示名称
  weight: 20,                 // 触发权重（越大越容易抽中）
  minDay: 2,                  // 最早触发天数（低天数不会出现）
  description: '...',         // 氛围描述（printEventIntro 会自动换行）
  choices: [                  // 3 个选项
    {
      id: 'cooperate',        // 选项标识
      text: '全力配合...',     // 选项显示文本
      outcomes: [             // 2-3 种加权随机结局
        {
          weight: 60,         // 结局权重
          money: 0,           // 金钱变化（正=赚，负=亏）
          reputation: 5,      // 声誉变化
          message: '...',     // 结局叙述文案
          log: '...'          // 简短日志（调试用）
        }
      ]
    }
  ]
}
```

### 5.4 现有 5 种事件

| 事件 ID | 名称 | minDay | 选项数 | 结局总数 | 氛围 |
|---------|------|--------|--------|---------|------|
| `police_raid` | 警察突击检查 | 2 | 3 | 7 | 紧张 |
| `power_outage` | 突然停电 | 1 | 3 | 8 | 悬疑 |
| `neighbor_visit` | 隔壁老板串门 | 3 | 3 | 9 | 人情 |
| `mysterious_warehouse` | 神秘人要进仓库 | 4 | 3 | 7 | 诡异 |
| `weird_knowck` | 门外的敲门声 | 2 | 3 | 6 | 惊悚 |

### 5.5 事件与主循环/UI 的协作关系

```
 ┌─────────────────────────────────────────────────────────┐
 │  gameLoop.js（主循环）                                    │
 │                                                          │
 │  runDay() ──▶ 顾客循环                                   │
 │       │              │                                   │
 │       │         midPoint 到达                             │
 │       │              │                                   │
 │       │    ┌─────────▼──────────┐                        │
 │       │    │  handleEvent()     │                        │
 │       │    │                    │                        │
 │       │    │  1. UI: 事件弹窗   │ ◀── uiRenderer.js     │
 │       │    │  2. Input: 选选项  │ ◀── input.js          │
 │       │    │  3. events: 解算   │ ◀── events.js         │
 │       │    │  4. shopState: 更新│ ◀── (via applyEvent)  │
 │       │    │  5. UI: 显示结果   │ ◀── uiRenderer.js     │
 │       │    │  6. 刷新状态栏     │ ──▶ clearScreen +     │
 │       │    │                    │     printShopStatus()  │
 │       │    └─────────┬──────────┘                        │
 │       │              │                                   │
 │       │    state 已更新（money/reputation 可能变了）      │
 │       │              │                                   │
 │       │         继续接待后半段顾客                         │
 │       │              │                                   │
 │       ▼              ▼                                   │
 │  过期结算 → 日报表 → 自动存档                              │
 └─────────────────────────────────────────────────────────┘
```

**关键点**：事件处理完后必须 `clearScreen + printShopStatus`，否则状态栏还显示事件前的旧数值。这个刷新在 `handleEvent()` 的末尾完成，同时在 `runDay()` 进入 `handleCustomer()` 前还有一次兜底刷新。

---

## 6. 存档系统

### 6.1 存档文件

位置：项目根目录下的 `save.json`（路径由 `config.js` 的 `CONFIG.SAVE_FILE` 定义）。

### 6.2 序列化流程（保存）

```
gameLoop 调用 saveGame(state)
      │
      ▼
storage.saveGame()
      │
      ├── normalizeState(state)    ← 关键！所有数值字段 Math.round()
      │       │
      │       ├── state.money = Math.round(state.money)
      │       ├── state.reputation = Math.round(state.reputation)
      │       ├── state.totalSales = Math.round(state.totalSales)
      │       ├── state.totalCustomers = Math.round(...)
      │       ├── state.happyCustomers = Math.round(...)
      │       ├── state.angryCustomers = Math.round(...)
      │       └── inventory 每个 item:
      │             ├── quantity = Math.round(quantity)
      │             └── expiryIn = Math.round(expiryIn)
      │
      ├── 构造 saveData = { savedAt: Date.now(), state: ... }
      │
      └── JSON.stringify(saveData, null, 2) → fs.writeFileSync
```

### 6.3 反序列化流程（读取）

```
gameLoop 调用 loadGame()
      │
      ▼
storage.loadGame()
      │
      ├── fs.readFileSync → JSON.parse(rawData)
      │
      ├── 校验 saveData.state 存在
      │
      ├── normalizeState(saveData.state)   ← 再次归一化，防止旧存档有脏数据
      │
      └── return { success: true, state, savedAt }
```

### 6.4 存档数据结构

```json
{
  "savedAt": 1719360000000,
  "state": {
    "day": 3,
    "money": 812,
    "reputation": 67,
    "totalSales": 1234,
    "totalCustomers": 20,
    "happyCustomers": 15,
    "angryCustomers": 3,
    "inventory": {
      "bento_a": { "quantity": 3, "expiryIn": 2 },
      "onigiri": { "quantity": 5, "expiryIn": 1 },
      "noodle":  { "quantity": 10, "expiryIn": 30 },
      "cola":    { "quantity": 12, "expiryIn": 60 },
      "...": "..."
    }
  }
}
```

### 6.5 精度防护体系

为防止 IEEE 754 浮点误差累积，设置了 **4 层防护**：

```
写入时        shopState.js    所有 money/reputation/totalSales 写入都带 Math.round()
              events.js       applyEventResult 中 money/reputation 写入带 Math.round()
存档时        storage.js      normalizeState() 全量 Math.round() 所有数值字段
读档时        storage.js      normalizeState() 再次执行，修正旧存档脏数据
```

所有金额、声誉、库存数量在整个生命周期中**始终为整数**。

---

## 7. 各模块详细说明

### `utils.js` — 共用工具

| 函数 | 说明 |
|------|------|
| `weightedRandom(items)` | 按权重随机选取，items 需有 `.weight` 字段 |
| `randomChoice(arr)` | 等概率随机选取 |

被 `customerGenerator.js`、`events.js`、`dialogue.js` 三个模块引用。

### `products.js` — 商品数据

- `CATEGORIES`：6 大类（食品/饮料/零食/日用品/烟酒/神秘商品）
- `PRODUCTS`：27 种商品的静态数组，每种含 `id/name/category/cost/price/shelfLife/description`
- `shelfLife = -1` 表示冷冻/永久保质（如冰淇淋）
- 查询函数：`getProductById`、`getProductsByCategory`、`getRandomProducts`

### `config.js` — 游戏配置

- `CONFIG`：游戏常量（初始资金 500、初始声誉 50、每晚顾客 3-8 人、还价上限 3 次等）
- `MOODS`：8 种心情状态
- `CUSTOMER_TYPES`：9 种顾客类型（加权 + 心情偏好）
- `CUSTOMER_NAMES`：20 个顾客称呼
- `CUSTOMER_GREETINGS`：8 种心情 × 3 条开场白

### `customerGenerator.js` — 顾客生成

| 函数 | 说明 |
|------|------|
| `generateCustomer()` | 生成一个完整顾客对象（类型→心情→需求→预算→砍价风格） |
| `generateCustomersForNight(min, max)` | 批量生成 [min, max] 个顾客 |

顾客生成链：`类型(加权) → 心情(偏好) → 需求商品(按心情过滤) → 预算(按心情浮动) → 砍价风格(按心情映射)`

### `shopState.js` — 商店状态

| 函数 | 说明 |
|------|------|
| `createInitialState()` | 创建初始状态（¥500 / 声誉50 / 20种商品初始库存） |
| `hasStock(state, pid, qty)` | 检查库存是否足够 |
| `reduceStock(state, pid, qty)` | 扣减库存 |
| `addStock(state, pid, qty)` | 增加库存 |
| `restockProduct(state, pid, qty)` | 进货（扣钱+加库存） |
| `processExpiry(state)` | 过期结算（保质期-1，过期则损耗30%数量） |
| `addMoney(state, amount)` | 加钱（带 Math.round） |
| `addReputation(state, amount)` | 加声誉（带 Math.round，clamp 0-100） |
| `isGameOver(state)` | 判断破产(¥0)或声誉崩盘(≤10) |
| `getInventoryValue(state)` | 计算库存总成本 |

### `transaction.js` — 交易计算

| 函数 | 说明 |
|------|------|
| `calculateBasePrice(items)` | 按标价计算总价 |
| `calculateCost(items)` | 按进价计算总成本 |
| `calculateCustomerAcceptance(customer, price)` | 计算顾客接受概率 (0-1) |
| `processCounterOffer(customer, offer)` | 顾客还价（最多3轮，按砍价风格打折） |
| `willCustomerWalkAway(customer, offer)` | 顾客是否直接走人 |

**纯计算模块**，不含任何对话文本。对话在 `dialogue.js`。

### `dialogue.js` — 对话文本

- `CUSTOMER_RESPONSES`：4 类（accept/reject/counter/walkAway）× 8 心情 = 96 条对话
- `getCustomerResponse(customer, accepted, walkedAway, counterOffer)`：根据交易状态和心情选一句

### `events.js` — 突发事件

| 函数 | 说明 |
|------|------|
| `getAvailableEvents(day)` | 筛选当天可触发的事件（day >= minDay） |
| `generateRandomEvent(day)` | 从可用事件中加权随机选一个 |
| `rollEventTrigger(day, prob)` | 概率触发（prob 默认 0.35） |
| `resolveEventChoice(event, choiceId)` | 选了某个选项后，加权抽结局 |
| `applyEventResult(state, result)` | 把结局的 money/reputation 应用到 state（带 Math.round） |

### `uiRenderer.js` — UI 渲染

所有函数只做 `console.log(chalk.xxx(...))`，不读输入、不改状态。

| 函数 | 用途 |
|------|------|
| `clearScreen()` | console.clear() |
| `printTitle()` | 游戏标题 |
| `printShopStatus(state)` | 状态栏（天数/资金/声誉/库存价值） |
| `printCustomer(customer)` | 顾客信息（名字/类型/心情/开场白） |
| `printWantedItems(customer, state)` | 顾客需求 + 库存状态 |
| `printOfferInfo(base, cost, budget)` | 价格参考 |
| `printMenu(options)` | 通用选项列表 |
| `printEventIntro(event)` | 事件红色弹窗 + 氛围描述 |
| `printEventChoices(event)` | 事件选项列表 |
| `printEventResult(result)` | 事件结局 + 💰⭐ 数值变化 |
| `printDayEndReport(state, stats)` | 每日报告 |
| `printGameOver(state)` | 游戏结束画面 |
| `printInventory(state)` | 库存详情 |

### `input.js` — 统一输入层

| 方法 | 说明 |
|------|------|
| `question(prompt)` | 基础问答，返回 trim 后的字符串 |
| `pause(hint?)` | 按回车继续（默认"按回车键继续..."） |
| `confirm(msg, defaultYes?)` | y/N 确认 |
| `chooseNumber(min, max, prompt?)` | 数字范围选择，无效返回 null |
| `inputNumber(prompt)` | 非负整数输入，无效返回 null |
| `close()` | 关闭 readline |

### `storage.js` — 存档

| 函数 | 说明 |
|------|------|
| `saveGame(state)` | normalizeState → JSON.stringify → writeFileSync |
| `loadGame()` | readFileSync → JSON.parse → normalizeState → return |
| `hasSaveFile()` | 检查存档文件是否存在 |
| `deleteSave()` | 删除存档文件 |

`normalizeState()` 是核心防护函数：对所有数值字段做 `Math.round()`，防止浮点精度污染。

---

## 8. 新手指南：我要改东西该看哪个文件？

### 想加一个新事件？

1. 打开 **`events.js`**
2. 在 `EVENTS` 数组里追加一个事件对象，结构参照现有事件：

```javascript
{
  id: 'my_new_event',
  name: '新事件名称',
  weight: 15,          // 触发权重
  minDay: 2,           // 最早第几天出现
  description: '...',  // 氛围描述
  choices: [
    {
      id: 'choice_a',
      text: '选项描述',
      outcomes: [
        { weight: 50, money: -30, reputation: 5, message: '结局描述', log: '调试日志' }
      ]
    }
  ]
}
```

3. 不需要改其他文件，事件系统会自动识别新增事件

### 想调整商品数据？

1. 打开 **`products.js`**
2. 在 `PRODUCTS` 数组里增删改商品，每个商品结构：

```javascript
{ id: 'xxx', name: '名称', category: CATEGORIES.FOOD, cost: 8, price: 15, shelfLife: 2, description: '描述' }
```

3. 如果要新增分类，在 `CATEGORIES` 对象里加一个键值对
4. 初始库存需要在 **`shopState.js`** 的 `initialStock` 数组里同步添加

### 想调整库存/过期逻辑？

打开 **`shopState.js`**：
- 进货逻辑 → `restockProduct()`
- 过期结算 → `processExpiry()`（`CONFIG.EXPIRY_DAMAGE_RATIO` 控制损耗比例）
- 库存扣减 → `reduceStock()`

过期相关常量在 **`config.js`**：
- `EXPIRY_DAMAGE_RATIO`：过期时损耗的比例（默认 0.3 = 30%）

### 想调整顾客生成规则？

打开 **`customerGenerator.js`**：
- 心情→商品偏好 → `generateWantedProducts()`
- 心情→预算浮动 → `generateBudget()`
- 心情→砍价风格 → `generateBargainStyle()`

顾客类型/名字/语录在 **`config.js`**。

### 想调整讨价还价参数？

打开 **`transaction.js`**：
- 顾客接受度 → `calculateCustomerAcceptance()`
- 顾客还价 → `processCounterOffer()`
- 顾客离开概率 → `willCustomerWalkAway()`

相关常量在 **`config.js`**：
- `BARGAIN_ATTEMPTS`：最多还价轮数（默认 3）
- `BARGAIN_MIN_RATIO` / `BARGAIN_MAX_RATIO`：还价浮动范围

### 想改 UI 样式或颜色？

打开 **`uiRenderer.js`**，所有 `chalk.xxx` 调用都在这里。

### 想改事件触发概率？

在 **`gameLoop.js`** 的 `runDay()` 中找到 `rollEventTrigger(this.state.day, 0.4)`，第二个参数就是概率（0.4 = 40%）。

---

## 9. 顾客对象结构参考

```javascript
{
  id: 1719360000123.456,     // 唯一 ID
  type: 'office_worker',     // 顾客类型 ID
  typeName: '加班族',        // 顾客类型显示名
  name: '疲惫的打工人',      // 随机称呼
  mood: 'tired',             // 心情状态
  wantedItems: [             // 想买的商品列表
    { productId: 'cola', quantity: 2 },
    { productId: 'bento_a', quantity: 1 }
  ],
  budget: 45,                // 预算上限
  bargainStyle: 'weak',      // 砍价风格
  greeting: '唉...有什么提神的吗？',  // 开场白
  currentOffer: null,        // 当前报价（还价过程中更新）
  bargainAttempts: 0         // 已还价次数
}
```

## 10. 商店状态结构参考

```javascript
{
  day: 1,                    // 营业天数
  money: 500,                // 当前资金（整数）
  reputation: 50,            // 当前声誉 0-100（整数）
  inventory: {               // 库存
    'bento_a': { quantity: 5, expiryIn: 2 },
    'cola':    { quantity: 15, expiryIn: 60 },
    // ...
  },
  totalSales: 0,             // 累计销售额（整数）
  totalCustomers: 0,         // 累计接待顾客数
  happyCustomers: 0,         // 满意顾客数
  angryCustomers: 0          // 流失顾客数
}
```

## 11. 商品对象结构参考

```javascript
{
  id: 'cola',                // 唯一标识
  name: '可乐',              // 显示名称
  category: '饮料',          // 分类
  cost: 3,                   // 进价
  price: 6,                  // 售价
  shelfLife: 60,             // 保质期（天），-1=永久/冷冻
  description: '冰爽碳酸饮料' // 描述
}
```
