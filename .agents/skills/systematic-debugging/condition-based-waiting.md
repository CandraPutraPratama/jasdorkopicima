# Condition-Based Waiting

> Sumber: obra/superpowers (MIT). Contoh disingkat.

## Overview

Flaky tests often guess at timing with arbitrary delays. This creates race conditions where tests pass on fast machines but fail under load or in CI.

**Core principle:** Wait for the actual condition you care about, not a guess about how long it takes.

## When to Use

- Tests have arbitrary delays (`setTimeout`, `sleep`)
- Tests are flaky (pass sometimes, fail under load)
- Waiting for async operations to complete

**Don't use when** testing actual timing behavior (debounce, throttle intervals). Always document WHY if you keep an arbitrary timeout.

## Core Pattern

```typescript
// BEFORE: guessing at timing
await new Promise(r => setTimeout(r, 50));
const result = getResult();

// AFTER: waiting for the condition
await waitFor(() => getResult() !== undefined, 'result to be defined');
```

## Implementation

```typescript
async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000
): Promise<T> {
  const startTime = Date.now();

  while (true) {
    const result = condition();
    if (result) return result;

    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
    }

    await new Promise(r => setTimeout(r, 10)); // poll every 10ms
  }
}
```

## Common Mistakes

- **Polling too fast** (`setTimeout(check, 1)`) wastes CPU -> poll every ~10ms.
- **No timeout** loops forever -> always include a timeout with a clear error.
- **Stale data** from caching state before the loop -> call the getter inside the loop.

## When an Arbitrary Timeout IS Correct

Only after first waiting for the triggering condition, when based on known timing, and with a comment explaining WHY.
