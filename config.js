const path = require('path');

const CONFIG = {
  SAVE_FILE: path.join(__dirname, 'save.json'),

  INITIAL_MONEY: 500,
  INITIAL_REPUTATION: 50,
  INITIAL_DAY: 1,

  MIN_CUSTOMERS_PER_NIGHT: 3,
  MAX_CUSTOMERS_PER_NIGHT: 8,

  RESTOCK_COST_MULTIPLIER: 1.0,
  EXPIRY_DAMAGE_RATIO: 0.3,

  BARGAIN_ATTEMPTS: 3,
  BARGAIN_MIN_RATIO: 0.7,
  BARGAIN_MAX_RATIO: 1.3,

  REPUTATION_PER_GOOD_SALE: 2,
  REPUTATION_PER_BAD_SALE: -3,
  REPUTATION_PER_REFUSE: -1,

  MONEY_GAME_OVER: 0,
  REPUTATION_GAME_OVER: 10,

  MAX_BARGAIN_PRICE_RATIO: 1.5,
  MIN_BARGAIN_PRICE_RATIO: 0.5
};

const MOODS = [
  'happy',
  'neutral',
  'tired',
  'angry',
  'mysterious',
  'sad',
  'excited',
  'drunk'
];

const CUSTOMER_TYPES = [
  { type: 'office_worker', name: '加班族', weight: 20, moodBias: ['tired', 'neutral'] },
  { type: 'student', name: '学生党', weight: 15, moodBias: ['happy', 'tired'] },
  { type: 'drunkard', name: '醉汉', weight: 10, moodBias: ['drunk', 'happy', 'angry'] },
  { type: 'couple', name: '情侣', weight: 12, moodBias: ['happy', 'excited'] },
  { type: 'night_shift', name: '夜班族', weight: 15, moodBias: ['tired', 'neutral', 'sad'] },
  { type: 'hooligan', name: '小混混', weight: 8, moodBias: ['angry', 'mysterious'] },
  { type: 'mysterious', name: '神秘人', weight: 5, moodBias: ['mysterious'] },
  { type: 'old_man', name: '老人', weight: 8, moodBias: ['sad', 'neutral', 'happy'] },
  { type: 'taxi_driver', name: '出租车司机', weight: 7, moodBias: ['tired', 'neutral'] }
];

const CUSTOMER_NAMES = [
  '疲惫的打工人', '迷茫的少年', '戴帽子的男人', '穿风衣的女人',
  '熬夜的程序员', '醉酒的大叔', '哭泣的女孩', '沉默的老人',
  '穿校服的学生', '戴墨镜的神秘人', '提着公文包的白领',
  '牵着狗的女士', '骑自行车的小哥', '穿拖鞋的宅男',
  '浓妆艳抹的女人', '文身的壮汉', '戴眼镜的书生',
  '提着行李箱的旅客', '拿着吉他的歌手', '穿睡衣的邻居'
];

const CUSTOMER_GREETINGS = {
  happy: [
    '老板好啊！今晚有什么好东西吗？',
    '嘿，生意不错吧？给我推荐点好吃的！',
    '晚上好！我想买点东西庆祝一下~'
  ],
  neutral: [
    '老板，随便看看。',
    '嗯，我看看有什么...',
    '有什么可以推荐的吗？'
  ],
  tired: [
    '唉...有什么提神的吗？',
    '累死了，给我来点能恢复元气的...',
    '加班到现在，好饿啊...'
  ],
  angry: [
    '快点！我赶时间！',
    '你们这最贵的是什么？！',
    '上次在你们这买的东西有问题！'
  ],
  mysterious: [
    '...我在找一样东西。',
    '你这里...有不寻常的东西吗？',
    '老板，你相信命运吗？'
  ],
  sad: [
    '有没有...能让人开心一点的东西？',
    '随便什么都行，打发时间吧...',
    '...一个人。'
  ],
  excited: [
    '哇！这家店看起来不错！',
    '听说你们这里什么都有？',
    '今晚我请客！有什么好货？'
  ],
  drunk: [
    '嗝...老板，再、再来点喝的！',
    '嘿嘿嘿...小姐~哦不，老板！',
    '我没醉！我...我还能喝！'
  ]
};

module.exports = {
  CONFIG,
  MOODS,
  CUSTOMER_TYPES,
  CUSTOMER_NAMES,
  CUSTOMER_GREETINGS
};
