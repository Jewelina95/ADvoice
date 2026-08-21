from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "website" / "public"
DATA_OUT = PUBLIC / "data"
FIGURE_OUT = PUBLIC / "figures"


def load_yaml(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def channel_payload() -> list[dict]:
    specs = [
        ("clinical_interview", "结构化临床访谈", "患者/访谈员角色、问答轮次与患者语音", "临床访谈"),
        ("picture_description", "图片描述", "标准诱发任务，适合比较停顿、输出与语言组织", "图片描述"),
        ("structured_multitask", "结构化多任务", "按任务分别校准，再在受试者层融合", "结构化任务"),
        ("public_speech", "公开视频与自由讲话", "非标准采集，仅用于外部泛化和鲁棒性审计", "自由讲话"),
    ]
    dataset_specs = []
    for path in sorted((ROOT / "configs" / "datasets").glob("*.yaml")):
        if path.name == "registry.yaml":
            continue
        item = load_yaml(path)
        dataset_specs.append(item)

    profile_aliases = {
        "clinical_interview": {"clinical_interview"},
        "picture_description": {
            "picture_description",
            "picture_description_asr",
            "progression_multimodal_asr",
        },
        "structured_multitask": {
            "structured_multitask",
            "structured_task_asr",
            "talkbank_multitask",
            "spontaneous_multilingual_asr",
        },
        "public_speech": {"public_speech"},
    }
    payload = []
    for key, title, description, short_label in specs:
        config = load_yaml(ROOT / "configs" / "channels" / f"{key}.yaml")
        datasets = [
            {
                "id": item["dataset_id"],
                "name": item["display_name"],
                "language": item.get("language", "unknown"),
                "task": item.get("task_type", "unspecified"),
                "target": item.get("target_description", ""),
            }
            for item in dataset_specs
            if item.get("channel_profile") in profile_aliases[key]
        ]
        payload.append(
            {
                "id": key,
                "title": title,
                "shortLabel": short_label,
                "description": description,
                "enabledStates": config.get("enabled_states", []),
                "unavailableReasons": config.get("unavailable_reasons", {}),
                "datasets": datasets,
            }
        )
    return payload


def example_case() -> dict:
    source = ROOT / "artifacts" / "PREPARE_DrivenData" / "diagnostic_agent_report_batch.json"
    cases = json.loads(source.read_text(encoding="utf-8"))["cases"]
    case = next((item for item in cases if item["predicted_label"] == "MCI"), cases[0])
    return {
        "caseId": case["case_id"],
        "dataset": "PREPARE",
        "task": "结构化认知语音任务",
        "predictedLabel": case["predicted_label"],
        "probabilities": {"HC": 0.173, "MCI": 0.678, "AD": 0.149},
        "supportingEvidence": case["used_evidence_ids"],
        "counterEvidence": case["counterevidence_ids"],
        "qualityEvidence": case["quality_evidence_ids"],
        "reportSections": [
            paragraph.strip()
            for paragraph in case["report_zh"].split("\n\n")
            if paragraph.strip()
        ],
        "uncertainty": case["uncertainty_zh"],
        "trace": [
            {"stage": "片段", "value": "SEG-CC0822C60D / SEG-7B5F6FEC56", "note": "保留时间定位与静音/发声比例"},
            {"stage": "指标", "value": "speech_rate_wpm = 140.0", "note": "相对健康训练参考，方向 z = 0.50"},
            {"stage": "状态", "value": "S02 输出效率", "note": "轻度风险支持；S01、S03 为反证"},
            {"stage": "融合", "value": "MCI 67.8%", "note": "概率与证据冲突同时保留"},
            {"stage": "临床建议", "value": "进一步正式认知评估", "note": "不以语音结果替代临床诊断"},
        ],
    }


def copy_figures() -> None:
    FIGURE_OUT.mkdir(parents=True, exist_ok=True)
    source = ROOT / "reports" / "latest" / "assets"
    selected = {
        "figure_1_system_architecture.png": "system-architecture.png",
        "figure_2_dataset_landscape.png": "dataset-landscape.png",
        "figure_3_channel_state_matrix.png": "channel-state-matrix.png",
        "figure_10_metric_to_state_map.png": "metric-state-map.png",
    }
    for original, target in selected.items():
        shutil.copy2(source / original, FIGURE_OUT / target)


def main() -> None:
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    metrics = load_yaml(ROOT / "configs" / "metrics" / "audio_metrics.yaml")["metrics"]
    states_config = load_yaml(ROOT / "configs" / "states" / "audio_states.yaml")
    metrics_by_id = {item["id"]: item for item in metrics}
    states = []
    for state in states_config["states"]:
        states.append(
            {
                **state,
                "status": "enabled" if state.get("metrics") else "planned",
                "metricDetails": [metrics_by_id[item] for item in state.get("metrics", [])],
            }
        )

    snapshot = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "release": "Research preview · model under revision",
        "researchBoundary": "用于认知风险筛查与转诊支持，不用于阿尔茨海默病确诊。",
        "channels": channel_payload(),
        "states": states,
        "metrics": metrics,
        "example": example_case(),
    }
    (DATA_OUT / "project-snapshot.json").write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    copy_figures()


if __name__ == "__main__":
    main()
