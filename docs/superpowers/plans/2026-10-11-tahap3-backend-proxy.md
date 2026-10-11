# Tahap 3 Implementation Plan: Backend Proxy, Token Management, Adapter, & Pricing Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement server-side proxy client for Kopi Kenangan Web Order API, response normalization adapter, in-memory caching layer, Next.js API routes, pure pricing calculation engine with unit tests, operational hours checker, and run verifications 7a-7d.

**Architecture:** Next.js App Router API endpoints serve frontend requests reading from normalized domain models and cache. The KK Client handles polite requests, timeouts, and transparent 444 token auto-renewal. Pricing and operational hours logic are pure functions decoupled from external services.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Node.js 22 native test runner (`node:test` + `node:assert`).

**Spec:** `Brief Proyek jasdorkopicima (untuk agent coding).md` + User Request Tahap 3 updates.

## Global Constraints
- Do NOT build frontend UI or touch Supabase in this stage.
- Do NOT store or commit real customer tokens, phone numbers, or credentials.
- Base price is taken from `menu_products.price`. Variant addition is `selected_sku.price - base_price`. Addon is `addon_price`.
- Filter out `is_combo_v2 === true` items from menu output for MVP.
- All pricing and fee values must reside in a single configuration file (`src/config/business.ts`).
- Token refresh must retry exactly ONCE upon encountering error_code 444.

## Review Focus
- Pricing engine must handle single-item fee (Rp4.000) vs multi-item fee (Rp2.000 per quantity).
- Operational hours check must accurately handle Jakarta timezone (Asia/Jakarta, UTC+7) boundaries: 07:59 (closed), 08:00 (open), 23:20 (open), 23:21 (closed).
- Adapter must hide sensitive/internal KK fields and ensure safe defaults when optional fields are null.
- Token manager must support empty phone as default, with fallback to env.

---

### Task 1: Business Configuration & Pure Pricing Engine (TDD)

**Files:**
- Create: `src/config/business.ts`
- Create: `src/lib/pricing.ts`
- Create: `tests/pricing.test.ts`

**Interfaces:**
- Produces: `calculateOrderPricing(items: OrderItemInput[], config?: PricingConfig): OrderPricingResult`
- Produces: `BUSINESS_CONFIG`

- [ ] **Step 1: Write failing tests in `tests/pricing.test.ts`**
  - Test brief sample: Latte (base 34k, +5k large, +3k juwara = promo 25k) + Cookie (base 19k = promo 9.5k). Subtotal: 34.5k, Fee (2 items): 4k, Total: 38.5k, Savings: 26.5k.
  - Test 1 item: fee is Rp4.000.
  - Test 2 of the same item: fee is Rp4.000 (Rp2.000 x 2).
  - Test 5 items: fee is Rp10.000 (Rp2.000 x 5).
- [ ] **Step 2: Run test to verify failure**
  - Run: `npm test`
- [ ] **Step 3: Implement `src/config/business.ts` and `src/lib/pricing.ts`**
- [ ] **Step 4: Run test to verify pass**
  - Run: `npm test`
- [ ] **Step 5: Git commit**

---

### Task 2: Jasdor Operational Hours Checking (TDD)

**Files:**
- Create: `src/lib/operational.ts`
- Create: `tests/operational.test.ts`

**Interfaces:**
- Produces: `isJasdorOpen(dateOrIso?: Date | string): { isOpen: boolean; currentTimeWib: string; reason?: string }`

- [ ] **Step 1: Write failing tests in `tests/operational.test.ts`**
  - Test exact boundaries in Asia/Jakarta time:
    - 07:59 WIB -> `isOpen: false`
    - 08:00 WIB -> `isOpen: true`
    - 23:20 WIB -> `isOpen: true`
    - 23:21 WIB -> `isOpen: false`
- [ ] **Step 2: Run test to verify failure**
  - Run: `npm test`
- [ ] **Step 3: Implement `src/lib/operational.ts`**
- [ ] **Step 4: Run test to verify pass**
  - Run: `npm test`
- [ ] **Step 5: Git commit**

---

### Task 3: Domain Types & Response Normalization Adapter

**Files:**
- Create: `src/types/kk-api.ts` (raw KK shapes)
- Create: `src/types/domain.ts` (normalized shapes: `Outlet`, `MenuGroup`, `Product`, `VariantSku`, `Addon`, `ProductOptionDetails`)
- Create: `src/lib/adapter.ts` (transforms KK raw responses to domain models, hides combo items)
- Create: `tests/adapter.test.ts`

- [ ] **Step 1: Define TypeScript interfaces**
- [ ] **Step 2: Write test for adapter transformation using Tahap 2 sample files**
- [ ] **Step 3: Implement adapter functions (`normalizeStore`, `normalizeStores`, `normalizeMenu`, `normalizeProductOptions`)**
- [ ] **Step 4: Verify tests pass**
- [ ] **Step 5: Git commit**

---

### Task 4: Server-Side KK API Client with Token Auto-Refresh & 444 Handling

**Files:**
- Create: `src/lib/kk-client.ts`

**Interfaces:**
- Produces: `class KkApiClient` with methods `queryStore`, `getStore`, `queryProductMenu`, `getProductOptions`
- Features: polite delay between consecutive requests, timeout, token auto-creation, 444 detection & single retry.

- [ ] **Step 1: Implement `KkApiClient`**
- [ ] **Step 2: Test client in isolated test or script**
- [ ] **Step 3: Git commit**

---

### Task 5: In-Memory Caching Service Layer

**Files:**
- Create: `src/lib/cache.ts`

**Interfaces:**
- Produces: `CacheService` interface with `get`, `set`, `has`, `clear`
- Produces: `inMemoryCache` singleton with TTL support

- [ ] **Step 1: Implement `src/lib/cache.ts`**
- [ ] **Step 2: Add test in `tests/cache.test.ts`**
- [ ] **Step 3: Git commit**

---

### Task 6: Next.js API Routes for Frontend Proxy

**Files:**
- Create: `src/app/api/operational-status/route.ts`
- Create: `src/app/api/outlets/route.ts`
- Create: `src/app/api/outlets/[code]/route.ts`
- Create: `src/app/api/outlets/[code]/menu/route.ts`
- Create: `src/app/api/outlets/[code]/products/[bundleCode]/options/route.ts`

- [ ] **Step 1: Implement API route handlers integrating KkClient, Cache, and Adapter**
- [ ] **Step 2: Verify `npm run build` succeeds**
- [ ] **Step 3: Git commit**

---

### Task 7: Comprehensive Verification (Points 7a - 7d) & Reporting

**Files:**
- Create: `scripts/verify-tahap3.mjs`

- [ ] **Step 1: Implement verification script covering 7a, 7b, 7c, and 7d**
- [ ] **Step 2: Run verification script and collect exact data**
- [ ] **Step 3: Git commit**
- [ ] **Step 4: Stop and generate detailed report for user**
