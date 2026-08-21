"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ArrowRight,
  AudioLines,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  CircleAlert,
  Code2,
  Database,
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

const FEATURED_STATES = ["S01", "S02", "S07"];

function directionLabel(direction: number) {
  if (direction > 0) return "升高提示风险方向";
  if (direction < 0) return "降低提示风险方向";
  return "无固定疾病方向";
}

export function ResearchSite({ snapshot }: { snapshot: Snapshot }) {
  const featured = snapshot.states.filter((state) => FEATURED_STATES.includes(state.id));
  const [activeStateId, setActiveStateId] = useState(featured[0]?.id ?? "S01");
  const [reportOpen, setReportOpen] = useState(false);
  const activeState = featured.find((state) => state.id === activeStateId) ?? featured[0];

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
          <p className="eyebrow">One worked example</p>
          <h2>MetricEvidence → StateCard → traceable conclusion</h2>
          <p>这里只展示三个代表性状态和一个去标识病例，用于说明方法，不展示完整内部评估。</p>
        </div>

        <div className="state-tabs" role="tablist" aria-label="代表性临床状态">
          {featured.map((state) => (
            <button key={state.id} className={state.id === activeStateId ? "active" : ""} onClick={() => setActiveStateId(state.id)} role="tab" aria-selected={state.id === activeStateId}>
              <span>{state.id}</span>{state.name_zh}
            </button>
          ))}
        </div>

        {activeState && (
          <div className="state-example">
            <div className="state-card">
              <span className="state-code">{activeState.id}</span>
              <p className="eyebrow">StateCard</p>
              <h3>{activeState.name_zh}</h3>
              <p>{activeState.clinical_question}</p>
              <dl>
                <div><dt>分支</dt><dd>{activeState.branch.replaceAll("_", " ")}</dd></div>
                <div><dt>输出</dt><dd>normal / borderline / impaired / unreliable</dd></div>
                <div><dt>证据</dt><dd>支持指标 + 反证 + 原始片段</dd></div>
              </dl>
            </div>

            <div className="metric-evidence">
              <div className="metric-heading"><p className="eyebrow">MetricEvidence</p><h3>状态内证据与固定先验权重</h3></div>
              <div className="metric-list">
                {activeState.metricDetails.map((metric, index) => (
                  <div className="metric-row" key={metric.id}>
                    <div><strong>{metric.id}</strong><small>{directionLabel(metric.direction)}</small></div>
                    <div className="weight"><span style={{ width: `${(activeState.weights[index] ?? 0) * 100}%` }} /><b>{((activeState.weights[index] ?? 0) * 100).toFixed(0)}%</b></div>
                    <div className="metric-permission">{metric.report_permission ? <><Check size={14} /> reportable</> : <><CircleAlert size={14} /> model only</>}</div>
                    <small className="metric-note">基础可靠度 {metric.reliability.toFixed(2)} · 混杂 {metric.confounds.join(", ")}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="case-example">
          <div className="case-summary">
            <p className="eyebrow">De-identified case</p>
            <span>{snapshot.example.caseId} · {snapshot.example.dataset}</span>
            <h3>{snapshot.example.predictedLabel} screening support</h3>
            <p>{snapshot.example.uncertainty}</p>
            <div className="probabilities">
              {Object.entries(snapshot.example.probabilities).map(([label, value]) => (
                <div key={label} className={label === snapshot.example.predictedLabel ? "selected" : ""}>
                  <span>{label}</span><strong>{(value * 100).toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="trace-list">
            {snapshot.example.trace.map((item, index) => (
              <div key={item.stage}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><small>{item.stage}</small><strong>{item.value}</strong><p>{item.note}</p></div>
              </div>
            ))}
          </div>
        </div>

        <button className="report-toggle" onClick={() => setReportOpen((open) => !open)} aria-expanded={reportOpen}>
          <FileText size={18} /> {reportOpen ? "Hide example report" : "Open example report"} <ChevronDown className={reportOpen ? "rotated" : ""} size={17} />
        </button>
        {reportOpen && (
          <div className="doctor-report">
            <div><Stethoscope size={22} /><span><small>Clinical screening report</small><strong>语音认知筛查支持报告</strong></span></div>
            {snapshot.example.reportSections.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        )}
      </section>

      <section id="code" className="section code-section">
        <div className="section-title narrow">
          <p className="eyebrow">Code & reproducibility</p>
          <h2>Repository structure</h2>
          <p>与 PlatonicRep 相同，GitHub 首页只保留方法概述、构建流程和复现入口；完整实验结果留在内部报告。</p>
        </div>
        <div className="code-layout">
          <div className="quick-start">
            <div><Code2 size={20} /><strong>Quick start</strong></div>
            <pre><code>{`git clone https://github.com/Jewelina95/ADvoice.git
cd ADvoice
npm install
npm run dev`}</code></pre>
          </div>
          <div className="repository-assets">
            <a href="/data/project-snapshot.json" target="_blank" rel="noreferrer"><Database size={20} /><span><strong>Project snapshot</strong><small>channels · metrics · states · example</small></span><ExternalLink size={15} /></a>
            <a href="/figures/system-architecture.png" target="_blank" rel="noreferrer"><Network size={20} /><span><strong>Architecture figure</strong><small>publication-ready method overview</small></span><ExternalLink size={15} /></a>
            <a href="https://github.com/WMD-group/PlatonicRep" target="_blank" rel="noreferrer"><BookOpen size={20} /><span><strong>Reference repository</strong><small>PlatonicRep organization reference</small></span><ExternalLink size={15} /></a>
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
