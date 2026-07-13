const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Plus0000";
pres.title = "医院建筑节能方案助手 — 用AI做产品决策的实践分享";

const BG = "1A1A2E";
const WHITE = "FFFFFF";
const BLUE = "2B87C9";
const GREEN = "1F9A67";
const GRAY = "6B7280";
const FONT = "PingFang SC";

// ── Slide 1: 开场黑底 ──
const s1 = pres.addSlide();
s1.background = { color: "1A1A2E" };
s1.addText(
  [
    { text: "一个非技术背景的人", options: { breakLine: true, fontSize: 32, color: WHITE, bold: true } },
    { text: "", options: { breakLine: true, fontSize: 16 } },
    { text: "用 AI 做了一个 B 端系统", options: { breakLine: true, fontSize: 32, color: WHITE, bold: true } },
    { text: "", options: { breakLine: true, fontSize: 16 } },
    { text: "6 分钟讲完", options: { breakLine: true, fontSize: 28, color: BLUE, bold: true } },
    { text: "", options: { breakLine: true, fontSize: 16 } },
    { text: "重点不是系统本身", options: { breakLine: true, fontSize: 24, color: GRAY } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "而是怎么用 AI 做产品决策", options: { fontSize: 24, color: GREEN, bold: true } },
  ],
  {
    x: 1.5, y: 0.6, w: 7, h: 4.8,
    align: "center", valign: "middle",
    fontFace: FONT,
    lineSpacingMultiple: 1.0,
  }
);

// ── Slide 2: 传统做法 vs 我的做法 ──
const s2 = pres.addSlide();
s2.background = { color: BG };
// Title
s2.addText("不是「让 AI 写代码」，而是「让 AI 理解产品」", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.7,
  fontSize: 22, color: WHITE, bold: true, fontFace: FONT, margin: 0,
});

// Table
const headerOpts = { fill: { color: "2B2B4A" }, color: WHITE, bold: true, fontSize: 16, fontFace: FONT, align: "center", valign: "middle" };
const leftOpts = { fill: { color: "2D2D3F" }, color: GRAY, fontSize: 15, fontFace: FONT, align: "center", valign: "middle" };
const rightOpts = { fill: { color: "1A2A3E" }, color: "7EC8FF", fontSize: 15, fontFace: FONT, align: "center", valign: "middle" };
const leftOpts2 = { fill: { color: "2D2D3F" }, color: GRAY, fontSize: 15, fontFace: FONT, align: "center", valign: "middle" };
const rightOpts2 = { fill: { color: "1A2A3E" }, color: "7EC8FF", fontSize: 15, fontFace: FONT, align: "center", valign: "middle" };

s2.addTable(
  [
    [{ text: "维度", options: headerOpts }, { text: "传统做法", options: headerOpts }, { text: "我的做法", options: headerOpts }],
    [{ text: "需求描述", options: { ...leftOpts, bold: true } }, { text: "「帮我写个登录」", options: leftOpts }, { text: "「先画登录/注册的用户流程」", options: rightOpts }],
    [{ text: "功能设计", options: { ...leftOpts2, bold: true } }, { text: "堆功能", options: leftOpts2 }, { text: "先定义信息的输入输出", options: rightOpts2 }],
    [{ text: "开发效率", options: { ...leftOpts, bold: true } }, { text: "需求分析→PRD→设计→开发→联调", options: leftOpts }, { text: "想清楚逻辑 → 直接告诉 AI", options: rightOpts }],
    [{ text: "试错成本", options: { ...leftOpts, bold: true } }, { text: "写完了才发现方向不对", options: leftOpts }, { text: "几分钟换一种方案重来", options: rightOpts }],
  ],
  {
    x: 0.8, y: 1.3, w: 8.4,
    colW: [1.2, 3.6, 3.6],
    border: { pt: 0.5, color: "3A3A5C" },
    rowH: [0.6, 0.7, 0.7, 0.7, 0.7],
    fontFace: FONT,
  }
);

// ── Slide 3: 五步逻辑链 ──
const s3 = pres.addSlide();
s3.background = { color: BG };
s3.addText("五步 Stepper 的结构是怎么来的", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.7,
  fontSize: 22, color: WHITE, bold: true, fontFace: FONT, margin: 0,
});

const steps = [
  { text: "先了解医院基本情况", sub: "类型 / 规模 / 地理位置 / 机电系统" },
  { text: "再匹配合适的节能技术", sub: "从技术库中筛选适配的技术" },
  { text: "技术需要算钱", sub: "设备 / 材料 / 安装 / 运维费用" },
  { text: "算完钱才能算节能效益", sub: "能耗对比 / 费用节省 / 投资回报" },
  { text: "最后出报告做决策", sub: "多方案横向对比 / 一键生成报告" },
];

const startY = 1.3;
const stepH = 0.85;
const iconW = 0.55;

steps.forEach((step, i) => {
  const yPos = startY + i * (stepH + 0.15);
  // Number circle
  s3.addShape(pres.shapes.OVAL, {
    x: 0.8, y: yPos + 0.08, w: iconW, h: iconW,
    fill: { color: BLUE },
  });
  s3.addText(`${i + 1}`, {
    x: 0.8, y: yPos + 0.08, w: iconW, h: iconW,
    align: "center", valign: "middle",
    fontSize: 16, color: WHITE, bold: true, fontFace: FONT,
  });

  // Arrow (except last)
  if (i < steps.length - 1) {
    s3.addShape(pres.shapes.LINE, {
      x: 1.075, y: yPos + iconW + 0.02, w: 0, h: 0.13,
      line: { color: "3A3A5C", width: 2 },
    });
  }

  // Step title
  s3.addText(step.text, {
    x: 1.6, y: yPos, w: 5, h: 0.42,
    fontSize: 18, color: WHITE, fontFace: FONT, margin: 0, valign: "bottom",
  });

  // Step subtitle
  s3.addText(step.sub, {
    x: 1.6, y: yPos + 0.38, w: 5, h: 0.4,
    fontSize: 12, color: GRAY, fontFace: FONT, margin: 0, valign: "top",
  });
});

// Right side: arrow flow summary
const arrows = ["", "→", "→", "→", ""];
arrows.forEach((arrow, i) => {
  if (arrow) {
    const yPos = startY + i * (stepH + 0.15);
    s3.addText(arrow, {
      x: 7.5, y: yPos, w: 1.2, h: stepH,
      fontSize: 28, color: BLUE, fontFace: FONT, align: "center", valign: "middle",
    });
  }
});

// ── Slide 4: 数据过期提示 ──
const s4 = pres.addSlide();
s4.background = { color: BG };
s4.addText("上游数据变更 → 下游自动标记过期", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.7,
  fontSize: 22, color: WHITE, bold: true, fontFace: FONT, margin: 0,
});

// Simulated modal box
s4.addShape(pres.shapes.RECTANGLE, {
  x: 0.8, y: 1.3, w: 8.4, h: 2.8,
  fill: { color: "252540" },
  line: { color: "3A3A5C", width: 1 },
});

// Warning icon area
s4.addShape(pres.shapes.OVAL, {
  x: 4.2, y: 1.5, w: 0.8, h: 0.8,
  fill: { color: "FAAD14" },
});
s4.addText("!", {
  x: 4.2, y: 1.5, w: 0.8, h: 0.8,
  align: "center", valign: "middle",
  fontSize: 28, color: "FFFFFF", bold: true, fontFace: FONT,
});

s4.addText("数据可能已过期", {
  x: 1.5, y: 2.5, w: 7, h: 0.5,
  align: "center", valign: "middle",
  fontSize: 18, color: WHITE, bold: true, fontFace: FONT,
});

s4.addText("此步骤的上游数据已变更，请重新确认所有数据是否正确。", {
  x: 1.5, y: 3.0, w: 7, h: 0.5,
  align: "center", valign: "middle",
  fontSize: 14, color: GRAY, fontFace: FONT,
});

// Button
s4.addShape(pres.shapes.RECTANGLE, {
  x: 3.8, y: 3.7, w: 2.4, h: 0.5,
  fill: { color: BLUE },
});
s4.addText("我知道了", {
  x: 3.8, y: 3.7, w: 2.4, h: 0.5,
  align: "center", valign: "middle",
  fontSize: 13, color: WHITE, fontFace: FONT,
});

// Description below
s4.addText("设计原则：只在用户回到下游步骤时弹一次，不反复打扰。点击确认后不再弹出，直至下一次上游变更。", {
  x: 0.8, y: 4.4, w: 8.4, h: 0.6,
  fontSize: 12, color: GRAY, fontFace: FONT, margin: 0,
});

// ── Slide 5: 系统边界状态一览 ──
const s5 = pres.addSlide();
s5.background = { color: BG };
s5.addText("好产品 vs 能用的产品", {
  x: 0.8, y: 0.3, w: 8.4, h: 0.7,
  fontSize: 22, color: WHITE, bold: true, fontFace: FONT, margin: 0,
});

s5.addText("所有边界状态都处理了，系统才不会「裸奔」", {
  x: 0.8, y: 0.85, w: 8.4, h: 0.4,
  fontSize: 13, color: GRAY, fontFace: FONT, margin: 0,
});

const cards = [
  { title: "加载骨架屏", desc: "数据加载中展示 Skeleton\n不让用户面对空白页", icon: "⏳" },
  { title: "空状态引导", desc: "项目列表为空时\n展示引导页 + 操作按钮", icon: "📋" },
  { title: "离线提示", desc: "网络断开时顶部 Banner\n提示数据可能无法保存", icon: "📡" },
  { title: "错误重试", desc: "接口报错时显示指引\n不让用户卡死在当前步骤", icon: "🔄" },
];

const cardW = 3.8;
const cardH = 1.8;
const gapX = 0.6;
const gapY = 0.4;
const startCardX = 0.8;
const startCardY = 1.5;

cards.forEach((card, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const cx = startCardX + col * (cardW + gapX);
  const cy = startCardY + row * (cardH + gapY);

  // Card bg
  s5.addShape(pres.shapes.RECTANGLE, {
    x: cx, y: cy, w: cardW, h: cardH,
    fill: { color: "252540" },
    line: { color: "3A3A5C", width: 0.5 },
  });

  // Left accent bar
  s5.addShape(pres.shapes.RECTANGLE, {
    x: cx, y: cy, w: 0.06, h: cardH,
    fill: { color: i % 2 === 0 ? BLUE : GREEN },
  });

  // Title
  s5.addText(card.title, {
    x: cx + 0.25, y: cy + 0.15, w: cardW - 0.5, h: 0.5,
    fontSize: 16, color: WHITE, bold: true, fontFace: FONT, margin: 0, valign: "middle",
  });

  // Description
  s5.addText(card.desc, {
    x: cx + 0.25, y: cy + 0.65, w: cardW - 0.5, h: 1.0,
    fontSize: 12, color: GRAY, fontFace: FONT, margin: 0, valign: "top",
  });
});

// ── Slide 6: 结尾金句 ──
const s6 = pres.addSlide();
s6.background = { color: "1A1A2E" };
s6.addText(
  [
    { text: "AI 不会取代产品经理", options: { breakLine: true, fontSize: 30, color: WHITE, bold: true } },
    { text: "", options: { breakLine: true, fontSize: 16 } },
    { text: "但会用 AI 的产品经理", options: { breakLine: true, fontSize: 30, color: GRAY } },
    { text: "", options: { breakLine: true, fontSize: 16 } },
    { text: "会取代不会用的", options: { fontSize: 30, color: BLUE, bold: true } },
  ],
  {
    x: 1.5, y: 1.0, w: 7, h: 3.5,
    align: "center", valign: "middle",
    fontFace: FONT,
    lineSpacingMultiple: 1.0,
  }
);

// ── Slide 7: 谢谢 ──
const s7 = pres.addSlide();
s7.background = { color: "1A1A2E" };
s7.addText("谢谢", {
  x: 0, y: 0, w: 10, h: 5.625,
  align: "center", valign: "middle",
  fontSize: 48, color: WHITE, bold: true, fontFace: FONT,
});

// ── Write ──
pres.writeFile({ fileName: "/Users/plus0/newhotelone/output/视频素材_节能方案助手.pptx" })
  .then(() => console.log("PPTX created successfully!"))
  .catch((err) => console.error("Error:", err));