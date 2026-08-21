# Model replacement contract

The website treats the current fusion model as a replaceable snapshot.

1. Update and evaluate the model in the parent `8.21` project.
2. Preserve the existing output contracts for MetricEvidence, StateCards, and de-identified case traces.
3. Run `npm run sync:data` in this website directory.
4. Inspect the generated `public/data/project-snapshot.json`.
5. Run `npm test` before publication.

Stable website content:

- research problem and screening boundary;
- data-channel logic;
- MetricEvidence and StateCard definitions;
- trace stages and report permissions;
- one representative case path.

Replaceable content:

- fusion weights and learned experts;
- model version and release status;
- de-identified case probabilities and report text.

Internal performance tables, baseline comparisons, and failure-mode audits are not part of this public recap repository.

Do not modify the website to make a model appear better. Any new value must originate from the locked evaluation artifacts.
