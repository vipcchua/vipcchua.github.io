# Cchua 个人网站

基于 React 19 和 Vite 6 的单页应用，部署在 Cloudflare Pages。页面包含个人简介、互动照片墙和社交链接。

## 本地开发

在项目根目录运行以下命令。Windows PowerShell 使用 `npm.cmd`，避免受 PowerShell 脚本执行策略影响。

```powershell
npm.cmd ci
npm.cmd run dev
```

访问 [http://127.0.0.1:8080/](http://127.0.0.1:8080/)。端口已固定为 `8080`，被占用时 Vite 会退出。也可以双击上一级目录的 `一键本地启动.cmd`。

## 代码结构

| 路径 | 职责 |
| --- | --- |
| `src/main.jsx` | React 入口和页面装配 |
| `src/pages/` | 首页、照片页和社交页的组件与独立样式。照片漂浮和碰撞由 `usePhotoMotion.js` 处理 |
| `src/shared/` | 导航、路由、平台数据和公共样式 |
| `src/img/` | 首页头像与背景图 |
| `src/imgBlog/` | 照片墙素材，支持 JPEG、PNG、WebP 和 AVIF |

## 路由与照片交互

- `/` 为首页，`/photos` 为照片墙，`/social` 为社交主页。站内切换使用 History API，前进和后退通过 `popstate` 同步。部署端需将页面路由回退到 `index.html`，以支持直接访问和刷新。
- 照片由 Vite 在构建时从 `src/imgBlog/` 及其子目录收集。浏览器逐张解码，完成后从随机方向飞入。漂浮和反弹由 `requestAnimationFrame` 驱动，拖动速度影响松手后的惯性与碰撞。
- 点按照片可放大，再点照片或空白处收回，也可按 `Esc`。系统启用「减少动态效果」时，自动飞入和漂浮停止。

## 更新与发布

添加、替换或删除 `src/imgBlog/` 中的图片后，双击上一级目录的 `更新照片到网站.cmd`，或在项目根目录执行：

```powershell
npm.cmd run build
npx.cmd --yes wrangler@4.50.0 pages deploy dist --project-name cchua --branch main
```

首次发布前用 `npx.cmd --yes wrangler@4.50.0 login` 授权。发布会更新整个站点。发布后检查首页、照片墙、社交主页能否直接打开，并确认新增照片及放大交互正常。

正式站点：[www.cchua.com](https://www.cchua.com/)。

文档写法参考[阿里巴巴前端规约 · 文档撰写规约](https://github.com/alibaba/f2e-spec/blob/main/docs/engineering/writing.md)。
