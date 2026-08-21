# Public runnable example

This example demonstrates the public ADvoice evidence contract without shipping licensed patient recordings or the private trained diagnostic model.

```bash
python3 demo/run_demo.py
```

The command reads:

- `demo/input/cookie_theft_demo.wav`: synthetic Cookie Theft description;
- `demo/input/cookie_theft_demo.txt`: matching transcript;
- `demo/input/cookie_theft_demo.vtt`: synchronized captions for the recording;
- `demo/reference_profile.json`: aggregate HC training reference with no individual records.

It writes `demo/output/demo_result.json`, containing MetricEvidence objects, three task-relevant StateCards, branch fusion, a trace map, and a screening-support report. Replace `--audio` and `--transcript` to inspect another 16-bit PCM WAV recording.

This is a method demonstration, not a diagnostic tool.
