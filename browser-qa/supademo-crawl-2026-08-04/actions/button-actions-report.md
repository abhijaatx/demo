# Button exercise report

The live-site button exercise was performed through the browser and retained in `button-actions-reference.json`.

| Outcome | Count |
| --- | ---: |
| Clicked and observed | 565 |
| Intentionally skipped with reason | 431 |
| Not found after reload | 84 |
| Not found after the action pass | 31 |
| Recorded error | 18 |
| Total discovered controls | 1,129 |

Skipped controls are explicit audit outcomes, not missing data. They cover duplicate sitewide navigation controls, disabled controls, authentication/download flows, and actions that could publish, submit, delete, or otherwise mutate external state. No credentials, personal data, uploads, or external submissions were entered.

For every route, the corresponding full-page screenshot is in `../reference/` and is linked by index in `../actions/route-crawl.json`.
