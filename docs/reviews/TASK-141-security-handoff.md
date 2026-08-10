# Security Review & Handoff — TASK-141: Produce the HTML-Cloning Threat Model and Constraints

## Overview

- **Task**: TASK-141 — Produce the HTML-cloning threat model and constraints
- **Status**: Completed & Verified
- **Scope**: `@supademo/domain` (`packages/domain/src/html-cloning-policy.ts`)

---

## Technical Changes & Architecture

- **HTML-Cloning Security Policy**: Implemented `createHtmlCloningPolicyConfig`.

---

## Security Controls & Mitigations

1. **Strict Tag & Attribute Blacklisting**: Disallows `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>` tags and `onclick`/`onload` attributes.
2. **DOM Depth & Node Boundaries**: Limits DOM tree depth to 50 levels and total node count to 10,000 to prevent resource exhaustion attacks.

---

## Verification Evidence

- `npm run verify` -> Passed.
- `npm test` -> All tests passed.
