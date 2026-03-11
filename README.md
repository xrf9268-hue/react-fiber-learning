# React Fiber Learning Project

A structured study-and-explanation project for understanding React Fiber from the official React 18/19 codebase, without starting from raw source overload.

## Goal

Produce a high-quality Chinese learning repo that:

1. Explains **why Fiber exists**.
2. Builds a correct mental model for **Fiber node / double buffering / render vs commit / lanes / scheduling**.
3. Uses **minimal official source verification** instead of full-repo archaeology.
4. Organizes learning into reviewable modules with checkpoints, self-review, and Git history.

## Working Principles

- Start from stable concepts, then verify in source.
- Split the work into reviewable modules.
- Each module must define: scope, success criteria, evidence, and open questions.
- Prefer diagrams, small trace examples, and official file references over vague summaries.
- React 18.2 is the baseline learning skeleton; React main / 19 is used for delta comparison.

## Planned Modules

- M0: project framing and study map
- M1: why Fiber exists
- M2: Fiber node and tree traversal
- M3: current / workInProgress / render / commit
- M4: one `setState` update traced end to end
- M5: lanes, priority, transition, scheduler
- M6: Suspense / Offscreen / modern React 19 deltas
- M7: final study guide, diagrams, review, polish

## Deliverable Style

- Chinese,书面语、通俗易懂
- Conclusion first, then key evidence, then next step
- Diagrams where they materially help
- Limited but precise code excerpts and file references

## Status

See `STATUS.md` and `docs/roadmap.md`.
