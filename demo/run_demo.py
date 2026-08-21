#!/usr/bin/env python3
"""Run the public ADvoice evidence-to-state demonstration.

This script intentionally stops at screening support. It does not claim to
reproduce the private diagnostic model or provide an AD diagnosis.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import statistics
import struct
import wave
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent

METRIC_SPECS = {
    "silence_fraction": {"state": "S01", "direction": 1, "base_reliability": 0.85, "unit": "ratio", "confounds": ["VAD threshold", "task duration"]},
    "long_pause_rate_min": {"state": "S01", "direction": 1, "base_reliability": 0.82, "unit": "events/min", "confounds": ["VAD threshold", "task type"]},
    "pause_mean_sec": {"state": "S01", "direction": 1, "base_reliability": 0.80, "unit": "s", "confounds": ["VAD threshold"]},
    "pause_p90_sec": {"state": "S01", "direction": 1, "base_reliability": 0.78, "unit": "s", "confounds": ["VAD threshold"]},
    "voiced_fraction": {"state": "S02", "direction": -1, "base_reliability": 0.84, "unit": "ratio", "confounds": ["task type", "microphone gain"]},
    "speech_run_mean_sec": {"state": "S02", "direction": -1, "base_reliability": 0.78, "unit": "s", "confounds": ["VAD threshold", "task type"]},
    "speech_run_rate_min": {"state": "S02", "direction": 1, "base_reliability": 0.72, "unit": "runs/min", "confounds": ["task type"]},
    "speech_rate_wpm": {"state": "S02", "direction": -1, "base_reliability": 0.82, "unit": "words/min", "confounds": ["task type", "transcript quality"]},
    "pronoun_ratio": {"state": "S07", "direction": 1, "base_reliability": 0.78, "unit": "ratio", "confounds": ["language", "transcript quality", "task type"]},
    "content_word_ratio": {"state": "S07", "direction": -1, "base_reliability": 0.62, "unit": "ratio", "confounds": ["language", "POS proxy", "transcript quality"]}
}

STATE_SPECS = {
    "S01": {"name_zh": "停顿与流畅性负担", "branch": "speech_behavior", "metrics": ["silence_fraction", "long_pause_rate_min", "pause_mean_sec", "pause_p90_sec"], "weights": [0.35, 0.25, 0.20, 0.20]},
    "S02": {"name_zh": "输出效率", "branch": "speech_behavior", "metrics": ["voiced_fraction", "speech_run_mean_sec", "speech_run_rate_min", "speech_rate_wpm"], "weights": [0.25, 0.20, 0.20, 0.35]},
    "S07": {"name_zh": "词汇提取与具体性", "branch": "language", "metrics": ["pronoun_ratio", "content_word_ratio"], "weights": [0.65, 0.35]}
}

PRONOUNS = {"i", "you", "he", "she", "it", "we", "they", "this", "that", "someone", "something"}
STOPWORDS = {"a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "is", "are", "was", "were", "be", "been", "with", "for"}


def percentile(values: list[float], fraction: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    position = (len(ordered) - 1) * fraction
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def run_lengths(flags: list[bool], target: bool, step_sec: float) -> list[float]:
    runs: list[float] = []
    count = 0
    for flag in flags:
        if flag is target:
            count += 1
        elif count:
            runs.append(count * step_sec)
            count = 0
    if count:
        runs.append(count * step_sec)
    return runs


def read_pcm_wav(path: Path) -> tuple[list[float], int]:
    with wave.open(str(path), "rb") as handle:
        channels = handle.getnchannels()
        sample_width = handle.getsampwidth()
        sample_rate = handle.getframerate()
        frame_count = handle.getnframes()
        raw = handle.readframes(frame_count)
    if sample_width != 2:
        raise ValueError("The public demo accepts 16-bit PCM WAV files.")
    unpacked = struct.unpack(f"<{frame_count * channels}h", raw)
    if channels == 1:
        mono = unpacked
    else:
        mono = [sum(unpacked[i:i + channels]) / channels for i in range(0, len(unpacked), channels)]
    return [float(value) / 32768.0 for value in mono], sample_rate


def audio_metrics(path: Path) -> tuple[dict[str, float], dict[str, float]]:
    samples, sample_rate = read_pcm_wav(path)
    sample_mean = statistics.fmean(samples) if samples else 0.0
    samples = [value - sample_mean for value in samples]
    duration = len(samples) / sample_rate
    frame_size = max(1, round(sample_rate * 0.025))
    hop_size = max(1, round(sample_rate * 0.010))
    rms = []
    for start in range(0, max(1, len(samples) - frame_size + 1), hop_size):
        frame = samples[start:start + frame_size]
        rms.append(math.sqrt(sum(value * value for value in frame) / max(1, len(frame))))
    rms_db = [20.0 * math.log10(max(value, 1e-8)) for value in rms]
    threshold_db = max(-50.0, percentile(rms_db, 0.90) - 35.0)
    silent = [value < threshold_db for value in rms_db]
    voiced = [not value for value in silent]
    pause_runs = run_lengths(silent, True, hop_size / sample_rate)
    speech_runs = run_lengths(voiced, True, hop_size / sample_rate)
    silence_fraction = sum(silent) / max(1, len(silent))
    speech_db = [value for value, flag in zip(rms_db, voiced) if flag]
    noise_db = [value for value, flag in zip(rms_db, silent) if flag]
    snr_proxy = statistics.median(speech_db) - statistics.median(noise_db) if noise_db else 30.0
    clipping = sum(abs(value) >= 0.999 for value in samples) / max(1, len(samples))
    audio_reliability = max(0.0, min(1.0,
        0.25
        + 0.25 * min(duration / 45.0, 1.0)
        + 0.25 * max(0.0, min(snr_proxy / 25.0, 1.0))
        + 0.15 * max(0.0, min((sum(voiced) / max(1, len(voiced))) / 0.5, 1.0))
        + 0.10 * (1.0 - min(clipping / 0.01, 1.0))
    ))
    return {
        "duration_sec": duration,
        "silence_fraction": silence_fraction,
        "long_pause_rate_min": sum(value >= 0.50 for value in pause_runs) / max(duration / 60.0, 1e-6),
        "pause_mean_sec": statistics.fmean(pause_runs) if pause_runs else 0.0,
        "pause_p90_sec": percentile(pause_runs, 0.90),
        "voiced_fraction": 1.0 - silence_fraction,
        "speech_run_mean_sec": statistics.fmean(speech_runs) if speech_runs else 0.0,
        "speech_run_rate_min": len(speech_runs) / max(duration / 60.0, 1e-6),
    }, {
        "sample_rate_hz": sample_rate,
        "vad_threshold_db": threshold_db,
        "frame_count": len(rms),
        "snr_proxy_db": snr_proxy,
        "clipping_fraction": clipping,
        "audio_reliability": audio_reliability
    }


def text_metrics(text: str, duration_sec: float) -> tuple[dict[str, float], dict[str, int]]:
    words = re.findall(r"[a-z']+", text.lower())
    word_count = len(words)
    content_count = sum(word not in STOPWORDS for word in words)
    adjacent_repairs = sum(left == right for left, right in zip(words, words[1:]))
    return {
        "speech_rate_wpm": word_count / max(duration_sec / 60.0, 1e-6),
        "pronoun_ratio": sum(word in PRONOUNS for word in words) / max(1, word_count),
        "content_word_ratio": content_count / max(1, word_count),
    }, {"word_count": word_count, "adjacent_repairs": adjacent_repairs}


def metric_evidence(values: dict[str, float], reference: dict, audio_reliability: float, text_reliability: float) -> list[dict]:
    evidence = []
    for metric_id, spec in METRIC_SPECS.items():
        value = values[metric_id]
        ref = reference["metrics"][metric_id]
        robust_z = (value - ref["median"]) / ref["scale"]
        directional_z = robust_z * spec["direction"]
        if metric_id == "speech_rate_wpm":
            source_reliability = min(audio_reliability, text_reliability)
        elif metric_id in {"pronoun_ratio", "content_word_ratio"}:
            source_reliability = text_reliability
        else:
            source_reliability = audio_reliability
        reliability = spec["base_reliability"] * source_reliability
        evidence.append({
            "metric_id": metric_id,
            "state_id": spec["state"],
            "value": round(value, 4),
            "unit": spec["unit"],
            "reference_median": round(ref["median"], 4),
            "robust_z": round(robust_z, 3),
            "directional_z": round(directional_z, 3),
            "reliability": round(reliability, 3),
            "missing": False,
            "confound_tags": spec["confounds"],
            "report_permission": reliability >= 0.60
        })
    return evidence


def category(score: float, confidence: float) -> str:
    if confidence < 0.45:
        return "unreliable"
    if score < 0.50:
        return "normal"
    if score < 1.50:
        return "borderline"
    return "impaired"


def state_cards(evidence: list[dict]) -> list[dict]:
    by_id = {item["metric_id"]: item for item in evidence}
    cards = []
    for state_id, spec in STATE_SPECS.items():
        rows = [by_id[item] for item in spec["metrics"]]
        weighted_reliability = sum(weight * row["reliability"] for weight, row in zip(spec["weights"], rows))
        score = sum(weight * row["reliability"] * max(-3.0, min(3.0, row["directional_z"])) for weight, row in zip(spec["weights"], rows)) / max(weighted_reliability, 1e-6)
        support = sorted((row for row in rows if row["directional_z"] >= 0.30), key=lambda row: row["directional_z"], reverse=True)
        counter = sorted((row for row in rows if row["directional_z"] <= -0.30), key=lambda row: row["directional_z"])
        cards.append({
            "state_id": state_id,
            "name_zh": spec["name_zh"],
            "branch": spec["branch"],
            "state_z": round(score, 3),
            "confidence": round(weighted_reliability, 3),
            "category": category(score, weighted_reliability),
            "supporting_metrics": [row["metric_id"] for row in support],
            "counter_evidence": [row["metric_id"] for row in counter],
            "metric_weights": {metric_id: weight for metric_id, weight in zip(spec["metrics"], spec["weights"])}
        })
    return cards


def fuse_states(cards: list[dict]) -> dict:
    branch_weights = {"speech_behavior": 0.58, "language": 0.42}
    branch_scores = {}
    for branch in branch_weights:
        selected = [card for card in cards if card["branch"] == branch]
        total_confidence = sum(card["confidence"] for card in selected)
        branch_scores[branch] = sum(card["state_z"] * card["confidence"] for card in selected) / max(total_confidence, 1e-6)
    review_signal = sum(branch_weights[name] * max(0.0, branch_scores[name]) for name in branch_weights)
    if review_signal >= 1.5:
        recommendation = "建议进入正式认知评估路径"
    elif review_signal >= 0.6:
        recommendation = "建议结合主诉进行量表复核"
    else:
        recommendation = "当前示例未形成明确转诊支持"
    return {
        "branch_weights": branch_weights,
        "branch_scores": {key: round(value, 3) for key, value in branch_scores.items()},
        "review_signal": round(review_signal, 3),
        "recommendation": recommendation,
        "diagnostic_probability": None
    }


def build_report(cards: list[dict], fusion: dict) -> list[str]:
    ordered = sorted(cards, key=lambda card: card["state_z"], reverse=True)
    findings = "；".join(f"{card['name_zh']}为{card['category']}（状态分数 {card['state_z']:.2f}，可信度 {card['confidence']:.2f}）" for card in ordered)
    return [
        f"本次演示结论：{fusion['recommendation']}。该输出仅展示证据处理流程，不是阿尔茨海默病诊断概率。",
        f"任务内状态：{findings}。",
        "系统保留了每个指标相对健康训练参考的方向、可靠度、混杂因素和报告权限，因此状态结论可以回到具体计算值。",
        "如用于真实受试者，仍需结合标准认知量表、病史、日常功能和临床检查进行判断。"
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the public ADvoice demonstration")
    parser.add_argument("--audio", type=Path, default=ROOT / "input" / "cookie_theft_demo.wav")
    parser.add_argument("--transcript", type=Path, default=ROOT / "input" / "cookie_theft_demo.txt")
    parser.add_argument("--reference", type=Path, default=ROOT / "reference_profile.json")
    parser.add_argument("--out", type=Path, default=ROOT / "output" / "demo_result.json")
    args = parser.parse_args()

    transcript = args.transcript.read_text(encoding="utf-8").strip()
    reference = json.loads(args.reference.read_text(encoding="utf-8"))
    acoustic, qc = audio_metrics(args.audio)
    language, text_qc = text_metrics(transcript, acoustic["duration_sec"])
    values = {**acoustic, **language}
    text_reliability = min(0.95, 0.55 + 0.40 * min(text_qc["word_count"] / 50.0, 1.0))
    evidence = metric_evidence(values, reference, qc["audio_reliability"], text_reliability)
    cards = state_cards(evidence)
    fusion = fuse_states(cards)
    result = {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "example_type": "synthetic_public_demonstration",
        "task": "Cookie Theft picture description",
        "input": {"audio": args.audio.name, "transcript": transcript},
        "qc": {**qc, **text_qc, "text_reliability": text_reliability, "duration_sec": round(acoustic["duration_sec"], 3)},
        "metric_evidence": evidence,
        "state_cards": cards,
        "fusion": fusion,
        "trace": [
            {"stage": "Input", "value": args.audio.name, "note": "16-bit PCM WAV + transcript"},
            {"stage": "MetricEvidence", "value": f"{len(evidence)} evidence objects", "note": "value + reference + reliability + confounds"},
            {"stage": "StateCards", "value": ", ".join(card["state_id"] for card in cards), "note": "within-state reliability-weighted fusion"},
            {"stage": "Fusion", "value": str(fusion["review_signal"]), "note": "branch-level review signal, not disease probability"},
            {"stage": "Report", "value": fusion["recommendation"], "note": "screening support only"}
        ],
        "report_zh": build_report(cards, fusion),
        "limitations": [
            "The bundled audio is synthetic and is not a patient recording.",
            "The aggregate reference contains no individual-level data.",
            "The public demo does not ship the private trained diagnostic model."
        ]
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {args.out}")
    print(f"Review signal: {fusion['review_signal']:.3f}")
    print(f"Recommendation: {fusion['recommendation']}")


if __name__ == "__main__":
    main()
