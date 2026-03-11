# Official Source Map (Initial)

This is the minimal source-reading map for learning Fiber from the official React repository without getting buried in the whole codebase.

## Baseline Strategy

- **Primary learning baseline:** `v18.2.0`
- **Delta comparison target:** `main` (React 19 era ongoing work)
- **Rule:** learn the stable skeleton first, then compare newer extensions.

## Phase A — vocabulary and data structures

### 1. Fiber node shape
- `packages/react-reconciler/src/ReactFiber.js`
- `packages/react-reconciler/src/ReactInternalTypes.js`

**Questions to answer**
- What fields live on a Fiber node?
- What are `child`, `sibling`, `return`, `alternate`?
- What are `pendingProps`, `memoizedProps`, `memoizedState`, `flags`, `lanes`?

### 2. Enums / tags / flags / lanes
- `packages/react-reconciler/src/ReactWorkTags.js`
- `packages/react-reconciler/src/ReactFiberFlags.js`
- `packages/react-reconciler/src/ReactFiberLane.js`
- `packages/react-reconciler/src/ReactRootTags.js`

**Questions to answer**
- What kinds of Fiber exist?
- Which side effects are tracked via flags?
- How do lanes encode priority?

## Phase B — update entry and scheduling

### 3. Hook update entry
- `packages/react-reconciler/src/ReactFiberHooks.js`

**Initial functions to follow**
- `dispatchSetState`
- Hook update queue helpers nearby

### 4. Scheduling and work loop
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `packages/react-reconciler/src/ReactFiberRootScheduler.js`

**Initial functions to follow**
- `scheduleUpdateOnFiber`
- `ensureRootIsScheduled`
- `performConcurrentWorkOnRoot`
- `renderRootConcurrent`
- `commitRoot`

## Phase C — render phase

### 5. Begin / reconcile / complete
- `packages/react-reconciler/src/ReactFiberBeginWork.js`
- `packages/react-reconciler/src/ReactChildFiber.js`
- `packages/react-reconciler/src/ReactFiberCompleteWork.js`

**Questions to answer**
- How does React descend the tree?
- How are children reconciled?
- What work is prepared before commit?

## Phase D — commit phase

### 6. Commit effects
- `packages/react-reconciler/src/ReactFiberCommitWork.js`
- `packages/react-reconciler/src/ReactFiberCommitEffects.js`
- `packages/react-reconciler/src/ReactFiberCommitHostEffects.js`

**Questions to answer**
- What becomes visible during commit?
- What is the difference between mutation, layout, and passive work?

## Phase E — advanced extensions

### 7. Scheduler package
- `packages/scheduler/src/*`

### 8. Suspense / thenable / offscreen
- `packages/react-reconciler/src/ReactFiberSuspenseComponent.js`
- `packages/react-reconciler/src/ReactFiberThrow.js`
- `packages/react-reconciler/src/ReactFiberThenable.js`
- `packages/react-reconciler/src/ReactFiberOffscreenComponent.js`

## Reading Rule

Do not attempt to linearly read the whole repository. Always start from a question and trace only the functions that answer it.

## First Trace

The first end-to-end trace for this project is:

`dispatchSetState` → `scheduleUpdateOnFiber` → `ensureRootIsScheduled` → `performConcurrentWorkOnRoot` → `renderRootConcurrent` → `beginWork` / `completeWork` → `commitRoot`
