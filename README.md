<p align="center">
  <img src="wloc.jpg" width="144" alt="WLOC" />
</p>

# Apple WLOC 定位修改（自托管备份版）

> 本仓库为 [Yu9191/wloc](https://github.com/Yu9191/wloc) 的自托管备份版本，主要用于避免上游仓库或公共服务失效。原始项目、主要代码和署名归原作者所有，本仓库不主张原创。

> 上游仓库目前未发现明确 LICENSE；使用、修改和再分发权限请以原作者授权为准。本仓库不会擅自补加 MIT、GPL、Apache 等许可证。

修改 Apple 网络定位服务（WiFi/基站）返回的坐标，实现 iOS 网络定位修改。安装对应代理工具模块后，可通过自托管选点页面或自建快捷指令写入坐标。

## 当前自托管状态

- 仓库：`https://github.com/zhangsan-nb/wloc`
- Raw 脚本：全部来自 `zhangsan-nb/wloc` 的 `main` 分支
- 选点页面：`https://wloc-zhangsan-nb.pages.dev/`
- Pages 项目名：`wloc-zhangsan-nb`（已部署）
- Worker 项目名：`wloc-spoofer-zhangsan-nb`（未单独部署，Pages 已提供相同页面和 API）

Pages 生产地址已经实际验证：首页、`/health` 和 `/api/parse` 均返回 HTTP 200。模块与快捷指令应使用上面的稳定生产域名，不要使用单次部署生成的预览子域名。

## 订阅地址

| 客户端 | 订阅地址 |
| --- | --- |
| Surge / Egern | https://raw.githubusercontent.com/zhangsan-nb/wloc/refs/heads/main/modules/wloc.sgmodule |
| Quantumult X | https://raw.githubusercontent.com/zhangsan-nb/wloc/refs/heads/main/modules/wloc.conf |
| Loon | https://raw.githubusercontent.com/zhangsan-nb/wloc/refs/heads/main/modules/wloc.lpx |
| Stash | https://raw.githubusercontent.com/zhangsan-nb/wloc/refs/heads/main/modules/wloc.stoverride |
| Shadowrocket（小火箭） | https://raw.githubusercontent.com/zhangsan-nb/wloc/refs/heads/main/modules/wloc.module |

Stash 请直接订阅 `.stoverride`，无需通过 Script Hub 转换。

## 自托管说明

本版本运行时使用以下资源：

- GitHub 脚本、图标、模块和仓库主页：来自 `zhangsan-nb/wloc`。
- 选点页面与 `/api/parse`：应来自本账号部署的 Cloudflare Worker 或 Pages Functions。
- 快捷指令：设置位置版本必须调用自己的 `/api/parse`；清理版本只调用被代理模块拦截的 Apple 设置接口。
- 地图和搜索：仍使用 Leaflet CDN、ArcGIS、OpenStreetMap、Carto、高德地图瓦片和 Nominatim。这些是第三方公共服务，但不属于上游作者账号。
- Apple 接口：`gs-loc.apple.com` 与 `gs-loc-cn.apple.com` 是项目业务所需目标，不是上游作者服务。

仓库内运行时代码、模块和部署配置不再依赖上游作者的 GitHub Raw、Worker 或 Pages。完整外部依赖清单见 [`docs/dependency-audit.md`](docs/dependency-audit.md)。

## 快捷指令

### 自建版本（长期使用）

自己的快捷指令分享地址尚未创建。创建后只需把下面两项替换为新的 iCloud 分享链接：

- wloc 设置地理位置：`待创建`
- wloc 清理恢复位置：`待创建`

设置位置快捷指令的关键流程：

1. 接收地图 App 分享的 URL 或文本并进行 URL 编码。
2. 请求 `https://wloc-zhangsan-nb.pages.dev/api/parse?format=json&u=<编码后的地图链接>`。
3. 从 JSON 中读取 `lat`、`lon` 和可选的 `name`。
4. 请求 `https://gs-loc.apple.com/wloc-settings/save?lat=<lat>&lon=<lon>&acc=25`。
5. 代理模块拦截第 4 步，由 `dist/wloc-settings.js` 把坐标写入设备持久化存储。

清理快捷指令只需请求：

```text
https://gs-loc.apple.com/wloc-settings/save?action=clear
```

如果改用直接部署的 Worker，请把第 2 步的域名替换为 Wrangler 实际返回的 Worker 地址。快捷指令中若有上游仓库模块链接或作者社群链接，也应删除或替换为本仓库地址。逐步重建说明见 [`docs/shortcut-guide.md`](docs/shortcut-guide.md)。

### 上游快捷指令（仅作来源参考）

- 设置地理位置：https://www.icloud.com/shortcuts/a82717d8fdad4e6280866fcf911173f7
- 清理恢复位置：https://www.icloud.com/shortcuts/f42632d406504f24a2cd163af4fe012f

这两个链接不是本仓库的长期自托管资产。已核查到上游“设置位置”快捷指令会调用上游公共解析服务，并包含上游模块/社群链接；即使当前仍能安装，也必须复制后按上一节替换，不能直接作为自托管完成状态。

## 使用方法

1. 订阅对应客户端模块并启用 MITM。
2. 确认 MITM 主机名包含 `gs-loc.apple.com` 和 `gs-loc-cn.apple.com`。
3. 部署自己的 Worker 或 Pages Functions。
4. 打开自己的选点页面，选择位置并点击“储存到设备”；也可以使用自建快捷指令。
5. 下次 Apple 网络定位触发时，`dist/wloc.js` 会读取已保存坐标并修改 protobuf 响应。

工作流程：

```text
选点页面 / 快捷指令
  -> 请求 gs-loc.apple.com/wloc-settings/save?lon=x&lat=y
  -> 代理模块拦截
  -> wloc-settings.js 写入 $persistentStore
  -> Apple WLOC 请求触发
  -> wloc.js 读取坐标并修改响应
```

模块参数优先级：已保存坐标 > 模块参数 > 默认值。默认精度为 25 米，默认日志级别为 `info`。

支持 Apple Maps、Google Maps、高德、百度分享链接和坐标文本。Apple/高德链接由 Worker 的 `parse.js` 处理短链和中国大陆 GCJ-02 -> WGS84 转换；境外坐标会跳过转换。

### 参数配置

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `longitude` | 目标经度（在线选点优先） | `113.94114` |
| `latitude` | 目标纬度（在线选点优先） | `22.544577` |
| `accuracy` | 精度（米） | `25` |
| `logLevel` | 日志级别 | `info` |

不使用选点页面时，也可以在代理工具的 BoxJS/持久化存储界面编辑：

```json
{"longitude":121.4737,"latitude":31.2304,"accuracy":25}
```

### 收藏位置

选点页面可以把多个坐标保存到浏览器 `localStorage`，点击收藏项即可快速切换；当前生效坐标仍以代理工具的 `wloc_settings` 为准。清除浏览器缓存只会清空收藏列表，不会清除设备上的生效坐标。

### iOS 高版本缓存

iOS 26/27 及更高版本可能长时间复用 `locationd` 缓存。安装模块或切换坐标后若脚本日志显示成功但地图没有变化，需要重启设备清除内存缓存；飞行模式或仅关闭定位服务可能不足以清除。

高版本系统建议：先在选点页面保存坐标，关闭定位服务并重启；重启后关闭飞行模式、连接代理并重新打开定位服务，再在地图中验证。较低版本通常无需重启。

### 恢复真实定位

- 最直接的方法是关闭或删除模块。
- 也可以调用 `wloc-settings/save?action=clear` 清除 `wloc_settings`。保持模块默认坐标不变时，脚本会进入透传模式。
- 若模块参数曾手动改成非默认坐标，清除持久化数据后仍会继续使用模块参数，需要同时恢复默认参数或关闭模块。

## Cloudflare 部署

Worker 入口 `worker/src/index.js` 同时提供选点页面、`/health` 和 `/api/parse`，不需要 KV、D1、R2 或环境变量。Pages Functions 通过 `worker/functions/[[route]].js` 复用同一个 Hono 应用。

### 直接部署 Worker

```bash
git clone https://github.com/zhangsan-nb/wloc.git
cd wloc/worker
npm ci
npx wrangler login
npm run deploy
```

部署项目名为 `wloc-spoofer-zhangsan-nb`。部署成功后，把实际 Worker 地址写入快捷指令；若希望模块打开 Worker 页面，也把五个模块中的 `https://wloc-zhangsan-nb.pages.dev/` 换成该地址。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zhangsan-nb/wloc/tree/main/worker)

### 部署 Pages Functions（模块当前默认）

```bash
git clone https://github.com/zhangsan-nb/wloc.git
cd wloc/worker
npm ci
npx wrangler login
npm run pages:deploy
```

默认项目名为 `wloc-zhangsan-nb`，当前生产地址为 `https://wloc-zhangsan-nb.pages.dev/`。脚本直接传入 `dist` 和项目名，是为了兼容当前 Wrangler Pages 不接受自定义配置文件路径的行为；`worker/wrangler.pages.jsonc` 仍作为配置参考保留。后续重新部署仍应按下一节验证稳定生产域名。

### 部署后验证

```bash
curl -fsS https://<实际域名>/health
curl -fsS "https://<实际域名>/api/parse?format=json&cs=none&u=31.2304%2C121.4737"
```

预期分别返回 `{"ok":true,"service":"wloc"}` 和包含 `lat`、`lon` 的 JSON。

## 本地检查

```bash
node scripts/check-self-hosted.mjs
cd worker
npm ci
npm test
npm run build
```

`check-self-hosted.mjs` 会递归检查上游 GitHub Raw、仓库、Worker 和 Pages 地址；README 中的上游项目来源是唯一白名单。GitHub Actions 会在每次 push 和 pull request 时执行同样检查、Worker 测试和构建。

## Git 历史备份

当前 `main` 保留了 Fork 的完整提交历史；审计时另外从上游抓取了 `geo` 分支和 `v1.0.0` 标签。GitHub 没有受支持的公开 API 可以把 Fork 安全地脱离 fork network，不能通过删库重建冒险处理。需要独立仓库时，应向 GitHub Support 请求 detach。

恢复 GitHub 写权限后，可把归档引用推送到自己的 Fork：

```bash
git fetch upstream --tags
git push origin refs/heads/geo
git push origin refs/tags/v1.0.0
```

这些引用是上游历史快照，不是当前自托管 `main` 的运行入口。

## 注意事项

- 需要安装并信任代理工具的 MITM 证书。
- 仅修改 Apple 网络定位（WiFi/基站），不直接修改 GPS 硬件定位。
- 选点页面写入坐标时，Safari 请求必须经过已启用模块的代理工具。
- 收藏位置保存在浏览器 `localStorage`；生效坐标保存在代理工具的 `wloc_settings`，两者互不替代。
- `dist/wloc.js` 与 `dist/wloc-settings.js` 是客户端实际执行文件，不应删除。

## 致谢与来源

- 上游来源：[Yu9191/wloc](https://github.com/Yu9191/wloc)
- [proxypin-wloc-spoofer](https://github.com/FFF686868/proxypin-wloc-spoofer) - 原始 WLOC 定位修改思路 by FFF686868
- [NSNanoCat/Util](https://github.com/NSNanoCat/util) - 跨平台脚本工具框架
