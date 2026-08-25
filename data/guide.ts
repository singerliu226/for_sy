export type GuideSource = {
  label: string;
  url: string;
  kind?: "官方规则" | "经验旁证";
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
  keywords: string[];
};

export type CampusContact = {
  id: string;
  name: string;
  phone: string;
  source: GuideSource;
};

export type EssentialApp = {
  id: string;
  name: string;
  summary: string;
};

const guideVerifiedAt = "2026-08-25";

const contentSources = {
  tongjiWelcome: { label: "同济大学迎新网", url: "https://hello.tongji.edu.cn/", kind: "官方规则" as const },
  tongjiCard: { label: "同济大学信息化办公室 · 校园卡服务", url: "https://nic.tongji.edu.cn/fwzn/jcfw/xykfw.htm", kind: "官方规则" as const },
  shanghaiMetro: { label: "上海地铁 · 官方运营信息", url: "https://www.shmetro.com/", kind: "官方规则" as const },
  shanghaiMetroLatestBoarding: { label: "上海地铁 · 最晚上车时间查询", url: "https://service.shmetro.com/zuiwantime/index.htm", kind: "官方规则" as const },
  airportGroundTransport: { label: "上海机场 · 地面交通", url: "https://www.shanghaiairport.com/dmjt/index.html", kind: "官方规则" as const },
  airportHongqiaoRideHailing: { label: "上海机场 · 虹桥 T2 P6/P7 2F 网约车区公告", url: "https://www.shanghaiairport.com/gdjt/", kind: "官方规则" as const },
  tongjiHospital: { label: "同济大学校医院 · 四平校区门诊与急诊", url: "https://shtjh.tongji.edu.cn/info/1021/4097.htm", kind: "官方规则" as const },
  tongjiItHelp: { label: "同济大学信息化办公室 · 联系我们", url: "https://nic.tongji.edu.cn/lxwm.htm", kind: "官方规则" as const },
  tongjiSecurity: { label: "同济大学保卫处", url: "https://baowei.tongji.edu.cn/", kind: "官方规则" as const },
  tongjiStudentSupport: { label: "同济大学党委学生工作部 · 工作职能", url: "https://student.tongji.edu.cn/bmjs/gzzn.htm", kind: "官方规则" as const },
  xhsReport: { label: "小红书 · 同济新生四平路报到（2026-08-13，仅作经验旁证）", url: "https://www.xiaohongshu.com/search_result?keyword=%E5%90%8C%E6%B5%8E%E5%A4%A7%E5%AD%A6%E5%9B%9B%E5%B9%B3%E8%B7%AF%E6%A0%A1%E5%8C%BA%20%E6%96%B0%E7%94%9F%E6%94%BB%E7%95%A5&source=web_explore_feed", kind: "经验旁证" as const },
  xhsAround: { label: "小红书 · 四平路校区出行经验（2026-08-02，仅作经验旁证）", url: "https://www.xiaohongshu.com/search_result?keyword=%E5%90%8C%E6%B5%8E%E5%A4%A7%E5%AD%A6%E5%9B%9B%E5%B9%B3%E8%B7%AF%E6%A0%A1%E5%8C%BA%20%E5%87%BA%E8%A1%8C%20%E6%8C%87%E5%8D%97&source=web_explore_feed", kind: "经验旁证" as const },
  xhsItService: { label: "小红书 · 同济官方账号 IT 服务说明（2025-09，流程旁证）", url: "https://www.xiaohongshu.com/search_result?keyword=%E5%90%8C%E6%B5%8E%E5%A4%A7%E5%AD%A6%20%E6%96%B0%E7%94%9F%20%E6%A0%A1%E5%9B%AD%E5%8D%A1%20%E6%A0%A1%E5%9B%AD%E7%BD%91&source=web_explore_feed", kind: "官方规则" as const },
  xhsShanghaiLife: { label: "小红书 · 沪漂生活工具讨论（2026-04，仅作经验旁证）", url: "https://www.xiaohongshu.com/search_result?keyword=%E4%B8%8A%E6%B5%B7%20%E6%96%B0%E7%94%9F%20%E7%94%9F%E6%B4%BB%20%E7%9C%9F%E5%AE%9E%20App&source=web_explore_feed", kind: "经验旁证" as const },
  xhsFreshmanChecklist: { label: "小红书 · 同济新生报到清单（2026-08，仅作经验旁证）", url: "https://www.xiaohongshu.com/search_result?keyword=%E5%90%8C%E6%B5%8E%E5%A4%A7%E5%AD%A6%20%E6%96%B0%E7%94%9F%20%E5%BF%85%E5%A4%87%20App&source=web_explore_feed", kind: "经验旁证" as const },
  xhsHongqiaoTaxi: { label: "小红书 · 虹桥 T2 网约车实测核验（2026-06）", url: "https://www.xiaohongshu.com/search_result?keyword=%E8%99%B9%E6%A1%A5T2%20%E6%89%93%E8%BD%A6%20%E6%94%BB%E7%95%A5&source=web_explore_feed", kind: "经验旁证" as const },
  xhsPudongTaxi: { label: "小红书 · 浦东 T1/T2 网约车实测核验（2026-05 至 08）", url: "https://www.xiaohongshu.com/search_result?keyword=%E6%B5%A6%E4%B8%9C%E6%9C%BA%E5%9C%BA%20%E6%89%93%E8%BD%A6%20%E6%94%BB%E7%95%A5&source=web_explore_feed", kind: "经验旁证" as const },
};

export type GuideSectionId =
  | "arrival"
  | "campus"
  | "nearby"
  | "daily"
  | "emergency";

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
    description: "机场到学校的路线、末班判断和夜间备选。",
  },
  {
    id: "nearby",
    index: "02",
    title: "学校周边",
    eyebrow: "AROUND TONGJI",
    description: "校门、同济大学站、五角场与高频生活点。",
  },
  {
    id: "daily",
    index: "03",
    title: "上海日常",
    eyebrow: "CITY LIFE",
    description: "日常出行、买药、快递与城市办事。",
  },
  {
    id: "emergency",
    index: "04",
    title: "紧急求助",
    eyebrow: "JUST IN CASE",
    description: "四平路校区常用号码。",
  },
  {
    id: "campus",
    index: "06",
    title: "校园办事",
    eyebrow: "ON CAMPUS",
    description: "校园卡、网络、宿舍、图书馆与迎新事项。",
  },
];

// 四平路校区常用号码。来源保留在配置中，页面只呈现“名称 + 号码 + 复制”，方便紧急时一眼找到。
export const campusContacts: CampusContact[] = [
  { id: "hospital-desk", name: "校医院 · 门诊服务台", phone: "021-65988837", source: contentSources.tongjiHospital },
  { id: "hospital-emergency", name: "校医院 · 急诊", phone: "021-65980120", source: contentSources.tongjiHospital },
  { id: "it-help", name: "信息化办公室 · 服务热线", phone: "021-65989006", source: contentSources.tongjiItHelp },
  { id: "security-1", name: "保卫处 · 四平路校区", phone: "021-65980110", source: contentSources.tongjiSecurity },
  { id: "security-2", name: "保卫处 · 四平路校区", phone: "021-65982404", source: contentSources.tongjiSecurity },
  { id: "counseling", name: "心理健康教育与咨询中心", phone: "021-65983723", source: contentSources.tongjiStudentSupport },
];

export const guideCards: GuideCard[] = [
  {
    id: "hongqiao-to-tongji",
    section: "arrival",
    title: "虹桥落地后，先把你带到同济",
    summary: "10 号线能直达同济，但要按“进闸时间”判断，不能按航班落地时刻赌。当前官方查询：T2 最晚 22:31 上车、约 46 分钟到同济；T1 最晚 22:34、约 43 分钟。",
    steps: [
      "拿到行李后，先打开地图 App：起点选实际的虹桥 1 号或 2 号航站楼，终点选“同济大学”，看当时是否还能完整坐地铁到校。",
      "给最后一班留 15 分钟缓冲：T2 预计无法在 22:15 前进闸、T1 无法在 22:18 前进闸，就直接打车，不再拖着行李赶。",
      "能进闸再坐 10 号线往市区方向，在“同济大学站”下车；出站前先复制“四平路 1239 号”，再按当日迎新安排进校。",
    ],
    time: "常态查询：T2→同济约 46 分钟，T1→同济约 43 分钟；首末班、加班车和临时调整必须以当天官方结果为准",
    tip: "“飞机落地”不等于“人已在地铁闸机前”。取行李、走到地铁和手机没电都会吃掉最后十几分钟。",
    backup: "过了安全进闸线、行李很多或身体疲惫时，直接打车；也可在到达层服务台确认官方夜间交通。",
    verifiedAt: guideVerifiedAt,
    freshness: "请实时查询",
    actionLabel: "打开地图 App",
    actionUrl: "https://ditu.amap.com/",
    source: contentSources.shanghaiMetroLatestBoarding,
    crossChecks: [contentSources.shanghaiMetro, contentSources.airportGroundTransport],
    keywords: ["虹桥", "t1", "t2", "机场", "地铁", "同济", "落地", "广州", "末班", "运营时间", "22:31"],
  },
  {
    id: "pudong-to-tongji",
    section: "arrival",
    title: "浦东落地，给自己留一点余地",
    summary: "浦东到同济要坐 2 号线、在南京东路换 10 号线。官方“最晚上车时间”当前查询是 21:57，约 80 分钟到同济；不要把 2 号线单线 22:30 的末班当成还能到学校。",
    steps: [
      "拿到行李后打开地图 App：起点选“浦东 1 号 2 号航站楼”，终点选“同济大学”，不要只查 2 号线单线。",
      "当前常态最晚上车是 21:57；给自己留 15 分钟缓冲，若无法在 21:42 前进闸，就不按地铁方案走。",
      "时间充裕时坐 2 号线至南京东路，换乘 10 号线到同济大学站；换乘本身也会占用约 8 分钟。",
    ],
    time: "当前官方查询：最晚 21:57 上车，约 80 分钟、预计 23:16 到同济；首末班和临时调整以当天查询为准",
    tip: "浦东的关键不是 2 号线有没有车，而是能不能赶上南京东路换 10 号线。只剩单线末班时，别把自己困在中途。",
    backup: "过了安全进闸线、航班晚点或人很累时，直接打车；机场巴士可作到市区的备选，但不直达同济。",
    verifiedAt: guideVerifiedAt,
    freshness: "请实时查询",
    actionLabel: "打开地图 App",
    actionUrl: "https://ditu.amap.com/",
    source: contentSources.shanghaiMetroLatestBoarding,
    crossChecks: [contentSources.shanghaiMetro, contentSources.airportGroundTransport, contentSources.tongjiWelcome],
    keywords: ["浦东", "pvg", "2号线", "10号线", "换乘", "机场", "同济", "落地", "末班", "运营时间", "21:57"],
  },
  {
    id: "hongqiao-taxi",
    section: "arrival",
    title: "虹桥 T2 打车：去 P6/P7 停车库 2F",
    summary: "虹桥 T2 的网约车上车区在 P6/P7 停车库 2F。司机接单后，看订单里的“P6 或 P7 + A/B/C/D 区 + 车位号”，按这三段位置找车。",
    steps: [
      "取完行李后，在打车平台确认上车地是“虹桥机场 2 号航站楼”，不要选成“虹桥 2 号航站楼地铁站”。",
      "跟航站楼内“网约车”指示到 P6/P7 停车库 2F；不要在到达门口等车。",
      "司机接单后，先记住订单里的 P6 或 P7、A/B/C/D 分区和车位号；到对应分区后再按车牌、车型、司机姓名核车。",
      "平台长时间没人接或预估价异常时，先取消平台订单，改走机场正规出租车排队区；不接受主动揽客的私下报价。",
    ],
    time: "从 T2 到 P6/P7 停车库 2F 后再等车；订单里的分区和车位号会随当次调度变化，以订单为准",
    tip: "只认“P6/P7 + 分区 + 车位号”这三个信息。找不到时，停在最近的分区牌旁给司机发定位，不要拖着行李在车库里来回找。",
    backup: "手机快没电时先在到达层找充电与服务台；订单内保留行程和目的地，必要时把行程页发给可信联系人。",
    verifiedAt: guideVerifiedAt,
    freshness: "请实时查询",
    actionLabel: "查看机场地面交通",
    actionUrl: "https://www.shanghaiairport.com/dmjt/index.html",
    source: contentSources.airportHongqiaoRideHailing,
    crossChecks: [contentSources.xhsHongqiaoTaxi],
    keywords: ["虹桥", "t1", "t2", "打车", "网约车", "出租车", "上车点", "停车库", "深夜", "机场"],
  },
  {
    id: "pudong-taxi",
    section: "arrival",
    title: "浦东 T1/T2 打车：先选对停车楼",
    summary: "浦东 T1 选“P1 停车楼 B1 层一、二区”；浦东 T2 沿“网约车 / P2 停车楼”走，到电梯前再按订单分配的 B1 或 B2 层和区域找车。",
    steps: [
      "先看自己在哪个航站楼：T1 在平台选“浦东机场 T1 — P1 停车楼 B1 层一、二区”；T2 跟“网约车 / P2 停车楼”指示走。",
      "T2 到 P2 电梯前才下单或确认订单；平台会给 B1 或 B2 层及区域。先看楼层再坐电梯，别下错层。",
      "到指定层后，按订单里的区域和车牌找车；柱子编号用于和司机确认位置，车牌、车型、司机姓名不一致就不上车。",
      "有人在路上主动问“要不要车”时不私下成交；平台连续无车或价格不合适，就走机场正规出租车排队区。",
    ],
    time: "T1 和 T2 不是同一个上车点：T1 是 P1；T2 是 P2。T2 的具体 B1/B2 楼层和区域由订单给出",
    tip: "T2 先走到 P2，再确认订单楼层；T1 直接按 P1 停车楼 B1 层一、二区设上车点。把航站楼选错，平台会把人和车分到不同停车楼。",
    backup: "如果订单连续换司机、找不到车或电量不足，就留在有工作人员和照明的候车区，改用正规出租车或向服务台询问当前动线。",
    verifiedAt: guideVerifiedAt,
    freshness: "请实时查询",
    actionLabel: "查看机场地面交通",
    actionUrl: "https://www.shanghaiairport.com/dmjt/index.html",
    source: contentSources.airportGroundTransport,
    crossChecks: [contentSources.xhsPudongTaxi],
    keywords: ["浦东", "pvg", "t1", "t2", "打车", "网约车", "出租车", "p2", "上车点", "停车楼", "深夜", "机场"],
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
      "第一次验证过的店，记下店名、营业时间和路线；下次直接照着走，不必重新猜。",
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
    tip: "快递取件码、身份证照片和宿舍号只留在自己手里；贵重件当面验外包装再签收。",
    backup: "通知不清、站点关门或包裹异常时，先在承运 App 内找订单客服并记下订单号；需要到校内处理时，再从迎新网或学院确认当期入校规则。",
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
      "先判断：是否带行李、下雨、身体不舒服或接近末班？任一为“是”，优先地铁/网约车，不勉强骑行或长距离步行。",
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
    id: "campus-setup",
    section: "campus",
    title: "学校里的事，不用一口气全办完",
    summary: "先跟着迎新通知走，剩下校园卡、校园网这些，按能上课、能联网、能生活的顺序慢慢补就好。",
    steps: [
      "先登录迎新网，核对报到、住宿、缴费和学院通知。",
      "依次确认校园身份、校园卡、校园网与邮箱；按需要补办的事项逐项处理。",
      "校医院、图书馆、教务与学院通知都从官方入口查看。",
    ],
    time: "以学院和迎新通知为准",
    tip: "开学季信息变化快，卡片中的“开学季核验”标识代表需要当天再点开官方页确认。",
    backup: "官方页面一时打不开时，优先联系学院辅导员或迎新现场确认。",
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
    title: "报到前，确认四件事",
    summary: "日期、校区、地点、联系人。别被一堆通知弄乱，最后就以你学院和自己系统里的信息为准。",
    steps: [
      "打开迎新网与学院通知，记下报到日期、报到校区、具体接待点和学院联系人/值班方式。",
      "确认“能进校的时间”与“能进宿舍的时间”是否分别写明；没有明确写就不要把行李和快递押在某一个日期上。",
      "把校区地址复制给地图，把接待点名称复制进备注；到达前再核验一次系统是否有新通知。",
    ],
    time: "出发前一天、落地后各核验一次；开学季旧通知可能失效",
    tip: "不要从别的年级、别的学院或小红书评论里推导自己的时间表；它们只能帮助你预判问题，不能替代录取通知书。",
    backup: "官网加载慢或信息冲突时，优先联系学院，说明两份通知的发布时间与内容，请对方确认哪一份适用于你。",
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
    summary: "先完成进校、校园卡、邮箱和网络；遇到问题优先查看官方入口。",
    steps: [
      "迎新系统中先确认同济身份激活、人脸信息、个人邮箱和“一网通办”等待办是否出现。",
      "校园卡先解决查询/消费密码与充值入口；网络问题走信息化办公室的网络服务入口，记录报障时间和编号。",
      "完成后确认每项状态已生效；不在公共设备保存密码。",
    ],
    time: "以迎新系统任务和信息化办公室当期说明为准",
    tip: "校园卡丢失、密码异常或网络不可用时，优先官方服务页；学号、验证码和身份材料只在官方页面填写。",
    backup: "官方页面无法打开时，记下报错时间和学号后联系学院或信息化服务渠道；先用手机热点完成当天最必要的任务。",
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
    summary: "上海地铁官方乘车码，也能查运营信息。",
  },
  {
    id: "suishenxing",
    name: "随申行",
    summary: "把地铁、公交、轮渡和磁浮放在一个出行入口；可查实时到站与换乘。",
  },
  {
    id: "suishenban",
    name: "随申办",
    summary: "上海官方政务和城市服务入口。",
  },
  {
    id: "dingdong",
    name: "叮咚买菜",
    summary: "适合刚安顿时补水果、牛奶和日常消耗品。",
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
      answer: "先做什么：这件事暂未收录为可执行攻略，先不要按猜测行动。\n\n推荐方案：打开地图或对应官方入口，确认地点、营业状态或当天通知。\n\n备选方案：在机场、地铁或学校，直接询问服务台、安保或值班老师。\n\n注意事项：证件号码、银行卡、宿舍号和实时位置不要写在这里；紧急情况直接拨打 110、120 或 119。\n\n来源状态：暂未收录，先以官方页面和现场消息为准。",
      sources: [],
      sourceStatus: "暂未收录可验证攻略",
      cards: [],
    };
  }
  return {
    answer: `先做什么：${card.summary}\n\n推荐方案：${card.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\n\n备选方案：${card.backup}\n\n注意事项：${card.tip}\n\n来源状态：${card.freshness === "请实时查询" ? "出发前查询当天页面" : card.freshness === "开学季核验" ? "开学前核验官方通知" : "已完成核验"}；核验日期 ${card.verifiedAt}。`,
    sources: [card.source, ...(card.crossChecks ?? [])],
    sourceStatus: card.crossChecks?.length ? "已收录攻略 · 含交叉核验" : "已收录攻略",
    cards: matched.slice(0, 3),
  };
}
