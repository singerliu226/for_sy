export type GuideSource = {
  label: string;
  url: string;
  kind?: "官方规则" | "经验旁证";
};

export type GuideAction = {
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
  backup: string;
  verifiedAt: string;
  freshness: "长期有效" | "开学季核验" | "请实时查询";
  actionLabel: string;
  actionUrl: string;
  source: GuideSource;
  crossChecks?: GuideSource[];
  quickActions?: GuideAction[];
  keywords: string[];
};

export type EssentialApp = {
  id: string;
  name: string;
  badge: string;
  summary: string;
  when: string;
  tip: string;
  actionLabel: string;
  actionUrl: string;
  source: GuideSource;
  crossChecks?: GuideSource[];
  verifiedAt: string;
};

const guideVerifiedAt = "2026-08-25";

const contentSources = {
  tongjiWelcome: { label: "同济大学迎新网", url: "https://hello.tongji.edu.cn/", kind: "官方规则" as const },
  tongjiCard: { label: "同济大学信息化办公室 · 校园卡服务", url: "https://nic.tongji.edu.cn/fwzn/jcfw/xykfw.htm", kind: "官方规则" as const },
  shanghaiMetro: { label: "上海地铁 · 官方运营信息", url: "https://www.shmetro.com/", kind: "官方规则" as const },
  shanghaiEmergency: { label: "上海市政府 · 公共服务热线", url: "https://english.shanghai.gov.cn/Public%20services/20260813/98b41f0e71bb4adf93e3992313a1417c.html", kind: "官方规则" as const },
  emergency120: { label: "上海市政府 · 正确拨打 120", url: "https://www.shanghai.gov.cn/sjzccs/20221222/ce54d8bb53a94a39bfbdd93d9b5d2367.html", kind: "官方规则" as const },
  xhsReport: { label: "小红书 · 同济新生四平路报到（2026-08-13，仅作经验旁证）", url: "https://www.xiaohongshu.com/search_result?keyword=%E5%90%8C%E6%B5%8E%E5%A4%A7%E5%AD%A6%E5%9B%9B%E5%B9%B3%E8%B7%AF%E6%A0%A1%E5%8C%BA%20%E6%96%B0%E7%94%9F%E6%94%BB%E7%95%A5&source=web_explore_feed", kind: "经验旁证" as const },
  xhsAround: { label: "小红书 · 四平路校区出行经验（2026-08-02，仅作经验旁证）", url: "https://www.xiaohongshu.com/search_result?keyword=%E5%90%8C%E6%B5%8E%E5%A4%A7%E5%AD%A6%E5%9B%9B%E5%B9%B3%E8%B7%AF%E6%A0%A1%E5%8C%BA%20%E5%87%BA%E8%A1%8C%20%E6%8C%87%E5%8D%97&source=web_explore_feed", kind: "经验旁证" as const },
  xhsItService: { label: "小红书 · 同济官方账号 IT 服务说明（2025-09，流程旁证）", url: "https://www.xiaohongshu.com/search_result?keyword=%E5%90%8C%E6%B5%8E%E5%A4%A7%E5%AD%A6%20%E6%96%B0%E7%94%9F%20%E6%A0%A1%E5%9B%AD%E5%8D%A1%20%E6%A0%A1%E5%9B%AD%E7%BD%91&source=web_explore_feed", kind: "官方规则" as const },
  xhsShanghaiLife: { label: "小红书 · 上海生活经验（2025-02，仅作经验旁证）", url: "https://www.xiaohongshu.com/search_result?keyword=%E4%B8%8A%E6%B5%B7%20%E5%BF%85%E5%A4%87%20%E8%BD%AF%E4%BB%B6&source=web_explore_feed", kind: "经验旁证" as const },
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
    description: "你落地以后，怎么不慌不忙地到学校，我先替你顺在这里。",
  },
  {
    id: "nearby",
    index: "02",
    title: "学校周边",
    eyebrow: "AROUND TONGJI",
    description: "先陪你把校门、同济大学站和五角场走熟，其他地方慢慢来。",
  },
  {
    id: "daily",
    index: "03",
    title: "上海日常",
    eyebrow: "CITY LIFE",
    description: "这些琐碎的上海日常，我想让你少临时手忙脚乱一点。",
  },
  {
    id: "emergency",
    index: "04",
    title: "紧急求助",
    eyebrow: "JUST IN CASE",
    description: "真遇到突然的事，先照顾好自己，剩下的我们再慢慢处理。",
  },
  {
    id: "saved",
    index: "05",
    title: "我的常用",
    eyebrow: "MY SHORTCUTS",
    description: "你后来摸熟的路和小习惯，也值得留给以后的你。",
  },
  {
    id: "campus",
    index: "06",
    title: "校园办事",
    eyebrow: "ON CAMPUS",
    description: "学校里要办的事不用一口气做完，我们一件一件来。",
  },
];

export const guideCards: GuideCard[] = [
  {
    id: "hongqiao-to-tongji",
    section: "arrival",
    title: "虹桥落地后，先把你带到同济",
    summary: "你白天到的话，10 号线最省心；要是已经很晚、行李又多，就别逞强，直接打车也没关系。",
    steps: [
      "确认自己在虹桥机场 1 号或 2 号航站楼，再跟随“地铁 10 号线”指示。",
      "乘坐开往市区方向的 10 号线，在“同济大学站”下车。",
      "从 5 号口出站，先复制“四平路 1239 号”，再按当日迎新安排进校。",
    ],
    time: "约 50–70 分钟；末班与拥挤情况请当日确认",
    tip: "如果已经很晚、手机电量低或行李难以换乘，不要勉强赶末班；先在官方机场交通页确认夜间方案。",
    backup: "地铁已停运或行李很多时，先到到达层服务台确认官方夜间交通；再用网约车直达校方通知的报到点。",
    verifiedAt: guideVerifiedAt,
    freshness: "请实时查询",
    actionLabel: "查看机场交通",
    actionUrl: "https://www.shanghaiairport.com/dmjt/index.html",
    source: { label: "上海机场 · 地面交通", url: "https://www.shanghaiairport.com/dmjt/index.html", kind: "官方规则" },
    crossChecks: [contentSources.shanghaiMetro],
    keywords: ["虹桥", "t1", "t2", "机场", "地铁", "同济", "落地", "广州"],
  },
  {
    id: "pudong-to-tongji",
    section: "arrival",
    title: "浦东落地，给自己留一点余地",
    summary: "浦东离学校远一些。白天地铁没问题；要是你又累又晚，先平安到学校，比省这一点车费重要。",
    steps: [
      "先在到达层确认航站楼、行李和电量；不急着在拥挤处决定路线。",
      "白天可按校方公开路线乘 2 号线至南京东路，换乘 10 号线到同济大学站。",
      "若地铁已临近末班、身体不舒服或行李多，改用机场官方夜间交通或网约车，并把终点设为校方通知的报到点。",
    ],
    time: "公共交通通常约 90 分钟以上；夜间请额外预留时间",
    tip: "不要只看航班落地时间：下机、取行李、走到交通层都会占用时间。",
    backup: "若末班临近或身体疲惫，优先机场官方夜间交通或网约车；不要为了省钱在陌生换乘点硬赶。",
    verifiedAt: guideVerifiedAt,
    freshness: "请实时查询",
    actionLabel: "查看浦东机场交通",
    actionUrl: "https://www.shanghaiairport.com/dmjt/index.html",
    source: { label: "上海机场 · 地面交通", url: "https://www.shanghaiairport.com/dmjt/index.html", kind: "官方规则" },
    crossChecks: [contentSources.shanghaiMetro, contentSources.tongjiWelcome],
    keywords: ["浦东", "pvg", "2号线", "换乘", "机场", "同济", "落地"],
  },
  {
    id: "first-night",
    section: "arrival",
    title: "第一晚，先让自己好好睡下",
    summary: "能进校、能充电、能洗漱、能睡觉，第一天就已经做得很好了，别逼自己一次弄完。",
    steps: [
      "证件、手机、充电宝、银行卡放在最容易拿到的小包里。",
      "到校后先确认宿舍与门禁，再处理行李；不要一口气采购所有东西。",
      "只补齐当晚必要物品：水、纸巾、洗漱、拖鞋、充电线和一点吃的。",
    ],
    time: "30–60 分钟完成，不追求一次到位",
    tip: "第一晚最重要的是睡好。床垫、收纳、装饰等可以等熟悉周边后再决定。",
    backup: "如果校内报到尚未完成，先联系学院迎新联系人或值班人员；采购可以第二天白天再做。",
    verifiedAt: guideVerifiedAt,
    freshness: "长期有效",
    actionLabel: "打开同济迎新网",
    actionUrl: "https://hello.tongji.edu.cn/",
    source: contentSources.tongjiWelcome,
    crossChecks: [contentSources.xhsReport],
    keywords: ["第一晚", "宿舍", "行李", "安顿", "洗漱", "入住"],
  },
  {
    id: "flight-delay-replan",
    section: "arrival",
    title: "飞机晚点了，就重新给自己选条路",
    summary: "飞机晚到最怕的不是不会走，是硬拿白天的路线去赶末班。你落地后，我们按那一刻的时间再看。",
    steps: [
      "落地、取行李后再看一次当前时间；不要用原定航班到达时间判断还能不能赶上地铁。",
      "依次打开上海机场地面交通页、上海地铁运营信息和地图，确认公共交通是否仍可完整走通。",
      "若已接近末班、手机电量不足或行李太多，优先在到达层服务台问清官方夜间交通；网约车终点填录取通知书或学院通知中的报到点。",
    ],
    time: "落地后先用 3 分钟重算；不要在行李转盘前匆忙下单",
    tip: "不要因陌生人主动搭话而改乘非平台车辆；支付、订单和目的地都留在自己手机里。",
    backup: "公共交通已经不可用时，留在有工作人员的到达层，确认官方夜间交通或通过常用平台叫车；将行程页发给可信任的人。",
    verifiedAt: guideVerifiedAt,
    freshness: "请实时查询",
    actionLabel: "查看机场地面交通",
    actionUrl: "https://www.shanghaiairport.com/dmjt/index.html",
    source: { label: "上海机场 · 地面交通", url: "https://www.shanghaiairport.com/dmjt/index.html", kind: "官方规则" },
    crossChecks: [contentSources.shanghaiMetro],
    keywords: ["晚点", "延误", "晚到", "航班", "末班", "夜间", "凌晨", "改路线"],
  },
  {
    id: "tongji-anchor",
    section: "nearby",
    title: "先记住三个地方，就够了",
    summary: "刚来不用急着认遍杨浦。先把校门、同济大学站和五角场走熟，上海会慢慢变小。",
    steps: [
      "同济四平路校区地址为杨浦区四平路 1239 号。",
      "同济大学站 5 号口可作为日常出入校与找路的起点。",
      "去五角场前先在地图里保存目的地，再从地铁或公交方案中挑换乘最少的一条。",
    ],
    time: "第一次出门预留 20 分钟找路时间",
    tip: "新城市的方向感不是背出来的，是把几个稳定锚点反复走熟的。",
    backup: "一时找不到路就先回到同济大学站或校门这个锚点，再重新规划，不必边走边猜。",
    verifiedAt: guideVerifiedAt,
    freshness: "长期有效",
    actionLabel: "查看校区地图",
    actionUrl: "https://www.tongji.edu.cn/xglj/fk/xydt.htm",
    source: { label: "同济大学 · 校园地图", url: "https://www.tongji.edu.cn/xglj/fk/xydt.htm", kind: "官方规则" },
    crossChecks: [contentSources.xhsAround],
    keywords: ["五角场", "同济大学站", "校门", "杨浦", "周边", "地图"],
  },
  {
    id: "nearby-supplies",
    section: "nearby",
    title: "缺东西了，先找离你最近的那一家",
    summary: "药店、便利店和快递点会变，别死记店名。你现在在哪、它现在开不开，才最重要。",
    steps: [
      "在高德或常用地图中搜索具体需求，例如“同济大学站 药店”。",
      "先查看步行距离、营业状态与最新评价，再决定是否出发。",
      "第一次验证过的店，把店名、营业时间或路线写进“我的地点 / 小提醒”，下次就不用重新猜。",
    ],
    time: "以地图实时状态为准",
    tip: "深夜采购时优先选距离近、路径明亮、人流正常的门店。",
    backup: "若附近店已打烊，先用外卖平台补齐当晚必需品；不为一件小东西走去偏僻街区。",
    verifiedAt: guideVerifiedAt,
    freshness: "请实时查询",
    actionLabel: "打开高德地图",
    actionUrl: "https://ditu.amap.com/",
    source: { label: "高德地图", url: "https://ditu.amap.com/", kind: "官方规则" },
    crossChecks: [contentSources.xhsAround],
    keywords: ["药店", "便利店", "超市", "打印", "快递", "买东西", "附近"],
  },
  {
    id: "parcel-without-guesswork",
    section: "nearby",
    title: "快递这件事，听这一次的通知就好",
    summary: "校园里的快递点会变，你收到的那条取件通知，比任何旧攻略都靠谱；别为了背地址把自己绕晕。",
    steps: [
      "第一件寄校物品不要放证件、电脑或当天必须用的东西；先用普通包裹验证当期的地址、站点和取件流程。",
      "收到通知后核对三项：收件人姓名/手机号、具体取件点、最晚取件时间；地址写法与通知不一致时，优先问承运方或驿站。",
      "寄件时先在地图搜索当日营业的快递服务点，再在官方 App 下单或由快递员上门；不要只按网上流传的固定门牌找。",
    ],
    time: "开学前后、节假日和宿舍调整期都要重新核验",
    tip: "快递取件码、身份证照片和宿舍号不要发到公开群聊；贵重件当面验外包装再签收。",
    backup: "通知不清、站点关门或包裹异常时，先在承运 App 内找订单客服并保留截图；需要到校内处理时，再从迎新网或学院确认当期入校规则。",
    verifiedAt: guideVerifiedAt,
    freshness: "开学季核验",
    actionLabel: "打开同济迎新网",
    actionUrl: "https://hello.tongji.edu.cn/",
    source: contentSources.tongjiWelcome,
    crossChecks: [{ label: "高德地图 · 实时地点查询", url: "https://ditu.amap.com/", kind: "官方规则" }],
    keywords: ["快递", "寄件", "取件", "驿站", "包裹", "菜鸟", "地址", "快递点"],
  },
  {
    id: "metro-basics",
    section: "daily",
    title: "在上海出门，地铁先当你的底气",
    summary: "走一小段再坐地铁，通常最稳。赶时间的时候，少换一次乘，比地图上快两分钟更让人放心。",
    steps: [
      "安装或打开“Metro 大都会”，也可使用常用支付工具内的交通乘车码。",
      "进站前确认目的地与末班，换乘少通常比理论最短时间更稳妥。",
      "出站后再看步行路线，避免在闸机口临时找方向。",
    ],
    time: "首末班、临时运营以官方查询为准",
    tip: "雨天或晚高峰多留 15 分钟，比一路赶路更轻松。",
    backup: "地铁异常时，先看官方运营公告，再比较公交与网约车；别只按地图默认路线行动。",
    verifiedAt: guideVerifiedAt,
    freshness: "请实时查询",
    actionLabel: "查看上海地铁",
    actionUrl: "https://www.shmetro.com/",
    source: contentSources.shanghaiMetro,
    crossChecks: [{ label: "上海申通地铁集团 · Metro 大都会", url: "https://apps.apple.com/cn/app/metro%E5%A4%A7%E9%83%BD%E4%BC%9A/id1202750238", kind: "官方规则" }],
    keywords: ["地铁", "公交", "通勤", "乘车码", "末班", "metro"],
  },
  {
    id: "city-services",
    section: "daily",
    title: "城市里的手续，先从随申办找",
    summary: "医保、证明这些事看着烦，先从官方入口进就好，别让乱七八糟的搜索广告把你带偏。",
    steps: [
      "下载或打开“随申办市民云”，完成自己的账户登录。",
      "用具体事项关键词搜索，例如“医保”“社保”“居住证”“公共服务”。",
      "看清办理条件与材料后再提交，不确定时保留官方页面链接。",
    ],
    time: "按事项办理时限为准",
    tip: "涉及身份证、银行卡、验证码时，只在官方 App 或官方网页操作。",
    backup: "如果页面看不懂或需要材料不全，先保存官方事项页，白天再向学校或热线确认，不要在非官方页面提交证件。",
    verifiedAt: guideVerifiedAt,
    freshness: "开学季核验",
    actionLabel: "打开随申办说明",
    actionUrl: "https://www.shanghai.gov.cn/nw17239/20260630/427c849d95dc4fe782555410b45290cb.html",
    source: { label: "上海市政府 · 随申办入口说明", url: "https://www.shanghai.gov.cn/nw17239/20260630/427c849d95dc4fe782555410b45290cb.html", kind: "官方规则" },
    crossChecks: [contentSources.tongjiWelcome],
    keywords: ["随申办", "医保", "政务", "社保", "办事", "市民云"],
  },
  {
    id: "choose-a-city-route",
    section: "daily",
    title: "今天怎么走，别只看最快那几分钟",
    summary: "下雨、没电、带行李或者路不熟，就选让你更轻松的那条；慢一点没关系。",
    steps: [
      "先问：我有行李、下雨、身体不舒服或快到末班吗？任一为“是”，优先地铁/网约车，不勉强骑行或长距离步行。",
      "再看：地铁是否一线直达或换乘很少？是就优先地铁；短距离且白天、路线熟，再考虑共享单车。",
      "最后看：地图上的实时拥堵、步行入口和到达点。下车点选校门、地铁口或公共建筑，不把陌生小路当捷径。",
    ],
    time: "雨天、晚高峰、首次去的地点额外留 15 分钟",
    tip: "共享单车和网约车的停放/上下车规则会随路段变化，以地图当时提示为准。",
    backup: "判断不出来就选换乘最少、到站后步行最短的公共交通方案；晚间宁可多花一点时间走主路，也不要为了快走偏僻小路。",
    verifiedAt: guideVerifiedAt,
    freshness: "请实时查询",
    actionLabel: "打开高德地图",
    actionUrl: "https://ditu.amap.com/",
    source: { label: "高德地图 · 出行服务", url: "https://www.amap.com/dl/download_map.jsp", kind: "官方规则" },
    crossChecks: [contentSources.shanghaiMetro],
    keywords: ["打车", "骑车", "共享单车", "下雨", "晚高峰", "路线", "怎么走", "五角场"],
  },
  {
    id: "emergency-now",
    section: "emergency",
    title: "真遇到事，先去有人的地方",
    summary: "你的人身安全永远排第一。手机没电、迷路或者心里发慌，先去明亮、有工作人员的地方，别一个人硬扛。",
    steps: [
      "遇到危及人身安全的情况拨打 110；医疗急救拨打 120；火情拨打 119。",
      "在机场、地铁站、校园内优先寻找服务台、安保或值班人员。",
      "非紧急城市公共服务问题可拨打 12345，说明地点、发生时间和你的诉求。",
    ],
    time: "立刻处理，不等待搜索结果",
    tip: "不要因为怕麻烦而独自处理明显超出自己能力范围的情况。",
    backup: "无法清楚说明位置时，先进入最近有工作人员的服务台、商店或警务室，请对方协助拨打电话。",
    verifiedAt: guideVerifiedAt,
    freshness: "长期有效",
    actionLabel: "查看上海市民热线",
    actionUrl: "https://www.shanghai.gov.cn/",
    source: contentSources.shanghaiEmergency,
    crossChecks: [contentSources.emergency120],
    quickActions: [
      { label: "拨打 110", url: "tel:110" },
      { label: "拨打 120", url: "tel:120" },
      { label: "拨打 119", url: "tel:119" },
      { label: "拨打 12345", url: "tel:12345" },
    ],
    keywords: ["紧急", "110", "120", "119", "12345", "丢失", "生病", "求助"],
  },
  {
    id: "phone-dead-or-lost",
    section: "emergency",
    title: "手机没电了，先别站在路边着急",
    summary: "先去地铁站、服务台、校门岗亭或便利店。有人、明亮、能充电，比继续在路边刷路线重要。",
    steps: [
      "直接向工作人员说“手机没电、需要充电/联系家人/确认路线”，并说明自己所在的可见位置。",
      "先补电或借电话报平安，再打开地图；不要在路边把手机、身份证或充电宝交给陌生人保管。",
      "若有安全风险、迷失后无法自救或发生财物/人身问题，按情况拨打 110、120 或 119；非紧急城市服务问题用 12345。",
    ],
    time: "立刻处理；先找工作人员，再找充电口",
    tip: "出门前截图一张“同济大学四平路校区 / 学院报到点 / 紧急联系人”的离线卡片，比把地址只存在聊天记录里更稳。",
    backup: "若周边没有安全室内场所，保持在人流和照明较好的主路，前往最近的地铁站、医院、警务室或商场服务台。",
    verifiedAt: guideVerifiedAt,
    freshness: "长期有效",
    actionLabel: "查看上海公共服务热线",
    actionUrl: "https://english.shanghai.gov.cn/Public%20services/20260813/98b41f0e71bb4adf93e3992313a1417c.html",
    source: contentSources.shanghaiEmergency,
    crossChecks: [contentSources.tongjiWelcome],
    keywords: ["手机没电", "没电", "充电", "迷路", "找不到路", "丢手机", "手机丢了"],
  },
  {
    id: "medical-or-not",
    section: "emergency",
    title: "身体不舒服，先把你自己放在前面",
    summary: "严重到呼吸困难、意识异常或受伤时就打 120；其他不舒服也别硬撑，按校方安排或正规医院慢慢看。",
    steps: [
      "出现呼吸困难、意识异常、严重受伤等急危重情况，拨 120；接通后如实描述位置、症状和联系方式，不夸大也不隐瞒。",
      "等待急救时保持电话畅通；条件允许时，让人在明显入口或路口等候引导。",
      "只是需要医疗咨询时，改打 12320 或查看校医院/迎新安排；不要因为着急就从社交平台照抄处方或随意用药。",
    ],
    time: "急危重情况立即呼叫；普通咨询以白天门诊/官方热线为主",
    tip: "120 是急救资源。需要救护车时，先按调度员问题回答；不要一边挂断一边自行离开，除非现场存在新的危险。",
    backup: "若是轻症但独自不便出门，先联系同学、宿舍管理或学院值班人员陪同；病情加重、无法安全行动时转为 120。",
    verifiedAt: guideVerifiedAt,
    freshness: "长期有效",
    actionLabel: "查看 120 官方指引",
    actionUrl: "https://www.shanghai.gov.cn/sjzccs/20221222/ce54d8bb53a94a39bfbdd93d9b5d2367.html",
    source: contentSources.emergency120,
    crossChecks: [contentSources.shanghaiEmergency],
    quickActions: [{ label: "拨打 120", url: "tel:120" }, { label: "拨打 12320", url: "tel:12320" }],
    keywords: ["生病", "不舒服", "发烧", "急救", "120", "12320", "医院", "校医院"],
  },
  {
    id: "cannot-enter-campus",
    section: "emergency",
    title: "深夜进不了校，也别一个人乱跑",
    summary: "门禁和报到安排会变。真被拦在外面，就先待在校门、地铁站或商场服务台这些明亮公开的地方。",
    steps: [
      "核对录取通知书/学院通知里的报到校区、校门和联络方式；报到校区不等于每个人的宿舍生活区。",
      "向校门安保或学院/迎新联系人说明姓名、学院、抵达时间和当前困难；只出示被要求的必要证件，不把证件照片发给陌生人。",
      "若需要等待，选择有工作人员、照明和监控的公共区域；确认下一步后再叫车或移动。",
    ],
    time: "规则以当天学院和迎新系统为准",
    tip: "不要相信“某个门肯定能进”“某个宿舍一定在这里”的转述；同一校区不同院系、不同报到日可能完全不同。",
    backup: "联系不上学院时，先在迎新网寻找最新通知或校内公开电话；确有安全风险时使用 110/120/119，不等待网站回答。",
    verifiedAt: guideVerifiedAt,
    freshness: "开学季核验",
    actionLabel: "查看同济报到须知",
    actionUrl: "https://hello.tongji.edu.cn/",
    source: contentSources.tongjiWelcome,
    crossChecks: [contentSources.xhsReport],
    keywords: ["进不了校", "进不去", "门禁", "深夜", "晚上", "校门", "报到", "宿舍"],
  },
  {
    id: "campus-setup",
    section: "campus",
    title: "学校里的事，不用一口气全办完",
    summary: "先跟着迎新通知走，剩下校园卡、校园网这些，按能上课、能联网、能生活的顺序慢慢补就好。",
    steps: [
      "先登录迎新网，核对报到、住宿、缴费和学院通知。",
      "依次确认校园身份、校园卡、校园网与邮箱；把卡号、入口和需要补办的事项写进“我的地点 / 小提醒”。",
      "校医院、图书馆、教务与学院通知都保存官方入口，不依赖群聊截图。",
    ],
    time: "以学院和迎新通知为准",
    tip: "开学季信息变化快，卡片中的“开学季核验”标识代表需要当天再点开官方页确认。",
    backup: "官方页面一时打不开时，优先联系学院辅导员或迎新现场；不要把群聊截图当作最终规则。",
    verifiedAt: guideVerifiedAt,
    freshness: "开学季核验",
    actionLabel: "进入同济迎新网",
    actionUrl: "https://hello.tongji.edu.cn/",
    source: contentSources.tongjiWelcome,
    crossChecks: [contentSources.tongjiCard],
    keywords: ["图书馆", "教务", "迎新", "校医院", "办事", "新生清单"],
  },
  {
    id: "reporting-day-check",
    section: "campus",
    title: "报到前，我们只确认四件事",
    summary: "日期、校区、地点、联系人。别被一堆通知弄乱，最后就以你学院和自己系统里的信息为准。",
    steps: [
      "打开迎新网与学院通知，截图保存：报到日期、报到校区、具体接待点、学院联系人/值班方式。",
      "确认“能进校的时间”与“能进宿舍的时间”是否分别写明；没有明确写就不要把行李和快递押在某一个日期上。",
      "把校区地址复制给地图，把接待点名称复制进备注；到达前再核验一次系统是否有新通知。",
    ],
    time: "出发前一天、落地后各核验一次；开学季任何旧截图都可能失效",
    tip: "不要从别的年级、别的学院或小红书评论里推导自己的时间表；它们只能帮助你预判问题，不能替代录取通知书。",
    backup: "官网加载慢或信息冲突时，优先联系学院；把两份通知的截图与时间发给对方，请对方确认哪一份适用于你。",
    verifiedAt: guideVerifiedAt,
    freshness: "开学季核验",
    actionLabel: "进入同济迎新网",
    actionUrl: "https://hello.tongji.edu.cn/",
    source: contentSources.tongjiWelcome,
    crossChecks: [contentSources.xhsReport],
    keywords: ["报到", "日期", "校区", "接待点", "联系人", "提前入住", "迎新系统", "录取通知书"],
  },
  {
    id: "identity-card-network",
    section: "campus",
    title: "身份、校园卡、网络，慢慢把它们弄顺",
    summary: "先让你能进学校，再让卡、邮箱和网络都能用。遇到问题不用翻群聊，我把官方入口留在这里。",
    steps: [
      "迎新系统中先确认同济身份激活、人脸信息、个人邮箱和“一网通办”等待办是否出现。",
      "校园卡先解决查询/消费密码与充值入口；网络问题走信息化办公室的网络服务入口，记录报障时间和编号。",
      "完成后把常用入口、卡片状态和需要补办的事项写进“我的地点 / 小提醒”；不在公共设备保存密码。",
    ],
    time: "以迎新系统任务和信息化办公室当期说明为准",
    tip: "校园卡丢失、密码异常或网络不可用时，优先官方服务页；不要把学号、验证码或身份材料发到非官方群聊。",
    backup: "官方页面无法打开时，保存报错截图、时间和学号后联系学院或信息化服务渠道；先用手机热点完成当天最必要的任务。",
    verifiedAt: guideVerifiedAt,
    freshness: "开学季核验",
    actionLabel: "打开校园卡服务",
    actionUrl: "https://nic.tongji.edu.cn/fwzn/jcfw/xykfw.htm",
    source: contentSources.tongjiCard,
    crossChecks: [contentSources.tongjiWelcome, contentSources.xhsItService],
    keywords: ["身份激活", "人脸", "校园卡", "一卡通", "校园网", "邮箱", "一网通办", "密码"],
  },
];

export const quickPrompts = [
  "我刚到虹桥 T2，带行李怎么去学校呀？",
  "今晚宿舍缺东西，我先买什么好？",
  "从同济去五角场，怎么走会轻松一点？",
  "我附近哪里能寄快递或者买药？",
];

export const essentialApps: EssentialApp[] = [
  {
    id: "metro-daduhui",
    name: "Metro 大都会",
    badge: "我想让你先装好",
    summary: "坐地铁前把乘车码开好，别拖着行李站在闸机口临时研究。",
    when: "你刚落地、第一次坐地铁，或者想看看运营状态的时候。",
    tip: "支付宝或微信乘车码也能当备用；出门前记得看一眼网络和电量。",
    actionLabel: "查看官方 App",
    actionUrl: "https://apps.apple.com/cn/app/metro%E5%A4%A7%E9%83%BD%E4%BC%9A/id1202750238",
    source: { label: "上海申通地铁集团 · Metro 大都会", url: "https://apps.apple.com/cn/app/metro%E5%A4%A7%E9%83%BD%E4%BC%9A/id1202750238" },
    crossChecks: [contentSources.xhsShanghaiLife],
    verifiedAt: guideVerifiedAt,
  },
  {
    id: "amap",
    name: "高德地图",
    badge: "出门时靠它",
    summary: "去哪儿、怎么走、附近还开着什么，先让它帮你看一眼。",
    when: "去校门、五角场、药店、快递点，或者哪条路走着更安心的时候。",
    tip: "出门前看步行距离和营业状态；晚上选路亮、人多、少换乘的那条。",
    actionLabel: "下载高德地图",
    actionUrl: "https://www.amap.com/dl/download_map.jsp",
    source: { label: "高德地图 · 官方下载", url: "https://www.amap.com/dl/download_map.jsp" },
    verifiedAt: guideVerifiedAt,
  },
  {
    id: "meituan",
    name: "美团",
    badge: "第一晚大概会用上",
    summary: "晚到的时候，饭、水、纸巾和应急药让它送来，会比你一个人出去找店轻松。",
    when: "宿舍刚安顿、附近店关了，或者你不舒服不想一个人出门的时候。",
    tip: "地址写校门或公开好找的位置就行，宿舍号别放在公开备注里。",
    actionLabel: "下载美团",
    actionUrl: "https://i.meituan.com/client/download",
    source: { label: "美团 · 官方下载", url: "https://i.meituan.com/client/download" },
    verifiedAt: guideVerifiedAt,
  },
  {
    id: "suishenban",
    name: "随申办市民云",
    badge: "办事时来这里",
    summary: "上海要办什么城市里的手续，先从这儿进，少走一点弯路。",
    when: "查政策、办公共服务，或者需要身份核验的时候。",
    tip: "需要时再认证就好；验证码、证件照片和密码只留在你自己手里。",
    actionLabel: "查看官方说明",
    actionUrl: "https://www.shanghai.gov.cn/nw17239/20260630/427c849d95dc4fe782555410b45290cb.html",
    source: { label: "上海市政府 · 随申办入口说明", url: "https://www.shanghai.gov.cn/nw17239/20260630/427c849d95dc4fe782555410b45290cb.html" },
    verifiedAt: guideVerifiedAt,
  },
  {
    id: "payment-check",
    name: "支付宝或微信",
    badge: "出发前确认一下",
    summary: "不用新装，但出发前确认至少有一个能登录、能付款、能打开乘车码就放心了。",
    when: "坐地铁、买饭、打车、收快递之前。",
    tip: "支付密码、验证码和身份证信息只留在你手里；不对劲就先停一下，找官方客服。",
    actionLabel: "查看官方办事入口",
    actionUrl: "https://www.shanghai.gov.cn/nw17239/20260630/427c849d95dc4fe782555410b45290cb.html",
    source: { label: "上海市政府 · 随申办可使用微信/支付宝入口", url: "https://www.shanghai.gov.cn/nw17239/20260630/427c849d95dc4fe782555410b45290cb.html" },
    verifiedAt: guideVerifiedAt,
  },
];

export function findGuideCards(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return guideCards
    .map((card, index) => {
    const haystack = [card.title, card.summary, card.tip, ...card.steps, ...card.keywords]
      .join(" ")
      .toLowerCase();
    const keywordHits = card.keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
    const score =
      (haystack.includes(normalized) ? 12 : 0)
      + (normalized.includes(card.title.toLowerCase()) ? 8 : 0)
      + keywordHits.reduce((total, keyword) => total + Math.min(keyword.length, 4), 0);
    return { card, index, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.card);
}

export function makeStaticAssistantAnswer(query: string) {
  const matched = findGuideCards(query);
  const card = matched[0];
  if (!card) {
    return {
      answer: "先做什么：这件事我还没提前查到能让你放心照着走的答案，先别拿猜测去跑。\n\n推荐方案：先打开地图或对应的官方入口，确认地点、营业状态或当天通知。\n\n备选方案：在机场、地铁或学校里，直接找服务台、安保或值班老师问一声就好。\n\n注意事项：证件号码、银行卡、宿舍号和实时位置别写在这里；真有紧急情况直接打 110、120 或 119。\n\n来源状态：这条我还没收进攻略，先以官方页面和现场消息为准。",
      sources: [],
      sourceStatus: "这条我还没提前查明白",
      cards: [],
    };
  }
  return {
    answer: `先做什么：${card.summary}\n\n推荐方案：${card.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\n备选方案：${card.backup}\n\n注意事项：${card.tip}\n\n来源状态：${card.freshness}；最近核验 ${card.verifiedAt}，出发前再打开官方链接确认。`,
    sources: [card.source, ...(card.crossChecks ?? [])],
    sourceStatus: card.crossChecks?.length ? "我提前给你放好的攻略（也留了交叉核验）" : "我提前给你放好的攻略",
    cards: matched.slice(0, 3),
  };
}
