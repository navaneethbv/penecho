# Agent 时序图回归：证据与修复验收

状态：代码修复、真实模型路由测试、最终 macOS 包验收及 Windows 构建/包内运行验证已完成。部分视觉和发布条件尚未覆盖，不能据此宣称版本可发布。

## 基准与要求

用户确认 1.2.0 没有此问题，且效果满意。以该版本的可视化行为作为质量基准，优化不能以降低图文解释、Widget 渲染质量或增加无效往返为代价。

原始请求：不要只返回源代码；请先在 Canvas 上以图文结合的方式创建并展示渲染后的时序图，再在聊天中返回可编辑的 Mermaid 或 PlantUML 源码，不要返回 HTML。

## 已确认的证据

- `origin/main` 的 1.2.0（84d4f8d）首次系统提示注入完整 Visual Explorer 合约，包含响应式 HTML/CSS/SVG Widget 交付要求。
- `cb22fc4` 将 Agent 切换到共享 MCP 工具和按需指导；schema 适配白名单删除 maxItems/minimum/maximum 等限制，而执行端仍严格校验。
- `974069e` 进一步删除初始 document-tools 提示中的 Widget/native tool 映射及 ROUTING，并将指导默认返回改为 brief。该改动确实削弱了首次工具选择指引；它没有引入 schema 白名单，但继承了该缺陷。
- Windows 已安装 PenEcho 1.3.0，17:22:21 请求实际使用 glm-5.3-flash/xhigh，首先读取 visual-explorer brief，随后公开进度明确说“先在 Canvas 上原生绘制”。因此不能归因为“没有读指导”，也不能声称知道模型内部如何理解“不要返回 HTML”。
- 实际发送给模型的 draw.items 只有 array/items，没有 24 项限制，strokeWidth 只有 number，没有 1..12。拒绝中存在笼统 items is invalid，无法指导准确修正。
- 后续快照显示该请求于 17:51:10 取消，共 18 次已计费模型调用、72,764 output tokens；这是后续快照，不与此前 10 次/12 分钟快照混用。本次排查没有中断该用户请求。
- 初始图片只是“你好！”及欢迎答复，没有具体时序图业务主题。不能凭空把某个业务主题当作用户原始题目。

## 修复

1. 在初始 Agent 提示、VE brief/full 和工具描述中恢复复杂/静态图文解释优先 Widget、少量简单标记使用 native draw 的职责。
2. 区分 Canvas 渲染容器与聊天源码语言：同时要求渲染与 Mermaid/PlantUML 时分别交付可见结果与对应 DSL，Canvas 表示按任务选择；仅源码请求不强制创建，明确禁止 HTML 实现仍须遵守。
3. 独立 schema 适配器保留 SDK 可接受结构，将不支持的约束完整写入紧凑 Constraints 注释。MCP 规范验证器仍是唯一执行规则，不放宽验证。
4. 数量/数值报错返回字段、实际数量或数值、允许范围；非法文本/对象仅返回类型，避免回显无关内容。没有用重试熔断器掩盖契约错误。
5. 使用官方限定文件同步更新 Cloud 共享运行时，并将新模块加入同步白名单。

## 已完成验证

- MCP guidance/schema 与真实 Agent document-tools/schema adapter：36/36 通过。
- Canvas Agent 主测试、视觉技能、native capture 合约：98/98 通过。
- Cloud mirror provenance、依赖导入、scoped sync：3/3 通过；hosted Agent/adapter/decision：12/12 通过。
- 实际 adapter 暴露 24 项、stroke 1..12、rect/ellipse 80 条件；安装版 SDK 接受；25 项输入在 browser RPC 前被具体拒绝。
- Astra 主任务集成与测试；请求 Astra/low 子代理实现 schema/诊断和测试，Astra/medium 独立只读审查。工具请求参数指定上述模型，未取得额外实际执行模型元数据。

## 成本与未完成项

恢复限制有输入成本，不能继续沿用删掉限制后得到的 token 节省数字。当前 13 个实际 Agent 工具的 parameters JSON 为 23,293 UTF-8 bytes；这不是 token 数，也不是完整请求长度。

真实测试使用隔离本机服务、原始文字请求、UI 选择 glm-5.3-flash/xhigh、空白测试画布，完成了 Widget 图文时序图和最终 Mermaid 源码交付，没有聊天 HTML 源码。未指定业务主题时，模型明确选用 JWT 登录示例。观察到读取 VE 指导、一次尺寸预设与显式宽高冲突的拒绝、纠正后成功创建；没有 native draw 反复试错。失败次数如实保留，不能宣称零重试。

这是功能与可见结果证据；截图中时序图的小标签在当前显示比例较小，未据此宣称视觉质量全面等同用户满意的 1.2.0。测试没有完整复现 Windows 原会话上下文，未开启该隔离实例请求追踪，因此没有准确分阶段耗时/token；不能从本轮推算普遍加速百分比。

- [实际 Widget 与聊天源码](agent-routing-regression-20260912/real-glm-widget.png)
- [最终界面文字](agent-routing-regression-20260912/real-glm-visible-result.txt)
- [原 Windows 请求脱敏统计](agent-routing-regression-20260912/windows-original-summary.json)

首次源码服务测试结束后，测试页、临时服务和复制的模型连接文件已清理，3939/13922 端口释放。后续双平台包验收见下文；已安装 1.3.0 不因本地源码修改自动修复。


## 中间版本 7eff 的 macOS 包与 UAT 验收

- 从精确运行时代码提交 `7eff4d1` 的隔离 archive 构建 arm64 DMG/ZIP；主工作区其他未提交 UI/图标修改未进入该包。
- 新包实际 Electron 43.2.0 / Node 24.18.0 执行：完整 Agent runtime 导入、13 个实际工具 SDK 验证、25 项绘图在 browser RPC 前拒绝，四个修复文件与提交内容逐字节一致。
- 冻结代码全量 `npm run check`：首次发现 MCP service 测试仍匹配旧模糊错误文字；改为核对具体范围/实际值后，1731 pass、0 fail、1 skip。唯一 skip 为隔离目录缺少 sibling Cloud；已在主工作区补跑对应 cloud-viewer-mode 文件 11/11 pass。
- [最终 47b macOS 构建产物和 SHA-256](agent-routing-regression-20260912/mac-artifacts.json)
- [最终 47b 包内实际 Electron 验证](agent-routing-regression-20260912/mac-packaged-smoke.json)
- UAT app 已重启加载 Cloud `7616b4d`，容器状态 healthy；实际容器中的 13 工具 SDK、限制和路由检查通过，本机 healthz/readyz 正常。公网 UAT 入口仍保留 Basic 访问保护，未认证请求为 401；没有关闭保护。没有部署 production。

## 最终运行代码与新增可见性修复

运行代码为 `47b567d2c4f98e457acc92143fb2c35e61d0545a`，包含路由/约束修复 `7eff4d1`。Cloud 运行时镜像 `7616b4d`、前端镜像 `bc8fdf5`。全部为本地提交，未推送 GitHub。

实际 macOS 7eff 包的原生绘图测试，模型成功画框并把 Hello 移至中心；文件几何证明坐标正确，但浏览器截图中 Hello 不可见。原因是原生形状转换为不透明图片，当前图层顺序把图片画在文字之上。此次修复让首次含文字的原生 artifact 使用既有文字前景规则；后续更新保留用户选择，后台 Canvas 写入自己的图层元数据。没有增加渲染队列或改变坐标。历史 1.2.0 的原生创建路径也未设置此前景规则，因此不能把该独立问题确定归因为本次提示精简。

最终 47b 包重放相同方框/文字参数，再执行中心移动，MCP 均成功；通过 CUA 检查实际安装包服务，Hello 清晰可见。该验证针对层级缺陷，未重新调用模型，不把成功截图等同于所有原生图文排版质量已达标。

- [修复前：文字被遮挡](agent-routing-regression-20260912/mac-native-only.png)
- [修复后：中心文字可见](agent-routing-regression-20260912/mac-native-layer-fixed.png)
- [修复后实际几何](agent-routing-regression-20260912/native-layer-final-evidence.json)

最终 macOS 包：7 个关键服务端/客户端文件逐字节匹配冻结代码，实际 Electron 完整 Agent runtime 导入、13 工具 SDK 合约验证及超限拒绝通过。全量 `npm run check` 为 **1733 pass / 0 fail / 1 skip**；隔离目录缺 sibling Cloud 的单项 skip 已在主工作区对应 11/11 测试中补验。新增原生/后台文档测试 63/63、相关界面控制测试 117/117。

## 实际模型边界测试

在隔离 macOS 7eff 安装包服务中，通过 UI 选择 glm-5.3-flash/medium：

| 请求 | 结果 | 调用与用量 |
|---|---|---|
| 只要 Mermaid，不创建 Canvas 内容 | 成功返回 Mermaid；无工具调用 | 1 模型调用，8.197 秒，9207 prompt / 63 output tokens |
| 明确原生方框 Hello，禁止 HTML/Widget | native draw + move，无参数拒绝；发现上述文字遮挡，后由 47b 修复验证 | 3 模型调用，2 工具，32300 prompt / 715 output tokens |

[真实模型脱敏证据](agent-routing-regression-20260912/mac-app-boundaries.json) 仅保留公开输出、工具参数与统计，不包含隐藏思考或凭据。实际输出请求同时证实模型可见 24 项和 1..12 限制。

仍需区分：路由功能通过，不等于全面恢复用户满意的 1.2.0 视觉质量；xhigh 原始文字测试仍有一次 presentation 尺寸纠正。没有从一次测试推算普遍速度收益。Windows 原生 UI/新包真实模型重放、签名/公证及正式安装升级、生产环境凭据/IAM仍未完成，本报告不解除发布报告中的其他前置条件。

## UAT 与清理记录

通过官方 `local-uat-deploy.mjs auto` 部署已审核的 7 个变化文件；该次采用 app restart，1.4 秒完成。最终 staged app.js 与 Cloud 镜像逐字节一致，healthz/readyz 均 200，见 [UAT 核验](agent-routing-regression-20260912/uat-final.json)。未变更公网 Basic 保护或 production。

最终 macOS 测试页已关闭、仅本次隔离应用进程已停止，3945 监听端口确认释放。测试模型连接复制文件及原始 trace 已清理；报告仅保留脱敏结果。未停止用户原有应用。

测试脚本首次调用 draw 遗漏 MCP 必填 requestId，被严格拒绝后补齐；这是人工测试 harness 错误，不计入真实模型重试统计，未改变产品验证规则。

## 最终 Windows 包

精确提交 `47b567d` 在独立 Windows 构建目录正常 `make` 完成，exit 0。针对性测试 **116/116 pass，0 fail / 0 skip**。实际打包 Electron 执行完整 runtime 导入、13 个工具 SDK 验证，25 项拒绝且 browser RPC 为 0。主任务另将 7 个包内文件 SHA-256 与 Git 提交内容逐一核对，全部一致。Squirrel nupkg 中嵌入的 app.asar 与已测试 app.asar 哈希一致。

- [Windows 最终包及包内验证摘要](agent-routing-regression-20260912/windows-final-summary.json)
- 本机安装包：`/tmp/penecho-agent-routing-20260912/windows-build/PenEcho-Setup-1.3.0-win-x64-47b567d.exe`
- 大小：253,030,912 bytes；SHA-256：`310789345f8cfcfb7b13e26f94c477e48caf50a6466e7b7bdbd5a362b9404a4d`，主任务再次计算确认。

此项是 Windows 实际包内运行验证，未操作新包原生窗口、未进行新包真实模型调用，也未覆盖旧用户应用。不能用 macOS 浏览器结果代替这些未完成项。

## 路由边界纠正

再次核对 1.2.0：visual-explorer-contract.md 第 3–5 行先限定适用任务，第 275 行才要求被选中的 Visual Explorer 使用 HTML/CSS/SVG Widget。解释/分析类是默认路由，但不存在所有图或所有 Mermaid 请求强制 HTML 的规则。此前新增“图 + DSL 就用 Widget”过强，现改为按任务、已有内容及编辑需求选择，明确源码语言本身不选择 HTML；保留聊天输出和内部实现的区别。新增边界断言已覆盖。此前 47b 安装包不包含本段后续提示修正，包测试仍只适用于所列提交。
