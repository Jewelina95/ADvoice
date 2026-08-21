# ADvoice

<p align="center">
  <img src="public/figures/system-architecture.png" alt="ADvoice evidence-governed speech screening framework" width="980" />
</p>

Task-aware, evidence-governed speech screening for traceable cognitive-risk assessment.

## Overview

ADvoice converts audio, transcripts, task metadata, and speaker roles into reviewable evidence. Instead of mapping a flat feature vector directly to a label, the framework routes each recording by task, constructs MetricEvidence objects, estimates clinical StateCards, and preserves a shared trace from source evidence to screening recommendation.

The repository includes one synthetic picture-description recording that can be processed locally without patient data or external dependencies. The public example demonstrates the evidence contract; it does not ship the private diagnostic model and does not output an Alzheimer disease probability.

## Key contributions

- **Task-aware routing** separates picture description, clinical interview, structured tasks, and free speech before metrics are interpreted.
- **MetricEvidence** attaches direction, reliability, missingness, confounds, and report permission to each metric.
- **State-guided fusion** combines related evidence into clinically named states before branch-level fusion.
- **Shared trace** links the screening recommendation and report back to the same metrics and state evidence.

## Quick start

```bash
git clone https://github.com/Jewelina95/ADvoice.git
cd ADvoice
python3 demo/run_demo.py
```

No Python packages are required. The command reads the bundled WAV and transcript, then writes `demo/output/demo_result.json`.

## Runnable example

The example contains:

| File | Purpose |
|---|---|
| `demo/input/cookie_theft_demo.wav` | Synthetic Cookie Theft picture-description speech |
| `demo/input/cookie_theft_demo.txt` | Transcript used by the language metrics |
| `demo/reference_profile.json` | Aggregate healthy-control training reference; no individual records |
| `demo/run_demo.py` | Audio/text extraction, calibration, state estimation, fusion, trace, and report |
| `demo/output/demo_result.json` | Expected machine-readable output |

Run another 16-bit PCM WAV with its transcript:

```bash
python3 demo/run_demo.py \
  --audio /path/to/recording.wav \
  --transcript /path/to/transcript.txt \
  --out /path/to/result.json
```

## Construction flow

1. Identify task, language, speaker role, and available modality.
2. Extract acoustic, speech-behavior, language, and interaction metrics.
3. Convert each metric into a MetricEvidence object using a training-fold reference.
4. Fuse reliable, nonmissing evidence within each clinical StateCard.
5. Combine state branches into a screening-review signal.
6. Generate a report and preserve the input-to-report trace.

## Expected output

The bundled example produces 10 MetricEvidence objects, three StateCards, two branch contributions, a screening recommendation, and a five-stage trace. `diagnostic_probability` is deliberately `null`: this public demonstration validates the processing path, not the private trained diagnostic model.

## Research website

To run the project page locally:

```bash
npm install
npm run dev
```

The deployed page includes the same playable audio, transcript, evidence table, state cards, fusion result, trace, and generated report.

## Data and clinical boundary

- The bundled speech is synthetic and is not a patient recording.
- The reference profile contains aggregate statistics only.
- Licensed datasets, identifiable records, internal benchmark reports, and private model weights are excluded.
- ADvoice is designed for screening and referral support, not Alzheimer disease diagnosis.
