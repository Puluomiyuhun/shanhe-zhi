# 山河志：共用引擎与剧本包

2026-09-24。新入口 `/game/`；春秋旧链接 `/chunqiu/` 自动进入 `/game/?scenario=chunqiu`。三国共用引擎版为 `/game/?scenario=sanguo`。根入口与 `/lab/` 原三国独立版保留，作为迁移对照。

## 目录与边界

- `dist/engine/`：共用渲染、六角地格、寻路、移动、AI 行动、情报和 UI。
- `dist/scenarios/<id>/data.js`：版本化数据，含势力、城池、人物、主角、行动角色、地图尺寸和河湖山道关隘。
- `terrain.js`：纯地形高度提供器；接收噪声、山系、城市辅助数据，不依赖 DOM 或全局游戏状态。
- `manifest.js`：组合数据与地形提供器；`engine/catalog.js` 是受控剧本目录。
- `schema.js`：载入前校验城池、归属、人物、行动目标及地理数据。未知剧本显示错误，不能任意导入路径。
- `runtime.js`：单页只加载一个剧本；切换通过整页导航重建场景，避免旧人物、事件监听、地形缓存混用。

春秋为 28 势力、38 城、146 人物、10 个活动角色；三国为 9 势力、35 城、89 人物、6 个活动角色。三国沿用原区域数据与高度逻辑，但河流转为通用折线水系，不是逐像素一致迁移。春秋旧 JS/CSS 暂留历史对照，当前入口已不再执行；维护应修改 engine/scenarios，回归测试已改为共用引擎。

## 新增时代

1. 在 scenarios 新建目录，参照现有剧本提供 data、terrain、manifest 三个模块。
2. 数据中填好 schemaVersion、id、title、description、player、terms、map、factions、cities、officers、actors；数据为可信项目内容，不接受未审查的外部脚本。
3. 在 catalog 注册唯一 ID 和选择卡信息。地图尺寸与渲染范围必须包住城邑和地理要素。
4. 执行 `node verify-scenarios.mjs`；PowerShell 可设置 `$env:SCENARIO='sanguo'` 选择目标，测试完 Remove-Item Env:SCENARIO。
5. 浏览器检查地图、情报筛选、头像、主角返回出发地和 AI 路线。新增剧本需另做地理史料记录。

战国七雄、秦楚汉尚未制作。此轮解耦的是沙盘、数据和现有行动系统；分封、会盟、郡县、兵制等时代制度仍需扩展规则模块。正式战斗、存档、外交和人物成长尚未实现；切换剧本会重新演练。

## 悬浮与网格

原 pointermove 的限频分支错误地隐藏提示框，下一次采样再次显示，产生闪烁。现限频只跳过采样，保留提示；拖动、缩放、离开地图才收起。view-policy.js 是实际渲染与事件处理共同使用的策略。
网格仅在相机距离 80 内渐入，48 内达到正常近景清晰度；距离 80 及以上 opacity=0 且停止绘制网格对象。地盘颜色、边界与已选目标/路线仍保留。

## 验证

`node verify-chunqiu.mjs`、`node verify-chunqiu-geography.mjs` 检查春秋共用引擎；`node verify-scenarios.mjs` 分别在两个 SCENARIO 下验证城池可达、居民、AI 180 秒模拟、悬浮限频、近远网格以及错误配置。浏览器验收另含两剧本名录与近远景。悬浮高频输入为逻辑回归，不能代替所有设备上的实测。

## 大陆海岸背景（2026-09-24）

共用引擎接入 `geography/east-asia-land.js`，`engine/coast.js` 将 Natural Earth 外环经剧本映射生成一次性的 721² 岸距场。查询 O(1)，无逐帧遍历海岸。远景显示渤海、黄海、东海、南海；海底下沉避免海面与地形 z-fighting，沿岸浅色渐变使用单通道纹理。

中心 ±110 单位保留原地形顶点间距，只延展外围顶点；地形仍为 480² 网格。海面增加一个双三角形绘制对象，四个 DOM 海名；模拟格子和 AI 数量不变。两剧本的 cameraExtent、overviewTarget、farDistance 独立配置。大陆背景不等于全国可玩范围。原 /lab/ 不变。

海域接入水岸、地块通行和领土遮罩；春秋有 88 格判为不可走海域，三国可玩区仍在内陆。所有城市保持距海岸大于3单位且可达。`node verify-coast.mjs` 在两个 SCENARIO 下检查海名在水上、海格不可行、海南台湾与内陆采样为陆地、城市未淹没。地理来源及推测边界见 dist/geography/README.md。未做前台 GPU 帧率基准。
