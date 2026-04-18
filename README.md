# 家教安排助手 PWA

纯前端应用，数据存储在手机本地，完全离线可用。

## 使用方法

### 方式一：本地测试
1. 进入 `tutoring-pwa` 目录
2. 启动本地服务器：
   ```bash
   # Python
   python -m http.server 8080

   # 或 Node.js
   npx serve
   ```
3. 浏览器访问 `http://localhost:8080`

### 方式二：部署到 GitHub Pages（推荐）
1. 在 GitHub 创建新仓库
2. 上传 `tutoring-pwa` 文件夹内容
3. Settings → Pages → Source: main branch
4. 访问 `https://你的用户名.github.io/仓库名`

### 方式三：手机直接使用
1. 部署到任意静态托管（GitHub Pages、Vercel、Netlify）
2. 在 iPhone Safari 打开网址
3. 点击分享按钮 → "添加到主屏幕"
4. 完成！像 App 一样使用

## 添加图标

将以下图标放入 `icons/` 文件夹：
- `icon-192.png` (192x192 像素)
- `icon-512.png` (512x512 像素)

可用在线工具生成：https://realfavicongenerator.net/

## 功能
- 周视图 / 月视图 / 统计
- 添加、编辑、删除课程
- 每周重复课程
- 自动标记已完成
- 收入统计和图表
- 完全离线可用
- 数据存在本地

## 原项目
原 Flask 项目保留在父目录，未受影响。
