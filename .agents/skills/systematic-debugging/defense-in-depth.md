# Defense-in-Depth Validation

> Sumber: obra/superpowers (MIT). Contoh disingkat.

## Overview

When you fix a bug caused by invalid data, one validation point feels sufficient. But a single check can be bypassed by other code paths, refactoring, or mocks.

**Core principle:** Validate at EVERY layer data passes through. Make the bug structurally impossible.

## The Four Layers

### Layer 1: Entry Point Validation
Reject obviously invalid input at the API boundary (empty, wrong type, missing).

### Layer 2: Business Logic Validation
Ensure the data makes sense for this specific operation.

### Layer 3: Environment Guards
Prevent dangerous operations in specific contexts (e.g. refuse destructive action when `NODE_ENV === 'test'` outside a temp dir).

### Layer 4: Debug Instrumentation
Log context (inputs, cwd, stack) so failures in other layers are diagnosable.

## Applying the Pattern

1. **Trace the data flow** - where does the bad value originate, where is it used?
2. **Map all checkpoints** - list every point the data passes through.
3. **Add validation at each layer** - entry, business, environment, debug.
4. **Test each layer** - try to bypass layer 1 and verify layer 2 catches it.

## Key Insight

All four layers are usually necessary: different code paths bypass entry validation, mocks bypass business logic checks, and edge cases need environment guards.

**Don't stop at one validation point.** Add checks at every layer.
