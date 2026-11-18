# Viv

<!-- metadata
{
  "id": "silogy-viv",
  "title": "Viv",
  "name": "Silogy / Viv",
  "direction": "verification-debugging",
  "date": null,
  "date_basis": "unknown",
  "tags": [
    "debugging",
    "waveform",
    "tool-use",
    "commercial",
    "vendor-report"
  ],
  "types": [
    "platform"
  ],
  "links": [
    {
      "label": "Silogy: Viv verification agent",
      "url": "https://silogy.io/",
      "kind": "source"
    },
    {
      "label": "Viv documentation",
      "url": "https://docs.silogy.io/",
      "kind": "source"
    }
  ],
  "related": [],
  "also_in": [],
  "summary": [
    "Uses LLM agents to investigate failing verification tests through code, logs, specifications, and waveforms; vendor-reported.",
    "使用 LLM Agent 结合代码、日志、规格与波形调查验证失败；能力为厂商报告。"
  ]
}
-->

<!-- resource:start -->
[English index](../../README.md) · [中文索引](../../README_zh.md) · [Direction](README.md) · [本方向](README_zh.md) · [Tags / 标签](../tags/README.md)

- **Date / 日期：** Not recorded / 待核实
- **Date basis / 日期依据：** Date not recorded / 日期待核实
- **Type / 类型：** Tool / platform / 工具 / 平台
- **Direction / 方向：** Verification, Debugging and Specifications / 验证、调试与规格推断
- **Tags / 标签：** [Debugging / 调试](../tags/debugging.md) · [Waveforms / 波形分析](../tags/waveform.md) · [Tool use / 工具调用](../tags/tool-use.md) · [Commercial platform / 商业平台](../tags/commercial.md) · [Vendor-reported / 厂商报告](../tags/vendor-report.md)

## Links / 相关链接

- **Source / 原始来源：** [Silogy: Viv verification agent](https://silogy.io/)
- **Source / 原始来源：** [Viv documentation](https://docs.silogy.io/)
- **Paper / 论文：** No separate paper link recorded / 暂未记录独立论文链接。

**Repository / 仓库：** No related public repository link recorded / 暂未记录相关公开仓库链接。
<!-- resource:end -->

## English

[Viv](https://docs.silogy.io/) — Silogy's commercial LLM agent for root-cause analysis of failing digital-verification tests using code, logs, specifications, and waveforms. Official documentation covers FST/VCD/FSDB analysis, CLI and CI use, multi-hypothesis investigations, regression triage, and suggested patches.

Viv runs in customer infrastructure and uses the configured LLM provider, including external APIs or vLLM-compatible endpoints; data residency depends on that provider configuration. Capabilities and speed claims are vendor-reported. The linked pages do not establish a first-public date.

## 简体中文

[Viv](https://docs.silogy.io/) — Silogy 用于数字验证失败根因分析的商业 LLM Agent，结合代码、日志、规格与波形。官方文档涵盖 FST/VCD/FSDB 分析、CLI 与 CI 使用、多假设调查、回归分类及修复补丁建议。

Viv 运行在客户基础设施中，并调用所配置的 LLM 提供方，包括外部 API 或兼容 vLLM 的端点；数据是否出域取决于该配置。功能与加速说法为厂商报告，所链接页面未确定首次公开日期。
