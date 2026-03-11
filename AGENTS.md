# AGENTS.md — React Fiber Learning Project

This file defines the project-local execution rules for the long-running React Fiber learning repo.

## Project Goal

Build a high-quality Chinese study repo for understanding React Fiber from the official React 18/19 codebase, using a concept-first path plus minimal but precise source verification.

## Canonical State Sources

Always treat these as the primary continuity objects for this project:

1. `STATUS.md`
2. `checkpoints/*.md`
3. `docs/modules/*.md`
4. Git history inside this repo

Do not rely on chat memory alone for project state.

## Learning Baseline

- Primary baseline: **React v18.2.0**
- Delta comparison target: **React main**
- Learn the stable skeleton first, then compare newer extensions.

## Local Upstream Source Mirrors

Prefer local source mirrors over ad-hoc remote browsing when checking React internals:

- `../tmp/react-upstream/react-v18.2.0`
- `../tmp/react-upstream/react-main`

If they drift or are missing, refresh them before deep source work.

## Module Execution Rules

- Work module by module.
- Keep each work package bounded.
- Each module should aim to produce, where applicable:
  - plan
  - evidence notes
  - draft
  - self-review
  - compare notes or diagram notes
  - commit-readiness note

## Hard Continuation Rules

These rules exist because this project is long-running and must not silently stall.

1. **Do not treat a user-facing progress update as continuation.**
   A short report is not progress by itself.

2. **When a bounded subagent work package finishes and the project is still active and unfinished, immediately start the next concrete work package or review/commit-readiness package.**
   Do this before or immediately after any short update.

3. **Treat the project as truly in progress only if at least one of these is true:**
   - a dedicated worker is active, or
   - substantive project files were updated recently, or
   - a new checkpoint/status update was created as part of real work.

4. **If there is no active worker and the remaining task is multi-step, resume with a dedicated subagent rather than trying to hold everything in the main session.**

5. **If a module is ready for a clean local milestone commit, commit it instead of endlessly polishing.**

## Progress Definition

Use explicit evidence, not intention.

Good signals of progress:
- new or updated files in `docs/modules/`
- new or updated `STATUS.md`
- new or updated `checkpoints/*.md`
- local milestone commit created

Bad signals:
- only saying "I will continue"
- only discussing next steps without starting them
- only having completed subagents with no next package started

## Commit Boundary Rules

- Prefer clean local milestone commits.
- A commit should correspond to a coherent module milestone.
- Do not mix half-finished future modules into the current milestone unless clearly intentional.

## Teaching Style Rules

- Chinese,书面语、通俗易懂
- Concept first, evidence oriented
- Do not drown the learner in source details too early
- Keep module boundaries clean:
  - M1 = why Fiber exists
  - M2 = Fiber node and traversal
  - M3 = current / workInProgress / render / commit
  - M4 = one `setState` trace
  - M5+ = priority / lanes / scheduler / advanced topics

## Quality Bar

Before calling a module "ready", check:
- Is the scope still bounded?
- Are official sources or official source files cited?
- Is the explanation understandable without reading the whole React repo?
- Are misconceptions explicitly handled?
- Is there a self-review note?
- Is the next action clear: polish, commit, or next module?

## Default Next-Step Logic

When unsure what to do next, prefer this order:
1. finish the current module package
2. produce commit-readiness
3. create local milestone commit if ready
4. plan the next module
5. execute the next module
