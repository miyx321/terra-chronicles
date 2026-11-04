# 泰拉行纪 · 大地与众生

独立静态网站，使用 HTML、CSS 和原生 JavaScript，支持 GitHub Pages 项目子目录部署。

目标仓库：`miyx321/terra-chronicles`。

## 内容

- 22 个地区与组织的历史沿革、23 篇地区纪事。
- 438 个干员入口、400 组干员人物纪事、65 位主要剧情 NPC。
- 干员本体档案、932 张人物立绘、320 张剧情 CG 与互动地图。
- 依据用户提供《大地巡旅》TXT校补22个地区，新增约1.6万字沿革、20篇人物补记。
- 32篇种族专题、64段历史与文化叙述，按游戏公开种族字段关联人物。
- 默认显示4081×5488无雾社区参考图，可切换原游戏地图；两图各自标定入口。

图像、角色、世界观和游戏剧情的权利归鹰角网络等原权利人；本站为非官方原创剧情梳理。具体出处、采用范围与不明年代均在网页中说明。

## 自动部署

GitHub 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。

推送 `main` 分支的静态文件后，工作流会检查并发布 `dist/`。也可在 **Actions → Publish GitHub Pages → Run workflow** 手动执行。

部署地址以 GitHub Pages 实际返回结果为准。默认项目地址为 `https://miyx321.github.io/terra-chronicles/`。

## 本地阅读与检查

```powershell
node server.mjs
# 打开 http://127.0.0.1:8787
node scripts/check-static.mjs
npm ci
npm test
```

全部阅读文件、立绘、CG、地图和背景图位于 `dist/`。站点运行不需要 ChatGPT 登录、OpenAI 接口或服务器数据库。

收藏、字号、主题和阅读进度保存在浏览器本地。切换到新域名后，旧域名下的浏览器记录不会自动迁移。

`README-content.txt` 保留内容范围与资料来源说明。本仓库不包含原工作区的研究原文、旧托管配置或原仓库历史。

设定集参考文本有OCR错字、跨栏串行和批注混排；章节与页区间根据文本目录识别，尚未以原版影印逐页核校。采用范围与摘要见 `dist/journey-meta.json`，参考全文仅在本地研究目录保存。无雾地图由terminator7211、陈谈据《大地巡旅》书衣整理，属于社区绘制，地图页保留署名、来源和完整高清图入口。
