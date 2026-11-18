# Flux

<!-- metadata
{
  "id": "flux-ai",
  "title": "Flux",
  "name": "Flux.ai",
  "direction": "board-system-design",
  "date": null,
  "date_basis": "unknown",
  "tags": [
    "board",
    "system",
    "tool-use",
    "commercial",
    "vendor-report"
  ],
  "types": [
    "platform"
  ],
  "links": [
    {
      "label": "Flux: How Flux works",
      "url": "https://www.flux.ai/copilot",
      "kind": "source"
    },
    {
      "label": "Flux in Your AI Tools: Use the Flux Agent From Claude Code, Cursor, and Any MCP Client",
      "url": "https://www.flux.ai/p/blog/flux-mcp-in-your-ai-tools",
      "kind": "source"
    }
  ],
  "related": [],
  "also_in": [
    "agent-infrastructure"
  ],
  "summary": [
    "Hardware-design agent for schematics and PCBs, with engineering checks and MCP access for external agents; vendor-reported.",
    "面向原理图与 PCB 的硬件设计 Agent，支持工程检查及外部 Agent 通过 MCP 接入；能力为厂商报告。"
  ]
}
-->

<!-- resource:start -->
[English index](../../README.md) · [中文索引](../../README_zh.md) · [Direction](README.md) · [本方向](README_zh.md) · [Tags / 标签](../tags/README.md)

- **Date / 日期：** Not recorded / 待核实
- **Date basis / 日期依据：** Date not recorded / 日期待核实
- **Type / 类型：** Tool / platform / 工具 / 平台
- **Direction / 方向：** Board, Packaging and System Design / 板级、封装与系统设计
- **Tags / 标签：** [Board / PCB / 板级 / PCB](../tags/board.md) · [System design / 系统设计](../tags/system.md) · [Tool use / 工具调用](../tags/tool-use.md) · [Commercial platform / 商业平台](../tags/commercial.md) · [Vendor-reported / 厂商报告](../tags/vendor-report.md)

## Links / 相关链接

- **Source / 原始来源：** [Flux: How Flux works](https://www.flux.ai/copilot)
- **Source / 原始来源：** [Flux in Your AI Tools: Use the Flux Agent From Claude Code, Cursor, and Any MCP Client](https://www.flux.ai/p/blog/flux-mcp-in-your-ai-tools)
- **Paper / 论文：** No separate paper link recorded / 暂未记录独立论文链接。

**Repository / 仓库：** No related public repository link recorded / 暂未记录相关公开仓库链接。
<!-- resource:end -->

## English

[Flux](https://www.flux.ai/copilot) — Commercial hardware-design agent working with project requirements, components, schematics, PCB layout, firmware, and engineering checks. Its documentation describes direct design edits, ERC/DRC, simulations, and preparation of manufacturing files.

The [MCP announcement](https://www.flux.ai/p/blog/flux-mcp-in-your-ai-tools) (2026-10) documents access from external AI clients to project data and delegation of hardware-design jobs to the cloud Flux agent. Capabilities are vendor-reported. This is distinct from the unrelated FluxEDA execution-infrastructure paper. The MCP announcement does not establish the platform's initial release date.

## 简体中文

[Flux](https://www.flux.ai/copilot) — 商业硬件设计 Agent，可围绕项目需求、元器件、原理图、PCB 布局、固件与工程检查开展工作。官方文档介绍了直接编辑设计、ERC/DRC、仿真及制造文件准备。

[MCP 公告](https://www.flux.ai/p/blog/flux-mcp-in-your-ai-tools)（2026-10）说明外部 AI 客户端可读取项目数据，并将硬件设计任务委派给云端 Flux Agent。能力为厂商报告。此项目与 FluxEDA 执行基础设施论文无关；MCP 公告日期不代表平台首次发布日期。
