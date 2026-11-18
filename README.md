<p align="right"><a href="README.en.md">English</a></p>

<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="节假日历 — 微缩 2026 年 1 月日历，元旦 1–3 日绿框、4 日调休补班；下方请假方案卡：中秋+国庆请 3 天连休 13 天">
</p>

<p align="center">
  <a href="https://holiday-visualizer.xiaosang.cc/">▶ 在线查看</a>
  ·
  <a href="https://github.com/holynova/holiday-visualizer">GitHub 仓库</a>
</p>

节假日历：一张年历查清中国大陆的节日放假、调休补班和请假连休，覆盖 2016–2027 年。选年份，点某一天，就知道这天是放假、周末还是调休补班；请假方案按效率排序，告诉你请几天假能连休几天——比如 2026 年中秋 + 国庆，请 3 天连休 13 天。

## 截图

<p align="center">
  <a href="https://holiday-visualizer.xiaosang.cc/"><img src="./assets/readme/calendar-mobile.webp" width="280" alt="手机年历：2026 年统计 33 天节假日、84 天普通周末、6 天调休补班、242 天普通工作日，下方 1–4 月月历"></a>
  <a href="https://holiday-visualizer.xiaosang.cc/"><img src="./assets/readme/leave-mobile.webp" width="280" alt="手机请假方案：中秋+国庆请 3 天连休 13 天，9 月和 10 月月历标出休息、请假和补班"></a>
</p>

<p align="center">
  <a href="https://holiday-visualizer.xiaosang.cc/"><img src="./assets/readme/qr.png" width="128" height="128" alt="扫码打开节假日历"></a>
</p>

## 怎么用

- **查日期**：选年份，再点某一天。连续节日共用边框，跨周或跨月用虚线接续；四种日期一目了然：节日放假、普通周末、调休补班、普通工作日。
- **拼连休**：请假方案按请假效率或连休天数排序。展开方案后，月历用「休」「请」「班」区分日期；补班日如果也需要请假，会显示两个标记。
- **分享年份**：切换年份后可复制当前地址，例如 [2027 年日历](https://holiday-visualizer.xiaosang.cc/?year=2027)。

请假方案以单个公历年为计算范围，用 1–5 个工作日连接相邻休息时段，效率 = 连休天数 ÷ 请假天数。

## 数据

12 年的放假安排各存一个 JSON（`src/utils/holidayData/2016.json` … `2027.json`），以国务院办公厅节假日安排通知为准；2026、2027 年的官方通知链接见旧 README 与代码中的 `yearSources`：

- 2026 年：[北京市人民政府 · 2026 年节假日安排](https://www.beijing.gov.cn/zhengce/zhengcefagui/202511/t20251104_4258873.html)
- 2027 年：[中国就业网 · 2027 年节假日安排](https://chinajob.mohrss.gov.cn/h5/c/2026-11-09/635850.shtml)

以 2026 年为例：33 天节假日（含春节 9 天）、6 天调休补班、84 天普通周末、242 天普通工作日。

## 本地运行

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## 技术

- React 17 + TypeScript + Vite 2，UI 用 antd 5，动效 framer-motion，日期计算 date-fns。
- 节假日数据是静态 JSON，前端纯计算，无后端；年份通过 URL 参数 `?year=` 分享。
- 移动优先：全年日历与请假方案均为手机端布局。

```
src/pages/HolidayPage/   主页面：年历、请假方案、月历
src/utils/holidays.ts    日期分类、连休方案计算（1–5 天桥接、效率比）
src/utils/holidayData/   2016–2027 年放假安排 JSON（每年一个文件）
```
