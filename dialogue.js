const { randomChoice } = require('./utils');

const CUSTOMER_RESPONSES = {
  accept: {
    happy: ['成交！老板真爽快！', '好嘞！就这么定了！', '老板会做生意！'],
    neutral: ['嗯，这个价格还行。', '可以，就这个价吧。', '行吧。'],
    tired: ['好吧...就这样吧...', '成交，我太累了不想说了。', '嗯...'],
    angry: ['哼！算你走运！', '勉强接受！', '快点给我装起来！'],
    mysterious: ['...有意思。', '你是个聪明人。', '成交。'],
    sad: ['...好。', '嗯，谢谢。', '可以。'],
    excited: ['太棒了！太好了！', '老板真给力！', '爱死这家店了！'],
    drunk: ['嗝~成交！老板我跟你说...', '好说好说！嘿嘿~', '老板够意思！']
  },
  reject: {
    happy: ['哎呀，太贵了，我再看看...', '这个价超出我预算啦~', '老板能不能再便宜点？'],
    neutral: ['价格不太合适。', '再考虑考虑。', '有点贵。'],
    tired: ['唉，还是算了吧...', '太贵了，走吧...', '...没带够钱。'],
    angry: ['什么？！这是抢钱吗？！', '你当我冤大头？！', '太黑了！我要投诉！'],
    mysterious: ['...这个价格不合理。', '看来你不够有诚意。', '再见。'],
    sad: ['...还是算了。', '我买不起...', '...我走了。'],
    excited: ['哦~这有点贵啊老板。', '能不能再便宜一点点？', '哎呀~便宜点嘛~'],
    drunk: ['什...什么？你再说一遍？！', '嗝~贵了！再便宜！', '我...我没喝多！便宜点！']
  },
  counter: {
    happy: ['给你这个价怎么样？', '我最多出这么多，老板看行不？', '再优惠点啦~'],
    neutral: ['这个价我可以接受。', '我出这么多。', '再降点吧。'],
    tired: ['唉...我只能出这么多了。', '就这点钱，行不行吧。', '实在没预算了...'],
    angry: ['我就出这么多！不卖拉倒！', '这个价已经够高了！', '别废话，就这价！'],
    mysterious: ['...这个价格怎么样？', '我的底线。', '考虑一下。'],
    sad: ['...我只有这么多。', '能便宜点吗...', '就这些了...'],
    excited: ['这个价卖不卖？我很有诚意的！', '再给点优惠嘛！', '老板~便宜一点点好不好~'],
    drunk: ['我出...嗝...这么多！卖不卖？！', '就这价！行不行给个痛快话！', '再贵我...我就去别家了啊！']
  },
  walkAway: {
    happy: ['算了，下次再来吧~', '没谈拢，走啦~', '老板下次给我优惠点啊~'],
    neutral: ['下次再说吧。', '先走了。', '看看别的。'],
    tired: ['算了算了，懒得说了...', '唉，回家吧...', '...走了。'],
    angry: ['什么破店！再也不来了！', '你会后悔的！', '气死我了！'],
    mysterious: ['...下次再见。', '我们还会见面的。', '再见。'],
    sad: ['...打扰了。', '...我走了。', '下次吧。'],
    excited: ['太可惜了！下次再来！', '好啦好啦，我去别家看看！', '哼，不给面子！'],
    drunk: ['走...走了！嗝~', '下次...下次我带朋友来！', '老板你...你不够意思！']
  }
};

function getCustomerResponse(customer, accepted, walkedAway, counterOffer) {
  let category;
  if (walkedAway) {
    category = 'walkAway';
  } else if (accepted) {
    category = 'accept';
  } else if (counterOffer !== null && counterOffer !== undefined) {
    category = 'counter';
  } else {
    category = 'reject';
  }

  const list = CUSTOMER_RESPONSES[category][customer.mood] || CUSTOMER_RESPONSES[category].neutral;
  return randomChoice(list);
}

module.exports = {
  CUSTOMER_RESPONSES,
  getCustomerResponse
};
