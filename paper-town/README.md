# 小星球 · 环游公路

一个纯前端实时 3D 微缩小镇。奶油色巴士沿球面公路循环行驶，支持四季、时间和有限范围的视角调整，适配电脑、手机横屏与竖屏。

## 运行

使用 Node.js 22.12 或更新版本。

```sh
npm ci
npm run dev
```

打开 http://localhost:5191/ 。生产构建运行 npm run build，生成的 dist 目录可部署到静态网站服务的根路径；npm run preview 可本地预览构建结果。项目不需要后端、数据库、账号或 API 密钥。

## 操作

- 鼠标或单指拖动调整视角，滚轮或双指缩放。
- 点击右下角“四季 / 时间”切换季节、调整时间、复位视角或暂停行驶。
- 空格暂停或继续，D 显示开发面板。
- 查询参数 season 支持 spring、summer、autumn、winter；hour 支持 0–24。
- ?debug=0 隐藏开发面板，?debug=1 显示性能统计和速度控制。

## 实现与维护

Three.js / WebGL 负责渲染，GLB 保存模型，GLSL 控制道路、天空和材质效果，Vite 提供开发与构建。模型在初始化阶段加载和合并，植被等使用实例化绘制。球体角度保持在一圈内，通过重复旋转实现无限行驶。

- src/planet-motion.js：球面坐标与循环运动。
- src/planet-view.js：场景、相机、实例化批次与渲染。
- src/planet-materials.js：程序化材质、天空与照明效果。
- src/planet-gardens.js：花园和沿路装饰。
- src/planet-environment.js：季节配色和时间参数。
- src/planet-app.js：运行循环和界面。
- src/assets.js 与 public/assets/：模型加载与 12 个 GLB 资产。

## 验证

npm test 运行运动与环境逻辑测试。先启动开发服务，再运行 npm run test:browser 验证循环行驶、交互和屏幕适配，npm run test:soak 执行 180 秒资源稳定性测试。

浏览器测试使用 Playwright；首次运行前安装浏览器：npx playwright install chromium。可使用 TEST_URL 指向其他本地测试地址，或设置 BROWSER_CHANNEL=msedge 使用已安装的 Edge。截图和测试报告输出到 artifacts，不纳入版本控制。

## 运行要求与限制

需要支持 WebGL 的现代浏览器。DPR 上限为 1.5，帧率受设备 GPU 与窗口分辨率影响；桌面模拟手机视口的结果不能替代手机真机表现。时间和季节由用户手动切换，无后端持久化。静态部署须将 dist 作为网站根目录，当前资源 URL 使用 /assets/ 路径。
