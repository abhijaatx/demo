# Architecture Decision Record (ADR) — Editor State & Document Model Architecture

- **Status**: Accepted
- **Task**: TASK-060 — Qualify the Editor Foundation
- **Date**: 2026-07-28

---

## Context & Problem Statement

The Supademo Creator Editor requires a responsive, offline-capable, and optimistic presentation editing environment. Creators build interactive walkthroughs containing 1–200+ steps, each with hotspots, callouts, and audio narrations.

---

## Decision Drivers

1. **Deterministic State Synchronization**: Autosave and undo/redo must guarantee zero data loss during network interruptions or tab crashes.
2. **Performance at Scale**: Editing 200 steps must remain under 50ms interaction latency budgets.
3. **Optimistic Concurrency Control**: Multi-user or multi-tab edits must be cleanly detected and resolved via revision numbers without overwriting remote progress.

---

## Decisions

1. **Canonical Normalized Document Schema**: All editor components consume a single immutable `DemoDocument` schema with normalized 0–100% canvas coordinates.
2. **Command Pattern Undo/Redo**: All document mutations execute via typed `EditorCommand` instances, guaranteeing deterministic execution and reversal.
3. **Local Draft Journaling**: Unsaved changes are mirrored to `localStorage` under `supademo_draft_journal_*` prior to background network dispatch.
4. **Optimistic Revisions**: Drafts maintain strict incremental `revisionNumber` counters; database updates verify expected revision numbers via PostgreSQL row checks.
