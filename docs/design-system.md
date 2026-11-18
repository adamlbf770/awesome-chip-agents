# Website design system / 网站设计规范

## Foundation / 基础

The website uses React + Vite, Tailwind CSS v4, and shadcn/ui with Radix primitives. `site/components.json` records the registry and import aliases. The editable component sources live in `site/src/components/ui/`; the shared brand, typography, radius, and surface tokens live in `site/src/style.css`.

网站采用 React + Vite、Tailwind CSS v4 与基于 Radix 的 shadcn/ui。`site/components.json` 记录组件来源和路径别名；可维护的组件源码位于 `site/src/components/ui/`，品牌色、字号、圆角和表面颜色统一在 `site/src/style.css` 定义。

Keep the green palette and chip illustration. Use semantic tokens such as `primary`, `muted-foreground`, `card`, and `border`. The current theme is light. Inter is self-hosted; Chinese text uses system Chinese fonts. No external font service is required.

保留绿色主题与芯片插画。使用 `primary`、`muted-foreground`、`card` 和 `border` 等语义颜色。目前采用浅色主题；Inter 字体随网站托管，中文使用系统字体，无需外部字体服务。

## Type and spacing / 字号与间距

Sizes use rem, with a browser default of 16px. English and Chinese share the same scale; Chinese headings avoid negative letter spacing.

字号使用 rem，以浏览器默认 16px 为基准。中英文共用字号层级，中文标题不采用负字距。

| Role / 用途 | Default size / 默认字号 | Rule / 规则 |
| --- | --- | --- |
| Body, resource summaries, search and select / 正文、资源说明、搜索和选择框 | 16px | Line height 1.75 / 行高 1.75 |
| Intro text / 页面导语 | 18px | Line height 1.7–1.75 / 行高 1.7–1.75 |
| Card titles / 卡片标题 | 20px | Sidebar panel titles 18px / 侧栏标题 18px |
| Section titles / 栏目标题 | 24–30px | Scale with available width / 随可用宽度调整 |
| Eyebrows, action links, navigation, field labels / 栏目提示、操作链接、导航、表单标签 | 14px | Keep on mobile / 手机端保持字号 |
| Tags, dates, counts in card footers, source timestamps / 标签、日期、卡片底部计数、来源时间 | 13px | Supporting information / 辅助信息 |

Use Tailwind's 4px spacing scale; prefer 8, 12, 16, 24, 32, 48, and 64px. Standard controls are at least 44px tall; primary large actions are 48px. Tag links are at least 32px tall and wrap. Card padding is 24px, compact sidebar panels 16px. The shared radius is 12px, with smaller controls and tags derived from it.

间距使用 Tailwind 的 4px 刻度，优先采用 8、12、16、24、32、48、64px。标准控件至少高 44px，主要大按钮为 48px；标签链接至少高 32px，并允许换行。卡片内边距 24px，紧凑侧栏 16px；统一基础圆角为 12px，控件和标签圆角由此派生。

## Components and responsive layout / 组件与响应式

Use `Button` for actions, `Badge` for resource tags, composed `Card` sections for resources and panels, `FieldGroup` + `Field` + `FieldLabel` for forms, `InputGroup` for search, `NativeSelect` for filters, `Empty` for no results, and `Separator` for dividers. Preserve semantic headings and visible keyboard focus. Native selects retain the platform's mobile picker.

操作使用 `Button`，资源标签使用 `Badge`，资源与侧栏使用完整组合的 `Card`，表单使用 `FieldGroup` + `Field` + `FieldLabel`，搜索使用 `InputGroup`，筛选使用 `NativeSelect`，无结果使用 `Empty`，分隔使用 `Separator`。保留语义标题和清晰的键盘焦点，原生下拉框在手机上使用系统选择器。

Change component defaults centrally instead of overriding colors and typography at each call site. Use page classes for layout. On narrow screens, wrap headings and actions and reduce grid columns rather than shrinking body and control text. Keep resource detail prose at 16px in both layouts.

组件的字号、颜色和默认尺寸集中维护，页面样式负责布局。窄屏时让标题和操作换行、减少网格列数，保持正文与控件的可读字号；详情正文在桌面和手机端均为 16px。

## Maintenance / 维护

From `site/`, add components using `npx shadcn@latest add <name>`. Existing sources contain deliberate readability changes; review upstream diffs before updating them. Run the production build and static-page checks, then check both languages at desktop and mobile widths. Verify search, filters, keyboard focus, and language switching. See [frontend commands](../site/README.md).

在 `site/` 中使用 `npx shadcn@latest add <name>` 添加组件。现有源码已按可读性要求调整，更新组件前先查看上游差异。运行生产构建与静态页面检查，再检查中英文的桌面和手机排版，以及搜索、筛选、键盘焦点和语言切换。命令见[前端说明](../site/README.md)。
