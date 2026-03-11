# M1 — Why Fiber Exists: research plan

## Scope

This module should answer one bounded question: **why React needed Fiber as a new reconciliation architecture**, not merely what Fiber’s data structure looks like.

In scope:
- The product and rendering problems Fiber was introduced to solve.
- The shift from effectively non-interruptible/synchronous rendering toward interruptible work.
- Why separating render work from commit work matters.
- How Fiber became the foundation for later capabilities surfaced in React 18 (concurrent rendering, transitions, Suspense integration, streaming SSR).
- A light note on current/main-branch terminology changes where useful.

Out of scope for M1:
- Full walkthrough of Fiber node fields.
- Detailed scheduler/lane implementation.
- Exhaustive history of every React 16–19 API.
- Performance claims that are not backed by official sources.

## Success definition

A good M1 artifact lets a learner explain, in plain language and with official evidence, that:
1. **Fiber was introduced because React needed finer control over rendering work**, especially the ability to pause, resume, prioritize, or discard in-progress render work.
2. **The key problem was user experience under large updates**, where fully synchronous rendering can block the main thread and delay visible responsiveness.
3. **Fiber is an internal architecture change**, not itself a public feature; its importance is that it unlocks later features.
4. **React preserves UI consistency by deferring mutations to commit**, even when render work is interruptible.
5. **React 18’s concurrent features are the clearest modern proof of why Fiber exists**, even though Fiber shipped earlier.

## Key misconceptions to avoid

- **“Fiber exists mainly to make React faster.”**
  - Too vague and often misleading. Official sources emphasize *interruptibility, prioritization, background preparation, and responsiveness*, not raw speed as the sole goal.

- **“Fiber = Concurrent React.”**
  - Not exactly. Fiber is the architectural foundation; concurrent rendering is a later rendering capability built on that foundation.

- **“Fiber means React mutates the DOM incrementally during partial renders.”**
  - Official React 18 material says React keeps the UI consistent by waiting to perform DOM mutations until the end of the render/commit process.

- **“Fiber was only about time slicing.”**
  - Time-slicing-like interruptibility matters, but official framing also includes priority, aborting stale work, reusable state patterns, Suspense, and background preparation.

- **“Fiber was a React 18 change.”**
  - Wrong timeline. Fiber arrived with React 16, while React 18 exposes major user-facing capabilities built on the newer concurrent renderer.

- **“Async rendering means commits are async in an unconstrained way.”**
  - The official material distinguishes render-phase work from commit-phase effects/mutations; this distinction is crucial.

## Official evidence targets

### React 18.2 baseline (primary teaching baseline)

Use these as the core evidence base because they explain the motivation most clearly in today’s language.

1. **React v18 blog post**  
   `https://react.dev/blog/2022/03/29/react-v18`
   - Key claims to anchor:
     - concurrency is a behind-the-scenes mechanism.
     - rendering is interruptible.
     - React may start, pause, continue later, or abandon render work.
     - React waits to perform DOM mutations until the end.
     - this enables background preparation and keeps the UI responsive.
     - transitions, Suspense, and streaming SSR are built on this foundation.

2. **React 18 upgrade guide**  
   `https://react.dev/blog/2022/03/08/react-18-upgrade-guide`
   - Use mainly for:
     - concurrent rendering is opt-in via new features.
     - behavior changes surface because rendering can be interruptible.
     - StrictMode helps detect issues related to reusable/interrupted work.

3. **React reconciler source (v18.2.0)**  
   - `packages/react-reconciler/src/ReactFiberWorkLoop.old.js`
   - `packages/react-reconciler/src/ReactFiberLane.old.js`
   - Use selectively, not as the first teaching surface.
   - Good for confirming terminology like sync vs concurrent work, yielding, priorities/lanes, render/commit split.

### Historical support (official, but secondary)

4. **React v16.0 release post**  
   `https://legacy.reactjs.org/blog/2017/09/26/react-v16.0.html`
   - Use carefully for timeline: Fiber shipped in React 16.
   - Treat as historical evidence, not the clearest explanation of “why”.

5. **Update on Async Rendering**  
   `https://legacy.reactjs.org/blog/2018/03/27/update-on-async-rendering.html`
   - Useful for explaining why older lifecycle assumptions break once render and commit can be separated by delay/interruption.
   - Especially useful evidence for the render-phase vs commit-phase distinction.

### Main / React 19 delta notes (only where relevant)

6. **Current `main` reconciler files**
   - `packages/react-reconciler/src/ReactFiberWorkLoop.js`
   - `packages/react-reconciler/src/ReactFiberLane.js`
   - Use only to note that the architecture continues to revolve around interruptible work, priorities/lanes, and a render/commit split.
   - Do **not** let current internals derail the teaching goal for M1.

### Evidence hierarchy rule

If wording conflicts, prefer:
1. React 18 blog/official docs language for conceptual claims.
2. Historical official blog posts for timeline and migration context.
3. Source code only for implementation confirmation, not for first-principles explanation.

## Recommended explanation order for teaching

1. **Start with the user-facing problem, not internals**
   - Old mental model: once React starts a big render, the work is effectively one uninterrupted synchronous transaction.
   - Why that hurts: large updates can block the main thread and make interactions feel delayed.

2. **State the architectural need**
   - React needed a way to break rendering work into manageable units so it could prioritize urgent updates and avoid wasting work on stale renders.

3. **Introduce Fiber as the answer**
   - Fiber is the internal reconciliation architecture that makes that control possible.
   - Keep the description functional: pause, resume, prioritize, abort, reuse work.

4. **Explain the safety invariant**
   - Interruptible render work does **not** mean partially committed UI.
   - React maintains consistency by waiting until commit to apply DOM mutations.

5. **Connect the architecture to modern React 18 outcomes**
   - concurrent rendering
   - transitions (urgent vs non-urgent updates)
   - Suspense behavior during background rendering
   - streaming SSR / selective hydration context where relevant

6. **Only then mention timeline**
   - Fiber shipped in React 16.
   - React 18 is where the motivation becomes easiest to see publicly because the concurrent renderer’s benefits are finally exposed in mainstream APIs.

7. **Defer low-level internals to later modules**
   - fiber node shape, alternate trees, lanes, scheduler hooks, etc.

## Compact review checklist

- [ ] Opens with the problem Fiber solves, not a definition dump.
- [ ] Uses official React 18 sources as the main evidence base.
- [ ] States clearly that Fiber is an internal foundation, not a public feature.
- [ ] Explains interruptible rendering in plain language.
- [ ] Explains why React delays DOM mutations until commit.
- [ ] Connects Fiber to responsiveness and stale-work cancellation/prioritization.
- [ ] Avoids overstating “performance” as raw speed.
- [ ] Notes React 16 timeline and React 18 visibility without conflating them.
- [ ] Keeps source-code details secondary to conceptual clarity.
- [ ] Leaves lanes/scheduler/fiber fields for later modules.

## Suggested thesis sentence for M1

**Fiber exists because React needed an internal architecture that could treat rendering work as interruptible, prioritizable, and discardable, so the UI could stay responsive while React prepared consistent updates in the background.**
