export type GuideSource = {
  label: string;
  url: string;
};

export type GuideCard = {
  id: string;
  section: GuideSectionId;
  title: string;
  summary: string;
  steps: string[];
  time: string;
  tip: string;
  freshness: "长期有效" | "开学季核验" | "请实时查询";
  actionLabel: string;
  actionUrl: string;
  source: GuideSource;
  keywords: string[];
};

export type GuideSectionId =
  | "arrival"
  | "campus"
  | "nearby"
  | "daily"
  | "emergency"
  | "saved";

export const guideSections: Array<{
  id: GuideSectionId;
  index: string;
  title: string;
  eyebrow: string;
  description: string;
}> = [
  {
    id: "arrival",
    index: "01",
    title: "落地通勤",
    eyebrow: "ARRIVE & MOVE",
    description: "从广州落地，到同济四平路校区的每一个分岔口。",
  },
  {
    id: "nearby",
    index: "02",
    title: "学校周边",
    eyebrow: "AROUND TONGJI",
    description: "把同济大学站、校门和五角场先变成熟悉的地名。",
  },
  {
    id: "daily",
    index: "03",
    title: "上海日常",
    eyebrow: "CITY LIFE",
    description: "交通、支付、快递、买药与这座城市的日常节奏。",
  },
  {
    id: "emergency",
    index: "04",
    title: "紧急求助",
    eyebrow: "JUST IN CASE",
    description: "先让人安心，再处理那些不在计划里的时刻。",
  },
  {
    id: "saved",
    index: "05",
    title: "我的常用",
    eyebrow: "MY SHORTCUTS",
    description: "把真正用得上的路线、清单和小备注留在这里。",
  },
  {
    id: "campus",
    index: "06",
    title: "校园办事",
    eyebrow: "ON CAMPUS",
    description: "迎新、校园网、校园卡和所有需要慢慢办好的事。",
  },
];

export const guideCards: GuideCard[] = [
  {
    id: "hongqiao-to-tongji",
    section: "arrival",
    title: "虹桥落地后，先到同济大学站",
    summary: "白天优先坐地铁 10 号线；抵达时间很晚或带很多行李，再考虑网约车。",
    steps: [
      "确认自己在虹桥机场 1 号或 2 号航站楼，再跟随“地铁 10 号线”指示。",
      "乘坐开往市区方向的 10 号线，在“同济大学站”下车。",
      "从 5 号口出站，先复制“四平路 1239 号”，再按当日迎新安排进校。",
    ],
    time: "约 50–70 分钟；末班与拥挤情况请当日确认",
    tip: "如果已经很晚、手机电量低或行李难以换乘，不要勉强赶末班；先在官方机场交通页确认夜间方案。",
    freshness: "请实时查询",
    actionLabel: "查看机场交通",
    actionUrl: "https://www.shanghaiairport.com/dmjt/index.html",
    source: { label: "上海机场 · 地面交通", url: "https://www.shanghaiairport.com/dmjt/index.html" },
    keywords: ["虹桥", "t1", "t2", "机场", "地铁", "同济", "落地", "广州"],
  },
  {
    id: "pudong-to-tongji",
    section: "arrival",
    title: "浦东落地后，给自己留足换乘时间",
    summary: "浦东距离更远。白天地铁可行，晚到或疲惫时优先把“安全抵达”排在省钱前面。",
    steps: [
      "先在到达层确认航站楼、行李和电量；不急着在拥挤处决定路线。",
      "白天可按校方公开路线乘 2 号线至南京东路，换乘 10 号线到同济大学站。",
      "若地铁已临近末班、身体不舒服或行李多，改用机场官方夜间交通或网约车，并把终点设为校方通知的报到点。",
    ],
    time: "公共交通通常约 90 分钟以上；夜间请额外预留时间",
    tip: "不要只看航班落地时间：下机、取行李、走到交通层都会占用时间。",
    freshness: "请实时查询",
    actionLabel: "查看浦东机场交通",
    actionUrl: "https://www.shanghaiairport.com/dmjt/index.html",
    source: { label: "同济大学 · 四平路校区交通说明", url: "https://xxgk.tongji.edu.cn/index.php?classid=3083&newsid=6836&t=show" },
    keywords: ["浦东", "pvg", "2号线", "换乘", "机场", "同济", "落地"],
  },
  {
    id: "first-night",
    section: "arrival",
    title: "第一晚只完成最小闭环",
    summary: "进校、能充电、能洗漱、能睡觉，就已经是很好的第一天。",
    steps: [
      "证件、手机、充电宝、银行卡放在最容易拿到的小包里。",
      "到校后先确认宿舍与门禁，再处理行李；不要一口气采购所有东西。",
      "只补齐当晚必要物品：水、纸巾、洗漱、拖鞋、充电线和一点吃的。",
    ],
    time: "30–60 分钟完成，不追求一次到位",
    tip: "第一晚最重要的是睡好。床垫、收纳、装饰等可以等熟悉周边后再决定。",
    freshness: "长期有效",
    actionLabel: "打开同济迎新网",
    actionUrl: "https://hello.tongji.edu.cn/",
    source: { label: "同济大学迎新网", url: "https://hello.tongji.edu.cn/" },
    keywords: ["第一晚", "宿舍", "行李", "安顿", "洗漱", "入住"],
  },
  {
    id: "tongji-anchor",
    section: "nearby",
    title: "先记住三个地点：校门、同济大学站、五角场",
    summary: "不必一开始记住整片杨浦；先把最常用的三个锚点走熟。",
    steps: [
      "同济四平路校区地址为杨浦区四平路 1239 号。",
      "同济大学站 5 号口可作为日常出入校与找路的起点。",
      "去五角场前先在地图里保存目的地，再从地铁或公交方案中挑换乘最少的一条。",
    ],
    time: "第一次出门预留 20 分钟找路时间",
    tip: "新城市的方向感不是背出来的，是把几个稳定锚点反复走熟的。",
    freshness: "长期有效",
    actionLabel: "查看校区地图",
    actionUrl: "https://www.tongji.edu.cn/xglj/fk/xydt.htm",
    source: { label: "同济大学 · 校园地图", url: "https://www.tongji.edu.cn/xglj/fk/xydt.htm" },
    keywords: ["五角场", "同济大学站", "校门", "杨浦", "周边", "地图"],
  },
  {
    id: "nearby-supplies",
    section: "nearby",
    title: "附近补给：先用地图解决，再决定常去哪里",
    summary: "药店、便利店、超市、快递点和打印店都可能变动；先找离此刻最近且仍营业的。",
    steps: [
      "在高德或常用地图中搜索具体需求，例如“同济大学站 药店”。",
      "先查看步行距离、营业状态与最新评价，再决定是否出发。",
      "第一次验证过的店，收藏到“我的常用”，以后就不用再搜。",
    ],
    time: "以地图实时状态为准",
    tip: "深夜采购时优先选距离近、路径明亮、人流正常的门店。",
    freshness: "请实时查询",
    actionLabel: "打开高德地图",
    actionUrl: "https://ditu.amap.com/",
    source: { label: "高德地图", url: "https://ditu.amap.com/" },
    keywords: ["药店", "便利店", "超市", "打印", "快递", "买东西", "附近"],
  },
  {
    id: "metro-basics",
    section: "daily",
    title: "在上海出门，先让地铁成为默认选项",
    summary: "短距离步行加地铁通常最稳定；赶时间时先看首末班与换乘次数。",
    steps: [
      "安装或打开“Metro 大都会”，也可使用常用支付工具内的交通乘车码。",
      "进站前确认目的地与末班，换乘少通常比理论最短时间更稳妥。",
      "出站后再看步行路线，避免在闸机口临时找方向。",
    ],
    time: "首末班、临时运营以官方查询为准",
    tip: "雨天或晚高峰多留 15 分钟，比一路赶路更轻松。",
    freshness: "请实时查询",
    actionLabel: "查看上海地铁",
    actionUrl: "https://www.shmetro.com/",
    source: { label: "上海地铁", url: "https://www.shmetro.com/" },
    keywords: ["地铁", "公交", "通勤", "乘车码", "末班", "metro"],
  },
  {
    id: "city-services",
    section: "daily",
    title: "城市办事，先从随申办开始找",
    summary: "医保、政务、证明和本地公共服务优先走官方入口，少被搜索广告带偏。",
    steps: [
      "下载或打开“随申办市民云”，完成自己的账户登录。",
      "用具体事项关键词搜索，例如“医保”“社保”“居住证”“公共服务”。",
      "看清办理条件与材料后再提交，不确定时保留官方页面链接。",
    ],
    time: "按事项办理时限为准",
    tip: "涉及身份证、银行卡、验证码时，只在官方 App 或官方网页操作。",
    freshness: "开学季核验",
    actionLabel: "打开随申办说明",
    actionUrl: "https://www.shanghai.gov.cn/nw17239/20260630/427c849d95dc4fe782555410b45290cb.html",
    source: { label: "上海市政府 · 随申办入口说明", url: "https://www.shanghai.gov.cn/nw17239/20260630/427c849d95dc4fe782555410b45290cb.html" },
    keywords: ["随申办", "医保", "政务", "社保", "办事", "市民云"],
  },
  {
    id: "emergency-now",
    section: "emergency",
    title: "遇到紧急情况：先找人，再解决事",
    summary: "人身安全、医疗与火情优先；手机没电或迷路时，先进入有人值守、明亮的公共区域。",
    steps: [
      "遇到危及人身安全的情况拨打 110；医疗急救拨打 120；火情拨打 119。",
      "在机场、地铁站、校园内优先寻找服务台、安保或值班人员。",
      "非紧急城市公共服务问题可拨打 12345，说明地点、发生时间和你的诉求。",
    ],
    time: "立刻处理，不等待搜索结果",
    tip: "不要因为怕麻烦而独自处理明显超出自己能力范围的情况。",
    freshness: "长期有效",
    actionLabel: "查看上海市民热线",
    actionUrl: "https://www.shanghai.gov.cn/",
    source: { label: "上海市人民政府", url: "https://www.shanghai.gov.cn/" },
    keywords: ["紧急", "110", "120", "119", "12345", "丢失", "生病", "求助"],
  },
  {
    id: "campus-setup",
    section: "campus",
    title: "校园办事不必一口气办完",
    summary: "迎新通知是唯一优先级最高的清单；其余事项按“能上课、能联网、能生活”慢慢补齐。",
    steps: [
      "先登录迎新网，核对报到、住宿、缴费和学院通知。",
      "依次确认校园身份、校园卡、校园网与邮箱；每办完一项就在“我的常用”勾掉。",
      "校医院、图书馆、教务与学院通知都保存官方入口，不依赖群聊截图。",
    ],
    time: "以学院和迎新通知为准",
    tip: "开学季信息变化快，卡片中的“开学季核验”标识代表需要当天再点开官方页确认。",
    freshness: "开学季核验",
    actionLabel: "进入同济迎新网",
    actionUrl: "https://hello.tongji.edu.cn/",
    source: { label: "同济大学迎新网", url: "https://hello.tongji.edu.cn/" },
    keywords: ["校园网", "校园卡", "图书馆", "教务", "迎新", "校医院", "办事"],
  },
];

export const quickPrompts = [
  "我在虹桥 T2，带行李怎么去同济？",
  "今晚宿舍缺日用品，先买什么？",
  "从同济去五角场怎么方便？",
  "附近哪里可以寄快递或买药？",
];

export function findGuideCards(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return guideCards.filter((card) => {
    const haystack = [card.title, card.summary, card.tip, ...card.steps, ...card.keywords]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized)
      || normalized.includes(card.title.toLowerCase())
      || card.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
  });
}

export function makeStaticAssistantAnswer(query: string) {
  const matched = findGuideCards(query);
  const card = matched[0] ?? guideCards.find((item) => item.id === "tongji-anchor")!;
  return {
    answer: `先做什么：${card.summary}\n\n推荐方案：${card.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\n注意事项：${card.tip}\n\n来源状态：${card.freshness}，建议出发前再打开官方链接确认。`,
    sources: [card.source],
    sourceStatus: "已匹配攻略资料库",
    cards: matched.slice(0, 3),
  };
}
