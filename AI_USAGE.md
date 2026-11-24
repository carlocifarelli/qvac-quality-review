# AI use

**At runtime (part of the solution).** The review and verify stages run Claude Code headless (`claude -p`, `claude-opus-5-5`) as a read-only agent in the target checkout; they can also run on a local model through any OpenAI-compatible server (measured on QVAC in `case-studies/qvac/results/local-qvac*/`, not used for the confirmed findings). Every model answer is schema-validated, its anchor re-checked against the file, challenged by a second adversarial pass, and cached in `state/cache/` so the outputs are inspectable. No finding was filed on model output alone: in the QVAC case study each confirmed one was reproduced by a script in `verification/` or verified by reading the cited code, as recorded per finding in `state/overrides.json`.

**At build time.** I used Claude Code as a pair programmer for code, reproduction scripts and documentation drafts. I set the architecture, scope, ranking, prompts and acceptance criteria, and reviewed, ran and corrected the output.

**Not delegated:** deciding that a finding is real and worth a maintainer's time.
