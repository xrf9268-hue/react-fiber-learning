# Roadmap

## Overall Strategy

This project follows a staged, evidence-driven path:

1. Build the mental model first.
2. Verify against a minimal set of official source files.
3. Turn the verified understanding into teaching modules.
4. Add diagrams, trace walkthroughs, and review notes.
5. Only then polish the repo structure and consider remote sync.

## Module Plan

### M0 — Project framing and source map
**Goal**
- Fix scope, learning sequence, quality bar, and official source entry points.

**Success definition**
- Repo skeleton exists.
- Roadmap exists.
- Official source reading map exists.
- Progress tracker exists.

**Evidence**
- `README.md`
- `STATUS.md`
- `docs/roadmap.md`
- `docs/source-map.md`

---

### M1 — Why Fiber exists
**Goal**
- Explain the real limits of the old recursive reconciler and the user-facing problems Fiber solves.

**Success definition**
- Can explain interruption, responsiveness, and priority in plain language.
- Distinguishes problem statement from modern implementation details.

---

### M2 — Fiber node and traversal
**Goal**
- Explain Fiber as a data structure and traversal model.

**Success definition**
- Can explain `child / sibling / return / alternate` clearly.
- Includes a diagram or trace for traversal.

---

### M3 — current / workInProgress / render / commit
**Goal**
- Build the core mental model of React's two-tree work cycle.

**Success definition**
- Can explain why render is interruptible and commit is not.
- Can explain effect timing at a high level.

---

### M4 — Trace one update end to end
**Goal**
- Trace a single `setState` from Hook dispatch to commit.

**Success definition**
- Includes a function-by-function walkthrough.
- Includes what can be simplified and what must stay precise.

---

### M5 — lanes, scheduler, transition
**Goal**
- Explain modern priority management without overstating "multi-threading".

**Success definition**
- Can explain lanes, transitions, and scheduler cooperation correctly.

---

### M6 — Suspense / Offscreen / React 19 deltas
**Goal**
- Add the advanced but bounded extension layer.

**Success definition**
- Keeps core and advanced layers clearly separated.

---

### M7 — Final synthesis and polish
**Goal**
- Produce a final high-quality study path and polished diagrams.

**Success definition**
- Repo is readable front to back.
- Final handbook or index exists.
- Module status is complete and reviewed.
