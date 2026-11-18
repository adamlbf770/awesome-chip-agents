# Chipmind

<!-- metadata
{
  "id": "chipmind",
  "title": "Chipmind",
  "name": "Chipmind",
  "direction": "agent-infrastructure",
  "date": null,
  "date_basis": "unknown",
  "tags": [
    "commercial",
    "eda-flow",
    "infrastructure",
    "tool-use",
    "vendor-report"
  ],
  "types": [
    "platform"
  ],
  "links": [
    {
      "label": "Chipmind",
      "url": "https://www.chipmind.ai/",
      "kind": "source"
    },
    {
      "label": "Chipmind technology: Chipgraph, agent harness and acceptance gates",
      "url": "https://www.chipmind.ai/technology",
      "kind": "source"
    }
  ],
  "related": [],
  "also_in": [],
  "summary": [
    "Combines a source-derived design graph, agent harness, EDA acceptance gates, and RTL Canvas review; capabilities are vendor-reported.",
    "结合源码设计图谱、Agent Harness、EDA 验收门槛与 RTL Canvas 审查；能力为厂商报告。"
  ]
}
-->

<!-- resource:start -->
[English index](../../README.md) · [中文索引](../../README_zh.md) · [Direction](README.md) · [本方向](README_zh.md) · [Tags / 标签](../tags/README.md)

- **Date / 日期：** Not recorded / 待核实
- **Date basis / 日期依据：** Date not recorded / 日期待核实
- **Type / 类型：** Tool / platform / 工具 / 平台
- **Direction / 方向：** Agent Infrastructure and Overviews / Agent 基础设施与综述
- **Tags / 标签：** [Commercial platform / 商业平台](../tags/commercial.md) · [EDA workflows / EDA 流程](../tags/eda-flow.md) · [Infrastructure / 基础设施](../tags/infrastructure.md) · [Tool use / 工具调用](../tags/tool-use.md) · [Vendor-reported / 厂商报告](../tags/vendor-report.md)

## Links / 相关链接

- **Source / 原始来源：** [Chipmind](https://www.chipmind.ai/)
- **Source / 原始来源：** [Chipmind technology: Chipgraph, agent harness and acceptance gates](https://www.chipmind.ai/technology)
- **Paper / 论文：** No separate paper link recorded / 暂未记录独立论文链接。

**Repository / 仓库：** No related public repository link recorded / 暂未记录相关公开仓库链接。
<!-- resource:end -->

## English

### Tools and Platforms

[Chipmind](https://www.chipmind.ai/) — Commercial agents for design, integration, debugging, and documentation within existing EDA flows. Its [technology description](https://www.chipmind.ai/technology) combines Chipgraph, parsed from SystemVerilog, with a design-specific agent harness that dispatches tools to customer infrastructure and returns changes for RTL Canvas review.

The illustrated acceptance gates use a Python golden model, Verilator simulation, Yosys synthesis checks, and YAML rules. The vendor explicitly limits “harness-verified RTL” to the task's simulation and synthesis evidence; formal equivalence remains on the roadmap. On-premises, VPC, and air-gapped deployment are described. Capabilities are vendor-reported; the linked pages do not establish a first-public date.

## 简体中文

### 工具与平台

[Chipmind](https://www.chipmind.ai/) — 在现有 EDA 流程内执行设计、集成、调试与文档任务的商业 Agent。其[技术说明](https://www.chipmind.ai/technology)将 SystemVerilog 解析得到的 Chipgraph 与针对设计定制的 Agent Harness 结合，把工具任务派发到客户基础设施，并通过 RTL Canvas 审查修改。

示例验收门槛包括 Python 参考模型、Verilator 仿真、Yosys 综合检查与 YAML 规则。厂商明确将“harness-verified RTL”限定为任务所定义的仿真与综合证据，形式等价仍属路线图；同时介绍了本地、VPC 与隔离网络部署。具体能力为厂商报告；所链接页面未确定首次公开日期。
