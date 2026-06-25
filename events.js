const { randomChoice } = require('./customerGenerator');

const EVENTS = [
  {
    id: 'police_raid',
    name: '警察突击检查',
    weight: 20,
    minDay: 2,
    description: '门外突然传来刺耳的警笛声，两辆警车急停在便利店门口。几个穿制服的警察走了进来，为首的那位亮出证件：「例行检查，请配合。」',
    choices: [
      {
        id: 'cooperate',
        text: '全力配合，主动把柜台烟酒全部摆出来',
        outcomes: [
          { weight: 60, money: 0, reputation: 5, message: '警察翻了一圈，没发现什么问题。临走时领头的拍了拍你肩膀：「守法经营，很好。」', log: '警察检查通过，声誉提升' },
          { weight: 30, money: -50, reputation: -5, message: '警察在货架角落发现几包没登记的香烟。「这个得带走，罚款交一下。」', log: '被查出违规香烟，罚款 ¥50' },
          { weight: 10, money: -200, reputation: -15, message: '警察从仓库里搜出了一些来路不明的烟酒...「麻烦跟我们走一趟吧。」', log: '查出严重违规，罚款 ¥200，声誉大跌' }
        ]
      },
      {
        id: 'bribe',
        text: '悄悄塞点钱过去，希望能通融一下',
        outcomes: [
          { weight: 40, money: -100, reputation: 0, message: '领头的警察不动声色地把钱收下，挥挥手让手下撤了。「下次注意点。」', log: '贿赂成功，花费 ¥100' },
          { weight: 60, money: -300, reputation: -20, message: '「你这是什么意思？！」警察勃然大怒，不仅没收了钱，还把这事记在了小本本上。', log: '贿赂失败，罚款 ¥300，声誉大跌' }
        ]
      },
      {
        id: 'stall',
        text: '借口去后面锁仓库，拖延时间',
        outcomes: [
          { weight: 30, money: 0, reputation: -3, message: '你磨磨蹭蹭半天，警察不耐烦地走了。但他们看你的眼神不太对。', log: '拖延成功，声誉微降' },
          { weight: 70, money: -150, reputation: -10, message: '「你在里面干什么？出来！」警察强行搜查，发现你正在转移一些东西...', log: '拖延失败，被重罚 ¥150' }
        ]
      }
    ]
  },
  {
    id: 'power_outage',
    name: '突然停电',
    weight: 25,
    minDay: 1,
    description: '「咔哒」一声，店内所有灯光瞬间熄灭。冰柜的嗡鸣声也戛然而止。窗外月光惨淡，整条街陷入一片漆黑。你听到货架后面似乎有什么动静...',
    choices: [
      {
        id: 'flashlight',
        text: '找手电筒，先去检查冰柜',
        outcomes: [
          { weight: 50, money: -80, reputation: 0, message: '你翻出备用手电筒，冲到冰柜前。可惜还是晚了一步——冰淇淋全化了，冷冻食品也得扔。', log: '冰柜食品损坏，损失 ¥80' },
          { weight: 30, money: -30, reputation: 0, message: '你反应够快，大部分冷冻食品保住了，但还是有些冰淇淋化了。', log: '部分食品损坏，损失 ¥30' },
          { weight: 20, money: 0, reputation: 3, message: '你手疾眼快插上了备用发电机！冰柜安然无恙。这时你发现门口站着一个黑影...等等，人呢？', log: '启动备用电源，保住了库存' }
        ]
      },
      {
        id: 'investigate',
        text: '先去看看货架后面是什么声音',
        outcomes: [
          { weight: 40, money: -50, reputation: -5, message: '你摸到货架后面，一只野猫「喵」地窜出来，把你吓得碰倒了一排商品。等回过神来，冰柜里的东西也快化完了。', log: '惊吓中碰倒商品，损失 ¥50' },
          { weight: 30, money: -20, reputation: -2, message: '什么也没找到。但冰柜食品已经开始软化了...', log: '虚惊一场，但仍有损失 ¥20' },
          { weight: 30, money: 100, reputation: -10, message: '你在角落发现一个被遗弃的黑色布袋，里面装着一沓现金...你把它收了起来。总觉得哪里不对劲。', log: '捡到神秘现金 ¥100，但心里不安' }
        ]
      },
      {
        id: 'wait',
        text: '站在柜台后面不动，等电自己来',
        outcomes: [
          { weight: 70, money: -120, reputation: -5, message: '你在黑暗中站了足足十分钟。电来了，但冰柜里的东西全坏了，门口还少了几包零食——刚才有人趁黑摸进来了。', log: '损失惨重，共 ¥120' },
          { weight: 30, money: -60, reputation: 0, message: '五分钟后来电了。冰柜里的冰淇淋化了一半，其他还好。', log: '部分食品损坏，损失 ¥60' }
        ]
      }
    ]
  },
  {
    id: 'neighbor_visit',
    name: '隔壁老板深夜串门',
    weight: 20,
    minDay: 3,
    description: '玻璃门被推开，进来的是隔壁音像店的王老板。他穿着皱巴巴的睡衣，脸色发白，手里攥着一个皱巴巴的纸包。「老弟...你得帮帮我。」',
    choices: [
      {
        id: 'help',
        text: '先让他进来，问清楚怎么回事',
        outcomes: [
          { weight: 35, money: 0, reputation: 5, message: '王老板说他老婆半夜突然发病，你借给他二百块钱打车去医院。一周后他不仅还了钱，还到处跟人说你仗义。', log: '帮助邻居，声誉提升' },
          { weight: 35, money: -200, reputation: 0, message: '他说欠了高利贷，今晚再不还就要被砍手。你心软借了他两百。他千恩万谢地走了——你再也没见过他。', log: '借出钱款 ¥200，有去无回' },
          { weight: 30, money: 50, reputation: -8, message: '他从纸包里掏出几袋白色粉末，要你帮忙在店里代售，利润五五分成。你犹豫了一下还是答应了。这天晚上你赚了五十块，但总觉得有双眼睛在盯着你。', log: '帮卖违禁品，赚 ¥50，声誉下降' }
        ]
      },
      {
        id: 'refuse',
        text: '「不好意思，我要打烊了」，把他拒之门外',
        outcomes: [
          { weight: 50, money: 0, reputation: -5, message: '「你...」王老板脸色惨白，失魂落魄地走了。第二天你听说他半夜在江边被人发现...你心里有些不是滋味。', log: '拒绝帮助，邻居出事，声誉下降' },
          { weight: 30, money: 0, reputation: 3, message: '你拒绝了他。后来才知道他欠了赌债想拉你下水。没卷进去真是万幸。', log: '明智拒绝，躲过一劫' },
          { weight: 20, money: -100, reputation: -3, message: '你刚把他推出去，他就一头栽倒在人行道上——你不得不打急救电话，还垫付了一百多的救护车费。', log: '被迫垫付医药费 ¥100' }
        ]
      },
      {
        id: 'call_police',
        text: '感觉不对劲，悄悄报警',
        outcomes: [
          { weight: 40, money: 0, reputation: 8, message: '警察来了之后才知道，王老板被人追债走投无路，本想在你店里...幸好你报警及时。街坊邻居都夸你机警。', log: '及时报警，化险为夷，声誉提升' },
          { weight: 30, money: -50, reputation: -5, message: '警察来了，什么事都没发生。王老板只是喝多了想找人聊天。你白忙活一场，还被街坊说小题大做。', log: '虚惊一场，声誉下降' },
          { weight: 30, money: 200, reputation: 2, message: '警察来了，当场从王老板包里搜出了毒品。因为你举报有功，警方给了你两百块奖金。', log: '举报成功，获得奖金 ¥200' }
        ]
      }
    ]
  },
  {
    id: 'mysterious_warehouse',
    name: '神秘人要进仓库',
    weight: 15,
    minDay: 4,
    description: '一个穿黑色风衣的男人站在柜台前，脸色阴沉得像外面的夜色。他盯着你看了很久，低声说：「我要进去看看后面的仓库。」你不记得店里有后门...仓库里也没什么特别的东西——至少你是这么认为的。',
    choices: [
      {
        id: 'allow',
        text: '「...请便」，给他打开仓库门',
        outcomes: [
          { weight: 25, money: 0, reputation: -10, message: '他在仓库里待了很久。你听见翻动纸箱的声音。出来时他什么也没说，径直走了。第二天你发现仓库最里面多了一个你从没见过的旧箱子。', log: '神秘人进入仓库，留下奇怪的箱子' },
          { weight: 35, money: 300, reputation: 0, message: '他在仓库角落翻出一个落满灰尘的铁盒，打开看了一眼，长出一口气。「谢谢你，这个对我很重要。」他留下三百块钱，消失在夜色中。', log: '神秘人取走物品，留下 ¥300' },
          { weight: 40, money: -100, reputation: -15, message: '他出来时脸色铁青：「东西...不见了。你动过？」你还没来得及解释，他就把你的柜台扫空了一排。「你会后悔的。」', log: '神秘人发怒，损失 ¥100' }
        ]
      },
      {
        id: 'refuse',
        text: '「仓库不对外人开放」，坚决拒绝',
        outcomes: [
          { weight: 40, money: 0, reputation: 3, message: '他冷冷地看了你一眼，没再说什么就走了。你锁好仓库门，总觉得后颈发凉。不过...至少什么也没发生。', log: '拒绝神秘人，安然无恙' },
          { weight: 35, money: -80, reputation: -5, message: '第二天早上开门时，你发现玻璃门被砸了一个洞，收银台里的零钱被翻得乱七八糟。地上留着一张纸条：「早让你开门不就没事了。」', log: '被人报复，损失 ¥80' },
          { weight: 25, money: 100, reputation: 5, message: '他走后你越想越不对劲，去仓库检查了一遍——在旧货架后面发现一个落满灰尘的信封，里面装着一百块钱和一张泛黄的照片。你把钱收了起来。', log: '发现旧信封，获得 ¥100' }
        ]
      },
      {
        id: 'ask',
        text: '「你先告诉我，你要找什么？」',
        outcomes: [
          { weight: 30, money: 500, reputation: 0, message: '他沉默了很久，终于开口：「一个音乐盒，蓝色的。」你想起来上周整理仓库时确实见过，便拿出来给了他。他颤抖着接过，塞给你五百块，头也不回地走了。', log: '找到音乐盒，获得 ¥500' },
          { weight: 40, money: 0, reputation: -3, message: '「你不该问的。」他转身就走。那天晚上你总觉得有人在窗外盯着你。', log: '问了不该问的，心里不安' },
          { weight: 30, money: -200, reputation: -8, message: '他突然变得激动：「你把它藏哪了？！」他掀翻了一排货架，临走前还踹碎了收银机的显示屏。维修花了你两百块。', log: '惹怒神秘人，损失 ¥200' }
        ]
      }
    ]
  },
  {
    id: 'weird_knowck',
    name: '门外的敲门声',
    weight: 20,
    minDay: 2,
    description: '「咚、咚、咚...」玻璃门传来三下缓慢的敲门声。你抬头望去——外面一个人都没有。街道空荡荡的，路灯昏黄。几秒后，又响起了三下，比刚才更轻了些。',
    choices: [
      {
        id: 'open_door',
        text: '走出去看看是谁',
        outcomes: [
          { weight: 30, money: 0, reputation: -5, message: '你推开门，冷风灌了进来。街道上空无一人。脚下却多了一个湿漉漉的纸箱，里面是一个旧娃娃，眼睛直直地盯着你。你连忙把它扔了。这天晚上你总做噩梦。', log: '捡到诡异娃娃，心神不宁' },
          { weight: 40, money: 150, reputation: 0, message: '门口台阶上放着一个信封，里面装着一百五十块钱和一张纸条：「谢谢你那天借我的伞。」你不记得借过谁伞。', log: '收到神秘感谢金 ¥150' },
          { weight: 30, money: -60, reputation: 0, message: '你刚迈出门，就被两个黑影拽进了旁边的小巷子...「破财消灾，破财消灾。」你被抢了六十块，幸好人没事。', log: '出门被抢，损失 ¥60' }
        ]
      },
      {
        id: 'ignore',
        text: '假装没听见，低头整理货架',
        outcomes: [
          { weight: 50, money: 0, reputation: 0, message: '敲门声持续了一会儿就停了。你再抬头时，门口的路灯闪了三下，然后恢复了正常。', log: '无事发生' },
          { weight: 30, money: 0, reputation: -3, message: '敲门声越来越急，最后「砰」的一声巨响——你吓得手一抖，打碎了一排陈列的酒瓶。', log: '被吓打碎酒，声誉微降' },
          { weight: 20, money: 0, reputation: 5, message: '第二天早上开门时，门口放着一小篮水果，压着一张纸条：「好人有好报。」街坊说昨晚有个醉汉在你门口躺了一夜，别的店都没管。', log: '无意中帮了人，声誉提升' }
        ]
      },
      {
        id: 'shout',
        text: '对着门口大喊「谁啊？」',
        outcomes: [
          { weight: 25, money: 0, reputation: -2, message: '「...」没有回应。但你发誓听到了一声极轻的笑声，从柜台底下传来的。', log: '诡异笑声，心里发毛' },
          { weight: 40, money: 0, reputation: 0, message: '远处传来一阵脚步声，越走越远。什么事也没有。', log: '声音远去，虚惊一场' },
          { weight: 35, money: 80, reputation: 2, message: '「哎呀，是我啦！」街角走来一个穿睡衣的老太太，说自己忘带钥匙，儿子又不在家。你陪她等了半小时开锁师傅，她硬塞给你八十块辛苦费。', log: '帮助老人，获得 ¥80' }
        ]
      }
    ]
  }
];

function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

function getAvailableEvents(day) {
  return EVENTS.filter(e => day >= e.minDay);
}

function generateRandomEvent(day) {
  const available = getAvailableEvents(day);
  if (available.length === 0) return null;
  return weightedRandom(available);
}

function rollEventTrigger(day, probability = 0.35) {
  if (Math.random() < probability) {
    return generateRandomEvent(day);
  }
  return null;
}

function resolveEventChoice(event, choiceId) {
  const choice = event.choices.find(c => c.id === choiceId);
  if (!choice) return null;
  const outcome = weightedRandom(choice.outcomes);
  return {
    event: event,
    choice: choice,
    outcome: outcome
  };
}

function applyEventResult(state, result) {
  if (result.outcome.money !== 0) {
    state.money = Math.max(0, state.money + result.outcome.money);
  }
  if (result.outcome.reputation !== 0) {
    state.reputation = Math.max(0, Math.min(100, state.reputation + result.outcome.reputation));
  }
}

module.exports = {
  EVENTS,
  generateRandomEvent,
  rollEventTrigger,
  resolveEventChoice,
  applyEventResult,
  getAvailableEvents
};
