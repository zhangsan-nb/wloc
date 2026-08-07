# 外部依赖审计

本清单基于仓库全部跟踪文件、隐藏配置和上游快捷指令的逐项检查。目标是区分“上游作者控制的资源”和“项目本身仍需要的第三方服务”。

## 已移除的上游在线依赖

| 类型 | 原出现位置 | 处理结果 |
| --- | --- | --- |
| 上游 GitHub Raw 脚本与图标 | `README.md`、五个 `modules/*` | 全部改为 `raw.githubusercontent.com/zhangsan-nb/wloc` |
| 上游仓库主页与 clone/deploy 链接 | `README.md`、五个 `modules/*` | 运行/安装链接全部改为 `zhangsan-nb/wloc`；README 仅保留上游来源署名 |
| 上游 Worker `/api/parse` | README 与上游“设置位置”快捷指令 | 仓库文档、页面和模块不再调用；自建快捷指令改为自己的 `SELF_HOST_URL` |
| 上游 Pages 选点页面 | README 与模块元数据 | 改为预设自有项目 `https://wloc-zhangsan-nb.pages.dev/` |
| 上游 iCloud 快捷指令 | README 与模块描述 | 从模块运行说明中移除；README 只保留为来源参考，并提供可独立重建步骤 |
| 上游社群链接 | 上游“设置位置”快捷指令内部 | 自建快捷指令要求删除或替换，不作为功能依赖 |

## 自有托管资源

| 资源 | 地址或项目名 | 使用位置 |
| --- | --- | --- |
| GitHub 仓库 | `https://github.com/zhangsan-nb/wloc` | README、模块 homepage、clone、Cloudflare deploy |
| GitHub Raw | `https://raw.githubusercontent.com/zhangsan-nb/wloc/refs/heads/main/` | 模块脚本、图标和订阅 |
| Pages Functions | 项目 `wloc-zhangsan-nb`，预设 `https://wloc-zhangsan-nb.pages.dev/` | 模块选点页面、快捷指令 `/api/parse` |
| Cloudflare Worker | 项目 `wloc-spoofer-zhangsan-nb`，部署后地址以 Wrangler 为准 | 可替代 Pages Functions 提供相同页面和 API |

Cloudflare 资源尚未在本次环境中部署或验证，因为 Wrangler 未登录。预设 Pages 地址不是“已上线”声明。

## 仍保留的第三方运行时依赖

这些服务不属于上游作者，但仍可能因第三方策略或网络状况失效：

| 主机/服务 | 用途 | 代码位置 |
| --- | --- | --- |
| `gs-loc.apple.com`、`gs-loc-cn.apple.com` | Apple WLOC 与设备设置请求，代理模块拦截目标 | `modules/*`、`dist/*`、`worker/src/page.js` |
| `unpkg.com` | Leaflet 1.9.4 CSS/JS | `worker/src/page.js`、旧版 `worker/wloc-worker.js` |
| `server.arcgisonline.com` | 卫星图与 WGS84 街道图瓦片 | `worker/src/page.js` |
| `tile.openstreetmap.org` | 标准地图瓦片 | `worker/src/page.js`、旧版 `worker/wloc-worker.js` |
| `basemaps.cartocdn.com` | Carto 暗色/彩色瓦片 | `worker/src/page.js` |
| `is.autonavi.com` | 高德地图瓦片 | `worker/src/page.js` |
| `nominatim.openstreetmap.org` | 地名搜索 | `worker/src/page.js`、旧版 `worker/wloc-worker.js` |
| 用户提供的 Apple/高德短链接 | `/api/parse` 跟随重定向并提取坐标 | `worker/src/parse.js` |

## 构建依赖

| 包 | 用途 | 声明位置 |
| --- | --- | --- |
| `hono` | Worker/Pages HTTP 路由 | `worker/package.json` |
| `wrangler` | 本地开发、dry-run 构建、Worker/Pages 部署 | `worker/package.json` |

## 备份边界与风险

- 根目录 `dist/wloc.js` 和 `dist/wloc-settings.js` 是当前可运行的压缩产物；上游历史中没有随仓库发布的 `src/`、rollup 配置或根锁文件，因此本备份可以继续分发和部署现有产物，但不能声称能从源码重建这两个脚本。
- `worker/wloc-worker.js` 是旧的单文件页面实现，不含 `/api/parse`。现代自托管入口固定为 `worker/src/index.js`；旧文件保留用于历史完整性，不应按旧文档粘贴部署。
- `/api/parse` 会跟随用户提供 URL 的重定向并读取响应正文。Cloudflare Workers 环境未配置存储或限流，本仓库保留上游行为以避免改变解析兼容性；公开部署时应在 Cloudflare WAF/Rate Limiting 中限制滥用，并按需要增加允许的地图域名白名单。
- 页面中的地图 CDN 和搜索服务不是本仓库控制的资源。若要做到完全离线，还需自行打包 Leaflet、地图瓦片和地名搜索服务，这不属于本次自托管改造范围。

## 非运行时来源引用

README 保留上游仓库链接用于署名和来源说明。此链接由 `scripts/check-self-hosted.mjs` 的窄范围白名单允许；任何其他文件中的上游仓库 URL 仍会使检查失败。
