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
| `src/pages/` | 各页面组件与独立样式 |
| `src/shared/` | 导航、路由、平台数据、公共样式及漂浮墙的拖动和碰撞逻辑 |
| `src/img/` | 首页头像与背景图 |
| `src/imgBlog/photoWall/` | 漂浮照片墙的图片 |
| `src/imgBlog/project/` | 照片项目，每个子文件夹对应一个项目 |

## 路由与照片交互

- `/` 为首页，`/about` 为关于，`/photos` 为照片，`/videos` 为视频，`/social` 为社交主页。站内切换使用 History API，前进和后退通过 `popstate` 同步。部署端需将页面路由回退到 `index.html`，以支持直接访问和刷新。
- 照片页为 `project/` 下每个直接子文件夹生成一张卡片。项目 JSON `projectInfo.json` 可填写 `projectName`、`projectTime`、`ip` 和 `indexPhoto`。`indexPhoto` 填相对于项目文件夹的图片路径，带扩展名。指定的图片用作卡片封面和预览的第一张。未填写或找不到时，按文件名排序。点击卡片打开全屏看图，可用缩略图、方向键或手机左右滑动切图。放大后可拖动图片。
- 点击「照片墙」可切换到漂浮视图。Vite 从 `photoWall/` 及其子目录收集图片。照片墙和项目均支持 JPEG、PNG、WebP 和 AVIF。墙上的图片逐张解码，从随机方向飞入，拖动速度影响松手后的惯性与碰撞。
- 视频页可切换到「视频墙」，沿用列表的平台筛选和播放器。封面、标题及播放数据随卡片一起漂浮，拖动和碰撞与照片墙共用逻辑。
- 点按照片可放大，再点照片或空白处收回，也可按 `Esc`。系统启用「减少动态效果」时，自动飞入和漂浮停止。

## 更新与发布

在 `src/data/video-links.json` 添加 B 站视频链接或抖音视频链接后，运行 `npm.cmd run videos:update`，再构建发布。抖音条目也可以使用 JSON 对象，`url` 填链接，`views`、`likes`、`favorites` 分别填播放、点赞和收藏数。填 `null` 会隐藏对应数字。

同步抖音昵称时会使用本机的 Chrome 读取官方播放器公开显示的作者名。

添加、替换或删除 `src/imgBlog/` 中的图片后，双击上一级目录的 `更新照片到网站.cmd`，或在项目根目录执行：

```powershell
npm.cmd run build
npx.cmd --yes wrangler@4.50.0 pages deploy dist --project-name cchua --branch main
```

首次发布前用 `npx.cmd --yes wrangler@4.50.0 login` 授权。发布会更新整个站点。发布后检查首页、照片墙、社交主页能否直接打开，并确认新增照片及放大交互正常。

正式站点：[www.cchua.com](https://www.cchua.com/)。

文档写法参考[阿里巴巴前端规约 · 文档撰写规约](https://github.com/alibaba/f2e-spec/blob/main/docs/engineering/writing.md)。
