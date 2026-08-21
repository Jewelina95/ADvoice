"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ArrowRight,
  AudioLines,
  BrainCircuit,
  Check,
  ChevronDown,
  CircleAlert,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Languages,
  Mic2,
  Network,
  SearchCheck,
  ShieldCheck,
  Stethoscope,
  TimerReset,
} from "lucide-react";
import { useState } from "react";

type Metric = {
  id: string;
  direction: number;
  reliability: number;
  role: string;
  report_permission: boolean;
  confounds: string[];
};

type State = {
  id: string;
  name_zh: string;
  branch: string;
  clinical_question: string;
  weights: number[];
  metricDetails: Metric[];
};

type Channel = {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  enabledStates: string[];
  datasets: { id: string; name: string; language: string }[];
};

type Snapshot = {
  generatedAt: string;
  release: string;
  researchBoundary: string;
  channels: Channel[];
  states: State[];
  example: {
    caseId: string;
    dataset: string;
    task: string;
    predictedLabel: string;
    probabilities: Record<string, number>;
    supportingEvidence: string[];
    counterEvidence: string[];
    reportSections: string[];
    uncertainty: string;
    trace: { stage: string; value: string; note: string }[];
  };
};

type DemoMetric = {
  metric_id: string;
  state_id: string;
  value: number;
  unit: string;
  reference_median: number;
  directional_z: number;
  reliability: number;
  confound_tags: string[];
  report_permission: boolean;
};

type DemoState = {
  state_id: string;
  name_zh: string;
  branch: string;
  state_z: number;
  confidence: number;
  category: string;
  supporting_metrics: string[];
  counter_evidence: string[];
};

type DemoResult = {
  example_type: string;
  task: string;
  input: { audio: string; transcript: string };
  qc: { duration_sec: number; sample_rate_hz: number; word_count: number; audio_reliability: number; text_reliability: number };
  metric_evidence: DemoMetric[];
  state_cards: DemoState[];
  fusion: {
    branch_weights: Record<string, number>;
    branch_scores: Record<string, number>;
    review_signal: number;
    recommendation: string;
    diagnostic_probability: null;
  };
  trace: { stage: string; value: string; note: string }[];
  report_zh: string[];
  limitations: string[];
};

const CATEGORY_LABELS: Record<string, string> = {
  normal: "未见明显异常",
  borderline: "边界范围",
  impaired: "异常方向",
  unreliable: "证据不足",
};

export function ResearchSite({ snapshot, demo }: { snapshot: Snapshot; demo: DemoResult }) {
  const [runNumber, setRunNumber] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="ADvoice 首页">
          <span className="wordmark-mark"><AudioLines size={18} /></span>
          <span>ADvoice</span>
        </a>
        <nav aria-label="主要导航">
          <a href="#overview">Overview</a>
          <a href="#flow">Method</a>
          <a href="#evidence">Example</a>
          <a href="#code">Code</a>
        </nav>
        <a className="github-link" href="https://github.com/Jewelina95/ADvoice" target="_blank" rel="noreferrer">
          GitHub <ExternalLink size={15} />
        </a>
      </header>

      <section id="top" className="hero">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <p className="project-status"><span /> Research preview · model module under revision</p>
          <p className="eyebrow">Speech-based cognitive screening</p>
          <h1>ADvoice</h1>
          <p className="hero-lead">
            A task-aware and evidence-governed framework that converts speech into traceable clinical states for cognitive-risk screening.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#flow">Explore the framework <ArrowRight size={17} /></a>
            <a className="plain-link" href="#evidence">View one example</a>
          </div>
          <p className="boundary"><ShieldCheck size={17} /> {snapshot.researchBoundary}</p>
        </div>
      </section>

      <section id="overview" className="section overview-section">
        <div className="section-title">
          <p className="eyebrow">Overview</p>
          <h2>From predictive features to reviewable evidence</h2>
        </div>
        <div className="overview-copy">
          <p>
            现有语音认知筛查通常直接从声学或文本表示预测标签，但不同采集任务、说话人角色和录音质量会改变同一指标的含义。ADvoice 在预测之前明确任务边界，并把每个指标转换为带有方向、可靠度、混杂因素和报告权限的证据对象。
          </p>
          <p>
            这些证据先组合成可解释的临床状态，再进入融合模型与诊断 Agent。最终结论可以返回到原始片段、指标和状态，而不是只给出一个无法核查的概率。
          </p>
        </div>

        <div className="contribution-list">
          {[
            ["01", "Task-aware routing", "先区分图片描述、临床访谈、结构化任务和自由讲话，避免跨任务误用指标。", Mic2],
            ["02", "MetricEvidence", "每个数值同时携带临床方向、可靠度、缺失、混杂与医生报告权限。", SearchCheck],
            ["03", "State-guided fusion", "同类证据先形成临床状态，模型学习状态与分支贡献，而不是平铺全部特征。", BrainCircuit],
            ["04", "Shared trace", "诊断、反证、不确定性和报告共享同一条片段到结论的回溯链。", GitBranch],
          ].map(([index, title, description, Icon]) => (
            <article key={String(index)}>
              <span className="contribution-number">{index as string}</span>
              <div className="contribution-icon"><Icon size={22} /></div>
              <div><h3>{title as string}</h3><p>{description as string}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section id="flow" className="section flow-section">
        <div className="section-title narrow">
          <p className="eyebrow">Construction flow</p>
          <h2>One constrained path from speech to clinical review</h2>
          <p>模型融合仍可替换，但输入、证据、状态和回溯契约保持稳定。</p>
        </div>

        <ol className="construction-flow">
          {[
            ["Route the input", "识别任务、语言、说话人角色与可用模态", Database],
            ["Extract evidence", "计算声学、言语行为、语言与互动指标", AudioLines],
            ["Calibrate", "仅用训练折健康对照建立参考范围", TimerReset],
            ["Estimate states", "在可靠度与混杂约束下完成状态内融合", Network],
            ["Fuse and reason", "融合分支表示，诊断 Agent 审理支持与反证", BrainCircuit],
            ["Report and trace", "输出筛查建议并保留完整证据路径", Stethoscope],
          ].map(([title, detail, Icon], index) => (
            <li key={String(title)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <Icon size={21} />
              <div><strong>{title as string}</strong><p>{detail as string}</p></div>
            </li>
          ))}
        </ol>

        <figure className="main-figure">
          <img src="/figures/system-architecture.png" alt="ADvoice architecture from data channels to evidence, clinical states, fusion, and report" />
          <figcaption><strong>Figure 1.</strong> ADvoice architecture and evidence flow. The current fusion module can be replaced without changing the evidence contract.</figcaption>
        </figure>
      </section>

      <section className="section channel-section">
        <div className="section-title narrow">
          <p className="eyebrow">Data channels</p>
          <h2>Four input contexts, one evidence contract</h2>
        </div>
        <div className="channel-grid">
          {snapshot.channels.map((channel, index) => (
            <article key={channel.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{channel.title}</h3>
              <p>{channel.description}</p>
              <div className="channel-meta">
                <small>{channel.enabledStates.length} states enabled</small>
                <small><Languages size={13} /> {channel.datasets.map((item) => item.language).filter((item, i, all) => all.indexOf(item) === i).join(" · ")}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="evidence" className="section evidence-section">
        <div className="section-title narrow">
          <p className="eyebrow">Runnable example</p>
          <h2>播放一段语音，复现完整证据路径</h2>
          <p>该示例使用合成的 Cookie Theft 图片描述语音，不含患者数据。仓库脚本读取同一 WAV 和转录，并生成网页下方展示的全部结果。</p>
        </div>

        <div className="demo-input-grid">
          <article className="demo-audio-card">
            <div className="demo-card-heading">
              <div><p className="eyebrow">Input 01 · Audio</p><h3>Cookie Theft 图片描述</h3></div>
              <span>synthetic demo</span>
            </div>
            <audio controls preload="metadata" src="/demo/cookie_theft_demo.wav">
              <track kind="captions" src="/demo/cookie_theft_demo.vtt" srcLang="en" label="English" default />
              浏览器不支持音频播放。
            </audio>
            <div className="demo-qc-row">
              <span>{demo.qc.duration_sec.toFixed(1)} 秒</span>
              <span>{demo.qc.sample_rate_hz / 1000} kHz</span>
              <span>{demo.qc.word_count} 词</span>
            </div>
            <blockquote>{demo.input.transcript}</blockquote>
          </article>

          <article className="demo-command-card">
            <p className="eyebrow">Input 02 · Run</p>
            <h3>一条命令重建输出</h3>
            <pre><code>python3 demo/run_demo.py</code></pre>
            <p>替换 <code>--audio</code> 和 <code>--transcript</code> 后，可检查另一段 16-bit PCM WAV。</p>
            <button className="primary-button" onClick={() => setRunNumber((value) => value + 1)}>
              <BrainCircuit size={17} /> 重放处理结果
            </button>
            <div className="demo-downloads">
              <a href="/demo/advoice_demo_bundle.zip" download>下载可运行示例包 <Download size={14} /></a>
              <a href="/demo/demo_result.json" target="_blank" rel="noreferrer">查看 JSON 输出 <ExternalLink size={14} /></a>
              <a href="https://github.com/Jewelina95/ADvoice/tree/main/demo" target="_blank" rel="noreferrer">打开示例代码 <ExternalLink size={14} /></a>
            </div>
          </article>
        </div>

        <div className="demo-results" key={runNumber}>
          <div className="run-status"><Check size={17} /><span>Run {String(runNumber).padStart(2, "0")} complete</span><b>{demo.metric_evidence.length} metrics · {demo.state_cards.length} states · 1 report</b></div>

          <div className="demo-result-heading">
            <p className="eyebrow">Output 01 · MetricEvidence</p>
            <h3>每个指标同时保留值、健康参考、方向、可靠度和混杂因素</h3>
          </div>
          <div className="demo-metric-table" role="table" aria-label="示例指标证据">
            <div className="demo-metric-header" role="row"><span>Metric</span><span>Value</span><span>HC median</span><span>Risk z</span><span>Reliability</span><span>Use</span></div>
            {demo.metric_evidence.map((metric) => (
              <div className="demo-metric-row" role="row" key={metric.metric_id}>
                <span><b>{metric.metric_id}</b><small>{metric.state_id} · {metric.confound_tags.join(" / ")}</small></span>
                <span>{metric.value.toFixed(3)} <small>{metric.unit}</small></span>
                <span>{metric.reference_median.toFixed(3)}</span>
                <span className={metric.directional_z > 0.5 ? "risk-value" : "counter-value"}>{metric.directional_z > 0 ? "+" : ""}{metric.directional_z.toFixed(2)}</span>
                <span>{metric.reliability.toFixed(2)}</span>
                <span className="metric-permission">{metric.report_permission ? <><Check size={14} /> report</> : <><CircleAlert size={14} /> model</>}</span>
              </div>
            ))}
          </div>

          <div className="demo-result-heading state-result-heading">
            <p className="eyebrow">Output 02 · StateCards</p>
            <h3>同一任务内，指标先在状态内部完成可靠度加权</h3>
          </div>
          <div className="demo-state-grid">
            {demo.state_cards.map((state) => (
              <article key={state.state_id}>
                <div><span>{state.state_id}</span><b>{CATEGORY_LABELS[state.category] ?? state.category}</b></div>
                <h3>{state.name_zh}</h3>
                <div className="state-score"><strong>{state.state_z.toFixed(2)}</strong><small>state z</small></div>
                <p>可信度 {state.confidence.toFixed(2)}</p>
                <dl>
                  <div><dt>支持</dt><dd>{state.supporting_metrics.join(" · ") || "无"}</dd></div>
                  <div><dt>反证</dt><dd>{state.counter_evidence.join(" · ") || "无"}</dd></div>
                </dl>
              </article>
            ))}
          </div>

          <div className="demo-fusion-grid">
            <article className="demo-fusion-card">
              <p className="eyebrow">Output 03 · Fusion</p>
              <h3>状态外分支融合</h3>
              {Object.entries(demo.fusion.branch_weights).map(([branch, weight]) => (
                <div className="branch-row" key={branch}>
                  <span>{branch.replaceAll("_", " ")}</span>
                  <div><i style={{ width: `${weight * 100}%` }} /></div>
                  <b>{(weight * 100).toFixed(0)}%</b>
                </div>
              ))}
              <div className="demo-recommendation"><small>Review signal {demo.fusion.review_signal.toFixed(2)} · not a probability</small><strong>{demo.fusion.recommendation}</strong></div>
            </article>

            <article className="demo-trace-card">
              <p className="eyebrow">Output 04 · Shared trace</p>
              <h3>从输入回到建议</h3>
              {demo.trace.map((item, index) => (
                <div className="demo-trace-row" key={item.stage}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><b>{item.stage}</b><strong>{item.value}</strong><small>{item.note}</small></div>
                </div>
              ))}
            </article>
          </div>

          <button className="report-toggle" onClick={() => setReportOpen((open) => !open)} aria-expanded={reportOpen}>
            <FileText size={18} /> {reportOpen ? "收起筛查报告" : "查看生成的筛查报告"} <ChevronDown className={reportOpen ? "rotated" : ""} size={17} />
          </button>
          {reportOpen && (
            <div className="doctor-report">
              <div><Stethoscope size={22} /><span><small>Generated output</small><strong>认知语音任务筛查报告</strong></span></div>
              {demo.report_zh.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
          )}

          <div className="demo-boundary">
            <ShieldCheck size={18} />
            <p>这是方法复现实例：音频为合成语音，健康参考仅含聚合统计，不包含个体记录；公开脚本不输出 AD 诊断概率。</p>
          </div>
        </div>
      </section>

      <section id="code" className="section code-section">
        <div className="section-title narrow">
          <p className="eyebrow">Code & reproducibility</p>
          <h2>Repository structure</h2>
          <p>公开仓库保留方法概述、一个可运行案例和明确输出；完整训练数据、诊断模型与内部评估不随演示发布。</p>
        </div>
        <div className="code-layout">
          <div className="quick-start">
            <div><Code2 size={20} /><strong>Quick start</strong></div>
            <pre><code>{`git clone https://github.com/Jewelina95/ADvoice.git
cd ADvoice
python3 demo/run_demo.py`}</code></pre>
          </div>
          <div className="repository-assets">
            <a href="/demo/advoice_demo_bundle.zip" download><Download size={20} /><span><strong>Runnable demo bundle</strong><small>WAV · transcript · reference · Python</small></span><ExternalLink size={15} /></a>
            <a href="/demo/demo_result.json" target="_blank" rel="noreferrer"><Database size={20} /><span><strong>Expected output</strong><small>MetricEvidence · StateCards · trace · report</small></span><ExternalLink size={15} /></a>
            <a href="/figures/system-architecture.png" target="_blank" rel="noreferrer"><Network size={20} /><span><strong>Architecture figure</strong><small>publication-ready method overview</small></span><ExternalLink size={15} /></a>
          </div>
        </div>
      </section>

      <footer>
        <div><span className="wordmark-mark"><AudioLines size={17} /></span><strong>ADvoice</strong></div>
        <p>Research preview · Not a diagnostic device</p>
        <p>Snapshot {new Date(snapshot.generatedAt).toLocaleDateString("zh-CN")}</p>
      </footer>
    </main>
  );
}
