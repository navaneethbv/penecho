# 发布候选版验收报告 · 2026-09-12

> **后续回归核查（当日 Windows 17:22 请求）：候选版需要补修后再放行。** 已安装 1.3.0 的 GLM-5.3-Flash/xhigh 原生时序图请求，截至日志 17:46:01 仍在执行：17 轮已启动、16 次模型调用已完成、累计输出 62,111 token、8 次参数拒绝。实际发送的 Agent 工具定义缺少绘图 24 项上限、描边 1–12 及其他数值限制，错误主要为 `items is invalid`。该适配遗漏由 `cb22fc4` 引入，`974069e`/`1855396` 保留；此前 Widget/read/patch 验收未覆盖此场景。原始 MCP schema 保留限制，问题在内置 Agent 的 SDK schema 转换。需以 SDK 支持的描述补齐模型可见约束、提供实际值和合法范围的错误，并补转换后契约及同模型时序图回归。本报告下列通过结果仅适用于各自已列覆盖范围，不能代表这一原生绘图路径已通过。

> **后续修复进展：** 路由指引和模型可见约束已在 `7eff4d1` 修复，`47b567d` 另修复实测发现的原生文字遮挡。最终 macOS 包全量 1733 pass / 0 fail，真实模型路由和可见性证据见[专项回归报告](agent-routing-regression-20260912.md)。Windows 最终包和未覆盖发布条件应以专项报告最新记录为准，以上原始事故统计保留作为历史证据。

本次完成 MCP 优化、源码/几何补丁修复、Cloud main 差异复查、UAT 真实接口与双平台打包测试。没有推送 GitHub，没有删除分支，没有发布或部署生产，也没有使用浏览器进行真实付款。

**结论：候选代码已完成下列范围的验收；正式发布仍有明确前置条件，不能把本报告理解为生产环境已经验证无阻塞。** 生产 AWS 登录已过期，实际 ECS/IAM/密钥引用尚需重新核对；Windows 原生窗口的人工交互、macOS 原生拖动/缩放，以及正式签名/公证后的安装升级路径未完成。

## 版本与环境

| 项目 | 验收基线 |
|---|---|
| 客户端最终运行代码 | `1855396ecb1bc07dff87c363f86129353df226bd` |
| Cloud 最终运行代码 | `52a81ad10896887ac59637047c8ed88e9ee9e1da`；Canvas/Agent 镜像来自上述客户端提交 |
| Cloud main 对比 | `cbceb52715e50189094500539923288f61c95e9a`，只读 fetch 已核对 |
| 本地检查点 | 071 `9b6d1e9`；Cloud `6ce8fb7`，保存修改前已有工作 |
| 实现提交 | 071 `974069e` MCP 核心；`3ab921b` 发布回归修复；`f4aba91` Sharp 安全补丁；`1855396` 单段补丁计数修正 |
| 工具链 | macOS arm64 / Windows x64；构建 Node 22.23.2；打包 Electron 43.2.0 / Node 24.18.0 |
| UAT | `internaltest.penecho.ai`；本机私有入口 18082；独立文档 worker 无公开端口 |

测试安装包与用户已安装应用隔离，未覆盖原安装。测试运行状态、凭据和临时服务的清理结果见最终交付记录。

## 本次发现并修复

1. **Widget 更新错误地返回 BUSY。** 源码更新不再等待拖动/缩放结束，也不因选中状态拒绝。提交时保留最新几何、手势和独立 Undo 历史；真正的源码冲突仍拒绝，避免覆盖另一份内容。
2. **MCP 冗余说明、回执和往返。** 22 个工具合并为 19 个；常用 6 个入口，保留全部能力；默认简短回执，支持一次写入同时截图与完成；HTTPS 连接复用及有界队列。源码 patch 的浏览器 RPC 从 2 次降至 1 次。
3. **混合供应商协议误报。** 有健康供应商时，模型目录可能仍选中失效/超价节点的协议，造成 Agent 503。内存和 PostgreSQL 现在用同一组健康、时效、熔断、计价条件决定可用性与协议。实际 PG/内存/路由回归 55 项通过。
4. **发布配置遗漏。** 明确保持 Hosted Agent/原生画布开关；补文档 worker 的 UAT 与生产构建、私有发现、镜像扫描、不可变摘要和部署检查；生产详细请求记录保持关闭。生产所需 IAM 变更仅准备，未应用。
5. **图片解析安全漏洞。** 客户端与 Cloud 将 Sharp 0.35.3 更新为 0.35.4（libheif 1.23.2），修复 [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)。运行依赖审计归零；没有关闭 AVIF 功能绕过问题。
6. **界面与包内资源。** 修复自定义颜色的严格 CSP 样式更新、减少动态效果时的 Agent 动画选择器、MCP/Agent 控件契约属性；安装包精确保留窗口 PNG 图标，其他构建文件继续排除。
7. **模型补丁计数造成额外往返。** 三次真实应用测试重现单 hunk 的行数摘要写 7、正文实际为 6，导致模型多走一轮。现在仅对路径明确、正文语法有效的单文件单 hunk 重算计数；不改正文、起始位置或源码哈希，也不放宽内容匹配。真实 MCP 错误计数重放一次成功；新一轮真实 Flash 创建/读取/patch 四次工具调用全部成功。合法多 hunk 继续支持；错误计数的多 hunk 不进入自动修复，非法正文和真实冲突继续拒绝。
8. **回归测试自身问题。** 更新旧契约夹具；修复 Windows TOML 路径转义、并发修改故障注入、OpenSSL 配置污染；异步心跳/回执等待改为实际事件或可控时钟。POSIX 权限检查与功能检查分开，未跳过 TLS、会话、鉴权和源码补丁测试。

## 测试覆盖与结果

| 范围 | 实际结果与边界 |
|---|---|
| 客户端完整检查 | 1,727 通过，0 失败，0 跳过；包含生成物和语法检查 |
| Sharp 更新后图片专项 | 252 通过；真实 PNG/JPEG/WebP/AVIF 编解码及尺寸核对 |
| Cloud 最终完整检查 | 最终产品修正前全量 771 总计：744 通过，0 失败，27 条默认环境跳过；最后仅同步计数修正后的针对性 19 项通过 |
| Cloud 环境补测 | 原 26 条分别以真实 PostgreSQL/Redis/worker 补测通过；新增协议 PG 分支也已真实运行通过。不是宣称默认命令零跳过 |
| 数据库升级 | 独立数据库顺序应用全部 68 个迁移，通过后删除该临时数据库 |
| Windows 完整检查 | 1,726 个 JUnit 叶子用例：1,720 通过，0 失败，6 跳过；另一个通过的嵌套组使 Node 总数为 1,727 |
| MCP 专项 | 380 项源文件、几何、取消、幂等、重连、隔离、组合完成等回归通过 |
| macOS 打包应用 | 原生窗口内真实 Agent 创建/读取/patch，按钮 Clicked，Undo A/Redo B，保存；包内服务真实 MCP 创建/读取/3 次 patch/截图通过 |
| Windows 打包应用 | 实际 EXE 启动、原生模块加载、TLS/鉴权/MCP 通过；转发至该 EXE 服务的浏览器中，真实 Agent 创建/读取/patch、按钮、Undo/Redo 通过。没有把这个算作 Windows 原生窗口交互验收 |
| 外部 ZCode | 本机 ZCode 3.11.2 / CLI 0.16.5，实际 DeepSeek Flash；本地完整更新场景 4 次工具调用零重试；连接最终 macOS 打包服务的创建+截图+完成场景 2 次工具调用零重试，整个单次场景 18.006 秒（非速度对照实验） |
| 真实模型重试 | 中间包在 macOS、Windows 各出现 1 次错误 hunk 行数重试，据此增加上述保守计数修正。最终逻辑本地真实模型 4 次、最终 macOS 原生模型 3 次工具调用零重试；错误计数 MCP 重放成功，真正源码冲突继续拒绝 |
| UAT 文档 | TXT/CSV/PDF/DOCX 上传及真实 Agent 读取标记通过；跨用户、跨会话、删除后读取被拒绝；测试文件/画布/会话清理 |
| UI 显示 | 1440px 和 960px、中文、产品支持最大 125% 缩放检查；页面无水平溢出，Agent 面板无内容溢出；自定义 #123456 生效，无内联样式或 CSP 错误 |
| 发布工程 | Terraform validate/fmt；32 项部署检查；28 段 workflow shell 语法；同步校验及差异空白检查通过 |

Windows 6 条跳过：3 条 POSIX chmod 权限断言；1 条 chmod 不可读目录夹具；1 条原有 Windows 跳过的目录身份/符号链接替换用例；1 条隔离源码目录不存在同级 Cloud 仓库的镜像 allow-list 检查。相应 macOS 用例已通过；Windows 目录替换行为不能据此视为已完成实机覆盖。

## 付款、积分与使用

- 全部 Stripe 写入对象均验证 `livemode=false`。创建真实沙箱订阅和积分包 Checkout；相同幂等键复用同一订单/会话。
- 后端沙箱 `pm_card_visa` 完成 $10 订阅，产生真实 paid invoice 和 `invoice.paid`。自然 webhook 首先到达；之后重放两次均为重复事件，未重复发放。
- 实际到账 7,000 积分，会员显示 Plus；随后真实 hosted deepseek-4 请求成功，扣 1 积分，余额 6,999。最终 UAT 部署后再次请求成功，余额 6,999 → 6,998，恰好新增一条消费账目。后续冻结 UAT 52a81ad 再次真实调用成功，6,996 → 6,995，恰好一条消费账目（中间额外验收调用有独立记录）。
- 已取消测试自动续费、过期未完成 Checkout、撤销测试会话。没有真实银行卡扣费，没有浏览器支付操作。
- **未覆盖：** 浏览器完成 Checkout、积分包成功付款的真实 provider webhook、真实生产收款、退款/争议完整实机流程；相关部分有单元/数据库回归，不能替代上述端到端覆盖。

## 几何与速度的具体结论

在最终 macOS 打包服务的浏览器入口中，读取源码/哈希后，用鼠标移动、缩小 Widget，保持选中再用旧源码哈希及错误行数的单 hunk patch；x/y/w/h 逐字段保持，延迟重新读取一致。正在拖动或缩放时提交的历史隔离、继续拖动、回到起点、取消手势由执行真实客户端函数的自动化测试覆盖。没有将几何变化误认成源码变化。最终实测 x/y 从 1000/1000 → 1082.2086/1098.6503，w/h 从 1400/880 → 1120.9080/704.5707，patch 后逐字段完全一致。

原生 macOS 的 CUA 拖动调用未完成几何变化，并留下活动编辑状态；已用 Escape 结束，未把该次尝试计为拖动通过。在这一状态下，真实包的源码 patch 仍一次成功且未返回 BUSY。**原生窗口的实际拖动/缩放仍需人工补验**；浏览器入口和执行真实客户端函数的手势测试已通过，不能替代这一人工项目。

本机热路径 20 次补丁：中位数 8.68 → 6.63 ms（约 -24%，实际只省 2.05 ms）；p95 10.89 → 8.01 ms。不能据此承诺整体 AI 对话快 24%。模型生成/思考和是否重试占用秒级时间；中间包观察到的单段计数错误已程序修正；这仅减少该类错误的一轮往返，不能保证任意模型输出均不重试。

Token 是固定字符估算：初始化 1,543 → 181；Skill 5,125 → 182；默认视觉指导 3,194 → 728；全部工具 schema 7,780 → 6,864。常用 6 个工具约 2,988，但当前 ZCode 仍加载全部 19 个，未强制增加“先搜索工具”的一轮。**全部 schema 的 6,000 目标未达成，严格预算检查仍如实失败。**

## 发布前仍需完成

1. 重新获取有效 AWS 登录，核对实际 ECS 环境、Secrets 引用和当前 IAM；在正式授权发布时应用已准备的 bootstrap 权限，再执行生产预检。当前只读 Stripe 预检正常、线上 Agent/native 开关为 true，但这不等于 AWS 状态已核对。
2. Windows 原生窗口的人工交互、macOS 原生拖动/缩放、安装器升级流程、正式签名及 macOS 公证/Gatekeeper 路径。当前测试包不能冒充已签名公证的正式发行包。
3. 用户浏览器真实付款按要求未操作；建议正式发布前由用户自行验证一次真实 Checkout。测试包及报告保留具体未覆盖项，不以沙箱代替实付结论。
4. 未做 Intel Mac、Windows ARM、iPad/Pencil、长时间高并发压测、全部第三方科学 Widget 的人工渲染，以及 XLSX/扫描 PDF OCR 的本轮实机覆盖。

已执行的源码、几何、计费和隔离断言通过。模型关联参数错误及一次截图重试已如实记录；未覆盖项与生产环境前置条件仍需要单独验收。

## 证据

- [MCP 改造详细报告](mcp-efficiency-20260912.md)
- [Cloud 风险复查](release-readiness-20260912/cloud-code-review.md)
- [生产只读与部署前置条件](release-readiness-20260912/production-readonly.md)
- [付款与积分证据](release-readiness-20260912/billing.md)
- [文档与隔离证据](release-readiness-20260912/document-files.md)
- [最终 UAT 部署后验收](release-readiness-20260912/uat-frozen-acceptance.md)
- [真实 ZCode 最终打包服务调用](release-readiness-20260912/zcode-frozen-evidence.json)
- [中文最大缩放截图](release-readiness-20260912/ui-narrow-zh-125.png)

主任务负责设计、客户端/UI修复、集成、真实交互和最终 review；实现/测试子任务请求 Astra low，独立审查请求 Astra medium。这里按实际工具调用设置说明分工，不把子代理自述当作模型证明。真实 DeepSeek Flash 身份由请求日志核实。

## 最终安装包与可复核证据

macOS arm64 运行代码为 `1855396`。DMG 位于 `out/make/PenEcho-1.3.0.dmg`，ZIP 位于 `out/make/zip/darwin/arm64/PenEcho-darwin-arm64-1.3.0.zip`。DMG SHA-256：`e7479fa3cc651db7446a0209c8ca2f028a548c048a33d0b49e85a7e9796ca80d`；ZIP SHA-256：`a04d997caceb7adb5465ee4d4adb63e87ddce75c1fae9bd64e6a22196e7259c3`。

包内主页面、样式、补丁、MCP 协议与服务、窗口 PNG 图标逐字节匹配最终源码，48,676 个 ASAR 条目未包含被禁止的根级配置、测试目录或构建缓存。Electron 内实际加载 Sharp 0.35.4/libheif 1.23.2，WebP/AVIF 编解码通过。`codesign --verify --deep --strict` 通过，签名仍为 ad-hoc，不是正式签名/公证。

- [macOS 包内容及安装包校验和](release-readiness-20260912/mac-final-audit.json)
- [包内原生模块实测](release-readiness-20260912/mac-final-runtime.json)
- [实际打包服务拖动/缩放与源码更新](release-readiness-20260912/mac-final-browser-geometry-results.json)
- [原生活动编辑状态下源码更新](release-readiness-20260912/mac-final-active-source-results.json)
- [原生 Agent 零重试截图](release-readiness-20260912/mac-final-agent.png)
- [原生 HTML 按钮 Clicked](release-readiness-20260912/mac-final-widget-clicked.png)
- [最终 ZCode 可见结果](release-readiness-20260912/zcode-frozen-widget.png)

Windows x64 最终 Squirrel 安装包：`out/make/windows-x64/PenEcho-Setup-1.3.0-win-x64-1855396.exe`，253,029,376 字节，Mac/Windows 两端 SHA-256 一致：`40e5f711bcb46c52138a54de435eef558aef709abfef5ae79bdbd6513384ae5c`。包内 191 个分发源码文件逐字节匹配最终提交，48,670 个 ASAR 条目通过排除检查；实际 EXE 的 WebP/AVIF、HTTPS 信任、无凭据拒绝和 19 工具会话检查通过。实际 EXE 的 7 次 MCP 调用通过，包括正常补丁、错误计数单 hunk 一次成功（该次 23.8ms）、最终截图与源码/hash 一致。

- [Windows 构建及安装包摘要](release-readiness-20260912/windows-final-build.json)
- [Windows 包内源码审计](release-readiness-20260912/windows-final-audit.json)
- [Windows 全量测试口径](release-readiness-20260912/windows-final-tests.json)
- [Windows 原生图片模块](release-readiness-20260912/windows-final-runtime.jsonl)
- [Windows 实际 EXE 的 TLS/鉴权](release-readiness-20260912/windows-final-tls.jsonl)

最终 Windows Agent：5 次工具调用，其中首次创建因模型把 `widget-1` 对象 ID 当作关联 artifact ID 而被拒绝；模型自行去掉错误关联后成功创建，读取和源码 patch 一次成功，Version B 与按钮 Clicked 已核对。这是一次真实的模型参数重试，保留在结果中；本轮没有观察到 BUSY 或补丁计数重试。通过 SSH 转发操作实际 EXE 服务的页面，未声称原生 Windows 窗口已经人工验收。

- [Windows 最终 Agent 调用记录截图](release-readiness-20260912/windows-final-agent.png)
- [Windows 最终 Widget 显示及按钮](release-readiness-20260912/windows-final-widget.png)

Windows 最终 EXE 服务的浏览器入口也完成实际拖动和缩放：x/y/w/h 从 `1000 / 1000 / 1680 / 1200` 变为 `827.7415143603134 / 862.1932114882505 / 1359.5992167101826 / 971.1422976501304`。用移动前的源码哈希将 Version 3 更新为 Version 4，四项几何逐字段保持，源码和新哈希核对通过。

该次附带截图首次返回 `CAPTURE_FAILED`，源码修改已经成功。相同 requestId 重取幂等结果没有再次修改；随后按返回指引独立截图成功，`pixelVerified=true`、WebP 6,614 字节。因此本轮不承诺每次组合截图都零重试；截图失败与更新失败已经分别验证，不能将已成功写入当作失败重做。

- [Windows 最终 MCP 七次调用](release-readiness-20260912/windows-final-mcp.json)
- [Windows 拖动/缩放后的旧哈希 patch 与截图重试](release-readiness-20260912/windows-final-geometry.json)
- [Windows Version 4 可见结果](release-readiness-20260912/windows-final-geometry.png)

## 清理与交付状态

本次临时 macOS/Windows PenEcho 进程及 SSH 转发已关闭；Mac 的 3937/3938/3941/3942/23922、Windows 的 3942/3943/13922/50903/61010 测试端口已释放。仅删除本次自建的测试状态目录、AI 连接副本、浏览器 cookie 和临时凭据；保留源码、安装包及脱敏证据。用户原有 macOS 应用进程及 Windows 原安装的 9 个进程均未终止。UAT 保留运行供后续复核，测试付款自动续费已取消，测试会话已撤销。

运行代码已本地提交：客户端 `1855396`、Cloud `52a81ad`；本报告及证据另作纯文档提交，不改变被验收安装包的运行源码。未推送 GitHub、未删除分支、未发布或部署生产。

- [macOS 临时环境清理](release-readiness-20260912/cleanup-mac.json)
- [Windows 临时环境清理](release-readiness-20260912/cleanup-windows.json)
