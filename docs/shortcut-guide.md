# WLOC 自托管快捷指令重建说明

本说明用于在上游 iCloud 快捷指令失效时，从零重建自己的版本。仓库不会把上游分享链接当作长期运行依赖。

## 已核查的上游逻辑

“设置地理位置”快捷指令实际执行两次 HTTP 请求：

1. 将地图 App 分享的链接 URL 编码后，请求自托管服务的 `/api/parse?format=json&u=...`。
2. 从 JSON 中取出 `lat`、`lon`、`name`，再请求 `https://gs-loc.apple.com/wloc-settings/save?lat=...&lon=...&acc=25`。

“清理恢复位置”不需要解析服务，只请求：

```text
https://gs-loc.apple.com/wloc-settings/save?action=clear
```

上游“设置地理位置”快捷指令还带有上游模块链接和作者社群链接。自建版本应删除这些非功能性动作，或替换为本仓库地址。

## 前提

1. 已部署本仓库的 Cloudflare Worker 或 Pages Functions。
2. `GET <SELF_HOST_URL>/health` 返回 `{"ok":true,"service":"wloc"}`。
3. `GET <SELF_HOST_URL>/api/parse?format=json&cs=none&u=31.2304%2C121.4737` 返回坐标 JSON。
4. 代理工具已安装本仓库模块，MITM 包含 `gs-loc.apple.com` 和 `gs-loc-cn.apple.com`。

仓库默认配置的 `SELF_HOST_URL` 是：

```text
https://wloc-zhangsan-nb.pages.dev
```

本次处理环境没有 Cloudflare 登录权限，所以上述地址必须在部署后实际访问验证。如果 Wrangler 返回了不同地址，以下所有步骤都使用实际地址。

## 重建“设置地理位置”

在快捷指令 App 新建快捷指令，并按顺序添加：

1. 在快捷指令详情中启用“在共享表单中显示”，接收“URL”和“文本”。
2. 读取“快捷指令输入”；如果为空，显示提示并停止。
3. 对输入执行“URL 编码”。
4. 使用“URL”动作拼出：

   ```text
   https://wloc-zhangsan-nb.pages.dev/api/parse?format=json&u=<URL 编码后的输入>
   ```

5. 添加“获取 URL 内容”，方法 `GET`，结果按 JSON 字典处理。
6. 从字典读取 `lat`、`lon` 和可选的 `name`。
7. 使用“URL”动作拼出：

   ```text
   https://gs-loc.apple.com/wloc-settings/save?lat=<lat>&lon=<lon>&acc=25
   ```

8. 再执行一次“获取 URL 内容”，方法 `GET`。
9. 根据返回字典的 `success` 显示成功或失败提示。

第 4 步是唯一需要 Cloudflare 自托管服务的功能性 URL。不要继续使用上游公共解析地址。

## 重建“清理恢复位置”

新建第二个快捷指令：

1. 添加“URL”动作，内容为：

   ```text
   https://gs-loc.apple.com/wloc-settings/save?action=clear
   ```

2. 添加“获取 URL 内容”，方法 `GET`。
3. 根据返回字典的 `success` 显示成功或失败提示。

这个快捷指令不调用 Worker/Pages。其请求会被已安装模块中的 `dist/wloc-settings.js` 拦截，并清除设备本地 `wloc_settings`。

## 发布自己的分享链接

1. 在快捷指令 App 中逐个运行并验证。
2. 打开快捷指令详情，选择“共享” -> “复制 iCloud 链接”。
3. 把 README 的“待创建”替换为自己的两个分享链接。
4. 再检查快捷指令内部没有上游仓库、上游模块、上游 Worker/Pages 或作者社群 URL。

上游分享链接仅供理解原始交互，不保证长期有效：

- 设置地理位置：https://www.icloud.com/shortcuts/a82717d8fdad4e6280866fcf911173f7
- 清理恢复位置：https://www.icloud.com/shortcuts/f42632d406504f24a2cd163af4fe012f

## 选点页面方案

不使用快捷指令时，直接在 Safari 打开自己的 `SELF_HOST_URL`：

1. 地图选点、搜索地名或粘贴地图链接。
2. 页面通过相对路径 `/api/parse` 解析短链接，因此自动使用当前部署实例。
3. 点击“储存到设备”，页面请求 Apple 设置接口，代理模块将坐标写入设备本地。
