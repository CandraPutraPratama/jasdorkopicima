# Root Cause Tracing

> Sumber: obra/superpowers (MIT). Diringkas; bagian bisect-script yang tidak ikut terpasang dibuang.

## Overview

Bugs often manifest deep in the call stack (wrong directory, wrong file path, wrong config). Your instinct is to fix where the error appears, but that's treating a symptom.

**Core principle:** Trace backward through the call chain until you find the original trigger, then fix at the source.

## When to Use

- Error happens deep in execution (not at entry point)
- Stack trace shows long call chain
- Unclear where invalid data originated

## The Tracing Process

1. **Observe the symptom** - exact error and where it surfaced.
2. **Find the immediate cause** - which code directly produces it.
3. **Ask: what called this?** - walk up the call chain one level at a time.
4. **Keep tracing up** - at each level ask "what value was passed, and where did it come from?"
5. **Find the original trigger** - the first place the bad value/state was created.
6. **Fix at the source**, then add validation at each layer it passed through (see `defense-in-depth.md`).

## Adding Instrumentation

When you can't trace manually, log before the dangerous operation (not after it fails):

```typescript
function riskyOperation(input: string) {
  console.error('DEBUG riskyOperation:', {
    input,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    stack: new Error().stack,
  });
  // ...
}
```

- In tests use `console.error()` (loggers may be suppressed).
- Include context: inputs, environment, timestamps.
- Capture `new Error().stack` to see the whole call chain.

## Key Principle

**NEVER fix just where the error appears.** Trace back to find the original trigger.
